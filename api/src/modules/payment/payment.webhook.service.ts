import { createHmac, timingSafeEqual } from "node:crypto";

import prisma from "../../config/database.js";

interface RazorpayWebhookPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  error_code?: string | null;
  error_description?: string | null;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: RazorpayWebhookPayment;
    };
  };
}

const verifyWebhookSignature = (
  rawBody: Buffer,
  receivedSignature: string
): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET_NOT_CONFIGURED");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!/^[a-fA-F0-9]{64}$/.test(receivedSignature)) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(receivedSignature, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

export const processRazorpayWebhook = async (
  rawBody: Buffer,
  signature: string,
  eventId: string
) => {
  // 1. Verify that the request came from Razorpay.
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new Error("INVALID_WEBHOOK_SIGNATURE");
  }

  // 2. Parse the original request body.
  let webhook: RazorpayWebhookPayload;

  try {
    webhook = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhookPayload;
  } catch {
    throw new Error("INVALID_WEBHOOK_PAYLOAD");
  }

  if (!webhook.event || !eventId) {
    throw new Error("INVALID_WEBHOOK_PAYLOAD");
  }

  const eventType = webhook.event;
  const paymentEntity = webhook.payload?.payment?.entity;

  // 3. Store the event and process it atomically.
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Unique providerEventId prevents duplicate processing.
      await tx.paymentWebhookEvent.create({
        data: {
          providerEventId: eventId,
          eventType,
          payload: JSON.parse(rawBody.toString("utf8")),
        },
      });

      // We currently handle these two payment events.
      if (
        eventType !== "payment.captured" &&
        eventType !== "payment.failed"
      ) {
        await tx.paymentWebhookEvent.update({
          where: { providerEventId: eventId },
          data: { processedAt: new Date() },
        });

        return {
          eventType,
          processed: true,
          message: "Event received; no action required",
        };
      }

      if (!paymentEntity?.id || !paymentEntity.order_id) {
        throw new Error("WEBHOOK_PAYMENT_DETAILS_MISSING");
      }

      // Find our internal payment using the Razorpay order ID.
      const payment = await tx.payment.findUnique({
        where: {
          providerOrderId: paymentEntity.order_id,
        },
        include: {
          booking: {
            include: {
              availability: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // Validate the amount and currency against our records.
      if (
        paymentEntity.amount !== payment.amount.mul(100).toNumber() ||
        paymentEntity.currency !== payment.currency
      ) {
        throw new Error("PAYMENT_DETAILS_MISMATCH");
      }

      if (eventType === "payment.captured") {
        // Never downgrade or replace an already successful payment.
        if (payment.status === "SUCCESS") {
          if (payment.providerPaymentId !== paymentEntity.id) {
            throw new Error("PAYMENT_ALREADY_PROCESSED");
          }
        } else {
          // A captured payment must be recorded as SUCCESS,
          // even if the booking needs separate reconciliation.
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "SUCCESS",
              providerPaymentId: paymentEntity.id,
              signatureVerifiedAt: new Date(),
              failureCode: null,
              failureMessage: null,
            },
          });

          // Confirm only if the booking and reserved slot
          // are still in the expected state.
          if (
            payment.booking.status === "PENDING_PAYMENT" &&
            payment.booking.availability.status === "BOOKED"
          ) {
            await tx.booking.updateMany({
              where: {
                id: payment.bookingId,
                status: "PENDING_PAYMENT",
              },
              data: {
                status: "CONFIRMED",
              },
            });
          }
        }
      }

      if (eventType === "payment.failed") {
        // A late failure event must never downgrade a captured payment.
        if (
          payment.status !== "SUCCESS" &&
          payment.status !== "REFUNDED" &&
          payment.status !== "PARTIALLY_REFUNDED"
        ) {
          await tx.payment.updateMany({
            where: {
              id: payment.id,
              status: {
                in: ["CREATED", "PENDING"],
              },
            },
            data: {
              status: "FAILED",
              failureCode: paymentEntity.error_code ?? null,
              failureMessage:
                paymentEntity.error_description ??
                "Razorpay payment failed",
            },
          });
        }
      }

      await tx.paymentWebhookEvent.update({
        where: { providerEventId: eventId },
        data: { processedAt: new Date() },
      });

      return {
        eventType,
        processed: true,
        paymentId: payment.id,
        bookingId: payment.bookingId,
      };
    });

    return result;
  } catch (error) {
    // A previously processed event is an idempotent success.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        eventType,
        processed: true,
        duplicate: true,
      };
    }

    throw error;
  }
};