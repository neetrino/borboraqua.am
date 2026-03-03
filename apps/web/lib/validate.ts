import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

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
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((d) => !!d.email || !!d.phone, { message: "Either email or phone required" });
