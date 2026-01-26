import { db } from "../client";

/**
 * Check database encoding information
 * This utility helps diagnose encoding issues with PostgreSQL databases
 * 
 * @returns Object with encoding information
 */
export async function checkDatabaseEncoding() {
  try {
    // Check database encoding
    const dbEncoding = await db.$queryRaw<Array<{ datname: string; encoding: string }>>`
      SELECT 
        datname,
        pg_encoding_to_char(encoding) as encoding
      FROM pg_database 
      WHERE datname = current_database()
    `;

    // Check client encoding for current session
    const clientEncoding = await db.$queryRaw<Array<{ client_encoding: string }>>`
      SHOW client_encoding
    `;

    // Check server encoding
    const serverEncoding = await db.$queryRaw<Array<{ server_encoding: string }>>`
      SHOW server_encoding
    `;

    const result = {
      database: {
        name: dbEncoding[0]?.datname || 'unknown',
        encoding: dbEncoding[0]?.encoding || 'unknown',
      },
      client: {
        encoding: clientEncoding[0]?.client_encoding || 'unknown',
      },
      server: {
        encoding: serverEncoding[0]?.server_encoding || 'unknown',
      },
      isUtf8: {
        database: dbEncoding[0]?.encoding === 'UTF8',
        client: clientEncoding[0]?.client_encoding === 'UTF8',
        server: serverEncoding[0]?.server_encoding === 'UTF8',
      },
      recommendations: [] as string[],
    };

    // Add recommendations
    if (!result.isUtf8.database) {
      result.recommendations.push(
        `Database encoding is ${result.database.encoding}, not UTF8. Consider recreating database with UTF8 encoding.`
      );
    }

    if (!result.isUtf8.client) {
      result.recommendations.push(
        `Client encoding is ${result.client.encoding}, not UTF8. Ensure DATABASE_URL includes client_encoding=UTF8.`
      );
    }

    if (result.isUtf8.database && result.isUtf8.client) {
      result.recommendations.push('✅ All encodings are properly set to UTF8');
    }

    return result;
  } catch (error: any) {
    console.error('❌ [DB ENCODING CHECK] Error checking encoding:', error);
    throw {
      error: 'Failed to check database encoding',
      message: error?.message,
    };
  }
}

/**
 * Test UTF-8 encoding by inserting and reading a test string with special characters
 * 
 * @param testString - Optional test string (default: Armenian, Russian, and emoji characters)
 * @returns Object with test results
 */
export async function testUtf8Encoding(testString?: string) {
  const defaultTestString = 'Հայերեն Русский 🎉 Test';
  const test = testString || defaultTestString;

  try {
    // Try to execute a simple query with UTF-8 characters
    const result = await db.$queryRaw<Array<{ test: string }>>`
      SELECT ${test}::text as test
    `;

    return {
      success: true,
      input: test,
      output: result[0]?.test || 'unknown',
      matches: result[0]?.test === test,
      message: result[0]?.test === test 
        ? '✅ UTF-8 encoding test passed'
        : '⚠️ UTF-8 encoding test failed - output does not match input',
    };
  } catch (error: any) {
    return {
      success: false,
      input: test,
      output: null,
      matches: false,
      error: error?.message,
      message: '❌ UTF-8 encoding test failed',
    };
  }
}










