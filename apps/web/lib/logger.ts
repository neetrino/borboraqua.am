/**
 * Minimal logger: logs only in development to avoid console in production.
 * Use this instead of console.log/error/warn (project rule: միայն logger).
 */

const isDev =
  typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
};
