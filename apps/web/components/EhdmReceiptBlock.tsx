"use client";

import { useCallback } from "react";

/**
 * Displays EHDM fiscal receipt (Էլեկտրոնային ՀԴՄ) for an order.
 * Used in admin order details and client order page. No PDF — print via browser; "Download" opens print (Save as PDF).
 */
export type EhdmReceiptData = {
  receiptId: string;
  fiscal: string | null;
  qr: string | null;
  createdAt: string | null;
  result: {
    taxpayer?: string;
    address?: string;
    crn?: string;
    sn?: string;
    tin?: string;
    time?: number;
    total?: number;
  } | null;
};

type Props = {
  receipt: EhdmReceiptData;
  orderNumber?: string;
  /** Compact: less spacing, for sidebar. Full: full receipt layout. */
  variant?: "compact" | "full";
};

const QR_IMAGE_SIZE = 120;

function formatReceiptTime(unixSeconds: number | undefined): string {
  if (unixSeconds == null) return "—";
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleString("hy-AM", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function EhdmReceiptBlock({
  receipt,
  orderNumber,
  variant = "full",
}: Props) {
  const result = receipt.result;
  const qrUrl =
    receipt.qr?.trim() != null && receipt.qr.trim() !== ""
      ? `https://api.qrserver.com/v1/create-qr-code/?size=${QR_IMAGE_SIZE}x${QR_IMAGE_SIZE}&data=${encodeURIComponent(
          receipt.qr.replace(/\s/g, "")
        )}`
      : null;

  const handleDownloadOrPrint = useCallback(() => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    const timeStr =
      result?.time != null
        ? formatReceiptTime(result.time)
        : "";
    const qrImg =
      qrUrl != null
        ? `<img src="${qrUrl}" alt="QR" width="${QR_IMAGE_SIZE}" height="${QR_IMAGE_SIZE}" style="display:block;width:120px;height:120px;object-fit:contain" />`
        : "";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Ֆիսկալ կտրոն ${receipt.receiptId}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; max-width: 400px; }
          h1 { font-size: 1rem; margin-bottom: 12px; }
          p { margin: 4px 0; font-size: 14px; }
          .qr { margin-top: 12px; }
        </style>
        </head>
        <body>
          <h1>ԿՏՐՈՆԻ ՖԻՍԿԱԼ ՀԱՄԱՐ (E-HDM)${orderNumber != null ? ` — Պատվեր ${orderNumber}` : ""}</h1>
          ${result?.taxpayer != null ? `<p><strong>Կազմակերպություն:</strong> ${escapeHtml(result.taxpayer)}</p>` : ""}
          ${result?.address != null ? `<p><strong>Հասցե:</strong> ${escapeHtml(result.address)}</p>` : ""}
          ${result?.tin != null ? `<p><strong>ՀՎՀՀ:</strong> ${escapeHtml(result.tin)}</p>` : ""}
          ${result?.crn != null ? `<p><strong>ԳՀ:</strong> ${escapeHtml(result.crn)}</p>` : ""}
          ${result?.sn != null ? `<p><strong>ՍՀ:</strong> ${escapeHtml(result.sn)}</p>` : ""}
          ${receipt.fiscal != null && receipt.fiscal !== "" ? `<p><strong>Ֆիսկալ:</strong> ${escapeHtml(receipt.fiscal)}</p>` : ""}
          <p><strong>Կտրոնի հերթ. համար (ԿՀ):</strong> ${escapeHtml(receipt.receiptId)}</p>
          ${timeStr ? `<p><strong>Ամսաթիվ, ժամ:</strong> ${escapeHtml(timeStr)}</p>` : ""}
          ${result?.total != null ? `<p><strong>Ընդամենը:</strong> ${Number(result.total).toFixed(2)} AMD</p>` : ""}
          <div class="qr">${qrImg}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  }, [receipt, result, orderNumber, qrUrl]);

  return (
    <section
      className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 print:border print:bg-white"
      aria-label="Fiscal receipt (EHDM)"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        ԿՏՐՈՆԻ ՖԻՍԿԱԼ ՀԱՄԱՐ (E-HDM)
        {orderNumber != null && (
          <span className="ml-2 font-normal text-gray-600">
            Պատվեր {orderNumber}
          </span>
        )}
      </h3>

      <div
        className={
          variant === "compact"
            ? "space-y-2 text-sm"
            : "grid gap-4 sm:grid-cols-[1fr_auto] text-sm"
        }
      >
        <div className="space-y-1.5">
          {result?.taxpayer != null && (
            <div>
              <span className="text-gray-500">Կազմակերպություն: </span>
              <span className="font-medium">{result.taxpayer}</span>
            </div>
          )}
          {result?.address != null && (
            <div>
              <span className="text-gray-500">Հասցե: </span>
              {result.address}
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {result?.tin != null && (
              <span>
                <span className="text-gray-500">ՀՎՀՀ: </span>
                <span className="font-medium">{result.tin}</span>
              </span>
            )}
            {result?.crn != null && (
              <span>
                <span className="text-gray-500">ԳՀ: </span>
                {result.crn}
              </span>
            )}
            {result?.sn != null && (
              <span>
                <span className="text-gray-500">ՍՀ: </span>
                {result.sn}
              </span>
            )}
          </div>
          {receipt.fiscal != null && receipt.fiscal !== "" && (
            <div>
              <span className="text-gray-500">Ֆիսկալ: </span>
              <span className="font-semibold">{receipt.fiscal}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Կտրոնի հերթ. համար (ԿՀ): </span>
            <span className="font-medium">{receipt.receiptId}</span>
          </div>
          {result?.time != null && (
            <div>
              <span className="text-gray-500">Ամսաթիվ, ժամ: </span>
              {formatReceiptTime(result.time)}
            </div>
          )}
          {result?.total != null && (
            <div>
              <span className="text-gray-500">Ընդամենը: </span>
              <span className="font-semibold">
                {Number(result.total).toFixed(2)} AMD
              </span>
            </div>
          )}
        </div>

        {(qrUrl != null || (variant === "full")) && (
          <div className="flex shrink-0 flex-col items-center gap-4 sm:items-end">
            {qrUrl != null && (
              <div
                style={{ width: QR_IMAGE_SIZE, height: QR_IMAGE_SIZE, minWidth: QR_IMAGE_SIZE, minHeight: QR_IMAGE_SIZE }}
              >
                <img
                  src={qrUrl}
                  alt="QR receipt"
                  width={QR_IMAGE_SIZE}
                  height={QR_IMAGE_SIZE}
                  className="block rounded border border-gray-200 bg-white object-contain"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
            )}
            {variant === "full" && (
              <button
                type="button"
                onClick={handleDownloadOrPrint}
                className="inline-flex w-[120px] justify-center items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PDF
              </button>
            )}
          </div>
        )}
      </div>

      {variant === "full" && (
        <p className="mt-3 text-xs text-gray-500 print:text-gray-700">
          Էլեկտրոնային ՀԴՄ կտրոն. Կարող եք նաև օգտագործել brauzerի «Տպել»:
        </p>
      )}
    </section>
  );
}
