
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.string().trim().email().transform((value) =>
    value.toLowerCase()
  ),

  password: z.string()
    .min(8)
    .max(72),

  role: z.enum(["STUDENT", "MENTOR"]),

  educationLevel: z.string().trim().optional(),

  institution: z.string().trim().optional(),

  headline: z.string().trim().max(150).optional(),

  bio: z.string().trim().max(2000).optional(),

  yearsOfExperience: z.number().int().min(0).max(60).optional(),

  hourlyRate: z.number().positive().max(100000).optional()
}).superRefine((data, ctx) => {
  if (data.role === "MENTOR") {
    if (data.hourlyRate === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["hourlyRate"],
        message: "Hourly rate is required for mentors"
      });
    }
  }
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) =>
    value.toLowerCase()
  ),

  password: z.string().min(1)
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  role: z.enum(["STUDENT", "MENTOR"]).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
