/**
 * AV OS admin — auth provider. Uses the existing backend session
 * (GET /api/session). `authed`/`loading` drive the route guard; `permissions`
 * are surfaced for UX-only gating (the backend remains authoritative).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, bootstrapSession } from '@/api/auth';
import { setOnUnauthorized, CsrfStore } from '@/api/client';
import type { SessionData, SessionUser } from '@/api/types';

interface AuthState {
  loading: boolean;
  authed: boolean;
  user: SessionUser | null;
  permissions: string[];
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);

  const applySession = useCallback((s: SessionData) => {
    CsrfStore.set(s.csrf);
    setSession(s);
  }, []);

  useEffect(() => {
    let active = true;
    setOnUnauthorized(() => {
      setSession(null);
    });
    bootstrapSession()
      .then((s) => { if (active) applySession(s); })
      .catch(() => { if (active) setSession(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; setOnUnauthorized(null); };
  }, [applySession]);

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password);
    const s = await bootstrapSession();
    applySession(s);
  }, [applySession]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* best effort */ }
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(() => ({
    loading,
    authed: !!session?.authed && !!session.user,
    user: session?.user ?? null,
    permissions: session?.permissions ?? [],
    mustChangePassword: session?.must_change_password ?? false,
    login,
    logout,
  }), [loading, session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
