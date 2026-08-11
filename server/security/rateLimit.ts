import rateLimit from "express-rate-limit";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Brute-force protection for login / register / password reset. */
export const authRateLimiter = rateLimit({
  windowMs: envInt("AUTH_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  max: envInt("AUTH_RATE_LIMIT_MAX", 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." },
  skipSuccessfulRequests: false,
});

/** Stricter limit for registration (account spam). */
export const registerRateLimiter = rateLimit({
  windowMs: envInt("REGISTER_RATE_LIMIT_WINDOW_MS", 60 * 60 * 1000),
  max: envInt("REGISTER_RATE_LIMIT_MAX", 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Try again later." },
});

/**
 * Portal auto-provision (JWT validate + ensurePortalUser).
 * Separate from public email registration — higher limits, different error text.
 */
export const portalSyncRateLimiter = rateLimit({
  windowMs: envInt("PORTAL_SYNC_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  max: envInt("PORTAL_SYNC_RATE_LIMIT_MAX", 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many portal sync attempts. Try again later." },
});

/** Forgot-password — prevent email enumeration floods. */
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: envInt("FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS", 60 * 60 * 1000),
  max: envInt("FORGOT_PASSWORD_RATE_LIMIT_MAX", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Try again later." },
});

/** External telemetry webhook — high volume but bounded. */
export const telemetryWebhookRateLimiter = rateLimit({
  windowMs: envInt("WEBHOOK_RATE_LIMIT_WINDOW_MS", 60 * 1000),
  max: envInt("WEBHOOK_RATE_LIMIT_MAX", 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Telemetry webhook rate limit exceeded." },
});
