/**
 * Customer order confirmation emails (cash at checkout; paid online + EHDM or fallback).
 */

import { sendEmail } from "@/lib/email";
import { resend } from "@/lib/resend";
import {
  buildItemsRows,
  escapeHtml,
  formatAddress,
  formatCustomerName,
  formatDeliveryDay,
  formatMoney,
  formatPaymentMethod,
  type OrderDetailsForAdminEmail,
} from "@/lib/email-templates/order-admin-email-shared";

const QR_EMAIL_SIZE = 180;

export type EhdmReceiptForEmail = {
  receiptId: string;
  fiscal: string | null;
  qr: string | null;
};

type LocaleKey = "hy" | "en" | "ru";

function resolveLocale(raw: string | null | undefined): LocaleKey {
  const l = (raw ?? "hy").toLowerCase().slice(0, 2);
  if (l === "en" || l === "ru") return l;
  return "hy";
}

function strings(locale: LocaleKey) {
  const t = {
    hy: {
      cashSubject: (n: string) => `Ձեր պատվերը ընդունված է #${n}`,
      cashTitle: "Շնորհակալություն պատվերի համար",
      paidSubject: (n: string) => `Ձեր պատվերը վճարված է #${n}`,
      paidTitle: "Վճարումը հաստատված է",
      orderNumber: "Պատվերի համար",
      customer: "Ստացող",
      payment: "Վճարում",
      address: "Հասցե",
      deliveryDay: "Առաքման օր",
      items: "Պատվերի կազմ",
      total: "Ընդամենը",
      cashNote:
        "Վճարումը կկատարվի կանխիկ կամ առաքման պահին, ինչպես ընտրել եք։",
      ehdmHeading: "Էլեկտրոնային ֆիսկալ անդորրագիր (EHDM)",
      receiptNo: "Անդորրագրի համար",
      fiscalNo: "Ֆիսկալ համար",
      fallbackReceipt:
        "Էլեկտրոնային ֆիսկալ անդորրագիրը այս պահին հասանելի չէ։ Ձեր վճարումը գրանցված է, պատվերը հաստատված է։",
      footer: "Այս նամակն ուղարկվել է ավտոմատ։",
    },
    en: {
      cashSubject: (n: string) => `Your order is confirmed #${n}`,
      cashTitle: "Thank you for your order",
      paidSubject: (n: string) => `Your order is paid #${n}`,
      paidTitle: "Payment confirmed",
      orderNumber: "Order number",
      customer: "Recipient",
      payment: "Payment",
      address: "Address",
      deliveryDay: "Delivery day",
      items: "Order items",
      total: "Total",
      cashNote: "Payment will be made in cash or on delivery as you selected.",
      ehdmHeading: "Electronic fiscal receipt (EHDM)",
      receiptNo: "Receipt no.",
      fiscalNo: "Fiscal no.",
      fallbackReceipt:
        "The fiscal receipt is not available at this moment. Your payment is recorded and the order is confirmed.",
      footer: "This email was sent automatically.",
    },
    ru: {
      cashSubject: (n: string) => `Ваш заказ принят #${n}`,
      cashTitle: "Спасибо за заказ",
      paidSubject: (n: string) => `Заказ оплачен #${n}`,
      paidTitle: "Оплата подтверждена",
      orderNumber: "Номер заказа",
      customer: "Получатель",
      payment: "Оплата",
      address: "Адрес",
      deliveryDay: "День доставки",
      items: "Состав заказа",
      total: "Итого",
      cashNote: "Оплата наличными или при получении, как вы выбрали.",
      ehdmHeading: "Электронный фискальный чек (EHDM)",
      receiptNo: "Номер чека",
      fiscalNo: "Фискальный номер",
      fallbackReceipt:
        "Фискальный чек сейчас недоступен. Оплата зарегистрирована, заказ подтверждён.",
      footer: "Письмо отправлено автоматически.",
    },
  };
  return t[locale];
}

