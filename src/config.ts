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
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'pl_github_token',
  USER: 'pl_github_user',
  THEME: 'pl_theme',
} as const;
