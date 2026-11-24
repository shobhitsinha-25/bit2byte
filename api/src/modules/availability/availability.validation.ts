
import { z } from "zod";

// Accept ISO date-time strings with an explicit timezone.
// Example: 2026-11-10T10:00:00.000Z

const dateTimeSchema = z.iso.datetime({
  offset: true,
});

const sessionFeeSchema = z
  .number()
  .positive("Session fee must be greater than zero")
  .max(99999999.99, "Session fee is too large")
  .refine(
    (value) => Number.isInteger(value * 100),
    "Session fee can have at most 2 decimal places"
  );

// =====================================
// CREATE AVAILABILITY
// =====================================

export const createAvailabilitySchema = z
  .object({
    topicId: z.string().min(1, "Topic is required"),

    startAt: dateTimeSchema,

    endAt: dateTimeSchema,

    sessionFee: sessionFeeSchema,
  })
  .refine(
    (data) =>
      new Date(data.endAt).getTime() >
      new Date(data.startAt).getTime(),
    {
      message: "End time must be later than start time",
      path: ["endAt"],
    }
  );

export type CreateAvailabilityInput = z.infer<
  typeof createAvailabilitySchema
>;

// =====================================
// UPDATE AVAILABILITY
// =====================================

export const updateAvailabilitySchema = z
  .object({
    topicId: z.string().min(1, "Topic is required").optional(),

    startAt: dateTimeSchema.optional(),

    endAt: dateTimeSchema.optional(),

    sessionFee: sessionFeeSchema.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided"
  );

export type UpdateAvailabilityInput = z.infer<
  typeof updateAvailabilitySchema
>;
