-- AlterTable
ALTER TABLE "orders" ADD COLUMN "customerCashOrderEmailSentAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "customerPaidOrderEmailSentAt" TIMESTAMP(3);
