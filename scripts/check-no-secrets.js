#!/usr/bin/env node
/**
 * P0 Security 5.3: fail if likely secrets are committed (use in CI).
 * Matches high-confidence patterns only; may have false positives in docs.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PATTERNS = [
  { re: /postgresql:\/\/[^:]+:[^@\s]+@/, msg: "DATABASE_URL with password" },
  { re: /sk_live_[a-zA-Z0-9]{24,}/, msg: "Stripe live secret key" },
  { re: /sk_test_[a-zA-Z0-9]{24,}/, msg: "Stripe test secret key" },
  { re: /ghp_[a-zA-Z0-9]{36}/, msg: "GitHub personal access token" },
  { re: /["']([A-Za-z0-9+/]{40,}==?)["']/, msg: "Long base64-like string (possible key)" },
];

const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage"]);
const IGNORE_FILES = /\.(png|jpg|jpeg|gif|ico|woff2?|ttf|mp4|webm|zip|tar|gz)$/;

function walk(dir, cb) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) walk(full, cb);
      } else if (e.isFile() && !IGNORE_FILES.test(e.name)) {
        cb(full);
      }
    }
  } catch (_) {}
}

let failed = false;
walk(ROOT, (file) => {
  const rel = path.relative(ROOT, file);
  if (rel.startsWith("scripts/check-no-secrets")) return;
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const { re, msg } of PATTERNS) {
    if (re.test(content)) {
      console.error(`[check-no-secrets] ${msg} in ${rel}`);
      failed = true;
    }
  }
});

if (failed) {
  process.exit(1);
}
console.log("[check-no-secrets] OK");
