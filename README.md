# Prompt Library

A curated library of AI prompts, powered by GitHub Issues and built with React + Vite. Includes optional GitHub-OAuth-gated CRUD for repository collaborators.

🌐 **Live Site**: [https://prompt.yu.money/](https://prompt.yu.money/)

## Features

- 🔍 **Search & Filter** — Full-text search and multi-category filters (model, type, use case, language, difficulty)
- 🏷️ **Label-based taxonomy** — Prompts tagged via prefixed Issue labels (`model:`, `type:`, `usecase:`, `lang:`, `difficulty:`)
- 📝 **Markdown** — Rendered with `react-markdown` + GFM; edited with `@uiw/react-md-editor`
- 📋 **One-click copy** — Copy prompt or version text to clipboard
- 🔄 **Version history** — Issue comments serve as versioned iterations
- 🌙 **Dark mode** — System-aware with manual toggle
- 🌐 **i18n** — Traditional Chinese (default) + English, switchable in nav
- 🔐 **GitHub OAuth** — Sign-in for collaborators enables Prompt / Comment / Label CRUD with image uploads
- 📦 **Pure SPA on GitHub Pages** + a tiny Cloudflare Worker for OAuth code exchange

## Architecture

```
┌──────────────┐  unauth GET (read)        ┌─────────────────┐
│  SPA on      │ ───────────────────────▶  │ GitHub REST API │
│ GitHub Pages │                            └─────────────────┘
│              │  OAuth code → token       ┌─────────────────────┐
│              │ ─────────────────────────▶│ Cloudflare Worker   │
│              │ ◀─────────────────────── │ (auth/exchange,     │
│              │  token + permission       │  auth/logout)       │
│              │                            └─────────────────────┘
│              │  authed CRUD (write)      ┌─────────────────┐
│              │ ───────────────────────▶  │ GitHub REST API │
└──────────────┘                            └─────────────────┘
```

The Worker only handles the secret-bearing OAuth flow and gates by `repos/{owner}/{repo}/collaborators/{user}/permission`. After login, the SPA calls the GitHub API directly with the returned token.

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + TypeScript | UI framework |
| Vite 7 | Build tool |
| Tailwind CSS 3 | Styling |
| React Router v7 | Client-side routing (HashRouter for GitHub Pages) |
| @tanstack/react-query | Data fetching, caching, mutations |
| @octokit/rest | GitHub API client (`getOctokit(token?)`) |
| react-i18next | i18n |
| @uiw/react-md-editor | Markdown editor |
| rehype-sanitize | XSS protection in rendered Markdown |
| Cloudflare Workers | OAuth code exchange + collaborator gating |
| pnpm | Package manager |

## Data Model

| Concept | GitHub mapping |
|---------|---------------|
| Prompt | Open Issue without `meta` or `archived` label |
| Prompt content | Issue body — the **copyable prompt** section (Markdown) |
| Notes / output examples | Stored in the same issue body via hidden HTML-comment markers (see below) |
| Prompt version | Issue comment (shown as v2, v3, …) |
| Categories | Issue labels with prefixes (`model:`, `type:`, …) |
| Soft delete | `archived` label + closed state |
| Image attachment | Committed under `.attachments/<yyyymmdd>/<uuid>.<ext>` on the default branch |

### Prompt body format

The issue body is split into sections with **HTML-comment markers** (invisible when the
issue is viewed on GitHub). Only the `pl:prompt` section is copied / opened in AI tools /
used for variable filling:

```markdown
<!-- pl:prompt:start -->
You are an expert... {{topic}}
<!-- pl:prompt:end -->

<!-- pl:notes:start -->
Optional notes/description — never copied.
<!-- pl:notes:end -->

<!-- pl:outputs
[{"type":"youtube","url":"https://youtu.be/ID","caption":"..."},
 {"type":"image","url":"https://raw.githubusercontent.com/.../x.png"},
 {"type":"text","text":"example output..."}]
-->
```

Output examples are typed (`image` / `youtube` / `text`), rendered as a gallery on the
detail page and a thumbnail on home cards. A body **without** markers is treated entirely as
the prompt, so legacy prompts keep working. Simple prompts (no notes/outputs) are stored
marker-free. Parsing/serialization lives in [src/web/lib/promptBody.ts](src/web/lib/promptBody.ts).

## Local Development

### Prerequisites

- Node 20+
- pnpm 10+

```pwsh
# Install SPA dependencies
pnpm install

# Install Worker dependencies
pnpm -C src/worker install

# Copy env templates
Copy-Item src/web/.env.example src/web/.env.local
Copy-Item src/worker/.dev.vars.example src/worker/.dev.vars
```

Fill in `src/web/.env.local`:

```ini
VITE_GITHUB_CLIENT_ID=<your OAuth App client id>
VITE_WORKER_URL=http://localhost:8787
```

Fill in `src/worker/.dev.vars`:

```ini
GITHUB_CLIENT_SECRET=<your OAuth App client secret>
```

### Run

```pwsh
# Terminal 1 — SPA
pnpm dev

# Terminal 2 — Worker
pnpm -C src/worker dev
```

Open `http://localhost:5173`.

For local OAuth, also add `http://localhost:5173` to `src/worker/wrangler.jsonc` `vars.ALLOWED_ORIGIN` and to your OAuth App's Authorization callback URL.

## Build

```pwsh
pnpm build
pnpm preview
```

## OAuth App Setup

1. https://github.com/settings/developers → **New OAuth App**
2. Application name: `PromptLibrary`
3. Homepage URL: `https://prompt.yu.money/`
4. **Authorization callback URL:** `https://prompt.yu.money/` (the bare site root; `index.html` rewrites the OAuth `?code=&state=` to `#/auth/callback?...` before React boots).
5. Generate a client secret. Save:
   - **Client ID** → SPA `VITE_GITHUB_CLIENT_ID` and Worker `wrangler.jsonc` `vars.GITHUB_CLIENT_ID`
   - **Client Secret** → `pnpm -C src/worker dlx wrangler secret put GITHUB_CLIENT_SECRET`

## Cloudflare Worker

See [src/worker/README.md](src/worker/README.md) for details. Summary:

| Setting | Where |
|---------|-------|
| `OWNER`, `REPO`, `ALLOWED_ORIGIN`, `GITHUB_CLIENT_ID` | `src/worker/wrangler.jsonc` `vars` (committed) |
| `GITHUB_CLIENT_SECRET` | `wrangler secret put` (encrypted, not committed) |

## Deployment

### SPA → GitHub Pages

Auto-deploys via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) on push to `main` (excluding `src/worker/**`).

