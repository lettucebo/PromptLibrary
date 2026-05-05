# Copilot Instructions — Prompt Library

## Project Overview

**Prompt Library** is a **pure SPA** (single-page application) running on **GitHub Pages** at `https://lettucebo.github.io/PromptLibrary/`. It is a curated library of AI prompts where each prompt is stored as a GitHub Issue in the `lettucebo/PromptLibrary` repository.

## Architecture

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 3 with dark mode (`class` strategy)
- **Routing**: `HashRouter` from react-router-dom v6 (GitHub Pages does not support server-side routing)
- **Data Fetching**: `@tanstack/react-query` for caching, `@octokit/rest` for GitHub API
- **Icons**: `lucide-react`
- **Markdown**: `react-markdown` + `remark-gfm`
- **Build base**: `base: '/PromptLibrary/'` in `vite.config.ts`

## Authentication

Uses **GitHub OAuth** (NOT PAT). The flow:

1. User clicks "Sign in with GitHub" → redirected to `github.com/login/oauth/authorize`
2. GitHub redirects back to the site with `?code=xxx&state=yyy` query params
3. `App.tsx` detects the `code` param (before HashRouter) and routes to `#/callback`
4. `OAuthCallbackPage.tsx` sends the code to a **Cloudflare Worker** (`workers/oauth-proxy.js`)
5. The Worker exchanges the code for an access token using the client secret (server-side only)
6. The access token is stored in `localStorage` under key `pl_github_token`

**Important**: Since this is a pure static SPA on GitHub Pages, the `client_secret` CANNOT be in the frontend. The Cloudflare Worker is the only server-side component and handles the OAuth token exchange.

### Configuration

- `VITE_GITHUB_CLIENT_ID` — GitHub OAuth App client ID (set via `.env` or GH Actions secrets)
- `VITE_TOKEN_PROXY_URL` — URL of the Cloudflare Worker proxy
- `VITE_OAUTH_REDIRECT_URI` — OAuth callback URL (defaults to `window.location.origin + BASE_URL`)

### localStorage Keys

- `pl_github_token` — OAuth access token
- `pl_github_user` — serialized user object (`GitHubUser`)
- `pl_theme` — `'dark'` or `'light'`
- `pl_oauth_state` — temporary CSRF state (in `sessionStorage`, cleared after callback)

## Data Model

| Concept | GitHub Mapping |
|---------|---------------|
| Prompt | GitHub Issue (open state, no `meta` label, not a PR) |
| Prompt content | Issue body (Markdown) |
| Prompt version | Issue comment (shown as v2, v3, …) |
| Category | Issue label with prefix |

### Label Prefixes

| Prefix | Category | Examples |
|--------|----------|---------|
| `model:` | AI model | `model:gpt-4o`, `model:claude-3` |
| `type:` | Content type | `type:text`, `type:image`, `type:video` |
| `usecase:` | Use case | `usecase:coding`, `usecase:writing` |
| `lang:` | Language | `lang:en`, `lang:zh-TW` |
| `difficulty:` | Difficulty | `difficulty:beginner`, `difficulty:advanced` |

Labels without a recognized prefix are categorized as `other`.

## File Structure

```
index.html                       # Entry HTML with dark-mode flash prevention script
vite.config.ts                   # Vite config (base: '/PromptLibrary/')
tailwind.config.js               # Tailwind config (darkMode: 'class')
src/
  main.tsx                       # React root
  App.tsx                        # Routes + OAuth redirect detection
  config.ts                      # Owner, repo, label prefixes, env-based OAuth config
  index.css                      # Tailwind directives + utilities
  types/index.ts                 # TypeScript interfaces
  lib/github.ts                  # Octokit wrappers (fetchPrompts, fetchLabels, etc.)
  contexts/AuthContext.tsx        # OAuth auth state + login/logout/callback handlers
  hooks/
    usePrompts.ts                # React Query hooks for prompts and comments
    useLabels.ts                 # React Query hooks for labels
  components/
    Layout.tsx                   # Page shell (Navbar + dark mode + <Outlet>)
    Navbar.tsx                   # Top nav with user avatar, dark mode toggle, logout
    PromptCard.tsx               # Prompt preview card for the grid
    CategoryFilter.tsx           # Sidebar filter panel (checkboxes by category)
    SearchBar.tsx                # Search input with clear button
    LabelBadge.tsx               # Colored label badge (color by category)
    LoadingSpinner.tsx           # Centered spinner
    EmptyState.tsx               # Empty results placeholder
  pages/
    LoginPage.tsx                # "Sign in with GitHub" OAuth button
    OAuthCallbackPage.tsx        # Handles OAuth code→token exchange
    HomePage.tsx                 # Search + filters + prompt card grid
    PromptDetailPage.tsx         # Full prompt view + copy button + version history
workers/
  oauth-proxy.js                 # Cloudflare Worker for OAuth code→token exchange
.github/workflows/deploy.yml     # CI/CD: build + deploy to GitHub Pages
.env.example                     # Required environment variables
```

## Build & Dev

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # TypeScript check (tsc) + Vite production build
npm run preview      # Preview production build locally
```

## Deployment

- Auto-deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`
- Requires `VITE_GITHUB_CLIENT_ID` and `VITE_TOKEN_PROXY_URL` as GitHub Actions repository secrets
- The Cloudflare Worker (`workers/oauth-proxy.js`) must be deployed separately via `wrangler deploy`

## Coding Conventions

- Functional React components with TypeScript
- Prefer named exports for hooks/contexts, default exports for components/pages
- Use `useCallback` for functions passed to context providers
- Tailwind utility classes only (no custom CSS except base layer)
- Chinese (zh-TW) used for user-facing UI text; English for code and comments
- Use `lucide-react` for all icons
- All GitHub API calls go through `src/lib/github.ts`; no direct Octokit usage in components
