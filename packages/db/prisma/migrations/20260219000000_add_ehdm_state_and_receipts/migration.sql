-- CreateTable
CREATE TABLE "ehdm_state" (
    "id" TEXT NOT NULL,
    "nextSeq" INTEGER NOT NULL DEFAULT 65,

    CONSTRAINT "ehdm_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ehdm_receipts" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "fiscal" TEXT,
    "qr" TEXT,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ehdm_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ehdm_receipts_orderId_key" ON "ehdm_receipts"("orderId");

-- CreateIndex
CREATE INDEX "ehdm_receipts_orderId_idx" ON "ehdm_receipts"("orderId");

-- Insert default EHDM seq row (initial seq from env EHDM_INITIAL_SEQ, typically 65)
INSERT INTO "ehdm_state" ("id", "nextSeq") VALUES ('default', 65);

-- AddForeignKey
ALTER TABLE "ehdm_receipts" ADD CONSTRAINT "ehdm_receipts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
