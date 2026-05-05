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
  category: 'model' | 'type' | 'usecase' | 'lang' | 'difficulty' | 'other';
}

export interface Prompt {
  id: number;
  number: number;
  title: string;
  body: string;
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
  lang: string[];
  difficulty: string[];
}
