import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { verifyToken } from '../lib/github';
import { STORAGE_KEYS } from '../config';
import type { GitHubUser } from '../types';

interface AuthContextValue {
  token: string | null;
  user: GitHubUser | null;
  isLoading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [user, setUser] = useState<GitHubUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (pat: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await verifyToken(pat);
      setToken(pat);
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.TOKEN, pat);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid token or no access');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (storedToken && !user) {
      setIsLoading(true);
      verifyToken(storedToken)
        .then((userData) => {
          setUser(userData);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        })
        .finally(() => setIsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
