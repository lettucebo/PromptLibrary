# PromptLibrary Auth Worker

A minimal Cloudflare Worker that handles the GitHub OAuth `code → access_token` exchange and gates write access by repository collaborator permission.

The frontend SPA never sees the OAuth client secret. After login, the SPA calls the GitHub REST API directly with the returned token.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `OPTIONS` | _any_ | CORS preflight |
| `POST` | `/auth/exchange` | `{ code }` → `{ token, user, permission }`. 403 if not collaborator. |
| `POST` | `/auth/logout` | `{ token }` → revokes the token via GitHub `DELETE /applications/{client_id}/token`. |
| `GET`  | `/healthz` | Liveness check. |

All requests must include an `Origin` header matching `ALLOWED_ORIGIN` (comma-separated for multiple).

## Configuration

`wrangler.jsonc` carries the **non-secret** values (committed to repo):

| Var | Value |
|-----|-------|
| `OWNER` | `lettucebo` |
| `REPO` | `PromptLibrary` |
| `GITHUB_CLIENT_ID` | (replace with the OAuth App's client id) |
| `ALLOWED_ORIGIN` | `https://prompt.yu.money` (add `,http://localhost:5173` for local dev) |

The **secret** value is set via `wrangler secret put`:

| Secret | How to set |
|--------|-----------|
| `GITHUB_CLIENT_SECRET` | `pnpm dlx wrangler secret put GITHUB_CLIENT_SECRET` |

## OAuth App setup

1. https://github.com/settings/developers → `New OAuth App`
2. Application name: `PromptLibrary`
3. Homepage URL: `https://prompt.yu.money/`
4. **Authorization callback URL: `https://prompt.yu.money/`** (the bare site root; HashRouter requires this — see `index.html` for the bootstrap redirect).
5. Generate a client secret. Save the **client id** into `wrangler.jsonc` `vars.GITHUB_CLIENT_ID` and into the SPA `VITE_GITHUB_CLIENT_ID`. Save the **client secret** as a Worker secret.

## Local development

```pwsh
# Install Worker dependencies
pnpm install

# Copy the dev secrets template, fill in real values
Copy-Item .dev.vars.example .dev.vars

# Run dev server (default http://localhost:8787)
pnpm dev
```

For local SPA dev, add the SPA dev origin to `wrangler.jsonc` `ALLOWED_ORIGIN`:

```jsonc
"ALLOWED_ORIGIN": "https://prompt.yu.money,http://localhost:5173"
```

## Deploy

Manual:

```pwsh
pnpm deploy
```

Automatic via GitHub Actions: push changes under `src/worker/` to `main`. The workflow at [.github/workflows/deploy-worker.yml](../../.github/workflows/deploy-worker.yml) requires the `CLOUDFLARE_API_TOKEN` repo secret (account-level token with **Workers Scripts: Edit** permission).

After the first deploy, the Worker URL will be:

```
https://promptlibrary-auth.<account-subdomain>.workers.dev
```

Set `VITE_WORKER_URL` for the SPA to that URL (via repo secret).

## Observability

```pwsh
pnpm tail
```

Streams structured logs (`exchange_failed`, `permission_denied`, `revoke_failed`).
