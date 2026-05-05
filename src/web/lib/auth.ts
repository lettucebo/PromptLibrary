import { config, STORAGE_KEYS } from '../config';
import type { AuthSession, AuthUser, RepoPermission } from '../types';

interface ExchangeResponse {
  token: string;
  tokenType: string;
  scope: string;
  permission: RepoPermission;
  user: AuthUser;
  error?: string;
  description?: string;
}

interface ExchangeErrorResponse {
  error: string;
  description?: string;
  permission?: RepoPermission;
  user?: { login: string };
}

export class AuthError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: ExchangeErrorResponse;
  constructor(code: string, message: string, status?: number, details?: ExchangeErrorResponse) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Begin the GitHub OAuth flow. Stores `state` and `returnTo` in sessionStorage,
 * then navigates to GitHub's authorize endpoint.
 */
export function startLogin(returnTo?: string): void {
  if (!config.githubClientId) {
    throw new AuthError(
      'missing_client_id',
      'VITE_GITHUB_CLIENT_ID is not configured.',
    );
  }
  const state = generateState();
  sessionStorage.setItem(STORAGE_KEYS.OAUTH_STATE, state);
  sessionStorage.setItem(
    STORAGE_KEYS.OAUTH_RETURN_TO,
    returnTo ?? `${window.location.pathname}${window.location.hash}`,
  );

  const redirect = config.siteUrl;
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    scope: 'public_repo',
    state,
    redirect_uri: redirect,
  });
  window.location.assign(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

/**
 * Validate state and POST the OAuth code to the Worker for exchange.
 * Returns a session on success.
 */
export async function exchangeCode(code: string, state: string): Promise<AuthSession> {
  const expected = sessionStorage.getItem(STORAGE_KEYS.OAUTH_STATE);
  sessionStorage.removeItem(STORAGE_KEYS.OAUTH_STATE);
  if (!expected || expected !== state) {
    throw new AuthError('state_mismatch', 'OAuth state mismatch');
  }

  const res = await fetch(`${config.workerUrl}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = (await res.json()) as ExchangeResponse | ExchangeErrorResponse;
  if (!res.ok || 'error' in data) {
    const err = data as ExchangeErrorResponse;
    throw new AuthError(err.error ?? 'exchange_failed', err.description ?? 'Exchange failed', res.status, err);
  }
  const ok = data as ExchangeResponse;
  return {
    token: ok.token,
    tokenType: ok.tokenType,
    scope: ok.scope,
    permission: ok.permission,
    user: ok.user,
  };
}

export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${config.workerUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    // best-effort; ignore network errors during logout
  }
}

export function getStoredAuth(): AuthSession | null {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.GH_TOKEN);
    const userRaw = localStorage.getItem(STORAGE_KEYS.GH_USER);
    if (!token || !userRaw) return null;
    const stored = JSON.parse(userRaw) as Omit<AuthSession, 'token'>;
    return { ...stored, token };
  } catch {
    return null;
  }
}

export function persistAuth(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEYS.GH_TOKEN, session.token);
  const { token: _t, ...rest } = session;
  void _t;
  localStorage.setItem(STORAGE_KEYS.GH_USER, JSON.stringify(rest));
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.GH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.GH_USER);
}

export function popReturnTo(): string {
  const v = sessionStorage.getItem(STORAGE_KEYS.OAUTH_RETURN_TO);
  sessionStorage.removeItem(STORAGE_KEYS.OAUTH_RETURN_TO);
  return v ?? '/';
}
