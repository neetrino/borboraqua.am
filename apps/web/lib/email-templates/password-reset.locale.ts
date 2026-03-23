/**
 * Password reset email copy (HTML + plain text) for en / hy / ru.
 */

import type { LanguageCode } from "@/lib/language";

type PasswordResetCopy = {
  subject: string;
  htmlTitle: string;
  /** Site domain line under the logo */
  siteDomain: string;
  logoAlt: string;
  heading: string;
  intro: string;
  button: string;
  /** Пояснение к дублирующей текстовой ссылке */
  orUseLink: string;
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
    subject: "Reset your password — borboraqua.am",
    htmlTitle: "Reset your password — borboraqua.am",
    siteDomain: "borboraqua.am",
    logoAlt: "Borbor Aqua",
    heading: "Reset your password",
    intro:
      "We received a request to reset or set a new password for your account on borboraqua.am. Use the button below, or the link under it, to open the password reset page:",
    button: "Reset password",
    orUseLink: "If the button does not work, copy this link into your browser:",
    buildExpiresNotice: (durationPhrase: string) =>
      `This link expires in ${durationPhrase}. If you did not request a password reset, you can ignore this email.`,
    footerAuto: "This email was sent automatically from borboraqua.am. Do not reply.",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `borboraqua.am — password reset\n\nWe received a request to reset your password. Open this link to set a new password:\n${resetUrl}\n\nThis link expires in ${durationPhrase}.`,
  },
  hy: {
    subject: "Գաղտնաբառի վերականգնում — borboraqua.am",
    htmlTitle: "Գաղտնաբառի վերականգնում — borboraqua.am",
    siteDomain: "borboraqua.am",
    logoAlt: "Borbor Aqua",
    heading: "Գաղտնաբառի վերականգնում",
    intro:
      "Մենք ստացել ենք borboraqua.am կայքում ձեր հաշվի գաղտնաբառը վերականգնելու կամ նորը սահմանելու հայտ։ Օգտագործեք ստորևի կոճակը կամ դրանից հետո տրված հղումը՝ գաղտնաբառի վերականգնման էջը բացելու համար։",
    button: "Վերականգնել գաղտնաբառը",
    orUseLink: "Եթե կոճակը չի աշխատում, պատճենեք այս հղումը դիտարկիչի հասցեի դաշտում՝",
    buildExpiresNotice: (durationPhrase: string) =>
      `Հղման վավերականությունը՝ ${durationPhrase}։ Եթե դուք չեք պահանջել գաղտնաբառի վերականգնում, կարող եք անտեսել այս նամակը։`,
    footerAuto: "Այս նամակը ավտոմատ է ուղարկվել borboraqua.am կայքից։ Չպատասխանեք։",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `borboraqua.am — գաղտնաբառի վերականգնում\n\nՄենք ստացել ենք ձեր գաղտնաբառը վերականգնելու հայտ։ Բացեք հղումը՝ նոր գաղտնաբառ սահմանելու համար.\n${resetUrl}\n\nՀղման վավերականությունը՝ ${durationPhrase}։`,
  },
  ru: {
    subject: "Сброс пароля — borboraqua.am",
    htmlTitle: "Сброс пароля — borboraqua.am",
    siteDomain: "borboraqua.am",
    logoAlt: "Borbor Aqua",
    heading: "Сброс пароля",
    intro:
      "Мы получили запрос на сброс или установку нового пароля для вашей учётной записи на borboraqua.am. Нажмите кнопку ниже или воспользуйтесь ссылкой под ней, чтобы открыть страницу сброса пароля:",
    button: "Сбросить пароль",
    orUseLink: "Если кнопка не сработала, скопируйте эту ссылку в адресную строку браузера:",
    buildExpiresNotice: (durationPhrase: string) =>
      `Срок действия ссылки — ${durationPhrase}. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.`,
    footerAuto: "Это письмо отправлено автоматически с сайта borboraqua.am. Не отвечайте на него.",
    buildPlainText: (resetUrl: string, durationPhrase: string) =>
      `borboraqua.am — сброс пароля\n\nМы получили запрос на сброс пароля. Перейдите по ссылке, чтобы задать новый пароль:\n${resetUrl}\n\nСрок действия ссылки — ${durationPhrase}.`,
  },
};

export function getPasswordResetEmailCopy(locale: LanguageCode): PasswordResetCopy {
  return COPY[locale] ?? COPY.en;
}
