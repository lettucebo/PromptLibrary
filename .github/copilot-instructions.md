# Copilot Instructions — Prompt Library

## Project Overview

**Prompt Library** is a SPA (single-page application) on GitHub Pages at `https://lettucebo.github.io/PromptLibrary/`, backed by GitHub Issues as the data store. Read access is unauthenticated; write access (CRUD) requires a GitHub OAuth login that goes through a tiny Cloudflare Worker for the secret-bearing code → token exchange.

## Architecture

- **Framework**: React 18 + TypeScript + Vite 7
- **Styling**: Tailwind CSS 3 with dark mode (`class` strategy)
- **Routing**: `HashRouter` from `react-router-dom` v7 (GitHub Pages has no SSR)
- **Data**: `@tanstack/react-query` for caching & mutations; `@octokit/rest` for GitHub
- **Markdown**: `react-markdown` + `remark-gfm` for rendering; `@uiw/react-md-editor` (from `/nohighlight`) for editing; `rehype-sanitize` for XSS protection
- **i18n**: `react-i18next` (default `zh-TW`, also `en`)
- **Icons**: `lucide-react`
- **Auth backend**: Cloudflare Worker under `src/worker/`
- **Package manager**: pnpm 10 (locked via `packageManager` field)
- **Vite base**: `'/PromptLibrary/'` (GitHub Pages subpath)

## Authentication

- OAuth App registers `https://lettucebo.github.io/PromptLibrary/` as the callback URL (root, not a hash route).
- An inline script in [index.html](../index.html) detects `?code=&state=` and rewrites the URL to `#/auth/callback?...` **before React boots**, so HashRouter sees the right route.
- The Cloudflare Worker (`POST /auth/exchange`) holds the OAuth client secret, exchanges the `code`, then immediately calls `GET /repos/{owner}/{repo}/collaborators/{user}/permission`. Only `admin` / `maintain` / `write` permissions get a token back; others get 403.
- The frontend stores `{token, user, ...}` in `localStorage` and calls the GitHub API directly with that token. The Worker never proxies CRUD.
- Logout calls `POST /auth/logout` which revokes the token via `DELETE /applications/{client_id}/token`.
- `src/lib/github.ts` registers a global Octokit `error` hook: on 401, it triggers `onUnauthorized` → `clearAuth()` + toast, forcing re-login.

## Cloudflare Worker

Lives in `src/worker/` with its own `package.json`, `wrangler.jsonc`, `tsconfig.json`, and deploy workflow.

- Endpoints: `POST /auth/exchange`, `POST /auth/logout`, `GET /healthz`
- **Public values** (committed in `wrangler.jsonc` `vars`): `OWNER`, `REPO`, `ALLOWED_ORIGIN`, `GITHUB_CLIENT_ID`
- **Secret** (set via `wrangler secret put`): only `GITHUB_CLIENT_SECRET`
- CORS only allows the configured `ALLOWED_ORIGIN` (comma-separated for dev + prod)
- Logs structured event types: `exchange_failed`, `permission_denied`, `revoke_failed`. Use `pnpm -C src/worker tail` to stream them.

## i18n

- Init in `src/i18n/index.ts`. Resources at `src/i18n/locales/{zh-TW,en}.json`.
- Key namespaces: `nav.*`, `home.*`, `filter.*`, `empty.*`, `prompt.*`, `prompt.editor.*`, `comment.*`, `label.*`, `auth.*`, `common.*`.
- **All user-facing text MUST go through `useTranslation()`. Never hardcode Chinese or English in JSX.** When adding strings, add them to **both** locale files.
- Language detector reads `localStorage` key `pl_lang`; fallback `zh-TW`.
- `<html lang>` is synced by `Layout.tsx`.

## Image Upload

The MDEditor wrapper (`src/components/MarkdownEditor.tsx`) intercepts `onPaste` and `onDrop`. Image files are uploaded via `useUploadAttachment()` → `uploadAttachment()` (in `src/lib/github.ts`), which calls the Contents API to commit the file to `.attachments/<yyyymmdd>/<uuid>.<ext>` on the default branch. The resulting `raw.githubusercontent.com` URL is inserted at the editor's value, replacing a temporary `![uploading...](pending-...)` placeholder.

