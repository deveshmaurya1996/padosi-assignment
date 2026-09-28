import { useCallback } from "react";
import { profileSchema } from "@padosipro/validation";
import type { ProfilePublic } from "@padosipro/types";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useApiAction } from "./useApiAction";
import { zodFields } from "./zodFields";

export function useSaveProfile() {
  const { token, bootstrapping, refreshMe } = useAuth();
  const { run, loading, error, setError, fields, setFields } = useApiAction();

  const save = useCallback(
    async (input: {
      name: string;
      mobile: string;
      address: string;
      businessName: string;
    }) => {
      if (!token || bootstrapping) {
        setError("Still signing you in — try again in a moment.");
        return { ok: false as const };
      }

      setError(null);
      const parsed = profileSchema.safeParse({
        name: input.name,
        mobile: input.mobile,
        address: input.address,
        businessName: input.businessName || undefined,
      });
      if (!parsed.success) {
        setFields(zodFields(parsed.error));
        return { ok: false as const };
      }
      setFields({});

      const result = await run(() =>
        api<ProfilePublic>("/profile", {
          method: "PUT",
          token,
          body: JSON.stringify(parsed.data),
        }),
      );

      if (!result.ok) return { ok: false as const };
      await refreshMe();
      return { ok: true as const, data: result.data };
    },
    [bootstrapping, refreshMe, run, setError, setFields, token],
  );

  return { save, loading, error, fields };
}
