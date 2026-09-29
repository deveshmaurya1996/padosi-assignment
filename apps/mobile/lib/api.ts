import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthTokenResponse } from "@padosipro/types";
import { resolveApiUrl } from "./env";

const ACCESS_KEY = "padosipro_token";
const REFRESH_KEY = "padosipro_refresh";

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getToken(): Promise<string | null> {
  return storageGet(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return storageGet(REFRESH_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await storageSet(ACCESS_KEY, access);
  await storageSet(REFRESH_KEY, refresh);
}

export async function setToken(token: string): Promise<void> {
  await storageSet(ACCESS_KEY, token);
}

export async function clearToken(): Promise<void> {
  await storageDelete(ACCESS_KEY);
  await storageDelete(REFRESH_KEY);
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

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await clearToken();
        return null;
      }
      const data = (await res.json()) as AuthTokenResponse;
      await setTokens(data.token, data.refreshToken);
      return data.token;
    } catch {
      await clearToken();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null; skipAuthRefresh?: boolean } = {},
): Promise<T> {
  const { token, headers, skipAuthRefresh, ...rest } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        ...(rest.body != null ? { "Content-Type": "application/json" } : {}),
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

  if (
    res.status === 401 &&
    !skipAuthRefresh &&
    path !== "/auth/refresh" &&
    path !== "/auth/logout" &&
    path !== "/auth/login"
  ) {
    const next = await refreshAccessToken();
    if (next) {
      return api<T>(path, { ...options, token: next, skipAuthRefresh: true });
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
