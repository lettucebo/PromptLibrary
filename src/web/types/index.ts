export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface ParsedLabel {
  raw: Label;
  prefix: string | null;
  value: string;
  category: 'model' | 'type' | 'usecase' | 'output' | 'lang' | 'difficulty' | 'other';
}

/** A typed output-example item shown in a prompt's preview gallery. */
export type OutputExample =
  | { type: 'youtube'; url: string; caption?: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'text'; text: string; caption?: string };

export interface Prompt {
  id: number;
  number: number;
  title: string;
  /** Raw issue body (structured; used by the editor). */
  body: string;
  /** Parsed prompt section — the copyable content. */
  promptText: string;
  /** Parsed optional notes/description section (not copied). */
  notes: string;
  /** Parsed typed output examples. */
  outputs: OutputExample[];
  labels: Label[];
  parsedLabels: ParsedLabel[];
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface PromptComment {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
}

export interface FilterState {
  search: string;
  model: string[];
  type: string[];
  usecase: string[];
  output: string[];
  lang: string[];
  difficulty: string[];
}

export type PromptSort = 'created' | 'updated' | 'comments';
export type SortOrder = 'asc' | 'desc';

export type RepoPermission = 'admin' | 'maintain' | 'write' | 'triage' | 'read' | 'none';

export interface AuthUser {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  name: string | null;
}

export interface AuthSession {
  token: string;
  tokenType: string;
  scope: string;
  permission: RepoPermission;
  user: AuthUser;
}

