ALTER TABLE "product_labels"
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

ALTER TABLE "product_labels"
ADD COLUMN IF NOT EXISTS "imagePosition" TEXT;
