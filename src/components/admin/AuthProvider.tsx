"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ensureCsrf, setUnauthenticatedHandler, type AdminUser } from "@/lib/admin-api";

interface AuthCtx {
  user: AdminUser | null;
  status: "loading" | "authenticated" | "guest";
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}

/**
 * Client-side view of the Laravel session. This only decides what to render;
 * every API call is still authorised by Laravel on the server.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AuthCtx["status"]>("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<{ data: AdminUser }>("/admin/me");
      setUser(res.data);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session probe
    void refresh();
    setUnauthenticatedHandler(() => {
      setUser(null);
      setStatus("guest");
    });
    return () => setUnauthenticatedHandler(null);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    await ensureCsrf(true);
    const res = await api.post<{ data: AdminUser }>("/admin/login", { email, password, remember });
    // The session id is regenerated on login, so fetch a fresh CSRF token too.
    await ensureCsrf(true);
    setUser(res.data);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/admin/logout");
    } finally {
      setUser(null);
      setStatus("guest");
      router.replace("/admin/login");
    }
  }, [router]);

  return <Ctx.Provider value={{ user, status, login, logout, refresh }}>{children}</Ctx.Provider>;
}
