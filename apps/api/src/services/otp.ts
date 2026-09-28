import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { OTP } from "../config";
import { AppError } from "../errors";

export function generateOtpCode(length = OTP.length): string {
  const max = 10 ** length;
  const n = randomInt(0, max);
  return String(n).padStart(length, "0");
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpHash(code: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

export function otpExpiresAt(from = new Date(), ttlMs = OTP.ttlMs): Date {
  return new Date(from.getTime() + ttlMs);
}

export function assertOtpNotExpired(expiresAt: Date, now = new Date()): void {
  if (expiresAt.getTime() <= now.getTime()) {
    throw new AppError(400, "OTP_EXPIRED", "This code has expired. Request a new one.");
  }
}

export function assertOtpNotUsed(usedAt: Date | null): void {
  if (usedAt) {
    throw new AppError(400, "OTP_USED", "This code has already been used.");
  }
}

export function assertAttemptsRemaining(attempts: number, max = OTP.maxAttempts): void {
  if (attempts >= max) {
    throw new AppError(
      429,
      "OTP_LOCKED",
      "Too many incorrect attempts. Request a new code.",
    );
  }
}

export function assertResendAllowed(lastSentAt: Date, now = new Date(), cooldownMs = OTP.resendCooldownMs): void {
  const elapsed = now.getTime() - lastSentAt.getTime();
  if (elapsed < cooldownMs) {
    const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
    throw new AppError(
      429,
      "OTP_RESEND_COOLDOWN",
      `Please wait ${waitSec}s before requesting another code.`,
    );
  }
}

export function isOtpFormatValid(code: string, length = OTP.length): boolean {
  return new RegExp(`^\\d{${length}}$`).test(code);
}
