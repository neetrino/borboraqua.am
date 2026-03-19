/**
 * One-off import of WordPress users from export file (HTML with embedded JSON).
 * All users get one standard temporary password; after import send password-reset links from admin.
 *
 * Usage: npx tsx scripts/import-wp-users.ts
 * Or: npm run import-wp-users
 *
 * Optional env: IMPORT_FILE (path to export), IMPORT_TEMP_PASSWORD (default TempPass2025!)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../packages/db';
import * as bcrypt from 'bcryptjs';

const DEFAULT_IMPORT_FILE = path.join(
  process.cwd(),
  'users-export-2026-03-19-17-31-20.json'
);
const DEFAULT_TEMP_PASSWORD = 'TempPass2025!';

interface WpUser {
  ID: number;
  user_login: string;
  user_email: string;
  phone?: string;
  display_name: string;
  user_registered?: string;
  user_pass?: string;
  roles: string;
}

function extractUsersJson(htmlPath: string): WpUser[] {
  const content = fs.readFileSync(htmlPath, 'utf-8');
  const arrayStart =
    content.indexOf('        [') !== -1
      ? content.indexOf('        [')
      : content.indexOf('    [');
  const start = arrayStart !== -1 ? arrayStart : content.indexOf('[\n    {');
  if (start === -1) throw new Error('JSON array not found in file');
  const fromStart = content.slice(start);
  const endBracket = fromStart.lastIndexOf(']');
  if (endBracket === -1) throw new Error('JSON array end not found');
  const jsonStr = fromStart.slice(0, endBracket + 1);
  return JSON.parse(jsonStr) as WpUser[];
}

async function run() {
  const importFile = process.env.IMPORT_FILE || DEFAULT_IMPORT_FILE;
  const tempPassword = process.env.IMPORT_TEMP_PASSWORD || DEFAULT_TEMP_PASSWORD;

  console.log('📂 [IMPORT] File:', importFile);
  if (!fs.existsSync(importFile)) {
    console.error('❌ [IMPORT] File not found');
    process.exit(1);
  }

  const wpUsers = extractUsersJson(importFile);
  console.log('📋 [IMPORT] Users in file:', wpUsers.length);

  const passwordHash = await bcrypt.hash(tempPassword, 10);
  let created = 0;
  let skipped = 0;

  for (const u of wpUsers) {
    const email = (u.user_email || '').trim().toLowerCase();
    if (!email) {
      skipped++;
      continue;
    }

    const phone = (u.phone || '').trim() || null;
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { email, deletedAt: null },
          ...(phone ? [{ phone, deletedAt: null }] : []),
        ],
      },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const roles =
      u.roles && String(u.roles).toLowerCase().includes('administrator')
        ? ['admin']
        : ['customer'];

    await db.user.create({
      data: {
        email,
        phone,
        firstName: (u.display_name || u.user_login || '').trim() || null,
        lastName: null,
        passwordHash,
        roles,
        locale: 'en',
      },
    });
    created++;
  }

  console.log('✅ [IMPORT] Created:', created, 'Skipped:', skipped);
  console.log('🔑 [IMPORT] Temporary password for all:', tempPassword);
  console.log('📧 [IMPORT] After import: send password-reset links from admin.');
  await db.$disconnect();
}

run().catch((e) => {
  console.error('❌ [IMPORT]', e);
  process.exit(1);
});
