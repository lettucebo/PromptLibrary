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
- 🔐 **GitHub PAT auth** — Authenticate with a Personal Access Token for API access

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

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Authentication

The site requires a GitHub Personal Access Token (PAT) to access the GitHub API:

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Create a token with `public_repo` scope (or `repo` for private repos)
3. Enter the token on the login screen

Tokens are stored in `localStorage` and never sent to any server other than GitHub's API.

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions on every push to `main`.

## Adding Prompts

To add a new prompt to the library:

1. Create a new GitHub Issue in this repository
2. Set the title as the prompt name
3. Write the prompt content in the issue body (Markdown supported)
4. Add relevant labels with the appropriate prefixes
5. The prompt will appear in the library automatically

## License

MIT