import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/services/admin.service";

/**
 * POST /api/v1/contact
 * Create a new contact message (public endpoint)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'name' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'email' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!body.subject || typeof body.subject !== 'string' || body.subject.trim().length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'subject' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    // Message is optional, use empty string if not provided
    const message = body.message && typeof body.message === 'string' 
      ? body.message.trim() 
      : '';

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Invalid email format",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const result = await adminService.createContactMessage({
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: message,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("❌ [CONTACT] POST Error:", error);
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Internal Server Error",
        status: error.status || 500,
        detail: error.detail || error.message || "An error occurred",
        instance: req.url,
      },
      { status: error.status || 500 }
    );
  }
}



