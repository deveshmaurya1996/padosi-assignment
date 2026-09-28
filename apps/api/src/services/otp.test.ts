import { describe, expect, it } from "vitest";
import {
  assertAttemptsRemaining,
  assertOtpNotExpired,
  assertOtpNotUsed,
  assertResendAllowed,
  generateOtpCode,
  hashOtp,
  isOtpFormatValid,
  otpExpiresAt,
  verifyOtpHash,
} from "./otp";
import { AppError } from "../errors";
import {
  indianMobileSchema,
  passwordSchema,
  profileSchema,
  registerSchema,
} from "@padosipro/validation";

describe("OTP generation", () => {
  it("generates a 6-digit code", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(isOtpFormatValid(code)).toBe(true);
    }
  });

  it("hashes OTP and verifies correctly", async () => {
    const code = "123456";
    const hash = await hashOtp(code);
    expect(hash).not.toBe(code);
    expect(await verifyOtpHash(code, hash)).toBe(true);
    expect(await verifyOtpHash("000000", hash)).toBe(false);
  });
});

describe("OTP expiry and attempts", () => {
  it("expires after 10 minutes", () => {
    const now = new Date("2026-09-28T12:00:00Z");
    const expires = otpExpiresAt(now);
    expect(expires.getTime() - now.getTime()).toBe(10 * 60 * 1000);
    expect(() => assertOtpNotExpired(expires, now)).not.toThrow();
    expect(() =>
      assertOtpNotExpired(expires, new Date(now.getTime() + 10 * 60 * 1000 + 1)),
    ).toThrow(AppError);
  });

  it("rejects expired OTP with OTP_EXPIRED", () => {
    try {
      assertOtpNotExpired(new Date("2020-01-01"), new Date());
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe("OTP_EXPIRED");
    }
  });

  it("locks after 5 failed attempts", () => {
    expect(() => assertAttemptsRemaining(4)).not.toThrow();
    try {
      assertAttemptsRemaining(5);
      expect.unreachable();
    } catch (e) {
      expect((e as AppError).code).toBe("OTP_LOCKED");
    }
  });

  it("cannot reuse a used OTP", () => {
    expect(() => assertOtpNotUsed(null)).not.toThrow();
    try {
      assertOtpNotUsed(new Date());
      expect.unreachable();
    } catch (e) {
      expect((e as AppError).code).toBe("OTP_USED");
    }
  });

  it("blocks resend during 30 second cooldown", () => {
    const lastSent = new Date("2026-09-28T12:00:00Z");
    expect(() =>
      assertResendAllowed(lastSent, new Date("2026-09-28T12:00:29Z")),
    ).toThrow(/wait/i);
    expect(() =>
      assertResendAllowed(lastSent, new Date("2026-09-28T12:00:30Z")),
    ).not.toThrow();
  });
});

describe("validation", () => {
  it("rejects invalid email", () => {
    const r = registerSchema.safeParse({
      email: "not-an-email",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(r.success).toBe(false);
  });

  it("rejects weak password", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("nodigits").success).toBe(false);
    expect(passwordSchema.safeParse("Password1").success).toBe(true);
  });

  it("rejects invalid Indian mobile", () => {
    expect(indianMobileSchema.safeParse("12345").success).toBe(false);
    expect(indianMobileSchema.safeParse("5123456789").success).toBe(false);
    expect(indianMobileSchema.safeParse("9876543210").success).toBe(true);
    expect(indianMobileSchema.safeParse("+919876543210").success).toBe(true);
  });

  it("requires profile name and address", () => {
    expect(
      profileSchema.safeParse({
        name: "A",
        mobile: "9876543210",
        address: "short",
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        name: "Devesh Kumar",
        mobile: "9876543210",
        address: "12 MG Road, Hyderabad",
      }).success,
    ).toBe(true);
  });
});
