export const config = {
  owner: 'lettucebo',
  repo: 'PromptLibrary',
  githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID ?? '',
  tokenProxyUrl: import.meta.env.VITE_TOKEN_PROXY_URL ?? '',
  oauthRedirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI ?? `${window.location.origin}${import.meta.env.BASE_URL}`,
  labelPrefixes: {
    model: 'model:',
    type: 'type:',
    usecase: 'usecase:',
    lang: 'lang:',
    difficulty: 'difficulty:',
  },
};

export const STORAGE_KEYS = {
  TOKEN: 'pl_github_token',
  USER: 'pl_github_user',
  THEME: 'pl_theme',
  OAUTH_STATE: 'pl_oauth_state',
} as const;
