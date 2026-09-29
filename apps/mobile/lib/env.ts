import Constants from "expo-constants";

/**
 * API base URL from Expo env files:
 *   .env.development → local
 *   .env.production  → Render
 *   .env.local       → optional override (gitignored)
 *
 * `EXPO_PUBLIC_API_URL` is inlined by Metro; `extra.apiUrl` is baked at config time.
 */
export function resolveApiUrl(): string {
  const fromPublic =
    typeof process !== "undefined"
      ? process.env.EXPO_PUBLIC_API_URL?.trim()
      : undefined;
  const fromExtra = (
    Constants.expoConfig?.extra?.apiUrl as string | undefined
  )?.trim();

  const raw = fromPublic || fromExtra;
  if (!raw) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is missing. Set it in .env.development or .env.production.",
    );
  }
  return raw.replace(/\/$/, "");
}

export function resolveAppEnv(): "development" | "production" {
  const fromPublic =
    typeof process !== "undefined" ? process.env.APP_ENV?.trim() : undefined;
  const fromExtra = Constants.expoConfig?.extra?.appEnv as string | undefined;
  const value = fromPublic || fromExtra;
  return value === "production" ? "production" : "development";
}
