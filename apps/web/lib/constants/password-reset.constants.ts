/**
 * Password reset link lifetime (token in DB and text in email must stay in sync).
 *
 * Common choices: 1h (stricter), 12h (balance), 24h (more convenient, slightly higher risk if link leaks).
 */

export const PASSWORD_RESET_LINK_VALIDITY_HOURS = 24;

export const PASSWORD_RESET_LINK_VALIDITY_MS =
  PASSWORD_RESET_LINK_VALIDITY_HOURS * 60 * 60 * 1000;
