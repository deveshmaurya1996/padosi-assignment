import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

const TOKEN_KEY = "padosipro_token";

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function resolveApiUrl(): string {
  const fromEnv = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const fromPublic =
    typeof process !== "undefined"
      ? (process.env.EXPO_PUBLIC_API_URL as string | undefined)
      : undefined;
  const raw = fromPublic || fromEnv;
  if (raw) return raw.replace(/\/$/, "");

  if (Platform.OS === "android") return "http://10.0.2.2:3000";
  return "http://localhost:3000";
}

export const API_URL = resolveApiUrl();

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public apiError: ApiError,
  ) {
    super(apiError.message);
    this.name = "ApiRequestError";
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiRequestError(0, {
      code: "NETWORK_ERROR",
      message:
        "Could not reach the server. Check EXPO_PUBLIC_API_URL and that the API is running.",
    });
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiRequestError(res.status, {
        code: "INVALID_RESPONSE",
        message: "Server returned an unexpected response.",
      });
    }
  }

  if (!res.ok) {
    const body = data as { error?: ApiError } | null;
    throw new ApiRequestError(
      res.status,
      body?.error ?? {
        code: "REQUEST_FAILED",
        message: "Something went wrong. Please try again.",
      },
    );
  }

  return data as T;
}
