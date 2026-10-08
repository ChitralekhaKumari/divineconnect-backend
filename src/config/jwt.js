/**
 * Centralized JWT secret access.
 *
 * The old code had `process.env.JWT_SECRET || 'divineconnect_secret_2026'`
 * duplicated in two files — meaning if the env var was ever missing in
 * production, every token would silently sign with a secret that's sitting
 * in this repo's git history. That's a critical vuln, not a convenience.
 *
 * Now: missing JWT_SECRET is fine in development (falls back with a loud
 * warning) but crashes startup in production, which is exactly what you want —
 * fail fast instead of shipping insecure tokens.
 */
const DEV_FALLBACK_SECRET = 'dev_only_insecure_secret_do_not_use_in_prod';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not set. Refusing to start in production without it. ' +
      'Set JWT_SECRET in your environment variables.'
    );
  }

  console.warn('⚠️  JWT_SECRET not set — using an insecure development-only fallback. Set JWT_SECRET before deploying.');
  return DEV_FALLBACK_SECRET;
}

module.exports = { getJwtSecret };
