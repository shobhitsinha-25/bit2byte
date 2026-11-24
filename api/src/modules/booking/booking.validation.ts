import { z } from "zod";

export const createBookingSchema = z.object({
  availabilityId: z.string().min(1, "Availability ID is required"),
});

export type CreateBookingInput = z.infer<
  typeof createBookingSchema
>;