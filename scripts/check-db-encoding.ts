/**
 * Script to check database encoding
 * 
 * This script checks the current database encoding and provides recommendations
 * for fixing encoding issues, especially for Armenian and other UTF-8 characters.
 * 
 * Usage:
 *   npm run check:db-encoding
 *   or
 *   tsx scripts/check-db-encoding.ts
 */

import dotenv from "dotenv";
import { checkDatabaseEncoding, testUtf8Encoding } from "../packages/db/utils/check-encoding";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🔍 [DB ENCODING CHECK] Checking database encoding...\n");

  try {
    // Check encoding
    const encodingInfo = await checkDatabaseEncoding();

    console.log("📊 Database Encoding Information:");
    console.log("─────────────────────────────────");
    console.log(`Database: ${encodingInfo.database.name}`);
    console.log(`  Encoding: ${encodingInfo.database.encoding}`);
    console.log(`  UTF-8: ${encodingInfo.isUtf8.database ? "✅ Yes" : "❌ No"}`);
    console.log();
    console.log(`Client Encoding: ${encodingInfo.client.encoding}`);
    console.log(`  UTF-8: ${encodingInfo.isUtf8.client ? "✅ Yes" : "❌ No"}`);
    console.log();
    console.log(`Server Encoding: ${encodingInfo.server.encoding}`);
    console.log(`  UTF-8: ${encodingInfo.isUtf8.server ? "✅ Yes" : "❌ No"}`);
    console.log();

    // Show recommendations
    console.log("💡 Recommendations:");
    console.log("─────────────────────────────────");
    encodingInfo.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log();

    // Test UTF-8 encoding
    console.log("🧪 Testing UTF-8 encoding with special characters...");
    console.log("─────────────────────────────────");
    const testResult = await testUtf8Encoding();
    
    if (testResult.success) {
      console.log(`Input:  "${testResult.input}"`);
      console.log(`Output: "${testResult.output}"`);
      console.log(`Match:  ${testResult.matches ? "✅ Yes" : "❌ No"}`);
      console.log(`Result: ${testResult.message}`);
    } else {
      console.log(`❌ Test failed: ${testResult.error}`);
      console.log(`Result: ${testResult.message}`);
    }

    console.log();
    
    // Final status
    if (encodingInfo.isUtf8.database && encodingInfo.isUtf8.client && testResult.success && testResult.matches) {
      console.log("✅ All encoding checks passed! Database is ready for UTF-8 characters.");
      process.exit(0);
    } else {
      console.log("⚠️  Encoding issues detected. Please review recommendations above.");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ [DB ENCODING CHECK] Error:", error);
    process.exit(1);
  }
}

main();






















