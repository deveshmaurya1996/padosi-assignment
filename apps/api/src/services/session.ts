import { createHash, randomBytes } from "node:crypto";
import type { User } from "@prisma/client";
import { accessTokenExpiresInSeconds, env } from "../config";
import { prisma } from "../db";
import { AppError } from "../errors";
import { signToken } from "./password";

function hashRefreshSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function parseRefreshToken(raw: string): { sessionId: string; secret: string } {
  const dot = raw.indexOf(".");
  if (dot <= 0 || dot === raw.length - 1) {
    throw new AppError(401, "INVALID_REFRESH", "Invalid or expired refresh token.");
  }
  return { sessionId: raw.slice(0, dot), secret: raw.slice(dot + 1) };
}

export async function assertSessionActive(sessionId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired session. Please log in again.");
  }
  return session;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function createSession(user: User): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const secret = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlMs);
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshSecret(secret),
      expiresAt,
    },
  });

  const accessToken = signToken({
    sub: user.id,
    email: user.email,
    sid: session.id,
  });

  return {
    accessToken,
    refreshToken: `${session.id}.${secret}`,
    expiresIn: accessTokenExpiresInSeconds(),
  };
}

export async function rotateRefresh(rawRefresh: string): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const { sessionId, secret } = parseRefreshToken(rawRefresh.trim());
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new AppError(401, "INVALID_REFRESH", "Invalid or expired refresh token.");
  }

  const expected = hashRefreshSecret(secret);
  if (expected !== session.refreshTokenHash) {
    await revokeSession(session.id);
    throw new AppError(401, "INVALID_REFRESH", "Invalid or expired refresh token.");
  }

  await revokeSession(session.id);
  const next = await createSession(session.user);
  return { user: session.user, ...next };
}
