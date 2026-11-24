import prisma from "../../config/database.js";
import { razorpay, keyId, keySecret  } from "../../config/razorpay.js";

import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from "./payment.validation.js";



export const createPaymentOrder = async (
  studentId: string,
  data: CreatePaymentOrderInput,
  idempotencyKey: string
) => {
  // Helper: build the response expected by Razorpay Checkout.
  const buildOrderResponse = (payment: {
    id: string;
    providerOrderId: string | null;
    amount: { mul: (value: number) => { toNumber: () => number } };
    currency: string;
  }) => {
    if (!payment.providerOrderId) {
      throw new Error("PAYMENT_ORDER_IN_PROGRESS");
    }

    return {
      paymentId: payment.id,
      orderId: payment.providerOrderId,
      amount: payment.amount.mul(100).toNumber(),
      currency: payment.currency,
      keyId,
    };
  };

  // 1. Check whether this exact request has already been processed.
  const existingByKey = await prisma.payment.findUnique({
    where: { idempotencyKey },
  });

  if (existingByKey) {
    if (existingByKey.bookingId !== data.bookingId) {
      throw new Error("IDEMPOTENCY_KEY_REUSED");
    }

    if (existingByKey.providerOrderId) {
      return buildOrderResponse(existingByKey);
    }

    if (existingByKey.status === "FAILED") {
      throw new Error("RAZORPAY_ORDER_CREATION_FAILED");
    }

    throw new Error("PAYMENT_ORDER_IN_PROGRESS");
  }

  // 2. Validate and lock the booking.
  const preparedPayment = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: data.bookingId,
        studentId,
      },
      include: {
        availability: {
          select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    // Serialize payment creation for this booking.
    // bookings is the actual PostgreSQL table name.
    await tx.$queryRaw`
      SELECT "id"
      FROM "bookings"
      WHERE "id" = ${booking.id}
      FOR UPDATE
    `;

    // Recheck the key after obtaining the lock.
    const paymentWithKey = await tx.payment.findUnique({
      where: { idempotencyKey },
    });

    if (paymentWithKey) {
      if (paymentWithKey.bookingId !== booking.id) {
        throw new Error("IDEMPOTENCY_KEY_REUSED");
      }

      if (paymentWithKey.providerOrderId) {
        return {
          existing: paymentWithKey,
          paymentId: null,
        };
      }

      throw new Error("PAYMENT_ORDER_IN_PROGRESS");
    }

    // Re-read booking state after obtaining the lock.
    const currentBooking = await tx.booking.findUnique({
      where: { id: booking.id },
      include: {
        availability: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!currentBooking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    if (currentBooking.status !== "PENDING_PAYMENT") {
      throw new Error("BOOKING_NOT_PAYABLE");
    }

    if (
      !currentBooking.expiresAt ||
      currentBooking.expiresAt <= new Date()
    ) {
      throw new Error("BOOKING_EXPIRED");
    }

    if (currentBooking.availability.status !== "BOOKED") {
      throw new Error("SLOT_NOT_RESERVED");
    }

    // Reuse an existing order for this booking, even if a different
    // idempotency key was supplied.
    const existingPayment = await tx.payment.findFirst({
      where: {
        bookingId: currentBooking.id,
        provider: "RAZORPAY",
        status: "PENDING",
        providerOrderId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingPayment) {
      return {
        existing: existingPayment,
        paymentId: null,
      };
    }

    // A CREATED payment without an order might represent a request
    // currently communicating with Razorpay. Do not create another.
    const inProgressPayment = await tx.payment.findFirst({
      where: {
        bookingId: currentBooking.id,
        provider: "RAZORPAY",
        status: "CREATED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (inProgressPayment) {
      throw new Error("PAYMENT_ORDER_IN_PROGRESS");
    }

    const amountInPaise = currentBooking.amount
      .mul(100)
      .toNumber();

    if (
      !Number.isSafeInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      throw new Error("INVALID_PAYMENT_AMOUNT");
    }

    // The unique idempotencyKey constraint is the final protection
    // against duplicate payment records.
    const payment = await tx.payment.create({
      data: {
        bookingId: currentBooking.id,
        provider: "RAZORPAY",
        idempotencyKey,
        amount: currentBooking.amount,
        currency: currentBooking.currency,
        status: "CREATED",
      },
    });

    return {
      existing: null,
      paymentId: payment.id,
    };
  });

  // An existing order was found under the booking lock.
  if (preparedPayment.existing) {
    return buildOrderResponse(preparedPayment.existing);
  }

  if (!preparedPayment.paymentId) {
    throw new Error("PAYMENT_ORDER_IN_PROGRESS");
  }

  // 3. Create the Razorpay order outside the database transaction.
  // This avoids holding a database row lock during a network request.
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: preparedPayment.paymentId },
    include: { booking: true },
  });

  const amountInPaise = payment.amount.mul(100).toNumber();

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: payment.currency,
      receipt: payment.id,
      notes: {
        bookingId: payment.bookingId,
        paymentId: payment.id,
        studentId,
      },
    });

    // Save the provider order ID.
    const update = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "CREATED",
        providerOrderId: null,
      },
      data: {
        providerOrderId: razorpayOrder.id,
        status: "PENDING",
      },
    });

    if (update.count !== 1) {
      throw new Error("PAYMENT_ORDER_SAVE_FAILED");
    }

    return {
      paymentId: payment.id,
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: payment.currency,
      keyId,
    };
  } catch (error) {
    // Do not mark this payment FAILED automatically.
    // A network timeout can happen after Razorpay has created the order.
    // Keeping CREATED prevents another order from being generated blindly.
    await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "CREATED",
      },
      data: {
        failureMessage:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Razorpay order creation outcome is uncertain",
      },
    });

    console.error("Razorpay order creation/save error:", error);

    if (error instanceof Error && error.message === "PAYMENT_ORDER_SAVE_FAILED") {
      throw error;
    }

    throw new Error("RAZORPAY_ORDER_CREATION_FAILED");
  }
};



