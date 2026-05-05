# Prompt Library

A curated library of AI prompts, powered by GitHub Issues and built with React + Vite.

🌐 **Live Site**: [https://lettucebo.github.io/PromptLibrary/](https://lettucebo.github.io/PromptLibrary/)

## Features

- 🔍 **Search & Filter** — Full-text search across prompt titles and content, with multi-category filters (model, type, use case, language, difficulty)
- 🏷️ **Label-based taxonomy** — Prompts are tagged via GitHub Issue labels using structured prefixes (`model:`, `type:`, `usecase:`, `lang:`, `difficulty:`)
- 📝 **Markdown rendering** — Prompt content rendered as formatted markdown with GFM support
- 📋 **One-click copy** — Copy prompt text to clipboard instantly
- 🔄 **Version history** — Issue comments serve as versioned iterations of each prompt
- 🌙 **Dark mode** — System-aware dark/light theme with manual toggle
- 🔐 **GitHub OAuth** — Authenticate via GitHub OAuth for a seamless login experience

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS 3 | Styling |
| React Router v6 | Client-side routing (HashRouter for GitHub Pages) |
| @tanstack/react-query | Data fetching & caching |
| @octokit/rest | GitHub API client |
| react-markdown + remark-gfm | Markdown rendering |
| lucide-react | Icons |
| Cloudflare Worker | OAuth token exchange proxy |

## How It Works

Prompts are stored as **GitHub Issues** in this repository. Each issue represents a prompt:

- **Title** → Prompt name
- **Body** → Main prompt content (Markdown)
- **Labels** → Categorization using prefixed labels:
  - `model:gpt-4`, `model:claude-3` → AI model
  - `type:system`, `type:user` → Prompt type
  - `usecase:coding`, `usecase:writing` → Use case
  - `lang:en`, `lang:zh-TW` → Language
  - `difficulty:beginner`, `difficulty:advanced` → Difficulty
- **Comments** → Version history (each comment = a new version)

Issues with the `meta` label are excluded from the library.

## Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: `Prompt Library`
   - **Homepage URL**: `https://lettucebo.github.io/PromptLibrary/`
   - **Authorization callback URL**: `https://lettucebo.github.io/PromptLibrary/`
4. Click **Register application**
5. Note the **Client ID**
6. Generate a **Client Secret** and save it securely

### 2. Deploy the OAuth Token Exchange Proxy (Cloudflare Worker)

Since GitHub Pages is a static site, we need a server-side proxy to securely exchange the OAuth authorization code for an access token (keeping the client secret private).

1. Install [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Create a `wrangler.toml` in the project root:
   ```toml
   name = "prompt-library-oauth-proxy"
   main = "workers/oauth-proxy.js"
   compatibility_date = "2024-01-01"

   [vars]
   ALLOWED_ORIGINS = "https://lettucebo.github.io"
   ```

3. Set secrets:
   ```bash
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```

4. Deploy:
   ```bash
   wrangler deploy
   ```

5. Note the deployed Worker URL (e.g., `https://prompt-library-oauth-proxy.your-subdomain.workers.dev`)

### 3. Configure Environment Variables

Create a `.env` file (or set GitHub Actions secrets for deployment):

```bash
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
VITE_TOKEN_PROXY_URL=https://prompt-library-oauth-proxy.your-subdomain.workers.dev
```

For GitHub Pages deployment, add these as **repository secrets** in GitHub Settings → Secrets → Actions, and update the workflow to pass them during build.

## Local Development

```bash
# Install dependencies
npm install

# Create .env with your OAuth client ID and proxy URL
cp .env.example .env
# Edit .env with your values

# Start dev server
npm run dev

# Build for production
npm run build
```

## Authentication

The site uses GitHub OAuth for authentication:

1. Click **Sign in with GitHub** on the login page
2. You'll be redirected to GitHub to authorize the application
3. After authorization, you'll be redirected back and signed in automatically

The OAuth access token is stored in `localStorage` and only used for GitHub API calls. The client secret is never exposed in the frontend — it is stored securely in the Cloudflare Worker.

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions on every push to `main`.

Make sure the `VITE_GITHUB_CLIENT_ID` and `VITE_TOKEN_PROXY_URL` environment variables are set in the GitHub Actions workflow (via repository secrets or environment variables).

## Adding Prompts

To add a new prompt to the library:

1. Create a new GitHub Issue in this repository
2. Set the title as the prompt name
3. Write the prompt content in the issue body (Markdown supported)
4. Add relevant labels with the appropriate prefixes
5. The prompt will appear in the library automatically

## License

MIT