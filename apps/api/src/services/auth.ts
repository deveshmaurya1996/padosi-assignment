import type { Profile, Task, User } from "@prisma/client";
import type {
  AuthTokenResponse,
  MeResponse,
  ProfilePublic,
  TaskPublic,
  UserPublic,
} from "@padosipro/types";
import {
  loginSchema,
  profileSchema,
  registerSchema,
  refreshTokenSchema,
  resendOtpSchema,
  taskSelectionSchema,
  verifyOtpSchema,
} from "@padosipro/validation";
import { prisma } from "../db";
import { AppError, zodFields } from "../errors";
import { sendOtpEmail } from "./mail";
import {
  assertAttemptsRemaining,
  assertOtpNotExpired,
  assertOtpNotUsed,
  assertResendAllowed,
  generateOtpCode,
  hashOtp,
  otpExpiresAt,
  verifyOtpHash,
} from "./otp";
import { hashPassword, verifyPassword } from "./password";
import { createSession, revokeSession, rotateRefresh } from "./session";

export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
  };
}

export function toProfilePublic(profile: Profile): ProfilePublic {
  return {
    name: profile.name,
    mobile: profile.mobile,
    address: profile.address,
    businessName: profile.businessName,
  };
}

export function toTaskPublic(task: Task): TaskPublic {
  return {
    id: task.id,
    name: task.name,
    category: task.category,
    description: task.description,
  };
}

export async function getOnboardingFlags(userId: string) {
  const [profile, taskCount] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userTask.count({ where: { userId } }),
  ]);
  return {
    profile,
    profileCompleted: Boolean(profile),
    tasksSelected: taskCount > 0,
  };
}

export async function buildMeResponse(user: User): Promise<MeResponse> {
  const flags = await getOnboardingFlags(user.id);
  return {
    user: toUserPublic(user),
    profile: flags.profile ? toProfilePublic(flags.profile) : null,
    profileCompleted: flags.profileCompleted,
    tasksSelected: flags.tasksSelected,
  };
}

export async function buildAuthResponse(user: User): Promise<AuthTokenResponse> {
  const flags = await getOnboardingFlags(user.id);
  const tokens = await createSession(user);
  return {
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    user: toUserPublic(user),
    profileCompleted: flags.profileCompleted,
    tasksSelected: flags.tasksSelected,
  };
}

export async function refreshAuth(body: unknown): Promise<AuthTokenResponse> {
  const parsed = refreshTokenSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", zodFields(parsed.error));
  }
  const rotated = await rotateRefresh(parsed.data.refreshToken);
  const flags = await getOnboardingFlags(rotated.user.id);
  return {
    token: rotated.accessToken,
    refreshToken: rotated.refreshToken,
    expiresIn: rotated.expiresIn,
    user: toUserPublic(rotated.user),
    profileCompleted: flags.profileCompleted,
    tasksSelected: flags.tasksSelected,
  };
}

export async function logoutSession(sessionId: string): Promise<{ ok: true }> {
  await revokeSession(sessionId);
  return { ok: true };
}

async function createAndSendOtp(user: User): Promise<string> {
  const code = generateOtpCode();
  const codeHash = await hashOtp(code);
  const now = new Date();

  await prisma.emailVerification.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: now },
  });

  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: otpExpiresAt(),
      lastSentAt: now,
    },
  });
  await sendOtpEmail(user.email, code);
  return code;
}

export async function registerUser(body: unknown) {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", zodFields(parsed.error));
  }

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const otp = await createAndSendOtp(user);

  return {
    message: "Account created. Enter the verification code shown in the app.",
    email: user.email,
    otp,
  };
}

export async function verifyUserOtp(body: unknown) {
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", zodFields(parsed.error));
  }

  const { email, code } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "No account found for this email.");
  }
  if (user.emailVerified) {
    return { message: "Email already verified. You can log in.", email: user.email };
  }

  const verification = await prisma.emailVerification.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    throw new AppError(400, "OTP_MISSING", "No verification code found. Request a new one.");
  }

  assertOtpNotUsed(verification.usedAt);
  assertAttemptsRemaining(verification.attempts);
  assertOtpNotExpired(verification.expiresAt);

  const ok = await verifyOtpHash(code, verification.codeHash);
  if (!ok) {
    const updated = await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = Math.max(0, 5 - updated.attempts);
    throw new AppError(
      400,
      "OTP_INVALID",
      remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Too many incorrect attempts. Request a new code.",
    );
  }

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
  ]);

  return { message: "Email verified. You can log in now.", email: user.email };
}

export async function resendUserOtp(body: unknown) {
  const parsed = resendOtpSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", zodFields(parsed.error));
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "No account found for this email.");
  }
  if (user.emailVerified) {
    throw new AppError(400, "ALREADY_VERIFIED", "Email is already verified. Please log in.");
  }

  const latest = await prisma.emailVerification.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (latest) {
    assertResendAllowed(latest.lastSentAt);
  }

  const otp = await createAndSendOtp(user);
  return {
    message: "A new verification code is ready. Enter it in the app.",
    email: user.email,
    otp,
  };
}

export async function loginUser(body: unknown) {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", zodFields(parsed.error));
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
  }

  if (!user.emailVerified) {
    throw new AppError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Please verify your email before logging in.",
    );
  }

  return buildAuthResponse(user);
}

export async function upsertProfile(userId: string, body: unknown) {
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", zodFields(parsed.error));
  }

  const data = {
    name: parsed.data.name,
    mobile: parsed.data.mobile,
    address: parsed.data.address,
    businessName: parsed.data.businessName ?? null,
  };

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return toProfilePublic(profile);
}

export async function listTasksGrouped() {
  const tasks = await prisma.task.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  const map = new Map<string, TaskPublic[]>();
  for (const task of tasks) {
    const list = map.get(task.category) ?? [];
    list.push(toTaskPublic(task));
    map.set(task.category, list);
  }
  return {
    categories: [...map.entries()].map(([category, tasks]) => ({ category, tasks })),
  };
}

export async function saveTaskSelection(userId: string, body: unknown) {
  const parsed = taskSelectionSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", zodFields(parsed.error));
  }

  const { taskIds } = parsed.data;
  const found = await prisma.task.findMany({ where: { id: { in: taskIds } } });
  if (found.length !== taskIds.length) {
    throw new AppError(400, "INVALID_TASKS", "One or more selected tasks are invalid.");
  }

  await prisma.$transaction([
    prisma.userTask.deleteMany({ where: { userId } }),
    prisma.userTask.createMany({
      data: taskIds.map((taskId) => ({ userId, taskId })),
    }),
  ]);

  return getTaskSelection(userId);
}

export async function getTaskSelection(userId: string) {
  const rows = await prisma.userTask.findMany({
    where: { userId },
    include: { task: true },
    orderBy: { task: { category: "asc" } },
  });
  return { tasks: rows.map((r) => toTaskPublic(r.task)) };
}
