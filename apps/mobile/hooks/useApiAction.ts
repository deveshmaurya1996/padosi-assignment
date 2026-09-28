import { useCallback, useState } from "react";
import { ApiRequestError } from "../lib/api";

type Fail = {
  ok: false;
  error: unknown;
  apiError?: ApiRequestError;
};

type Ok<T> = {
  ok: true;
  data: T;
};

export function useApiAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<Ok<T> | Fail> => {
    setLoading(true);
    setError(null);
    setFields({});
    try {
      const data = await fn();
      return { ok: true, data };
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setError(e.apiError.message);
        if (e.apiError.fields) setFields(e.apiError.fields);
        return { ok: false, error: e, apiError: e };
      }
      setError("Could not reach the server. Is the API running?");
      return { ok: false, error: e };
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error, setError, fields, setFields };
}
