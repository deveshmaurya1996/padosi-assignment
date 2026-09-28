import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { AppError } from "../errors";
import { verifyToken } from "../services/password";
import type { User } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    user: User;
  }
}

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required.");
  }
  const token = header.slice("Bearer ".length).trim();
  const payload = verifyToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required.");
  }
  request.user = user;
}
