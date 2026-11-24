import { z } from "zod";

export const createPaymentOrderSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

export const idempotencyKeySchema = z
  .string()
  .uuid("A valid UUID idempotency key is required");

export type CreatePaymentOrderInput = z.infer<
  typeof createPaymentOrderSchema
>;

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type VerifyPaymentInput = z.infer<
  typeof verifyPaymentSchema
>;