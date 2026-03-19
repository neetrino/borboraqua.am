/**
 * Password reset email — HTML template and send helper.
 * Uses env: APP_URL (for reset link).
 */

import { sendEmail } from "@/lib/email";

const RESET_EXPIRES_HOURS = 1;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildResetEmailHtml(resetUrl: string, expiresIn: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:#f1f5f9;">
  <div style="max-width:480px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
    <div style="padding:24px 28px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Reset your password</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.5;">
        We received a request to reset your password. Click the button below to set a new password:
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 24px;background:linear-gradient(to right,#00D1FF,#1AC0FD);color:#fff;text-decoration:none;font-weight:600;border-radius:8px;">Reset password</a>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;">
        This link expires in ${escapeHtml(expiresIn)}. If you did not request a password reset, you can ignore this email.
      </p>
    </div>
    <div style="padding:12px 28px;background:#f8fafc;font-size:12px;color:#64748b;">
      This email was sent automatically. Do not reply.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends password reset email with link. Uses APP_URL for base.
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const baseUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const expiresIn = `${RESET_EXPIRES_HOURS} hour${RESET_EXPIRES_HOURS > 1 ? "s" : ""}`;
  const html = buildResetEmailHtml(resetUrl, expiresIn);

  await sendEmail({
    to,
    subject: "Reset your password",
    html,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in ${expiresIn}.`,
  });
}