GitHub's user-attachment endpoint is **not** used (no public OAuth API).

## Storage Keys

### localStorage

- `pl_theme` — `'dark'` | `'light'`
- `pl_lang` — `'zh-TW'` | `'en'`
- `pl_gh_token` — OAuth access token
- `pl_gh_user` — JSON: `{ user, permission, tokenType, scope }`

### sessionStorage

- `pl_oauth_state` — CSRF token for the active OAuth handshake
- `pl_oauth_return_to` — path to redirect to after successful login

## Data Model

| Concept | GitHub mapping |
|---------|---------------|
| Prompt | Open Issue without `meta` and `archived` labels |
| Prompt body | Issue body (Markdown) |
| Prompt version | Issue comment (renders as v2, v3, …) |
| Categories | Issue labels with prefixes (`model:`, `type:`, `usecase:`, `lang:`, `difficulty:`) |
| Soft delete | Apply `archived` label + close issue |
| Restore | Remove `archived` label + reopen |
| Image attachment | File at `.attachments/<yyyymmdd>/<uuid>.<ext>` on the default branch |

`fetchPrompts` excludes both `meta` and `archived` labels.

Issue title constraint: ≤ 256 characters (validated in the editor).

Label CRUD requires write permission on the repo. The protected labels `archived` and `meta` cannot be renamed or deleted from the admin page.

## File Structure

```
.env.example                     VITE_GITHUB_CLIENT_ID, VITE_WORKER_URL
package.json                     Scripts run vite/tsc with --config src/web/...
src/
  web/                           ← Frontend SPA source + its build configs
    index.html                   Entry HTML (CSP meta + theme & OAuth bootstrap; loads /main.tsx)
    vite.config.ts               root: __dirname, base: '/PromptLibrary/', build.outDir: '../../dist'
    tsconfig.json                include: ['**/*.ts','**/*.tsx'], exclude: ['vite.config.ts']
    tsconfig.node.json           composite project for vite.config.ts
    tailwind.config.js           content paths relative to this file
    public/                      Static assets served at base URL (favicon, etc.)
    main.tsx                     imports './i18n'
    App.tsx                      AuthProvider + lazy routes + Suspense
    config.ts                    owner/repo, env vars, label prefixes, storage keys
    vite-env.d.ts                ImportMetaEnv types
    index.css                    Tailwind directives
    i18n/
      index.ts                   react-i18next init
      locales/{zh-TW,en}.json
    contexts/
      AuthContext.tsx            session, login, logout, exchange, notice
    lib/
      auth.ts                    startLogin/exchangeCode/logout, persistAuth, popReturnTo
      github.ts                  getOctokit(token?), fetch+CRUD+upload helpers, setUnauthorizedHandler
    hooks/
      usePrompts.ts              queries + mutations for prompts and comments + uploadAttachment
      useLabels.ts               queries + mutations for labels
    types/index.ts               Label, Prompt, AuthSession, RepoPermission, …
    components/
      Layout.tsx                 theme + lang sync + Toast
      Navbar.tsx                 logo, language switcher, theme toggle, login button / UserMenu
      UserMenu.tsx               dropdown: New Prompt / Manage Labels / Logout
      AuthGuard.tsx              wraps write routes; auto-triggers login + returnTo
      Toast.tsx                  transient notice driven by AuthContext
      LanguageSwitcher.tsx
      SearchBar.tsx
      CategoryFilter.tsx
      PromptCard.tsx
      LabelBadge.tsx
      LabelMultiSelect.tsx       used by PromptEditorPage
      MarkdownEditor.tsx         wrapper for @uiw/react-md-editor + paste/drop image upload
      CommentEditor.tsx          inline comment editor
      LoadingSpinner.tsx
      EmptyState.tsx
    pages/
      HomePage.tsx               list + filters + search + (auth) "+ New" button
      PromptDetailPage.tsx       (lazy) detail + (auth) edit/archive/restore + comment CRUD
      PromptEditorPage.tsx       (lazy, auth) new/edit form
      LabelsAdminPage.tsx        (lazy, auth) label CRUD by category
      AuthCallbackPage.tsx       (lazy) verifies state, calls exchange, redirects to returnTo
  worker/                        ← Cloudflare Worker source (own package.json/tsconfig/wrangler)
    package.json
    wrangler.jsonc               vars block + observability
    tsconfig.json
    src/index.ts                 /auth/exchange, /auth/logout, /healthz, CORS
    .dev.vars.example
    README.md
.github/
  workflows/
    deploy.yml                   pnpm + Pages; injects VITE_* from repo Variables
    deploy-worker.yml            pnpm + wrangler-action; needs CLOUDFLARE_API_TOKEN
  copilot-instructions.md        this file
```

