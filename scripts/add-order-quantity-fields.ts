import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
const envPath = join(process.cwd(), '.env');
dotenv.config({ path: envPath });
dotenv.config(); // Also try default location

const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl || (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://"))) {
  console.error("❌ Error: DATABASE_URL is not set or invalid in environment variables!");
  process.exit(1);
}

const prisma = new PrismaClient();

async function addOrderQuantityFields() {
  try {
    console.log('🔄 Adding minimumOrderQuantity and orderQuantityIncrement columns...');
    
    // Add minimumOrderQuantity column
    console.log('📝 Adding minimumOrderQuantity column...');
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('✅ minimumOrderQuantity column processed');
    
    // Add orderQuantityIncrement column
    console.log('📝 Adding orderQuantityIncrement column...');
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('✅ orderQuantityIncrement column processed');
    
    console.log('✅ Columns added successfully!');
    
    // Verify columns exist
    console.log('\n📝 Verifying columns...');
    const columns = await prisma.$queryRawUnsafe<Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>>(`
      SELECT 
          column_name, 
          data_type,
          is_nullable,
          column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name IN ('minimumOrderQuantity', 'orderQuantityIncrement')
      ORDER BY column_name;
    `);
    
    if (columns.length === 0) {
      console.log('⚠️  No columns found! Something went wrong.');
    } else {
      console.log('✅ Verification results:');
      columns.forEach((col) => {
        console.log(`   ✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addOrderQuantityFields();

