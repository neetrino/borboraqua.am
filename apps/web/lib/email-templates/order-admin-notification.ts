/**
 * Order notification email to admin — HTML template and send helpers.
 * Uses env: ADMIN_EMAIL.
 */

import { sendEmail } from "@/lib/email";
import {
  buildCreatedNoticeBanner,
  buildItemsRows,
  createdNoticeTextLine,
  escapeHtml,
  formatAddress,
  formatCustomerName,
  formatDeliveryDay,
  formatMoney,
  formatPaymentMethod,
} from "@/lib/email-templates/order-admin-email-shared";
import type {
  OrderDetailsForAdminEmail,
  OrderForAdminEmail,
} from "@/lib/email-templates/order-admin-email-shared";

export type {
  OrderCreatedNotice,
  OrderDetailsForAdminEmail,
  OrderForAdminEmail,
  OrderItemForEmail,
} from "@/lib/email-templates/order-admin-email-shared";

function buildOrderAdminHtml(order: OrderForAdminEmail): string {
  const customerName = formatCustomerName(order.shippingAddress);
  const addressText = formatAddress(order.shippingAddress);
  const paymentLabel = formatPaymentMethod(order.paymentMethod);
  const deliveryDayText = formatDeliveryDay(order.shippingAddress);
  const rows = buildItemsRows(order);
  const noticeBanner = buildCreatedNoticeBanner(order.createdNotice);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New order ${escapeHtml(order.number)}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:#fff;padding:24px 28px;">
      <h1 style="margin:0;font-size:22px;font-weight:600;">Նոր պատվեր</h1>
      <p style="margin:8px 0 0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">#${escapeHtml(order.number)}</p>
    </div>
    <div style="padding:28px;">
      ${noticeBanner}
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;width:140px;">Հաճախորդ</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(customerName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Էլ. փոստ</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(order.customerEmail ?? "—")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Հեռախոս</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(order.customerPhone ?? "—")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Վճարում</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#2563eb;">${escapeHtml(paymentLabel)}</td>
        </tr>
        ${deliveryDayText !== "—" ? `<tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Առաքման օր</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#16a34a;">${escapeHtml(deliveryDayText)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">Հասցե</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(addressText)}</td>
        </tr>
      </table>

      <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1e293b;">Պատվերի կազմ</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#475569;">Ապրանք</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#475569;">SKU</th>
            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#475569;">Քանակ</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#475569;">Գին</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#475569;">Ընդամենը</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:24px;padding-top:16px;border-top:2px solid #e2e8f0;text-align:right;">
        <span style="font-size:18px;font-weight:700;color:#1e293b;">Ընդամենը՝ ${formatMoney(order.total)} ${escapeHtml(order.currency)}</span>
      </div>
    </div>
    <div style="padding:16px 28px;background:#f8fafc;font-size:12px;color:#64748b;">
      Այս նամակն ուղարկվել է ավտոմատ կերպով։ Պատվերը ստեղծվել է խանութում։
    </div>
  </div>
</body>
</html>`;
}

function buildOrderPaidAdminHtml(order: OrderDetailsForAdminEmail): string {
  const customerName = formatCustomerName(order.shippingAddress);
  const addressText = formatAddress(order.shippingAddress);
  const paymentLabel = formatPaymentMethod(order.paymentMethod);
  const deliveryDayText = formatDeliveryDay(order.shippingAddress);
  const rows = buildItemsRows(order);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paid order ${escapeHtml(order.number)}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#15803d 0%,#166534 100%);color:#fff;padding:24px 28px;">
      <h1 style="margin:0;font-size:22px;font-weight:600;">Պատվերը վճարված է</h1>
      <p style="margin:8px 0 0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">#${escapeHtml(order.number)}</p>
    </div>
    <div style="padding:28px;">
      <div style="background:#dcfce7;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:14px;color:#14532d;border:1px solid #86efac;">
        <strong>Վճարման կարգավիճակ՝</strong> Վճարումը հաստատված է
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;width:140px;">Հաճախորդ</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(customerName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Էլ. փոստ</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(order.customerEmail ?? "—")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Հեռախոս</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(order.customerPhone ?? "—")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Վճարում</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#15803d;">${escapeHtml(paymentLabel)}</td>
        </tr>
        ${deliveryDayText !== "—" ? `<tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Առաքման օր</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#16a34a;">${escapeHtml(deliveryDayText)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">Հասցե</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(addressText)}</td>
        </tr>
      </table>

      <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1e293b;">Պատվերի կազմ</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#475569;">Ապրանք</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#475569;">SKU</th>
            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#475569;">Քանակ</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#475569;">Գին</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#475569;">Ընդամենը</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:24px;padding-top:16px;border-top:2px solid #e2e8f0;text-align:right;">
        <span style="font-size:18px;font-weight:700;color:#1e293b;">Ընդամենը՝ ${formatMoney(order.total)} ${escapeHtml(order.currency)}</span>
      </div>
    </div>
    <div style="padding:16px 28px;background:#f8fafc;font-size:12px;color:#64748b;">
      Այս նամակն ուղարկվել է ավտոմատ կերպով։ Վճարումը հաստատվել է։
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends order details to admin email (order created). Does not throw; logs on failure.
 */
export async function sendOrderNotificationToAdmin(
  order: OrderForAdminEmail
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    console.warn(
      "[EMAIL] ADMIN_EMAIL is not set — skipping order notification to admin. Add ADMIN_EMAIL to .env (root or apps/web) and restart the dev server."
    );
    return;
  }

  const subject =
    order.createdNotice === "awaiting_online_payment"
      ? `Նոր պատվեր #${order.number} — սպասում ենք վճարման`
      : `Նոր պատվեր #${order.number}`;

  try {
    await sendEmail({
      to: adminEmail,
      subject,
      html: buildOrderAdminHtml(order),
      text: [
        subject,
        createdNoticeTextLine(order.createdNotice),
        `Հաճախորդ՝ ${formatCustomerName(order.shippingAddress)}`,
        `Էլ. փոստ՝ ${order.customerEmail ?? "—"}, Հեռախոս՝ ${order.customerPhone ?? "—"}`,
        `Վճարում՝ ${formatPaymentMethod(order.paymentMethod)}`,
        `Առաքման օր՝ ${formatDeliveryDay(order.shippingAddress)}`,
        `Հասցե՝ ${formatAddress(order.shippingAddress)}`,
        ``,
        order.items
          .map(
            (i) =>
              `${i.productTitle} (${i.sku}) x${i.quantity} = ${formatMoney(i.total)} ${order.currency}`
          )
          .join("\n"),
        ``,
        `Ընդամենը՝ ${formatMoney(order.total)} ${order.currency}`,
      ].join("\n"),
    });
    console.log("[EMAIL] Order notification sent to admin:", adminEmail);
  } catch (err) {
    console.error("[EMAIL] Failed to send order notification to admin:", err);
  }
}

/**
 * Sends "order paid" confirmation to admin (online payments). Does not throw; logs on failure.
 */
export async function sendOrderPaidNotificationToAdmin(
  order: OrderDetailsForAdminEmail
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    console.warn(
      "[EMAIL] ADMIN_EMAIL is not set — skipping order paid notification to admin."
    );
    return;
  }

  const subject = `Պատվերը վճարված է #${order.number}`;

  try {
    await sendEmail({
      to: adminEmail,
      subject,
      html: buildOrderPaidAdminHtml(order),
      text: [
        subject,
        "Վճարման կարգավիճակ՝ Վճարումը հաստատված է",
        `Հաճախորդ՝ ${formatCustomerName(order.shippingAddress)}`,
        `Էլ. փոստ՝ ${order.customerEmail ?? "—"}, Հեռախոս՝ ${order.customerPhone ?? "—"}`,
        `Վճարում՝ ${formatPaymentMethod(order.paymentMethod)}`,
        `Առաքման օր՝ ${formatDeliveryDay(order.shippingAddress)}`,
        `Հասցե՝ ${formatAddress(order.shippingAddress)}`,
        ``,
        order.items
          .map(
            (i) =>
              `${i.productTitle} (${i.sku}) x${i.quantity} = ${formatMoney(i.total)} ${order.currency}`
          )
          .join("\n"),
        ``,
        `Ընդամենը՝ ${formatMoney(order.total)} ${order.currency}`,
      ].join("\n"),
    });
    console.log("[EMAIL] Order paid notification sent to admin:", adminEmail);
  } catch (err) {
    console.error("[EMAIL] Failed to send order paid notification to admin:", err);
  }
}
