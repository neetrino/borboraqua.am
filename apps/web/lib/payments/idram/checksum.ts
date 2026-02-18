import { createHash } from "crypto";

/**
 * Idram EDP_CHECKSUM = MD5(EDP_REC_ACCOUNT:EDP_AMOUNT:SECRET_KEY:EDP_BILL_NO:EDP_PAYER_ACCOUNT:EDP_TRANS_ID:EDP_TRANS_DATE).
 * Doc: Order Confirmation (b) — concatenate by colon, then MD5.
 */
export function computeIdramChecksum(
  recAccount: string,
  amount: string,
  secretKey: string,
  billNo: string,
  payerAccount: string,
  transId: string,
  transDate: string
): string {
  const str = [recAccount, amount, secretKey, billNo, payerAccount, transId, transDate].join(":");
  return createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

export function verifyIdramChecksum(
  recAccount: string,
  amount: string,
  secretKey: string,
  billNo: string,
  payerAccount: string,
  transId: string,
  transDate: string,
  receivedChecksum: string
): boolean {
  const expected = computeIdramChecksum(
    recAccount,
    amount,
    secretKey,
    billNo,
    payerAccount,
    transId,
    transDate
  );
  return (receivedChecksum ?? "").toUpperCase() === expected;
}
