"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/admin-api";

/** Loads data from the admin API with loading/error state and a reload(). */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  const seq = useRef(0);

  // Keep the latest loader without re-creating reload(); runs before the fetch effect below.
  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      if (id === seq.current) setData(result);
    } catch (e) {
      if (id === seq.current) setError(e instanceof ApiError ? e.message : "Something went wrong while loading.");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on dependency change
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}

/** Maps a failed save to field errors + a toast-able message. */
export function saveErrors(e: unknown): { fields: Record<string, string>; message: string } {
  if (e instanceof ApiError) {
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(e.errors)) fields[k] = v[0];
    return { fields, message: e.status === 422 ? "Please fix the highlighted fields." : e.message };
  }
  return { fields: {}, message: "Save failed. Please try again." };
}
