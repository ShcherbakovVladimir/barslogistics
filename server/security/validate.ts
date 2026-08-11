import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "username too short")
  .max(64, "username too long")
  .regex(/^[a-zA-Z0-9._-]+$/, "invalid username characters");

const passwordSchema = z.string().min(8, "password too short").max(256, "password too long");

const emailSchema = z.string().trim().email("invalid email").max(254, "email too long");

const tokenSchema = z.string().trim().min(16, "invalid token").max(512, "invalid token");

export const loginBodySchema = z.object({
  username: z.string().trim().min(1, "username required").max(128, "username too long"),
  password: z.string().min(1, "password required").max(256, "password too long"),
});

export const registerBodySchema = z.object({
  username: usernameSchema,
  name: z.string().trim().min(1, "name required").max(200, "name too long"),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  token: tokenSchema,
  password: passwordSchema,
});

export const confirmEmailBodySchema = z.object({
  token: tokenSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type ConfirmEmailBody = z.infer<typeof confirmEmailBodySchema>;

type LocalizedRequest = Request & { st?: (key: string) => string };

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const st = (req as LocalizedRequest).st;
      return res.status(400).json({
        error: st?.("auth.validationRequired") ?? "Validation failed",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten().fieldErrors,
      });
    }
    req.body = parsed.data;
    next();
  };
}
