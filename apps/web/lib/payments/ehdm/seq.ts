import { db } from "@white-shop/db";
import { getConfig } from "./config";

/**
 * Get next seq for EHDM API and increment in DB (transaction).
 * If no row exists, create with EHDM_INITIAL_SEQ and return it (then next call will return initial+1).
 */
export async function getNextSeqAndIncrement(): Promise<number> {
  const config = getConfig();
  const result = await db.$transaction(async (tx) => {
    let row = await tx.ehdmState.findUnique({ where: { id: "default" } });
    if (!row) {
      await tx.ehdmState.create({
        data: { id: "default", nextSeq: config.initialSeq },
      });
      row = await tx.ehdmState.findUnique({ where: { id: "default" } });
    }
    if (!row) throw new Error("EHDM: failed to get seq");
    const seqToUse = row.nextSeq;
    await tx.ehdmState.update({
      where: { id: "default" },
      data: { nextSeq: seqToUse + 1 },
    });
    return seqToUse;
  });
  return result;
}

/**
 * Rollback seq by 1 (use only when API call failed after getNextSeqAndIncrement).
 */
export async function decrementSeq(): Promise<void> {
  await db.$transaction(async (tx) => {
    const row = await tx.ehdmState.findUnique({ where: { id: "default" } });
    if (!row || row.nextSeq <= 1) return;
    await tx.ehdmState.update({
      where: { id: "default" },
      data: { nextSeq: row.nextSeq - 1 },
    });
  });
}
