/**
 * Neon Database Setup Script (Simplified)
 * 
 * Այս script-ը օգտագործում է `prisma db push`-ը, որը ավելի պարզ է և ավտոմատ ստեղծում է
 * բոլոր աղյուսակները schema-ի հիման վրա
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." tsx scripts/setup-neon-db.ts
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const NEON_DATABASE_URL = process.env.DATABASE_URL;

if (!NEON_DATABASE_URL) {
  console.error("❌ [SETUP] DATABASE_URL environment variable is not set!");
  console.error("   Please set DATABASE_URL in your .env file or as an environment variable.");
  console.error("\n   Example:");
  console.error('   DATABASE_URL="postgresql://user:@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&client_encoding=UTF8"');
  process.exit(1);
}

// Ensure UTF-8 encoding is included
let databaseUrl = NEON_DATABASE_URL;
if (!databaseUrl.includes('client_encoding')) {
  databaseUrl = databaseUrl.includes('?') 
    ? `${databaseUrl}&client_encoding=UTF8`
    : `${databaseUrl}?client_encoding=UTF8`;
}

console.log("🚀 [SETUP] Starting Neon database setup...");
console.log("📝 [SETUP] Database URL:", databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = databaseUrl;

const dbPath = join(process.cwd(), "packages/db");

// Check if packages/db exists
if (!existsSync(dbPath)) {
  console.error(`❌ [SETUP] Database package not found at: ${dbPath}`);
  process.exit(1);
}

try {
  console.log("\n🔄 [SETUP] Pushing Prisma schema to Neon database...");
  console.log("   This will create all tables, indexes, and relationships...");
  console.log("   ⚠️  Note: This will not delete existing data, only create missing tables.");
  
  execSync("npm run db:push", {
    cwd: dbPath,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  
  console.log("\n✅ [SETUP] Database schema pushed successfully!");
  console.log("🎉 [SETUP] Your Neon database is now ready to use.");
  console.log("\n📋 [SETUP] Next steps:");
  console.log("   1. Restart your Vercel deployment");
  console.log("   2. Verify that your application works correctly");
  
} catch (error: any) {
  console.error("\n❌ [SETUP] Database setup failed!");
  console.error("   Error:", error.message);
  
  if (error.stdout) {
    console.error("\n📋 [SETUP] Output:", error.stdout.toString());
  }
  
  if (error.stderr) {
    console.error("\n⚠️  [SETUP] Errors:", error.stderr.toString());
  }
  
  console.error("\n💡 [SETUP] Troubleshooting:");
  console.error("   1. Check that DATABASE_URL is correct");
  console.error("   2. Verify that Neon database is accessible");
  console.error("   3. Ensure you have proper permissions");
  console.error("   4. Check network connectivity");
  console.error("   5. Try closing any applications that might be using the database");
  
  process.exit(1);
}

