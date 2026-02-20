/**
 * Order notification email to admin — HTML template and send helper.
 * Uses env: ADMIN_EMAIL.
 */

import { sendEmail } from "@/lib/email";

export type OrderItemForEmail = {
  productTitle: string;
  variantTitle: string | null;
  sku: string;
  quantity: number;
  price: number;
  total: number;
};

export type OrderForAdminEmail = {
  number: string;
  customerEmail: string | null;
  customerPhone: string | null;
  total: number;
  currency: string;
  shippingAddress: unknown;
  shippingMethod: string | null;
  items: OrderItemForEmail[];
};

function formatCustomerName(addr: unknown): string {
  if (addr == null || typeof addr !== "object") return "—";
  const o = addr as Record<string, unknown>;
  const first = o.firstName != null ? String(o.firstName).trim() : "";
  const last = o.lastName != null ? String(o.lastName).trim() : "";
  const name = [first, last].filter(Boolean).join(" ");
  return name || "—";
}

function formatAddress(addr: unknown): string {
  if (addr == null) return "—";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object" && addr !== null) {
    const o = addr as Record<string, unknown>;
    const parts = [
      o.address,
      o.addressLine1,
      o.city,
      o.region,
      o.state,
      o.postalCode,
      o.country,
    ]
      .filter(Boolean)
      .map(String);
    return parts.join(", ") || "—";
  }
  return "—";
}

function buildOrderAdminHtml(order: OrderForAdminEmail): string {
  const customerName = formatCustomerName(order.shippingAddress);
  const addressText = formatAddress(order.shippingAddress);
  const rows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(item.productTitle)}${item.variantTitle ? ` (${escapeHtml(item.variantTitle)})` : ""}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(item.sku)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(item.price)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(item.total)}</td>
    </tr>`
    )
    .join("");

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
      <h1 style="margin:0;font-size:22px;font-weight:600;">New order</h1>
      <p style="margin:8px 0 0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">#${escapeHtml(order.number)}</p>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;width:140px;">Customer</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(customerName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Email</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(order.customerEmail ?? "—")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Phone</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(order.customerPhone ?? "—")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;">Shipping</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(order.shippingMethod ?? "—")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">Address</td>
          <td style="padding:6px 0;font-size:14px;">${escapeHtml(addressText)}</td>
        </tr>
      </table>

      <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1e293b;">Order items</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#475569;">Product</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#475569;">SKU</th>
            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#475569;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#475569;">Price</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#475569;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:24px;padding-top:16px;border-top:2px solid #e2e8f0;text-align:right;">
        <span style="font-size:18px;font-weight:700;color:#1e293b;">Total: ${formatMoney(order.total)} ${escapeHtml(order.currency)}</span>
      </div>
    </div>
    <div style="padding:16px 28px;background:#f8fafc;font-size:12px;color:#64748b;">
      This email was sent automatically. Order created in the store.
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Sends order details to admin email. Does not throw; logs on failure.
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

  try {
    await sendEmail({
      to: adminEmail,
      subject: `New order #${order.number}`,
      html: buildOrderAdminHtml(order),
      text: [
        `New order #${order.number}`,
        `Customer: ${formatCustomerName(order.shippingAddress)}`,
        `Email: ${order.customerEmail ?? "—"}, Phone: ${order.customerPhone ?? "—"}`,
        `Address: ${formatAddress(order.shippingAddress)}`,
        ``,
        order.items
          .map(
            (i) =>
              `${i.productTitle} (${i.sku}) x${i.quantity} = ${formatMoney(i.total)} ${order.currency}`
          )
          .join("\n"),
        ``,
        `Total: ${formatMoney(order.total)} ${order.currency}`,
      ].join("\n"),
    });
    console.log("[EMAIL] Order notification sent to admin:", adminEmail);
  } catch (err) {
    console.error("[EMAIL] Failed to send order notification to admin:", err);
  }
}
