"use client";

/**
 * Displays EHDM fiscal receipt (Էլեկտրոնային ՀԴՄ) for an order.
 * Used in admin order details and client order page. No PDF — print via browser.
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

        {qrUrl != null && (
          <div
            className="flex shrink-0 justify-center sm:justify-end"
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
      </div>

      {variant === "full" && (
        <p className="mt-3 text-xs text-gray-500 print:text-gray-700">
          Էլեկտրոնային ՀԴՄ կտրոն. Տպելու համար օգտագործեք brauzerի «Տպել»:
        </p>
      )}
    </section>
  );
}
