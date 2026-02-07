import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createContactMessagesTable() {
  try {
    console.log('🔄 Creating contact_messages table...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "contact_messages" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "contact_messages_createdAt_idx" ON "contact_messages"("createdAt" DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "contact_messages_email_idx" ON "contact_messages"("email");
    `);

    console.log('✅ contact_messages table created successfully!');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  contact_messages table already exists');
    } else {
      console.error('❌ Error creating table:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createContactMessagesTable();

