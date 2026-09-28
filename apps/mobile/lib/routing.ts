import type { MeResponse } from "@padosipro/types";

type OnboardingFlags = Pick<MeResponse, "profileCompleted" | "tasksSelected">;

export function authedHref(me: OnboardingFlags) {
  if (!me.profileCompleted) return "/(app)/profile" as const;
  if (!me.tasksSelected) return "/(app)/tasks" as const;
  return "/(app)/home" as const;
}
