# Copilot Instructions — Prompt Library

## Project Overview

**Prompt Library** is a SPA (single-page application) on GitHub Pages at `https://prompt.yu.money/`, backed by GitHub Issues as the data store. Read access is unauthenticated; write access (CRUD) requires a GitHub OAuth login that goes through a tiny Cloudflare Worker for the secret-bearing code → token exchange.

## Architecture

- **Framework**: React 18 + TypeScript + Vite 7
- **Styling**: Tailwind CSS 3 with dark mode (`class` strategy)
- **Routing**: `HashRouter` from `react-router-dom` v7 (GitHub Pages has no SSR)
- **Data**: `@tanstack/react-query` for caching & mutations; `@octokit/rest` for GitHub
- **Markdown**: `react-markdown` + `remark-gfm` for rendering; `@uiw/react-md-editor` (from `/nohighlight`) for editing; `rehype-sanitize` for XSS protection; `diff` package for inline version diffs
- **i18n**: `react-i18next` (default `zh-TW`, also `en`)
- **Icons**: `lucide-react`
- **Auth backend**: Cloudflare Worker under `src/worker/`
- **Package manager**: pnpm 10 (locked via `packageManager` field)
- **Vite base**: `'/PromptLibrary/'` (GitHub Pages subpath)
- **Provider hierarchy**: `QueryClientProvider` → `ToastProvider` → `AuthProvider` → `HashRouter` (order matters: `AuthProvider` can call `useToast()`)

## Authentication

- OAuth App registers `https://prompt.yu.money/` as the callback URL (root, not a hash route).
- An inline script in [src/web/index.html](../src/web/index.html) detects `?code=&state=` and rewrites the URL to `#/auth/callback?...` **before React boots**, so HashRouter sees the right route.
- The Cloudflare Worker (`POST /auth/exchange`) holds the OAuth client secret, exchanges the `code`, then immediately calls `GET /repos/{owner}/{repo}/collaborators/{user}/permission`. Only `admin` / `maintain` / `write` permissions get a token back; others get 403.
- The frontend stores `{token, user, ...}` in `localStorage` and calls the GitHub API directly with that token. The Worker never proxies CRUD.
- Logout calls `POST /auth/logout` which revokes the token via `DELETE /applications/{client_id}/token`.
- `src/web/lib/github.ts` registers a global Octokit `error` hook: on 401, it triggers `onUnauthorized` → `clearAuth()` + toast, forcing re-login.

## Cloudflare Worker

Lives in `src/worker/` with its own `package.json`, `wrangler.jsonc`, `tsconfig.json`, and deploy workflow.

- Endpoints: `POST /auth/exchange`, `POST /auth/logout`, `GET /healthz`
- **Public values** (committed in `wrangler.jsonc` `vars`): `OWNER`, `REPO`, `ALLOWED_ORIGIN`, `GITHUB_CLIENT_ID`
- **Secret** (set via `wrangler secret put`): only `GITHUB_CLIENT_SECRET`
- CORS only allows the configured `ALLOWED_ORIGIN` (comma-separated for dev + prod)
- Logs structured event types: `exchange_failed`, `permission_denied`, `revoke_failed`. Use `pnpm -C src/worker tail` to stream them.

## i18n

- Init in `src/web/i18n/index.ts`. Resources at `src/web/i18n/locales/{zh-TW,en}.json`. Single `translation` namespace; all keys accessed without a prefix namespace.
- Key groups: `nav.*`, `home.*`, `filter.*`, `empty.*`, `prompt.*`, `prompt.editor.*`, `comment.*`, `label.*`, `auth.*`, `toast.*`, `errors.*`, `common.*`.
- **All user-facing text MUST go through `useTranslation()`. Never hardcode Chinese or English in JSX.** When adding strings, add them to **both** locale files.
- **Plurals** — There is **no i18next-icu plugin**. Use suffix form: `key_one` / `key_other` (e.g. `"totalResults_one": "{{count}} prompt"`, `"totalResults_other": "{{count}} prompts"`). The inline ICU form `{{count, plural, one{...} other{...}}}` does **not** work here and renders as broken text.
- Language detector reads `localStorage` key `pl_lang`; fallback `zh-TW`.
- `<html lang>` is synced by `Layout.tsx`.

