/**
 * Password reset email copy (HTML + plain text) for en / hy / ru.
 */

import type { LanguageCode } from "@/lib/language";

type PasswordResetCopy = {
  subject: string;
  htmlTitle: string;
  heading: string;
  intro: string;
  button: string;
  buildExpiresNotice: (durationPhrase: string) => string;
  footerAuto: string;
  buildPlainText: (resetUrl: string, durationPhrase: string) => string;
};

/** Human-readable link validity duration (e.g. "1 ժամ", "1 hour"). */
export function formatPasswordResetExpiryDuration(locale: LanguageCode, hours: number): string {
  if (hours < 1) {
    return locale === "hy" ? "0 ժամ" : locale === "ru" ? "0 ч." : "0 hours";
  }
  if (locale === "hy") {
    return hours === 1 ? "1 ժամ" : `${hours} ժամ`;
  }
  if (locale === "ru") {
    if (hours === 1) return "1 час";
    if (hours >= 2 && hours <= 4) return `${hours} часа`;
    return `${hours} часов`;
  }
  return `${hours} hour${hours > 1 ? "s" : ""}`;
}

const COPY: Record<LanguageCode, PasswordResetCopy> = {
  en: {
    subject: "Reset your password",
    htmlTitle: "Reset your password",
    heading: "Reset your password",
    intro:
      "We received a request to reset your password. Click the button below to set a new password:",
    button: "Reset password",
    buildExpiresNotice: (durationPhrase: string) =>
      `This link expires in ${durationPhrase}. If you did not request a password reset, you can ignore this email.`,
    footerAuto: "This email was sent automatically. Do not reply.",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `Reset your password: ${resetUrl}\n\nThis link expires in ${durationPhrase}.`,
  },
  hy: {
    subject: "Գաղտնաբառի վերականգնում",
    htmlTitle: "Գաղտնաբառի վերականգնում",
    heading: "Գաղտնաբառի վերականգնում",
    intro:
      "Մենք ստացել ենք ձեր գաղտնաբառը վերականգնելու հայտ։ Սեղմեք ստորևի կոճակը՝ նոր գաղտնաբառ սահմանելու համար։",
    button: "Վերականգնել գաղտնաբառը",
    buildExpiresNotice: (durationPhrase: string) =>
      `Հղման վավերականությունը՝ ${durationPhrase}։ Եթե դուք չեք պահանջել գաղտնաբառի վերականգնում, կարող եք անտեսել այս նամակը։`,
    footerAuto: "Այս նամակը ուղարկվել է ավտոմատ կերպով։ Չպատասխանեք։",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `Գաղտնաբառի վերականգնում։ ${resetUrl}\n\nՀղման վավերականությունը՝ ${durationPhrase}։`,
  },
  ru: {
    subject: "Сброс пароля",
    htmlTitle: "Сброс пароля",
    heading: "Сброс пароля",
    intro:
      "Мы получили запрос на сброс пароля. Нажмите кнопку ниже, чтобы задать новый пароль:",
    button: "Сбросить пароль",
    buildExpiresNotice: (durationPhrase: string) =>
      `Срок действия ссылки — ${durationPhrase}. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.`,
    footerAuto: "Это письмо отправлено автоматически. Не отвечайте на него.",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `Сброс пароля: ${resetUrl}\n\nСрок действия ссылки — ${durationPhrase}.`,
  },
};

export function getPasswordResetEmailCopy(locale: LanguageCode): PasswordResetCopy {
  return COPY[locale] ?? COPY.en;
}
