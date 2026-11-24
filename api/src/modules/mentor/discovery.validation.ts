import { z } from "zod";

export const getMentorsQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  topicId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type GetMentorsQuery = z.infer<
  typeof getMentorsQuerySchema
>;

export const mentorIdSchema = z.object({
  id: z.string().min(1, "Mentor ID is required"),
});

export const getMentorAvailabilityQuerySchema = z.object({
  topicId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type GetMentorAvailabilityQuery = z.infer<
  typeof getMentorAvailabilityQuerySchema
>;