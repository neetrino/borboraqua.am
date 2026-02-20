/**
 * POST /api/v1/email/test
 * Sends a test email (for development). Body: { to: string }.
 */
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = typeof body?.to === "string" && body.to.trim() ? body.to.trim() : null;
    if (!to) {
      return NextResponse.json(
        { error: "Missing or invalid 'to' email" },
        { status: 400 }
      );
    }

    await sendEmail({
      to,
      subject: "Test email from Borboraqua",
      html: "<p>This is a test email. Resend integration works.</p>",
      text: "This is a test email. Resend integration works.",
    });

    return NextResponse.json({ ok: true, message: "Email sent" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
