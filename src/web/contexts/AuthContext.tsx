import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  clearAuth as clearAuthStorage,
  exchangeCode as exchangeCodeApi,
  getStoredAuth,
  logout as logoutApi,
  persistAuth,
  popReturnTo,
  startLogin as startLoginApi,
} from '../lib/auth';
import { setUnauthorizedHandler } from '../lib/github';
import type { AuthSession } from '../types';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  startLogin: (returnTo?: string) => void;
  signOut: () => Promise<void>;
  exchange: (code: string, state: string) => Promise<{ session: AuthSession; returnTo: string }>;
  notice: { type: 'info' | 'error'; message: string } | null;
  clearNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuth());
  const [notice, setNotice] = useState<{ type: 'info' | 'error'; message: string } | null>(null);

  const handleUnauthorized = useCallback(() => {
    clearAuthStorage();
    setSession(null);
    setNotice({ type: 'error', message: 'tokenInvalid' });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const startLogin = useCallback((returnTo?: string) => {
    try {
      startLoginApi(returnTo);
    } catch (err) {
      setNotice({ type: 'error', message: err instanceof Error ? err.message : 'login_failed' });
    }
  }, []);

  const exchange = useCallback(async (code: string, state: string) => {
    const next = await exchangeCodeApi(code, state);
    persistAuth(next);
    setSession(next);
    return { session: next, returnTo: popReturnTo() };
  }, []);

  const signOut = useCallback(async () => {
    const token = session?.token;
    setSession(null);
    clearAuthStorage();
    if (token) {
      await logoutApi(token);
    }
  }, [session?.token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      startLogin,
      signOut,
      exchange,
      notice,
      clearNotice: () => setNotice(null),
    }),
    [session, startLogin, signOut, exchange, notice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
