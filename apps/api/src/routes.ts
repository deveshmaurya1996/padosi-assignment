import type { FastifyInstance } from "fastify";
import {
  buildMeResponse,
  getTaskSelection,
  listTasksGrouped,
  loginUser,
  registerUser,
  resendUserOtp,
  saveTaskSelection,
  upsertProfile,
  verifyUserOtp,
} from "./services/auth";
import { requireAuth } from "./plugins/auth";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));

  app.post("/auth/register", async (request, reply) => {
    const result = await registerUser(request.body);
    return reply.code(201).send(result);
  });

  app.post("/auth/verify-otp", async (request) => verifyUserOtp(request.body));

  app.post("/auth/resend-otp", async (request) => resendUserOtp(request.body));

  app.post("/auth/login", async (request) => loginUser(request.body));

  app.get("/me", { preHandler: requireAuth }, async (request) =>
    buildMeResponse(request.user),
  );

  app.put("/profile", { preHandler: requireAuth }, async (request) =>
    upsertProfile(request.user.id, request.body),
  );

  app.get("/tasks", { preHandler: requireAuth }, async () => listTasksGrouped());

  app.get("/tasks/selection", { preHandler: requireAuth }, async (request) =>
    getTaskSelection(request.user.id),
  );

  app.put("/tasks/selection", { preHandler: requireAuth }, async (request) =>
    saveTaskSelection(request.user.id, request.body),
  );
}
