import { Octokit } from '@octokit/rest';
import { config } from '../config';
import type { Label, ParsedLabel, Prompt, PromptComment, GitHubUser } from '../types';

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

export async function verifyToken(token: string): Promise<GitHubUser> {
  const octokit = createOctokit(token);
  const { data } = await octokit.rest.users.getAuthenticated();
  return {
    login: data.login,
    name: data.name,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
  };
}

export function parseLabel(label: Label): ParsedLabel {
  const prefixes = config.labelPrefixes;
  for (const [category, prefix] of Object.entries(prefixes)) {
    if (label.name.startsWith(prefix)) {
      return {
        raw: label,
        prefix,
        value: label.name.slice(prefix.length),
        category: category as ParsedLabel['category'],
      };
    }
  }
  return {
    raw: label,
    prefix: null,
    value: label.name,
    category: 'other',
  };
}

function mapIssueToPrompt(issue: {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  labels: Array<{ id?: number; name?: string; color?: string | null; description?: string | null } | string>;
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: { login: string; avatar_url: string } | null;
}): Prompt {
  const labels: Label[] = (issue.labels || [])
    .filter((l): l is { id?: number; name?: string; color?: string | null; description?: string | null } => typeof l === 'object')
    .map((l) => ({
      id: l.id ?? 0,
      name: l.name ?? '',
      color: l.color ?? '',
      description: l.description ?? null,
    }));

  const parsedLabels = labels.map(parseLabel);

  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    labels,
    parsedLabels,
    comments: issue.comments,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    html_url: issue.html_url,
    user: issue.user,
  };
}

export async function fetchPrompts(token: string): Promise<Prompt[]> {
  const octokit = createOctokit(token);
  const prompts: Prompt[] = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.rest.issues.listForRepo({
      owner: config.owner,
      repo: config.repo,
      state: 'open',
      per_page: 100,
      page,
    });

    if (data.length === 0) break;

    const filtered = data
      .filter((issue) => !issue.pull_request)
      .filter((issue) => {
        const labelNames = (issue.labels || []).map((l) =>
          typeof l === 'string' ? l : l.name ?? ''
        );
        return !labelNames.includes('meta');
      });

    prompts.push(...filtered.map(mapIssueToPrompt));

    if (data.length < 100) break;
    page++;
  }

  return prompts;
}

export async function fetchPrompt(token: string, issueNumber: number): Promise<Prompt> {
  const octokit = createOctokit(token);
  const { data } = await octokit.rest.issues.get({
    owner: config.owner,
    repo: config.repo,
    issue_number: issueNumber,
  });

  return mapIssueToPrompt(data);
}

export async function fetchPromptComments(
  token: string,
  issueNumber: number
): Promise<PromptComment[]> {
  const octokit = createOctokit(token);
  const { data } = await octokit.rest.issues.listComments({
    owner: config.owner,
    repo: config.repo,
    issue_number: issueNumber,
    per_page: 100,
  });

  return data.map((c) => ({
    id: c.id,
    body: c.body ?? '',
    created_at: c.created_at,
    updated_at: c.updated_at,
    user: c.user,
  }));
}

export async function fetchLabels(token: string): Promise<Label[]> {
  const octokit = createOctokit(token);
  const { data } = await octokit.rest.issues.listLabelsForRepo({
    owner: config.owner,
    repo: config.repo,
    per_page: 100,
  });

  return data.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    description: l.description ?? null,
  }));
}
