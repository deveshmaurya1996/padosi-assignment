import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const isProd = process.env.NODE_ENV === "production";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  databaseUrl: required("DATABASE_URL", "postgresql://padosi:padosi@localhost:5432/padosipro?schema=public"),
  jwtSecret: isProd
    ? required("JWT_SECRET")
    : required("JWT_SECRET", "dev-only-change-me-padosipro-jwt-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshTokenTtlMs: Number(
    process.env.REFRESH_TOKEN_TTL_MS ?? 30 * 24 * 60 * 60 * 1000,
  ),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  smtp: {
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || undefined,
    pass: process.env.SMTP_PASS || undefined,
    from: process.env.EMAIL_FROM ?? "PadosiPro <noreply@padosipro.local>",
  },
};

export const OTP = {
  length: 6,
  ttlMs: 10 * 60 * 1000,
  maxAttempts: 5,
  resendCooldownMs: 30 * 1000,
} as const;

/** Access token lifetime in seconds for clients (parsed from jwtExpiresIn when possible). */
export function accessTokenExpiresInSeconds(): number {
  const raw = env.jwtExpiresIn.trim();
  const m = /^(\d+)([smhd])$/i.exec(raw);
  if (!m) return 15 * 60;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === "s") return n;
  if (unit === "m") return n * 60;
  if (unit === "h") return n * 60 * 60;
  if (unit === "d") return n * 24 * 60 * 60;
  return 15 * 60;
}
