-- CreateIndex (position for product sort order in admin)
CREATE INDEX IF NOT EXISTS "products_position_idx" ON "products"("position");