export const verifyPayment = async (
  studentId: string,
  data: VerifyPaymentInput
) => {
  // 1. Generate the expected Razorpay signature.
  const expectedSignature = createHmac("sha256", keySecret)
    .update(
      `${data.razorpay_order_id}|${data.razorpay_payment_id}`
    )
    .digest("hex");

  // 2. Compare signatures safely.
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(
    data.razorpay_signature,
    "hex"
  );

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new Error("INVALID_PAYMENT_SIGNATURE");
  }

  // 3. Find the internal payment record.
  const payment = await prisma.payment.findFirst({
    where: {
      provider: "RAZORPAY",
      providerOrderId: data.razorpay_order_id,
      booking: {
        studentId,
      },
    },
    include: {
      booking: {
        include: {
          availability: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  // 4. Handle repeated verification requests.
  if (payment.status === "SUCCESS") {
    if (
      payment.providerPaymentId === data.razorpay_payment_id
    ) {
      return {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        paymentStatus: "SUCCESS",
        bookingStatus: payment.booking.status,
        alreadyVerified: true,
      };
    }

    throw new Error("PAYMENT_ALREADY_PROCESSED");
  }

  if (payment.status !== "PENDING") {
    throw new Error("PAYMENT_NOT_PAYABLE");
  }

  // 5. Confirm payment details directly with Razorpay.
  const razorpayPayment = await razorpay.payments.fetch(
    data.razorpay_payment_id
  );

  if (
    razorpayPayment.order_id !== data.razorpay_order_id ||
    razorpayPayment.amount !== payment.amount.mul(100).toNumber() ||
    razorpayPayment.currency !== payment.currency
  ) {
    throw new Error("PAYMENT_DETAILS_MISMATCH");
  }

  // This implementation confirms only captured payments.
  if (razorpayPayment.status !== "captured") {
    throw new Error("PAYMENT_NOT_CAPTURED");
  }

  // 6. Verify the booking is still in a payable state.
  if (payment.booking.status !== "PENDING_PAYMENT") {
    throw new Error("BOOKING_NOT_PAYABLE");
  }

  if (payment.booking.availability.status !== "BOOKED") {
    throw new Error("SLOT_NOT_RESERVED");
  }

  // 7. Update payment and booking atomically.
  const result = await prisma.$transaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique({
      where: { id: payment.id },
    });

    if (!currentPayment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    // Another request may have completed verification meanwhile.
    if (currentPayment.status === "SUCCESS") {
      if (
        currentPayment.providerPaymentId ===
        data.razorpay_payment_id
      ) {
        return {
          paymentId: currentPayment.id,
          bookingId: payment.bookingId,
          paymentStatus: "SUCCESS" as const,
          bookingStatus: "CONFIRMED" as const,
          alreadyVerified: true,
        };
      }

      throw new Error("PAYMENT_ALREADY_PROCESSED");
    }

    if (currentPayment.status !== "PENDING") {
      throw new Error("PAYMENT_NOT_PAYABLE");
    }

    const paymentUpdate = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
      },
      data: {
        status: "SUCCESS",
        providerPaymentId: data.razorpay_payment_id,
        signatureVerifiedAt: new Date(),
      },
    });

    if (paymentUpdate.count !== 1) {
      throw new Error("PAYMENT_ALREADY_PROCESSED");
    }

    const bookingUpdate = await tx.booking.updateMany({
      where: {
        id: payment.bookingId,
        studentId,
        status: "PENDING_PAYMENT",
      },
      data: {
        status: "CONFIRMED",
      },
    });

    if (bookingUpdate.count !== 1) {
      throw new Error("BOOKING_NOT_PAYABLE");
    }

    return {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      paymentStatus: "SUCCESS" as const,
      bookingStatus: "CONFIRMED" as const,
      alreadyVerified: false,
    };
  });

  return result;
};
