-- CreateTable
CREATE TABLE "order_number_state" (
    "id" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "order_number_state_pkey" PRIMARY KEY ("id")
);

-- Insert default order number state row (starts from 100 for P100)
INSERT INTO "order_number_state" ("id", "nextNumber") VALUES ('default', 100);

