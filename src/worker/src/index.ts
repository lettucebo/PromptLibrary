/**
 * PromptLibrary Auth Worker
 *
 * Two endpoints:
 *  - POST /auth/exchange  Exchange OAuth code for access_token, gate by collaborator permission
 *  - POST /auth/logout    Revoke an access_token
 *
 * Frontend calls GitHub REST API directly with the returned token; this Worker
 * only handles the secret-bearing OAuth flow and the collaborator gate.
 */

interface Env {
  /** Public OAuth App client id */
  GITHUB_CLIENT_ID: string;
  /** Secret OAuth App client secret (wrangler secret put) */
  GITHUB_CLIENT_SECRET: string;
  /** Repository owner (vars) */
  OWNER: string;
  /** Repository name (vars) */
  REPO: string;
  /** Allowed Origin for CORS (no trailing slash). Comma-separated for multiple. */
  ALLOWED_ORIGIN: string;
}

interface ExchangeRequest {
  code: string;
}

interface LogoutRequest {
  token: string;
}

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  name?: string | null;
}

interface CollaboratorPermission {
  permission: 'admin' | 'maintain' | 'write' | 'triage' | 'read' | 'none';
  user: GitHubUser;
}

const USER_AGENT = 'PromptLibrary-Auth-Worker';

function isAllowedOrigin(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  const allowed = env.ALLOWED_ORIGIN.split(',').map((s) => s.trim());
  return allowed.includes(origin);
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = isAllowedOrigin(origin, env) ? origin! : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(
  body: unknown,
  init: ResponseInit & { origin?: string | null; env?: Env } = {},
): Response {
  const { origin, env, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  if (env) {
    for (const [k, v] of Object.entries(corsHeaders(origin ?? null, env))) {
      headers.set(k, v);
    }
  }
  return new Response(JSON.stringify(body), { ...rest, headers });
}

async function githubFetch(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('User-Agent', USER_AGENT);
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', '2022-11-28');
  if (token) headers.set('Authorization', `token ${token}`);
  return fetch(`https://api.github.com${path}`, { ...init, headers });
}

async function exchangeCodeForToken(env: Env, code: string): Promise<GitHubTokenResponse> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  return (await res.json()) as GitHubTokenResponse;
}

async function fetchUser(token: string): Promise<GitHubUser | null> {
  const res = await githubFetch('/user', {}, token);
  if (!res.ok) return null;
  return (await res.json()) as GitHubUser;
}

async function fetchPermission(
  env: Env,
  token: string,
  username: string,
): Promise<CollaboratorPermission['permission']> {
  const res = await githubFetch(
    `/repos/${env.OWNER}/${env.REPO}/collaborators/${encodeURIComponent(username)}/permission`,
    {},
    token,
  );
  if (!res.ok) return 'none';
  const data = (await res.json()) as CollaboratorPermission;
  return data.permission;
}

async function handleExchange(req: Request, env: Env, origin: string | null): Promise<Response> {
  let body: ExchangeRequest;
  try {
    body = (await req.json()) as ExchangeRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400, env, origin });
  }
  if (!body?.code || typeof body.code !== 'string') {
    return jsonResponse({ error: 'missing_code' }, { status: 400, env, origin });
  }

  const tokenResp = await exchangeCodeForToken(env, body.code);
  if (tokenResp.error || !tokenResp.access_token) {
    console.log('exchange_failed', { error: tokenResp.error, description: tokenResp.error_description });
    return jsonResponse(
      { error: tokenResp.error ?? 'exchange_failed', description: tokenResp.error_description },
      { status: 400, env, origin },
    );
  }

  const user = await fetchUser(tokenResp.access_token);
  if (!user) {
    return jsonResponse({ error: 'user_lookup_failed' }, { status: 502, env, origin });
  }

  const permission = await fetchPermission(env, tokenResp.access_token, user.login);
  const writeAllowed = permission === 'admin' || permission === 'maintain' || permission === 'write';
  if (!writeAllowed) {
    console.log('permission_denied', { user: user.login, permission });
    return jsonResponse(
      { error: 'permission_denied', permission, user: { login: user.login } },
      { status: 403, env, origin },
    );
  }

  return jsonResponse(
    {
      token: tokenResp.access_token,
      tokenType: tokenResp.token_type ?? 'bearer',
      scope: tokenResp.scope ?? '',
      permission,
      user: {
        login: user.login,
        avatarUrl: user.avatar_url,
        htmlUrl: user.html_url,
        name: user.name ?? null,
      },
    },
    { env, origin },
  );
}

async function handleLogout(req: Request, env: Env, origin: string | null): Promise<Response> {
  let body: LogoutRequest;
  try {
    body = (await req.json()) as LogoutRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400, env, origin });
  }
  if (!body?.token || typeof body.token !== 'string') {
    return jsonResponse({ error: 'missing_token' }, { status: 400, env, origin });
  }
  // GitHub revoke endpoint: DELETE /applications/{client_id}/token
  // Auth: Basic with client_id:client_secret
  const basic = btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`);
  const res = await fetch(
    `https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: body.token }),
    },
  );
  // 204 = revoked, 422 = invalid token; treat both as success from caller's perspective
  if (res.status === 204 || res.status === 422) {
    return jsonResponse({ ok: true }, { env, origin });
  }
  console.log('revoke_failed', { status: res.status });
  return jsonResponse({ error: 'revoke_failed', status: res.status }, { status: 502, env, origin });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Preflight
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(origin, env)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    // Reject non-allowed origins for actual requests
    if (!isAllowedOrigin(origin, env)) {
      return jsonResponse({ error: 'origin_not_allowed' }, { status: 403, env, origin: null });
    }

    if (url.pathname === '/auth/exchange' && request.method === 'POST') {
      return handleExchange(request, env, origin);
    }
    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      return handleLogout(request, env, origin);
    }
    if (url.pathname === '/healthz' && request.method === 'GET') {
      return jsonResponse({ ok: true }, { env, origin });
    }

    return jsonResponse({ error: 'not_found' }, { status: 404, env, origin });
  },
} satisfies ExportedHandler<Env>;
