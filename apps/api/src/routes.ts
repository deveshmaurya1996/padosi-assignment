import type { FastifyInstance } from "fastify";
import {
  buildMeResponse,
  getTaskSelection,
  listTasksGrouped,
  loginUser,
  logoutSession,
  refreshAuth,
  registerUser,
  resendUserOtp,
  saveTaskSelection,
  upsertProfile,
  verifyUserOtp,
} from "./services/auth";
import { requireAuth } from "./plugins/auth";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));

  // Render / browsers hit "/" after deploy — keep logs clean and document the API.
  const root = async () => ({
    ok: true,
    service: "padosipro-api",
    health: "/health",
    auth: ["/auth/register", "/auth/verify-otp", "/auth/login"],
  });
  app.get("/", root);
  app.head("/", async (_req, reply) => reply.code(200).send());

  app.post("/auth/register", async (request, reply) => {
    const result = await registerUser(request.body);
    return reply.code(201).send(result);
  });

  app.post("/auth/verify-otp", async (request) => verifyUserOtp(request.body));

  app.post("/auth/resend-otp", async (request) => resendUserOtp(request.body));

  app.post("/auth/login", async (request) => loginUser(request.body));

  app.post("/auth/refresh", async (request) => refreshAuth(request.body));

  app.post("/auth/logout", { preHandler: requireAuth }, async (request) =>
    logoutSession(request.sessionId),
  );

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
