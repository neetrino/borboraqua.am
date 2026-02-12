-- Add minimumOrderQuantity and orderQuantityIncrement columns to products table
-- This script can be run directly in your database if migrations are not working

-- Add minimumOrderQuantity column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'minimumOrderQuantity'
    ) THEN
        ALTER TABLE "products" ADD COLUMN "minimumOrderQuantity" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added minimumOrderQuantity column';
    ELSE
        RAISE NOTICE 'minimumOrderQuantity column already exists';
    END IF;
END $$;

-- Add orderQuantityIncrement column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'orderQuantityIncrement'
    ) THEN
        ALTER TABLE "products" ADD COLUMN "orderQuantityIncrement" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added orderQuantityIncrement column';
    ELSE
        RAISE NOTICE 'orderQuantityIncrement column already exists';
    END IF;
END $$;

