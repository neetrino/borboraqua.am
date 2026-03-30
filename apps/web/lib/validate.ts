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

export const fastshiftInitBodySchema = z.object({
  orderNumber: z.string().trim().min(1, "orderNumber is required").max(64, "orderNumber is too long"),
});

const checkoutItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  variantId: z.string().min(1, "variantId is required"),
  quantity: z.number().int().positive().max(100),
});

export const checkoutBodySchema = z.object({
  cartId: z.string().optional(),
  items: z.array(checkoutItemSchema).optional(),
  couponCode: z.string().trim().max(64).optional(),
  email: z.string().email("Invalid email"),
  phone: z.string().trim().min(3, "Invalid phone").max(32, "Invalid phone"),
  firstName: optionalSafeNameSchema,
  lastName: optionalSafeNameSchema,
  shippingMethod: z.string().trim().max(32).optional(),
  shippingAddress: z.record(z.unknown()).optional(),
  paymentMethod: z
    .enum(["idram", "arca", "ameriabank", "telcell", "fastshift", "cash", "card"])
    .optional(),
  locale: z.enum(["en", "hy", "ru"]).optional(),
}).refine((d) => !!d.cartId || (Array.isArray(d.items) && d.items.length > 0), {
  message: "Either cartId or items is required",
});

export const adminUploadImagesBodySchema = z.object({
  images: z
    .array(z.string().min(1, "Image data is required"))
    .min(1, "At least one image is required")
    .max(10, "Too many images in one request"),
  folder: z.enum(["products", "labels"]).optional(),
});
