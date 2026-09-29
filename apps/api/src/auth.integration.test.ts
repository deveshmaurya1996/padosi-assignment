import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { buildApp } from "./app";
import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
let app: FastifyInstance;

const email = `test-${Date.now()}@example.com`;
const password = "Password1";

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await app.close();
  await prisma.$disconnect();
});

describe("auth integration", () => {
  it("registers, verifies OTP, logs in, and returns /me", async () => {
    const happyEmail = `happy-${Date.now()}@example.com`;
    const reg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: happyEmail, password, confirmPassword: password },
    });
    expect(reg.statusCode).toBe(201);
    expect(reg.json().otp).toBeUndefined();

    const knownCode = "654321";
    const user = await prisma.user.findUniqueOrThrow({ where: { email: happyEmail } });
    await prisma.emailVerification.updateMany({
      where: { userId: user.id, usedAt: null },
      data: {
        codeHash: await bcrypt.hash(knownCode, 10),
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const verify = await app.inject({
      method: "POST",
      url: "/auth/verify-otp",
      payload: { email: happyEmail, code: knownCode },
    });
    expect(verify.statusCode).toBe(200);

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: happyEmail, password },
    });
    expect(login.statusCode).toBe(200);
    const token = login.json().token as string;
    expect(token).toBeTruthy();
    expect(login.json().refreshToken).toBeTruthy();
    expect(login.json().expiresIn).toBeGreaterThan(0);

    const me = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe(happyEmail);
    expect(me.json().user.emailVerified).toBe(true);

    await prisma.user.deleteMany({ where: { email: happyEmail } });
  });

  it("revokes access on logout and rotates refresh tokens", async () => {
    const sessionEmail = `session-${Date.now()}@example.com`;
    await prisma.user.create({
      data: {
        email: sessionEmail,
        passwordHash: await bcrypt.hash(password, 12),
        emailVerified: true,
      },
    });

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: sessionEmail, password },
    });
    expect(login.statusCode).toBe(200);
    const access = login.json().token as string;
    const refresh = login.json().refreshToken as string;

    const meOk = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${access}` },
    });
    expect(meOk.statusCode).toBe(200);

    const rotated = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: refresh },
    });
    expect(rotated.statusCode).toBe(200);
    const access2 = rotated.json().token as string;
    const refresh2 = rotated.json().refreshToken as string;
    expect(access2).toBeTruthy();
    expect(refresh2).not.toBe(refresh);

    const oldRefresh = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: refresh },
    });
    expect(oldRefresh.statusCode).toBe(401);

    const logout = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { authorization: `Bearer ${access2}` },
    });
    expect(logout.statusCode).toBe(200);

    const meDead = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${access2}` },
    });
    expect(meDead.statusCode).toBe(401);

    const refreshDead = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: refresh2 },
    });
    expect(refreshDead.statusCode).toBe(401);

    await prisma.user.deleteMany({ where: { email: sessionEmail } });
  });

  it("registers and blocks login before verification", async () => {
    const reg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email, password, confirmPassword: password },
    });
    expect(reg.statusCode).toBe(201);

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password },
    });
    expect(login.statusCode).toBe(403);
    expect(login.json().error.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("rejects incorrect password after verification", async () => {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "WrongPass1" },
    });
    expect(login.statusCode).toBe(401);
    expect(login.json().error.code).toBe("INVALID_CREDENTIALS");
  });

  it("allows verified user to login and rejects bad JWT", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password },
    });
    expect(login.statusCode).toBe(200);
    const token = login.json().token as string;
    expect(token).toBeTruthy();

    const me = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe(email);
    expect(me.json().profileCompleted).toBe(false);

    const bad = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "Bearer not-a-real-token" },
    });
    expect(bad.statusCode).toBe(401);
  });

  it("rejects incorrect OTP and locks after 5 attempts", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: false },
    });
    const codeHash = await bcrypt.hash("111111", 10);
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });

    for (let i = 0; i < 5; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/auth/verify-otp",
        payload: { email, code: "000000" },
      });
      expect([400, 429]).toContain(res.statusCode);
    }

    const locked = await app.inject({
      method: "POST",
      url: "/auth/verify-otp",
      payload: { email, code: "111111" },
    });
    expect(locked.statusCode).toBe(429);
    expect(locked.json().error.code).toBe("OTP_LOCKED");
  });
});
