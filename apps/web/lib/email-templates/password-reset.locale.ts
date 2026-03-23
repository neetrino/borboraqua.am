/**
 * Password reset email copy (HTML + plain text) for en / hy / ru.
 * HTML: short copy, no visible URL — button only; plain text still includes the link for non-HTML clients.
 */

import type { LanguageCode } from "@/lib/language";

type PasswordResetCopy = {
  subject: string;
  htmlTitle: string;
  siteDomain: string;
  logoAlt: string;
  heading: string;
  intro: string;
  button: string;
  /** One short line under the button (link validity) */
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
    const n = hours % 100;
    const last = hours % 10;
    if (n >= 11 && n <= 14) return `${hours} часов`;
    if (last === 1) return `${hours} час`;
    if (last >= 2 && last <= 4) return `${hours} часа`;
    return `${hours} часов`;
  }
  return `${hours} hour${hours > 1 ? "s" : ""}`;
}

const COPY: Record<LanguageCode, PasswordResetCopy> = {
  en: {
    subject: "borboraqua.am — Password reset",
    htmlTitle: "Password reset",
    siteDomain: "borboraqua.am",
    logoAlt: "Borbor Aqua",
    heading: "Reset your password",
    intro: "To change or reset your password, tap the button below.",
    button: "Reset password",
    buildExpiresNotice: (durationPhrase: string) => `Valid for ${durationPhrase}.`,
    footerAuto: "borboraqua.am",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `borboraqua.am — password reset\n\nTo change or reset your password, open this link:\n${resetUrl}\n\nValid for ${durationPhrase}.`,
  },
  hy: {
    subject: "borboraqua.am — Գաղտնաբառի վերականգնում",
    htmlTitle: "Գաղտնաբառի վերականգնում",
    siteDomain: "borboraqua.am",
    logoAlt: "Borbor Aqua",
    heading: "Գաղտնաբառի վերականգնում",
    intro: "Գաղտնաբառը փոխելու և վերականգնելու համար սեղմեք կոճակը։",
    button: "Վերականգնել գաղտնաբառը",
    buildExpiresNotice: (durationPhrase: string) => `Վավեր է ${durationPhrase}։`,
    footerAuto: "borboraqua.am",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `borboraqua.am — գաղտնաբառի վերականգնում\n\nԳաղտնաբառը փոխելու և վերականգնելու համար բացեք հղումը՝\n${resetUrl}\n\nՎավեր է ${durationPhrase}։`,
  },
  ru: {
    subject: "borboraqua.am — Сброс пароля",
    htmlTitle: "Сброс пароля",
    siteDomain: "borboraqua.am",
    logoAlt: "Borbor Aqua",
    heading: "Сброс пароля",
    intro: "Для смены и восстановления пароля нажмите на кнопку.",
    button: "Сбросить пароль",
    buildExpiresNotice: (durationPhrase: string) => `Действует ${durationPhrase}.`,
    footerAuto: "borboraqua.am",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `borboraqua.am — сброс пароля\n\nДля смены и восстановления пароля перейдите по ссылке:\n${resetUrl}\n\nДействует ${durationPhrase}.`,
  },
};

export function getPasswordResetEmailCopy(locale: LanguageCode): PasswordResetCopy {
  return COPY[locale] ?? COPY.en;
}
