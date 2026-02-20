/**
 * Email sending via Resend.
 * Uses env: EMAIL_FROM, RESEND_API_KEY (via lib/resend).
 */

import { resend } from "@/lib/resend";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "test@dev.neetrino.com";

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

/**
 * Sends an email via Resend.
 * @returns Resend response data or null if Resend is not configured
 * @throws Error when Resend returns an error
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<{ id: string } | null> {
  if (!resend) {
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}
