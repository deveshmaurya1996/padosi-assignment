import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthTokenResponse, MeResponse } from "@padosipro/types";
import { api, clearToken, getToken, setToken } from "./api";

type AuthState = {
  bootstrapping: boolean;
  token: string | null;
  me: MeResponse | null;
  refreshMe: () => Promise<MeResponse | null>;
  signIn: (auth: AuthTokenResponse) => Promise<void>;
  signOut: () => Promise<void>;
  setSessionToken: (token: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);

  const refreshMe = useCallback(async () => {
    const t = token ?? (await getToken());
    if (!t) {
      setMe(null);
      return null;
    }
    try {
      const data = await api<MeResponse>("/me", { token: t });
      setMe(data);
      return data;
    } catch {
      await clearToken();
      setTokenState(null);
      setMe(null);
      return null;
    }
  }, [token]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const t = await getToken();
      if (!alive) return;
      if (!t) {
        setBootstrapping(false);
        return;
      }
      setTokenState(t);
      try {
        const data = await api<MeResponse>("/me", { token: t });
        if (alive) setMe(data);
      } catch {
        await clearToken();
        if (alive) {
          setTokenState(null);
          setMe(null);
        }
      } finally {
        if (alive) setBootstrapping(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (auth: AuthTokenResponse) => {
    await setToken(auth.token);
    setTokenState(auth.token);
    setMe({
      user: auth.user,
      profile: null,
      profileCompleted: auth.profileCompleted,
      tasksSelected: auth.tasksSelected,
    });
  }, []);

  const setSessionToken = useCallback(async (t: string) => {
    await setToken(t);
    setTokenState(t);
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setTokenState(null);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({
      bootstrapping,
      token,
      me,
      refreshMe,
      signIn,
      signOut,
      setSessionToken,
    }),
    [bootstrapping, token, me, refreshMe, signIn, signOut, setSessionToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
