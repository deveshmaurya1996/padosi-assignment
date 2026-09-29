import { useCallback } from "react";
import {
  loginSchema,
  otpCodeSchema,
  registerSchema,
} from "@padosipro/validation";
import type {
  AuthTokenResponse,
  RegisterResponse,
  ResendOtpResponse,
  VerifyOtpResponse,
} from "@padosipro/types";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useApiAction } from "./useApiAction";
import { zodFields } from "./zodFields";

export function useLogin() {
  const { signIn } = useAuth();
  const { run, loading, error, setError, fields, setFields } = useApiAction();

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setFields(zodFields(parsed.error));
        return { ok: false as const };
      }
      setFields({});

      const result = await run(() =>
        api<AuthTokenResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify(parsed.data),
        }),
      );

      if (!result.ok) {
        if (result.apiError?.apiError.code === "EMAIL_NOT_VERIFIED") {
          return {
            ok: false as const,
            needsVerify: true as const,
            email: parsed.data.email,
          };
        }
        return { ok: false as const };
      }

      await signIn(result.data);
      return { ok: true as const, auth: result.data };
    },
    [run, setError, setFields, signIn],
  );

  return { login, loading, error, fields };
}

export function useRegister() {
  const { run, loading, error, setError, fields, setFields } = useApiAction();

  const register = useCallback(
    async (email: string, password: string, confirmPassword: string) => {
      setError(null);
      const parsed = registerSchema.safeParse({
        email,
        password,
        confirmPassword,
      });
      if (!parsed.success) {
        setFields(zodFields(parsed.error));
        return { ok: false as const };
      }
      setFields({});

      const result = await run(() =>
        api<RegisterResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify(parsed.data),
        }),
      );

      if (!result.ok) return { ok: false as const };
      return {
        ok: true as const,
        email: parsed.data.email,
        otp: result.data.otp,
        data: result.data,
      };
    },
    [run, setError, setFields],
  );

  return { register, loading, error, fields };
}

export function useVerifyOtp() {
  const { run, loading, error, setError } = useApiAction();

  const verify = useCallback(
    async (email: string, code: string) => {
      setError(null);
      if (!email) {
        setError("Missing email.");
        return { ok: false as const };
      }
      const parsed = otpCodeSchema.safeParse(code);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid code");
        return { ok: false as const };
      }

      const result = await run(() =>
        api<VerifyOtpResponse>("/auth/verify-otp", {
          method: "POST",
          body: JSON.stringify({ email, code: parsed.data }),
        }),
      );

      if (!result.ok) return { ok: false as const };
      return { ok: true as const, data: result.data };
    },
    [run, setError],
  );

  return { verify, loading, error };
}

export function useResendOtp() {
  const { run, loading, error, setError } = useApiAction();

  const resend = useCallback(
    async (email: string) => {
      if (!email) return { ok: false as const };
      setError(null);
      const result = await run(() =>
        api<ResendOtpResponse>("/auth/resend-otp", {
          method: "POST",
          body: JSON.stringify({ email }),
        }),
      );
      if (!result.ok) return { ok: false as const };
      return { ok: true as const, otp: result.data.otp };
    },
    [run, setError],
  );

  return { resend, loading, error };
}
