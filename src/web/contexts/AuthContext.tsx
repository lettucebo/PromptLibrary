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
import { useToast } from './ToastContext';
import type { AuthSession } from '../types';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  startLogin: (returnTo?: string) => void;
  signOut: () => Promise<void>;
  exchange: (code: string, state: string) => Promise<{ session: AuthSession; returnTo: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuth());
  const toast = useToast();

  const handleUnauthorized = useCallback(() => {
    clearAuthStorage();
    setSession(null);
    toast.error('auth.tokenInvalid');
  }, [toast]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const startLogin = useCallback(
    (returnTo?: string) => {
      try {
        startLoginApi(returnTo);
      } catch (err) {
        toast.push({ type: 'error', message: err instanceof Error ? err.message : 'login_failed' });
      }
    },
    [toast],
  );

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
    }),
    [session, startLogin, signOut, exchange],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