Required repository **variables** (Settings → Secrets and variables → Actions → Variables tab):

- `VITE_GITHUB_CLIENT_ID`
- `VITE_WORKER_URL` (e.g. `https://promptlibrary-auth.<account>.workers.dev`)

(These are public values, so use **Variables**, not Secrets.)

### Worker → Cloudflare

Auto-deploys via [.github/workflows/deploy-worker.yml](.github/workflows/deploy-worker.yml) on changes under `src/worker/**`.

Required repository **secret**:

- `CLOUDFLARE_API_TOKEN` (account-level token with `Workers Scripts: Edit` permission)

## Permissions Model

Read access is unauthenticated and public.

Write access (Prompt CRUD, Comment CRUD, Label CRUD, image upload) requires:

1. Sign in via the **Login with GitHub** button
2. Be a repo collaborator with `write` / `maintain` / `admin` permission

The Worker enforces this gate at OAuth exchange time and refuses to issue a token to non-collaborators.

## Soft delete

There is no hard delete. Archive applies the `archived` label and closes the issue; restore removes the label and re-opens. The home list automatically excludes `archived` and `meta`-tagged issues.

## Image upload

In the Markdown editor, **drag & drop** or **paste** an image to upload. The image is committed to the repository under `.attachments/<yyyymmdd>/<uuid>.<ext>` on the default branch and inserted as a `raw.githubusercontent.com` URL. Each upload creates a separate commit; orphan files are not auto-pruned.

## Output examples

The prompt editor has an **Output Examples** section to showcase what a prompt produces:

- **Image** — uploaded via the same `.attachments/` pipeline.
- **YouTube** — paste a link; it is embedded (privacy-preserving `youtube-nocookie.com`).
- **Text** — a Markdown snippet for chat-style outputs.

Examples render as a gallery on the prompt detail page and the first image / YouTube thumbnail appears on the home card. Direct video-file uploads are intentionally **not** supported (repo size / CSP); use a YouTube link instead.

## Security

- **Token** stored in `localStorage` (`pl_gh_token`); the SPA never sees the OAuth client secret.
- **CSP** — strict `Content-Security-Policy` meta tag in [src/web/index.html](src/web/index.html). `script-src 'self'`, `connect-src` whitelisted, `frame-ancestors 'none'`. YouTube output-example embeds are allowed via `frame-src https://www.youtube-nocookie.com`, and their thumbnails via `img-src https://i.ytimg.com`.
- **XSS** — Markdown rendering uses `rehype-sanitize`.
- **CSRF** — OAuth flow uses cryptographically-random `state` stored in `sessionStorage`.
- **401 handling** — Octokit response hook auto-clears auth and prompts re-login on token revocation.
- **CORS** — Worker rejects origins not in `ALLOWED_ORIGIN`.

## Limitations

- **Last-write-wins.** Concurrent edits are not detected.
- **Orphan attachment files** are not auto-deleted on archive/restore.
- **Rate limit** — browsing uses the GitHub Search API (≈10 req/min unauthenticated, ≈30 req/min authenticated); hitting the limit surfaces a friendly in-app message. Authenticated users also get the higher REST limit (5,000/hour) for detail/CRUD calls.

## License

MIT