## Design System (Warm Morandi)

[`DESIGN.md`](../DESIGN.md) at the repo root is the **single source of truth** for visual design (the "Warm Morandi" system). Follow it for all UI work; in that file only the project name is project-specific — the tokens/principles are authoritative.

- **No hardcoded colors.** Use the semantic Tailwind tokens, defined as CSS variables in `src/web/index.css` (`:root` + `.dark`) and mapped in `tailwind.config.js` via `rgb(var(--c-*) / <alpha-value>)`:
  - Surfaces: `bg-page`, `bg-card`, `bg-subtle`
  - Text: `text-content`, `text-content-soft`, `text-content-faint`
  - Borders: `border-line`, `border-line-strong`
  - Primary: `bg-primary`, `bg-primary-dark`, `text-primary`, `text-on-primary`
  - Status: `success` / `warning` / `error` / `info` (+ their `-container` variants, `text-on-error`, `text-on-warning`)
  - Accents (text/icons): `accent-green`, `accent-red`, `accent-yellow`, `accent-blue`
- The CSS variables flip automatically under `.dark`, so **do not add `dark:` color variants** for these tokens — set the semantic class once.
- **Fonts**: `font-sans` (Noto Sans TC, body default), `font-title` (Libre Baskerville — brand/logo & headings), `font-mono` (JetBrains Mono). Loaded from Google Fonts in `index.html` (allow-listed in the CSP `style-src`/`font-src`).
- Intentional non-token exceptions: dynamic GitHub label colors in `LabelMultiSelect` (`text-white` over the label's own color) and the `Modal` backdrop scrim (`bg-black/50`).

## Image Upload

The MDEditor wrapper (`src/web/components/MarkdownEditor.tsx`) intercepts `onPaste` and `onDrop`. Image files are uploaded via `useUploadAttachment()` → `uploadAttachment()` (in `src/web/lib/github.ts`), which calls the Contents API to commit the file to `.attachments/<yyyymmdd>/<uuid>.<ext>` on the default branch. The resulting `raw.githubusercontent.com` URL is inserted at the editor's value, replacing a temporary `![uploading...](pending-...)` placeholder.

GitHub's user-attachment endpoint is **not** used (no public OAuth API).

## Storage Keys

### localStorage

- `pl_theme` — `'dark'` | `'light'`
- `pl_lang` — `'zh-TW'` | `'en'`
- `pl_gh_token` — OAuth access token
- `pl_gh_user` — JSON: `{ user, permission, tokenType, scope }`
- `pl_recent` — JSON array of recently viewed prompts `{ number, title, at }` (deduped + capped; via `lib/recentlyViewed.ts`)

### sessionStorage

- `pl_oauth_state` — CSRF token for the active OAuth handshake
- `pl_oauth_return_to` — path to redirect to after successful login

## Data Model

| Concept | GitHub mapping |
|---------|---------------|
| Prompt | Open Issue without `meta` and `archived` labels |
| Prompt body | Issue body (Markdown) — structured into sections via hidden `pl:*` HTML-comment markers; only the `pl:prompt` section is copyable (see below) |
| Notes / output examples | Same issue body: `pl:notes` (Markdown) + `pl:outputs` (JSON array of typed `image`/`youtube`/`text` items) |
| Prompt version | Issue comment (rendered as v2, v3, …; the v1 baseline is the parsed `pl:prompt` text, with inline diff vs the previous version) |
| Categories | Issue labels with prefixes (`model:`, `type:`, `usecase:`, `lang:`, `difficulty:`) |
| Soft delete | Apply `archived` label + close issue |
| Restore | Remove `archived` label + reopen |
| Image attachment | File at `.attachments/<yyyymmdd>/<uuid>.<ext>` on the default branch |

**Prompt body format** (`lib/promptBody.ts` `parsePromptBody`/`serializePromptBody`): sections are delimited by `<!-- pl:prompt:start/end -->`, `<!-- pl:notes:start/end -->`, and a `<!-- pl:outputs [JSON] -->` block. A body with **no** markers is treated entirely as the prompt (legacy-compatible); serialization stays marker-free unless notes/outputs exist. `mapIssueToPrompt` parses this and attaches derived `promptText` / `notes` / `outputs` to every `Prompt` (raw `body` kept for the editor). **All copy / variable-fill consumers use `promptText`, never `body`.**

The home list uses the **GitHub Search API** (`searchPrompts` in `lib/github.ts` → `useSearchPrompts` infinite query) for server-side text search, sort, and pagination; its query excludes `meta` and `archived`. `fetchPrompts` (REST, fetch-all) is retained for non-search callers. Note: the Search API ANDs multiple `label:` qualifiers, so selecting several labels in one category requires matching all of them. It also does **not** support boolean operators on qualifiers — `label:a OR label:b` returns HTTP 422 (`OR`/`AND`/`NOT` apply to free text only), so an "OR labels" filter would need per-label queries merged client-side.

Issue title constraint: ≤ 256 characters (validated in the editor).

Label CRUD requires write permission on the repo. The protected labels `archived` and `meta` cannot be renamed or deleted from the admin page.

## React Query Cache Keys

| Key | Data | staleTime |
|-----|------|-----------|
| `['prompts']` | Full unfiltered list (REST) | 5 min |
| `['prompts', 'search', text, sort, order, filters]` | Paginated search results | 1 min |
| `['prompt', issueNumber]` | Single prompt detail | 5 min |
| `['prompt-comments', issueNumber]` | Comments for a prompt | 5 min |
| `['default-branch']` | Repo default branch name | Infinity |

Mutations invalidate the relevant list key (`['prompts']`) and, where applicable, the individual prompt key (`['prompt', issueNumber]`).

## File Structure

```
.env.example                     VITE_GITHUB_CLIENT_ID, VITE_WORKER_URL
package.json                     Scripts run vite/tsc with --config src/web/...
src/
  web/                           ← Frontend SPA source + its build configs
    index.html                   Entry HTML (CSP meta + theme & OAuth bootstrap; loads /main.tsx)
    vite.config.ts               root: __dirname, base: '/', build.outDir: '../../dist'
    tsconfig.json                include: ['**/*.ts','**/*.tsx'], exclude: ['vite.config.ts']
    tsconfig.node.json           composite project for vite.config.ts
    tailwind.config.js           content paths relative to this file
    public/                      Static assets served at base URL (favicon, etc.)
    main.tsx                     imports './i18n'
    App.tsx                      QueryClientProvider + ToastProvider + AuthProvider + HashRouter + lazy routes
    config.ts                    owner/repo, env vars, label prefixes, storage keys
    vite-env.d.ts                ImportMetaEnv types
    index.css                    Tailwind directives
    i18n/
      index.ts                   react-i18next init
      locales/{zh-TW,en}.json
    contexts/
      AuthContext.tsx            session, login, logout, exchange
      ToastContext.tsx           ToastProvider, useToast() — push/dismiss/success/error/info
    lib/
      auth.ts                    startLogin/exchangeCode/logout, persistAuth, popReturnTo
      github.ts                  getOctokit(token?), fetch+CRUD+upload helpers, setUnauthorizedHandler
      errors.ts                  errorMessageKey(err) → 'errors.*' key; isRateLimitError()
      clipboard.ts               copyText(text) → Promise<boolean>; async Clipboard API with execCommand fallback
      highlight.tsx              highlight(text, query) → ReactNode with <mark> wrapping matches
      tokens.ts                  countChars / estimateTokens (CJK-aware heuristic) for char+token counts
      promptVars.ts              extract/fill {{var}} & [VAR] placeholders (excludes md links & task lists)
      promptFormat.ts            stripMarkdown + promptToJson (multi-format copy/export; uses promptText + outputs)
      promptBody.ts              parse/serialize pl:prompt / pl:notes / pl:outputs sections in the issue body
      youtube.ts                 parseYouTubeId / youtubeEmbedUrl (nocookie) / youtubeThumbnailUrl
      recentlyViewed.ts          get/addRecentlyViewed (localStorage pl_recent)
      rehypeHighlightPlaceholders.ts  rehype plugin: wrap {{var}}/[VAR] in <mark> for read-only Markdown
    hooks/
      usePrompts.ts              queries + mutations for prompts and comments + uploadAttachment
      useLabels.ts               queries + mutations for labels
    types/index.ts               Label, Prompt, AuthSession, RepoPermission, …
    components/
      Layout.tsx                 theme + lang sync; mounts ToastViewport
      Navbar.tsx                 logo, language switcher, theme toggle, login button / UserMenu
      UserMenu.tsx               dropdown: New Prompt / Manage Labels / Logout
      AuthGuard.tsx              wraps write routes; auto-triggers login + returnTo
      ToastViewport.tsx          renders the toast list; mounted in Layout.tsx
      LanguageSwitcher.tsx
      CategoryFilter.tsx
      PromptCard.tsx
      LabelBadge.tsx
      LabelMultiSelect.tsx       used by PromptEditorPage
      InlineLabelCreator.tsx     inline "create label" form embedded in the prompt editor
      MarkdownEditor.tsx         wrapper for @uiw/react-md-editor + paste/drop image upload
      Markdown.tsx               read-only renderer (ReactMarkdown + rehypeSanitize + placeholder highlight); default class: prose prose-sm dark:prose-invert max-w-none
      CommentEditor.tsx          inline comment editor
      ConfirmDialog.tsx          confirm/cancel dialog built on Modal; use instead of window.confirm
      Modal.tsx                  accessible portal dialog (ESC + backdrop close)
      CopyButton.tsx             copy-to-clipboard button using lib/clipboard.ts
      CopyMenu.tsx               copy as plain text / Markdown / JSON (detail page)
      VariableFiller.tsx         form to fill {{var}}/[VAR] placeholders, then copy result
      OutputExamples.tsx         read-only output gallery (image lightbox / YouTube nocookie embed / text)
      OutputExampleEditor.tsx    editor for typed output examples (image upload / YouTube link / text)
      RelatedPrompts.tsx         related prompts by shared label (detail page)
      RecentlyViewed.tsx         recently viewed strip (home; reads pl_recent)
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
pnpm build              # tsc -p src/web/tsconfig.json && vite build
pnpm typecheck          # tsc --noEmit (no separate lint step exists)
pnpm preview

# Worker
pnpm -C src/worker install     # one-time
pnpm -C src/worker dev         # http://localhost:8787
pnpm -C src/worker typecheck   # tsc --noEmit
pnpm -C src/worker cf-typegen  # regenerate worker-configuration.d.ts from wrangler.jsonc
pnpm -C src/worker deploy
pnpm -C src/worker tail
```

There is **no test runner or linter** configured in either package. `typecheck` (TypeScript `--noEmit`) is the only static check; run it after edits to validate. All scripts run `vite`/`tsc` against `src/web/...` configs (see `package.json`).

## Deployment

- **SPA**: [.github/workflows/deploy.yml](workflows/deploy.yml) on push to `main` (excluding `src/worker/**`). Repository Variables: `VITE_GITHUB_CLIENT_ID`, `VITE_WORKER_URL`.
- **Worker**: [.github/workflows/deploy-worker.yml](workflows/deploy-worker.yml) on changes under `src/worker/**`. Repository Secret: `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit).

## Coding Conventions

- Functional React components with TypeScript; default exports for components/pages.
- **All UI text via `useTranslation()`**. Add keys to both `zh-TW.json` and `en.json`.
- Tailwind utility classes using the **Warm Morandi semantic tokens** (see Design System) — avoid `indigo-*`/`gray-*`/hardcoded hex. No custom CSS beyond the token definitions + base layer in `index.css`.
- All GitHub API access goes through `src/web/lib/github.ts`. Use `getOctokit(token?)`; never `new Octokit()` ad hoc.
- All write operations go through React Query mutation hooks in `src/web/hooks/usePrompts.ts` or `src/web/hooks/useLabels.ts`. Mutations must `invalidateQueries` for affected lists.
- Consume the Markdown editor only via `<MarkdownEditor />` wrapper, not by importing `@uiw/react-md-editor` directly. This isolates the underlying library.
- Read-only Markdown renders via the shared `<Markdown>` component (never `ReactMarkdown` directly) so `rehype-sanitize` is always applied. `<Markdown>` also highlights `{{var}}`/`[VAR]` placeholders (via `lib/rehypeHighlightPlaceholders.ts`); its sanitize schema is extended only to allow `<mark class>`.
- Reuse the prompt-consumption helpers instead of reinventing: char/token counts (`lib/tokens.ts`), placeholder parse/fill (`lib/promptVars.ts` + `<VariableFiller>`), multi-format export (`lib/promptFormat.ts` + `<CopyMenu>`), recently-viewed (`lib/recentlyViewed.ts` + `<RecentlyViewed>`).
- User feedback via `useToast()` (`contexts/ToastContext.tsx`); `<ToastViewport/>` is mounted in `Layout`. Map errors to friendly keys with `errorMessageKey()` (`lib/errors.ts`). Use `<ConfirmDialog>` / `<Modal>` instead of `window.confirm`/`alert`. Copy via the shared `<CopyButton>` / `copyText()` (`lib/clipboard.ts`). For search-term highlighting in list items use `highlight(text, query)` from `lib/highlight.tsx`.
- Home list state (search, sort, filters) lives in the URL via `useSearchParams` (HashRouter-compatible) so views are shareable/bookmarkable.
- Write-protected pages (`PromptEditorPage`, `LabelsAdminPage`) and the `AuthCallbackPage` must be `React.lazy`-loaded; wrap with `Suspense` and use `<AuthGuard>` for write routes.
- 401 from GitHub → never re-throw to UI; let `setUnauthorizedHandler` handle it (it auto-clears auth and shows the toast).
- `PromptEditorPage` persists a draft to `sessionStorage` while the user edits; it offers "Restore draft" / "Discard draft" on re-open and confirms navigation away with `<ConfirmDialog>` when there are unsaved changes.

## Security

- **CSP** — strict `<meta http-equiv="Content-Security-Policy">` in `index.html`:
  - `default-src 'self'`
  - `img-src 'self' https://*.githubusercontent.com https://i.ytimg.com data:` (favicon/app assets + avatars & `raw.githubusercontent.com` + YouTube output-example thumbnails; other external image hosts are intentionally disallowed)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` (Tailwind + MDEditor inline SVG styles + Google Fonts CSS)
  - `font-src 'self' https://fonts.gstatic.com` (Libre Baskerville / Noto Sans TC / JetBrains Mono web fonts)
  - `script-src 'self' 'unsafe-inline'` (theme + OAuth bootstrap inline scripts)
  - `frame-src https://www.youtube-nocookie.com` (output-example video embeds)
  - `connect-src` allow-list: `api.github.com`, `github.com`, `raw.githubusercontent.com`, Worker URL
  - `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`
- **XSS** — the shared `<Markdown>` component (`components/Markdown.tsx`) and `<MarkdownEditor>` previewOptions both apply `rehype-sanitize`; all read-only renders go through `<Markdown>`. `<Markdown>` extends the default sanitize schema only to allow `<mark class>` (placeholder highlighting) — no other tags/attributes are added.
- **CSRF** — OAuth `state` is `crypto.getRandomValues`-derived, stored in `sessionStorage`, validated in `AuthCallbackPage`.
- **Token storage** — `localStorage`. Mitigation: strict CSP. Token is a `public_repo`-scoped OAuth token (no admin powers).
- **CORS** — Worker only allows configured `ALLOWED_ORIGIN`(s); preflight rejects others.

## MCP Servers

Configured in [.mcp.json](../.mcp.json) at the repo root (relevant to this React SPA + Cloudflare Worker stack):

- `microsoft/playwright-mcp` & `io.github.ChromeDevTools/chrome-devtools-mcp` — browser automation / debugging the deployed SPA.
- `cloudflare-doc` & `cloudflare-api` — Cloudflare docs lookup and API access for the auth Worker.
- `io.github.upstash/context7` — up-to-date library docs (needs `CONTEXT7_API_KEY` input).
- `microsoft-learn` — Microsoft Learn documentation.

## Limitations (intentional, documented in README)

- Last-write-wins; no concurrent-edit detection
- Image attachments are not auto-pruned
- No hard delete (Issues are soft-deleted via `archived` label)
- Rate limits surface as a friendly message (`errors.rateLimited`); the Search API limits are lower (≈10/min anon, 30/min auth)
