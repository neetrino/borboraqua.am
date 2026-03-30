import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const MAX_NAME_LENGTH = 80;
const NAME_SAFE_REGEX = /^[\p{L}\p{M}\s'-]+$/u;

const optionalSafeNameSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmedValue = value.trim();
    return trimmedValue === "" ? undefined : trimmedValue;
  },
  z
    .string()
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`)
    .refine((value) => !/[<>]/.test(value), {
      message: "Name cannot contain angle brackets",
    })
    .refine((value) => NAME_SAFE_REGEX.test(value), {
      message: "Name contains invalid characters",
    })
    .optional()
);

/**
 * Parse and validate JSON body with Zod (P0 Security 3.1). Returns parsed data or 400 response.
 */
export function parseBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  return req.json().then(
    (body) => {
      const result = schema.safeParse(body);
      if (result.success) return { data: result.data, error: null };
      return {
        data: null,
        error: NextResponse.json(
          {
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            status: 400,
            detail: result.error.flatten().fieldErrors
              ? Object.entries(result.error.flatten().fieldErrors)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                  .join("; ")
              : "Invalid request body",
            instance: req.url,
          },
          { status: 400 }
        ),
      };
    },
    () => ({
      data: null,
      error: NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Invalid JSON",
          instance: req.url,
        },
        { status: 400 }
      ),
    })
  );
}

export const loginBodySchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  password: z.string().min(1),
}).refine((d) => !!d.email || !!d.phone, { message: "Either email or phone required" });

export const registerBodySchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: optionalSafeNameSchema,
  lastName: optionalSafeNameSchema,
}).refine((d) => !!d.email || !!d.phone, { message: "Either email or phone required" });

export const forgotPasswordBodySchema = z.object({
  email: z.string().email("Invalid email"),
  /** Language for email subject and body (en / hy / ru) */
  locale: z.enum(["en", "hy", "ru"]).optional(),
});

export const adminSendPasswordResetBodySchema = z.object({
  locale: z.enum(["en", "hy", "ru"]).optional(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
