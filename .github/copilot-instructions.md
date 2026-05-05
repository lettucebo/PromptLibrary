# Copilot Instructions — Prompt Library

## Project Overview

**Prompt Library** is a **pure SPA** (single-page application) running on **GitHub Pages** at `https://lettucebo.github.io/PromptLibrary/`. It is a curated library of AI prompts where each prompt is stored as a GitHub Issue in the `lettucebo/PromptLibrary` repository.

**Zero backend** — no server, no auth, no API keys. Everything runs client-side using unauthenticated GitHub REST API calls.

## Architecture

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 3 with dark mode (`class` strategy)
- **Routing**: `HashRouter` from react-router-dom v6 (GitHub Pages does not support server-side routing)
- **Data Fetching**: `@tanstack/react-query` for caching, `@octokit/rest` for GitHub API (unauthenticated)
- **Icons**: `lucide-react`
- **Markdown**: `react-markdown` + `remark-gfm`
- **Build base**: `base: '/PromptLibrary/'` in `vite.config.ts`

## No Authentication

This site has **no authentication**. It reads from the public GitHub API without a token.

- Unauthenticated API rate limit: 60 requests/hour
- React Query's `staleTime` (5 min for prompts, 10 min for labels) keeps API usage minimal
- Data caching means most navigations don't trigger API calls

### localStorage Keys

- `pl_theme` — `'dark'` or `'light'`

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
  App.tsx                        # Routes (HashRouter)
  config.ts                      # Owner, repo, label prefixes
  index.css                      # Tailwind directives + utilities
  types/index.ts                 # TypeScript interfaces
  lib/github.ts                  # Octokit wrappers (fetchPrompts, fetchLabels, etc.)
  hooks/
    usePrompts.ts                # React Query hooks for prompts and comments
    useLabels.ts                 # React Query hooks for labels
  components/
    Layout.tsx                   # Page shell (Navbar + dark mode + <Outlet>)
    Navbar.tsx                   # Top nav with dark mode toggle
    PromptCard.tsx               # Prompt preview card for the grid
    CategoryFilter.tsx           # Sidebar filter panel (checkboxes by category)
    SearchBar.tsx                # Search input with clear button
    LabelBadge.tsx               # Colored label badge (color by category)
    LoadingSpinner.tsx           # Centered spinner
    EmptyState.tsx               # Empty results placeholder
  pages/
    HomePage.tsx                 # Search + filters + prompt card grid
    PromptDetailPage.tsx         # Full prompt view + copy button + version history
.github/workflows/deploy.yml     # CI/CD: build + deploy to GitHub Pages
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
- No secrets or environment variables required

## Coding Conventions

- Functional React components with TypeScript
- Default exports for components/pages
- Tailwind utility classes only (no custom CSS except base layer)
- Chinese (zh-TW) used for some user-facing UI text; English for code and comments
- Use `lucide-react` for all icons
- All GitHub API calls go through `src/lib/github.ts`; no direct Octokit usage in components
- No authentication — all API calls are unauthenticated (public repo data only)
