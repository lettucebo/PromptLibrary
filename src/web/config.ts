export const config = {
  owner: 'lettucebo',
  repo: 'PromptLibrary',
  labelPrefixes: {
    model: 'model:',
    type: 'type:',
    usecase: 'usecase:',
    lang: 'lang:',
    difficulty: 'difficulty:',
  },
  /** Public OAuth client_id; safe to expose in bundle. */
  githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID ?? '',
  /** Cloudflare Worker base URL (no trailing slash). */
  workerUrl:
    (import.meta.env.VITE_WORKER_URL ?? '').replace(/\/$/, '') ||
    'http://localhost:8787',
  /** GitHub Pages site URL (used as OAuth redirect_uri). */
  siteUrl:
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname.split('#')[0]}`
      : '',
  /** Folder under repo where uploaded images are committed. */
  attachmentsDir: '.attachments',
  /** Label name used to mark soft-deleted prompts. */
  archivedLabel: 'archived',
  /** Label name to exclude from the public list. */
  metaLabel: 'meta',
} as const;

export const STORAGE_KEYS = {
  THEME: 'pl_theme',
  LANG: 'pl_lang',
  GH_TOKEN: 'pl_gh_token',
  GH_USER: 'pl_gh_user',
  /** sessionStorage keys */
  OAUTH_STATE: 'pl_oauth_state',
  OAUTH_RETURN_TO: 'pl_oauth_return_to',
} as const;

