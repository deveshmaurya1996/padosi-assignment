import { useCallback, useEffect, useState } from "react";
import type {
  TaskPublic,
  TaskSelectionResponse,
  TasksGroupedResponse,
} from "@padosipro/types";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useApiAction } from "./useApiAction";

async function resolveSelectedIds(
  token: string,
  selectedParam?: string,
): Promise<string[]> {
  if (selectedParam) {
    try {
      return JSON.parse(String(selectedParam)) as string[];
    } catch {
      /* fall through to saved selection */
    }
  }
  try {
    const selection = await api<TaskSelectionResponse>("/tasks/selection", {
      token,
    });
    return selection.tasks.map((t) => t.id);
  } catch {
    return [];
  }
}

export function useTasksCatalog(selectedParam?: string) {
  const { token, bootstrapping } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<TasksGroupedResponse["categories"]>(
    [],
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api<TasksGroupedResponse>("/tasks", { token });
      setCategories(data.categories);
      const ids = await resolveSelectedIds(token, selectedParam);
      setSelected(new Set(ids));
    } catch (e) {
      setCategories([]);
      if (e instanceof ApiRequestError) setError(e.apiError.message);
      else setError("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [token, selectedParam]);

  useEffect(() => {
    if (bootstrapping || !token) return;
    load();
  }, [bootstrapping, token, load]);

  const toggle = useCallback((task: TaskPublic) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(task.id)) next.delete(task.id);
      else next.add(task.id);
      return next;
    });
  }, []);

  return {
    categories,
    selected,
    toggle,
    loading,
    error,
    setError,
    reload: load,
  };
}

export function useTaskSelection() {
  const { token, bootstrapping, refreshMe } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskSelectionResponse["tasks"]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await api<TaskSelectionResponse>("/tasks/selection", {
        token,
      });
      setTasks(data.tasks);
      await refreshMe();
    } catch (e) {
      setTasks([]);
      if (e instanceof ApiRequestError) setError(e.apiError.message);
      else setError("Could not load your tasks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, refreshMe]);

  useEffect(() => {
    if (bootstrapping || !token) return;
    load();
  }, [bootstrapping, token, load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    return load();
  }, [load]);

  return {
    tasks,
    loading,
    refreshing,
    error,
    reload: load,
    refresh,
  };
}

export function useSaveTaskSelection() {
  const { token, refreshMe } = useAuth();
  const { run, loading, error } = useApiAction();

  const save = useCallback(
    async (taskIds: string[]) => {
      const result = await run(() =>
        api<TaskSelectionResponse>("/tasks/selection", {
          method: "PUT",
          token,
          body: JSON.stringify({ taskIds }),
        }),
      );
      if (!result.ok) return { ok: false as const };
      await refreshMe();
      return { ok: true as const, data: result.data };
    },
    [refreshMe, run, token],
  );

  return { save, loading, error };
}
