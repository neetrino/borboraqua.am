-- Run this SQL directly in your database (pgAdmin, DBeaver, psql, etc.)
-- This will add the 'attributes' JSONB column to the product_variants table

ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "attributes" JSONB;

-- After running this SQL, restart your Next.js dev server
-- The Prisma client will automatically recognize the new column




