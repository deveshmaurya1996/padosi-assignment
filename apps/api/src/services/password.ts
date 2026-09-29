import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config";
import { AppError } from "../errors";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export type JwtPayload = {
  sub: string;
  email: string;
  sid: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (!decoded?.sub || !decoded?.email || !decoded?.sid) {
      throw new Error("invalid payload");
    }
    return decoded;
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Invalid or expired session. Please log in again.");
  }
}
