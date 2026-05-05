import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { config, STORAGE_KEYS } from '../config';
import type { GitHubUser } from '../types';

interface AuthContextValue {
  token: string | null;
  user: GitHubUser | null;
  isLoading: boolean;
  error: string | null;
  loginWithOAuth: () => void;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [user, setUser] = useState<GitHubUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (accessToken: string): Promise<GitHubUser> => {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user info');
    const data = await res.json();
    return {
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
      html_url: data.html_url,
    };
  }, []);

  const loginWithOAuth = useCallback(() => {
    const state = generateState();
    sessionStorage.setItem(STORAGE_KEYS.OAUTH_STATE, state);

    const params = new URLSearchParams({
      client_id: config.githubClientId,
      redirect_uri: config.oauthRedirectUri,
      scope: 'public_repo',
      state,
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const savedState = sessionStorage.getItem(STORAGE_KEYS.OAUTH_STATE);
      if (!savedState || savedState !== state) {
        throw new Error('Invalid OAuth state. Please try signing in again.');
      }
      sessionStorage.removeItem(STORAGE_KEYS.OAUTH_STATE);

      const res = await fetch(config.tokenProxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Token exchange failed: ${errBody}`);
      }

      const { access_token } = await res.json();
      if (!access_token) throw new Error('No access token in response');

      const userData = await fetchUser(access_token);

      setToken(access_token);
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  // Verify stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (storedToken && !user) {
      setIsLoading(true);
      fetchUser(storedToken)
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
    <AuthContext.Provider value={{ token, user, isLoading, error, loginWithOAuth, handleOAuthCallback, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
