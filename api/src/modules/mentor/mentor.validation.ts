
import { z } from "zod";

export const updateExpertiseSchema = z.object({
  topicIds: z
    .array(z.string().min(1))
    .max(100)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Duplicate topic IDs are not allowed"
    ),
});

export type UpdateExpertiseInput = z.infer<
  typeof updateExpertiseSchema
>;
