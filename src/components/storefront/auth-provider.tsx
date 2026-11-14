"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SessionCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

type Ctx = {
  customer: SessionCustomer | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  customer: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<SessionCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/me", { credentials: "same-origin" });
      const json = await res.json();
      if (json.ok) setCustomer(json.data.customer as SessionCustomer);
      else setCustomer(null);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch("/api/v1/auth/logout", { method: "POST", credentials: "same-origin" });
    setCustomer(null);
  }, []);

  const value = useMemo(() => ({ customer, loading, refresh, signOut }), [customer, loading, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
