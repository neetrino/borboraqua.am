/**
 * Shared types and formatters for admin order notification emails.
 */

export type OrderItemForEmail = {
  productTitle: string;
  variantTitle: string | null;
  sku: string;
  quantity: number;
  price: number;
  total: number;
};

/** First email after checkout: online vs cash-on-delivery wording. */
export type OrderCreatedNotice = "awaiting_online_payment" | "cash_like";

export type OrderDetailsForAdminEmail = {
  number: string;
  customerEmail: string | null;
  customerPhone: string | null;
  total: number;
  currency: string;
  shippingAddress: unknown;
  shippingMethod: string | null;
  paymentMethod: string | null;
  items: OrderItemForEmail[];
};

export type OrderForAdminEmail = OrderDetailsForAdminEmail & {
  createdNotice: OrderCreatedNotice;
};

export function formatPaymentMethod(method: string | null): string {
  if (!method) return "—";
  const labels: Record<string, string> = {
    idram: "IDram",
    arca: "ArCa",
    ameriabank: "Ameriabank",
    telcell: "Telcell",
    fastshift: "FastShift",
    pickup: "Ինքնավաճառք",
    cash: "Կանխիկ",
    cash_on_delivery: "Առաքումով վճարում",
    card: "Քարտ",
  };
  return labels[method.toLowerCase()] ?? method;
}

export function formatDeliveryDay(addr: unknown): string {
  if (addr == null || typeof addr !== "object") return "—";
  const o = addr as Record<string, unknown>;
  const raw = o.deliveryDay;
  if (!raw || typeof raw !== "string") return "—";
  const parts = raw.split("-").map(Number);
  const [year, month, day] = parts;
  if (!year || !month || !day) return raw;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("hy-AM", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatCustomerName(addr: unknown): string {
  if (addr == null || typeof addr !== "object") return "—";
  const o = addr as Record<string, unknown>;
  const first = o.firstName != null ? String(o.firstName).trim() : "";
  const last = o.lastName != null ? String(o.lastName).trim() : "";
  const name = [first, last].filter(Boolean).join(" ");
  return name || "—";
}

export function formatAddress(addr: unknown): string {
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

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function buildCreatedNoticeBanner(
  createdNotice: OrderCreatedNotice
): string {
  if (createdNotice === "awaiting_online_payment") {
    return `
    <div style="background:#fef3c7;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:14px;color:#92400e;border:1px solid #fcd34d;">
      <strong>Վճարման կարգավիճակ՝</strong> Սպասում ենք առցանց վճարման
    </div>`;
  }
  return `
    <div style="background:#ecfdf5;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:14px;color:#065f46;border:1px solid #6ee7b7;">
      <strong>Վճարման կարգավիճակ՝</strong> Կանխիկ / առաքումով վճարում (առցանց վճարում չի սպասվում)
    </div>`;
}

export function buildItemsRows(order: OrderDetailsForAdminEmail): string {
  return order.items
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
}

export function createdNoticeTextLine(
  createdNotice: OrderCreatedNotice
): string {
  if (createdNotice === "awaiting_online_payment") {
    return "Վճարման կարգավիճակ՝ Սպասում ենք առցանց վճարման";
  }
  return "Վճարման կարգավիճակ՝ Կանխիկ / առաքումով վճարում";
}
