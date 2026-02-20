/**
 * Resend email client.
 * Uses env: RESEND_API_KEY. Sender: EMAIL_FROM.
 * @see reference/platforms/11-EMAIL.md
 */

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

function getResend(): Resend | null {
  if (!apiKey?.trim()) return null;
  return new Resend(apiKey);
}

export const resend = getResend();
