
import type { Request, Response } from "express";
import { ZodError } from "zod";

import { createPaymentOrderSchema, idempotencyKeySchema, verifyPaymentSchema } from "./payment.validation.js";
import * as paymentService from "./payment.service.js";
import * as paymentWebhookService from "./payment.webhook.service.js";

export const createPaymentOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const data = createPaymentOrderSchema.parse(req.body);

    const idempotencyKey = idempotencyKeySchema.parse(
      req.get("Idempotency-Key")
    );

    const result = await paymentService.createPaymentOrder(
      req.user!.id,
      data,
      idempotencyKey
    );

    return res.status(200).json({
      success: true,
      message: "Payment order ready",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    const errorCode =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    const errorResponses: Record<
      string,
      { status: number; message: string }
    > = {
      BOOKING_NOT_FOUND: {
        status: 404,
        message: "Booking not found",
      },
      BOOKING_NOT_PAYABLE: {
        status: 409,
        message: "This booking cannot be paid",
      },
      BOOKING_EXPIRED: {
        status: 409,
        message: "Booking payment window has expired",
      },
      SLOT_NOT_RESERVED: {
        status: 409,
        message: "This session is no longer reserved",
      },
      INVALID_PAYMENT_AMOUNT: {
        status: 400,
        message: "Invalid payment amount",
      },
      IDEMPOTENCY_KEY_REUSED: {
        status: 409,
        message: "This idempotency key was used for another booking",
      },
      PAYMENT_ORDER_IN_PROGRESS: {
        status: 409,
        message: "Payment order creation is in progress. Retry shortly using the same key",
      },
      RAZORPAY_ORDER_CREATION_FAILED: {
        status: 502,
        message: "Unable to create Razorpay order",
      },
    };

    const response = errorResponses[errorCode];

    if (response) {
      return res.status(response.status).json({
        success: false,
        message: response.message,
      });
    }

    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



export const verifyPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const data = verifyPaymentSchema.parse(req.body);

    const result = await paymentService.verifyPayment(
      req.user!.id,
      data
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    const errorCode =
      error instanceof Error
        ? error.message
        : "INTERNAL_SERVER_ERROR";

    const errorResponses: Record<
      string,
      { status: number; message: string }
    > = {
      INVALID_PAYMENT_SIGNATURE: {
        status: 400,
        message: "Invalid payment signature",
      },
      PAYMENT_NOT_FOUND: {
        status: 404,
        message: "Payment not found",
      },
      PAYMENT_ALREADY_PROCESSED: {
        status: 409,
        message: "Payment has already been processed",
      },
      PAYMENT_NOT_PAYABLE: {
        status: 409,
        message: "This payment cannot be verified",
      },
      PAYMENT_DETAILS_MISMATCH: {
        status: 400,
        message: "Payment details do not match",
      },
      PAYMENT_NOT_CAPTURED: {
        status: 409,
        message: "Payment has not been captured yet",
      },
      BOOKING_NOT_PAYABLE: {
        status: 409,
        message: "This booking cannot be confirmed",
      },
      SLOT_NOT_RESERVED: {
        status: 409,
        message: "The session slot is no longer reserved",
      },
    };

    const response = errorResponses[errorCode];

    if (response) {
      return res.status(response.status).json({
        success: false,
        message: response.message,
      });
    }

    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const handleRazorpayWebhook = async (
  req: Request,
  res: Response
) => {
  try {
    // express.raw() must provide a Buffer here.
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook request body",
      });
    }

    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];

    if (
      typeof signature !== "string" ||
      typeof eventId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay webhook headers",
      });
    }

    const result =
      await paymentWebhookService.processRazorpayWebhook(
        req.body,
        signature,
        eventId
      );

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      data: result,
    });
  } catch (error) {
    const errorCode =
      error instanceof Error
        ? error.message
        : "INTERNAL_SERVER_ERROR";

    const errorResponses: Record<string, number> = {
      INVALID_WEBHOOK_SIGNATURE: 400,
      INVALID_WEBHOOK_PAYLOAD: 400,
      WEBHOOK_PAYMENT_DETAILS_MISSING: 400,
      RAZORPAY_WEBHOOK_SECRET_NOT_CONFIGURED: 500,
      PAYMENT_NOT_FOUND: 500,
      PAYMENT_DETAILS_MISMATCH: 500,
      PAYMENT_ALREADY_PROCESSED: 500,
    };

    const status = errorResponses[errorCode] ?? 500;

    console.error("Razorpay webhook error:", error);

    return res.status(status).json({
      success: false,
      message:
        status === 400
          ? "Invalid webhook request"
          : "Webhook processing failed",
    });
  }
};