## Build & Dev

```pwsh
# SPA
pnpm install            # one-time
pnpm dev                # http://localhost:5173
pnpm build              # tsc + vite build
pnpm preview

# Worker
pnpm -C src/worker install  # one-time
pnpm -C src/worker dev      # http://localhost:8787
pnpm -C src/worker deploy
pnpm -C src/worker tail
```

## Deployment

- **SPA**: [.github/workflows/deploy.yml](workflows/deploy.yml) on push to `main` (excluding `src/worker/**`). Repository Variables: `VITE_GITHUB_CLIENT_ID`, `VITE_WORKER_URL`.
- **Worker**: [.github/workflows/deploy-worker.yml](workflows/deploy-worker.yml) on changes under `src/worker/**`. Repository Secret: `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit).

## Coding Conventions

- Functional React components with TypeScript; default exports for components/pages.
- **All UI text via `useTranslation()`**. Add keys to both `zh-TW.json` and `en.json`.
- Tailwind utility classes only; no custom CSS beyond base layer.
- All GitHub API access goes through `src/lib/github.ts`. Use `getOctokit(token?)`; never `new Octokit()` ad hoc.
- All write operations go through React Query mutation hooks in `src/hooks/usePrompts.ts` or `useLabels.ts`. Mutations must `invalidateQueries` for affected lists.
- Consume the Markdown editor only via `<MarkdownEditor />` wrapper, not by importing `@uiw/react-md-editor` directly. This isolates the underlying library.
- Write-protected pages (`PromptEditorPage`, `LabelsAdminPage`) and the `AuthCallbackPage` must be `React.lazy`-loaded; wrap with `Suspense` and use `<AuthGuard>` for write routes.
- 401 from GitHub → never re-throw to UI; let `setUnauthorizedHandler` handle it (it auto-clears auth and shows the toast).

## Security

- **CSP** — strict `<meta http-equiv="Content-Security-Policy">` in `index.html`:
  - `default-src 'self'`
  - `img-src https: data:` (allows `raw.githubusercontent.com` and external image hosts)
  - `style-src 'self' 'unsafe-inline'` (Tailwind + MDEditor inline SVG styles)
  - `script-src 'self' 'unsafe-inline'` (theme + OAuth bootstrap inline scripts)
  - `connect-src` allow-list: `api.github.com`, `github.com`, `raw.githubusercontent.com`, Worker URL
  - `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`
- **XSS** — `<MarkdownEditor>` previewOptions and read-only renders use `rehype-sanitize`.
- **CSRF** — OAuth `state` is `crypto.getRandomValues`-derived, stored in `sessionStorage`, validated in `AuthCallbackPage`.
- **Token storage** — `localStorage`. Mitigation: strict CSP. Token is a `public_repo`-scoped OAuth token (no admin powers).
- **CORS** — Worker only allows configured `ALLOWED_ORIGIN`(s); preflight rejects others.

## Limitations (intentional, documented in README)

- Last-write-wins; no concurrent-edit detection
- Image attachments are not auto-pruned
- No hard delete (Issues are soft-deleted via `archived` label)
- No rate-limit indicator in UI