function ehdmQrImgUrl(qr: string): string {
  const clean = qr.replace(/\s/g, "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${QR_EMAIL_SIZE}x${QR_EMAIL_SIZE}&data=${encodeURIComponent(clean)}`;
}

function buildCustomerOrderDetailSection(
  order: OrderDetailsForAdminEmail,
  L: ReturnType<typeof strings>
): string {
  const name = formatCustomerName(order.shippingAddress);
  const addr = formatAddress(order.shippingAddress);
  const pay = formatPaymentMethod(order.paymentMethod);
  const day = formatDeliveryDay(order.shippingAddress);
  const rows = buildItemsRows(order);
  return `
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;width:130px;">${escapeHtml(L.orderNumber)}</td><td style="padding:6px 0;font-weight:600;">#${escapeHtml(order.number)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">${escapeHtml(L.customer)}</td><td style="padding:6px 0;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">${escapeHtml(L.payment)}</td><td style="padding:6px 0;">${escapeHtml(pay)}</td></tr>
        ${day !== "—" ? `<tr><td style="padding:6px 0;color:#64748b;">${escapeHtml(L.deliveryDay)}</td><td style="padding:6px 0;">${escapeHtml(day)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">${escapeHtml(L.address)}</td><td style="padding:6px 0;">${escapeHtml(addr)}</td></tr>
      </table>
      <h2 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#1e293b;">${escapeHtml(L.items)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px 10px;text-align:left;font-weight:600;color:#475569;">Item</th>
          <th style="padding:8px 10px;text-align:left;font-weight:600;color:#475569;">SKU</th>
          <th style="padding:8px 10px;text-align:center;font-weight:600;color:#475569;">Qty</th>
          <th style="padding:8px 10px;text-align:right;font-weight:600;color:#475569;">Price</th>
          <th style="padding:8px 10px;text-align:right;font-weight:600;color:#475569;">${escapeHtml(L.total)}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:16px;text-align:right;font-size:18px;font-weight:700;">${escapeHtml(L.total)}: ${formatMoney(order.total)} ${escapeHtml(order.currency)}</div>`;
}

function buildEhdmBlock(ehdm: EhdmReceiptForEmail, L: ReturnType<typeof strings>): string {
  const qr = ehdm.qr?.trim();
  const qrImg =
    qr && qr !== ""
      ? `<div style="margin-top:12px;"><img src="${escapeHtml(ehdmQrImgUrl(qr))}" width="${QR_EMAIL_SIZE}" height="${QR_EMAIL_SIZE}" alt="QR" style="border:1px solid #e2e8f0;border-radius:8px;" /></div>`
      : "";
  return `
    <div style="margin-top:20px;padding:16px;border-radius:10px;border:1px solid #cbd5e1;background:#f8fafc;">
      <h3 style="margin:0 0 10px;font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(L.ehdmHeading)}</h3>
      <p style="margin:4px 0;font-size:14px;"><strong>${escapeHtml(L.receiptNo)}</strong> ${escapeHtml(ehdm.receiptId)}</p>
      ${ehdm.fiscal ? `<p style="margin:4px 0;font-size:14px;"><strong>${escapeHtml(L.fiscalNo)}</strong> ${escapeHtml(ehdm.fiscal)}</p>` : ""}
      ${qrImg}
    </div>`;
}

function buildCashOrderHtml(
  order: OrderDetailsForAdminEmail,
  locale: LocaleKey
): string {
  const L = strings(locale);
  const body = buildCustomerOrderDetailSection(order, L);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h1 style="margin:0 0 8px;font-size:20px;color:#1e293b;">${escapeHtml(L.cashTitle)}</h1>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">${escapeHtml(L.cashNote)}</p>
    ${body}
    <p style="margin-top:20px;font-size:12px;color:#94a3b8;">${escapeHtml(L.footer)}</p>
  </div>
</body></html>`;
}

function buildPaidOrderHtml(
  order: OrderDetailsForAdminEmail,
  ehdm: EhdmReceiptForEmail | null,
  locale: LocaleKey
): string {
  const L = strings(locale);
  const body = buildCustomerOrderDetailSection(order, L);
  const receiptBlock = ehdm
    ? buildEhdmBlock(ehdm, L)
    : `<p style="margin-top:16px;padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:14px;color:#9a3412;">${escapeHtml(L.fallbackReceipt)}</p>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h1 style="margin:0 0 8px;font-size:20px;color:#15803d;">${escapeHtml(L.paidTitle)}</h1>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">#${escapeHtml(order.number)}</p>
    ${body}
    ${receiptBlock}
    <p style="margin-top:20px;font-size:12px;color:#94a3b8;">${escapeHtml(L.footer)}</p>
  </div>
</body></html>`;
}

function textLinesCash(
  order: OrderDetailsForAdminEmail,
  locale: LocaleKey
): string {
  const L = strings(locale);
  const lines = [
    L.cashSubject(order.number),
    "",
    L.cashNote,
    `${L.orderNumber}: #${order.number}`,
    `${L.customer}: ${formatCustomerName(order.shippingAddress)}`,
    `${L.payment}: ${formatPaymentMethod(order.paymentMethod)}`,
    `${L.address}: ${formatAddress(order.shippingAddress)}`,
    "",
    ...order.items.map(
      (i) =>
        `${i.productTitle} x${i.quantity} = ${formatMoney(i.total)} ${order.currency}`
    ),
    "",
    `${L.total}: ${formatMoney(order.total)} ${order.currency}`,
  ];
  return lines.join("\n");
}

function textLinesPaid(
  order: OrderDetailsForAdminEmail,
  ehdm: EhdmReceiptForEmail | null,
  locale: LocaleKey
): string {
  const L = strings(locale);
  const lines = [
    L.paidSubject(order.number),
    "",
    `${L.orderNumber}: #${order.number}`,
    `${L.total}: ${formatMoney(order.total)} ${order.currency}`,
  ];
  if (ehdm) {
    lines.push("", L.ehdmHeading, `${L.receiptNo}: ${ehdm.receiptId}`);
    if (ehdm.fiscal) lines.push(`${L.fiscalNo}: ${ehdm.fiscal}`);
  } else {
    lines.push("", L.fallbackReceipt);
  }
  return lines.join("\n");
}

/**
 * Send cash/COD order confirmation to customer. Does not throw; logs on failure.
 */
export async function sendCustomerCashOrderEmail(
  order: OrderDetailsForAdminEmail & { customerEmail: string; customerLocale?: string | null }
): Promise<void> {
  const to = order.customerEmail.trim();
  if (!to) return;
  if (!resend) {
    console.warn(
      "[EMAIL] RESEND_API_KEY / resend client missing — skip customer cash order email"
    );
    return;
  }
  const locale = resolveLocale(order.customerLocale ?? undefined);
  const L = strings(locale);
  try {
    await sendEmail({
      to,
      subject: L.cashSubject(order.number),
      html: buildCashOrderHtml(order, locale),
      text: textLinesCash(order, locale),
    });
  } catch (err) {
    console.error("[EMAIL] sendCustomerCashOrderEmail failed:", err);
  }
}

/**
 * Send paid order email to customer (EHDM block or fallback). Does not throw.
 */
export async function sendCustomerPaidOrderEmail(
  order: OrderDetailsForAdminEmail & { customerEmail: string; customerLocale?: string | null },
  ehdm: EhdmReceiptForEmail | null
): Promise<void> {
  const to = order.customerEmail.trim();
  if (!to) return;
  if (!resend) {
    console.warn(
      "[EMAIL] RESEND_API_KEY / resend client missing — skip customer paid order email"
    );
    return;
  }
  const locale = resolveLocale(order.customerLocale ?? undefined);
  const L = strings(locale);
  try {
    await sendEmail({
      to,
      subject: L.paidSubject(order.number),
      html: buildPaidOrderHtml(order, ehdm, locale),
      text: textLinesPaid(order, ehdm, locale),
    });
  } catch (err) {
    console.error("[EMAIL] sendCustomerPaidOrderEmail failed:", err);
  }
}
