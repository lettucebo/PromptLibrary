import { Octokit } from '@octokit/rest';
import { config } from '../config';
import type { Label, ParsedLabel, Prompt, PromptComment } from '../types';

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/** Register the global 401 handler used by the auth context. */
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  onUnauthorized = fn;
}

const cache = new Map<string, Octokit>();

/** Get a memoized Octokit. Pass a token to authenticate; omit for unauthenticated requests. */
export function getOctokit(token?: string): Octokit {
  const key = token ?? '__anon__';
  let client = cache.get(key);
  if (client) return client;
  client = new Octokit(token ? { auth: token } : {});
  client.hook.error('request', (error) => {
    const status = (error as { status?: number }).status;
    if (status === 401 && token && onUnauthorized) {
      onUnauthorized();
    }
    throw error;
  });
  cache.set(key, client);
  return client;
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

export async function fetchPrompts(token?: string): Promise<Prompt[]> {
  const octokit = getOctokit(token);
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
          typeof l === 'string' ? l : l.name ?? '',
        );
        return !labelNames.includes(config.metaLabel) && !labelNames.includes(config.archivedLabel);
      });

    prompts.push(...filtered.map(mapIssueToPrompt));

    if (data.length < 100) break;
    page++;
  }

  return prompts;
}

export type { PromptSort, SortOrder } from '../types';

export interface SearchPromptsParams {
  text?: string;
  filters?: Partial<Record<keyof typeof config.labelPrefixes, string[]>>;
  sort?: import('../types').PromptSort;
  order?: import('../types').SortOrder;
  page?: number;
  perPage?: number;
  token?: string;
}

export interface SearchPromptsResult {
  items: Prompt[];
  totalCount: number;
  incompleteResults: boolean;
  hasNextPage: boolean;
  page: number;
}

/** GitHub Search API hard cap on reachable results. */
const SEARCH_RESULT_CAP = 1000;

/**
 * Server-side search/sort/pagination over prompt issues via the GitHub Search API.
 * Excludes `meta` / `archived` and pull requests. Note: multiple label filters are
 * ANDed by the Search API (must match all selected labels).
 */
export async function searchPrompts(params: SearchPromptsParams = {}): Promise<SearchPromptsResult> {
  const { text, filters, sort = 'created', order = 'desc', page = 1, perPage = 30, token } = params;
  const octokit = getOctokit(token);

  const qParts: string[] = [
    `repo:${config.owner}/${config.repo}`,
    'is:issue',
    'is:open',
    `-label:${config.metaLabel}`,
    `-label:${config.archivedLabel}`,
  ];

  if (filters) {
    for (const [category, values] of Object.entries(filters)) {
      const prefix = config.labelPrefixes[category as keyof typeof config.labelPrefixes];
      if (!prefix || !values) continue;
      for (const value of values) {
        qParts.push(`label:"${prefix}${value}"`);
      }
    }
  }

  // Wrap in quotes to prevent qualifier injection (e.g. "repo:other/owner").
  // Strip embedded quotes so the phrase stays valid.
  const trimmed = (text ?? '').trim().replace(/"/g, '');
  if (trimmed) qParts.push(`"${trimmed}"`);

  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q: qParts.join(' '),
    sort,
    order,
    per_page: perPage,
    page,
  });

  const items = data.items
    .filter((issue) => !issue.pull_request)
    .map((issue) => mapIssueToPrompt(issue as Parameters<typeof mapIssueToPrompt>[0]));

  const loaded = (page - 1) * perPage + data.items.length;
  const reachable = Math.min(data.total_count, SEARCH_RESULT_CAP);
  const hasNextPage = loaded < reachable && data.items.length === perPage;

  return {
    items,
    totalCount: data.total_count,
    incompleteResults: data.incomplete_results,
    hasNextPage,
    page,
  };
}

export async function fetchPrompt(issueNumber: number, token?: string): Promise<Prompt> {
  const { data } = await getOctokit(token).rest.issues.get({
    owner: config.owner,
    repo: config.repo,
    issue_number: issueNumber,
  });

  return mapIssueToPrompt(data);
}

export async function fetchPromptComments(
  issueNumber: number,
  token?: string,
): Promise<PromptComment[]> {
  const { data } = await getOctokit(token).rest.issues.listComments({
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

export async function fetchLabels(token?: string): Promise<Label[]> {
  const { data } = await getOctokit(token).rest.issues.listLabelsForRepo({
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

// =====================================================================
// Mutations (require token)
// =====================================================================

export async function createPrompt(
  token: string,
  input: { title: string; body: string; labels: string[] },
): Promise<Prompt> {
  const { data } = await getOctokit(token).rest.issues.create({
    owner: config.owner,
    repo: config.repo,
    title: input.title,
    body: input.body,
    labels: input.labels,
  });
  return mapIssueToPrompt(data);
}

export async function updatePrompt(
  token: string,
  issueNumber: number,
  input: { title?: string; body?: string; labels?: string[] },
): Promise<Prompt> {
  const { data } = await getOctokit(token).rest.issues.update({
    owner: config.owner,
    repo: config.repo,
    issue_number: issueNumber,
    ...input,
  });
  return mapIssueToPrompt(data);
}

export async function archivePrompt(token: string, issueNumber: number): Promise<void> {
  const octokit = getOctokit(token);
  await ensureArchivedLabel(token);
  await octokit.rest.issues.addLabels({
    owner: config.owner,
    repo: config.repo,
    issue_number: issueNumber,
    labels: [config.archivedLabel],
  });
  await octokit.rest.issues.update({
    owner: config.owner,
    repo: config.repo,
    issue_number: issueNumber,
    state: 'closed',
    state_reason: 'not_planned',
  });
}

export async function restorePrompt(token: string, issueNumber: number): Promise<void> {
  const octokit = getOctokit(token);
  try {
    await octokit.rest.issues.removeLabel({
      owner: config.owner,
      repo: config.repo,
      issue_number: issueNumber,
      name: config.archivedLabel,
    });
  } catch (err) {
    // 404 means label wasn't applied; ignore
    if ((err as { status?: number }).status !== 404) throw err;
  }
  await octokit.rest.issues.update({
    owner: config.owner,
    repo: config.repo,
    issue_number: issueNumber,
    state: 'open',
  });
}

export async function ensureArchivedLabel(token: string): Promise<void> {
  const octokit = getOctokit(token);
  try {
    await octokit.rest.issues.getLabel({
      owner: config.owner,
      repo: config.repo,
      name: config.archivedLabel,
    });
  } catch (err) {
    if ((err as { status?: number }).status === 404) {
      await octokit.rest.issues.createLabel({
        owner: config.owner,
        repo: config.repo,
        name: config.archivedLabel,
        color: '6b7280',
        description: 'Soft-deleted prompt; hidden from the library list.',
      });
    } else {
      throw err;
    }
  }
}

// Comments
export async function createComment(
  token: string,
  issueNumber: number,
  body: string,
): Promise<PromptComment> {
  const { data } = await getOctokit(token).rest.issues.createComment({
    owner: config.owner,
    repo: config.repo,
    issue_number: issueNumber,
    body,
  });
  return {
    id: data.id,
    body: data.body ?? '',
    created_at: data.created_at,
    updated_at: data.updated_at,
    user: data.user,
  };
}

export async function updateComment(
  token: string,
  commentId: number,
  body: string,
): Promise<PromptComment> {
  const { data } = await getOctokit(token).rest.issues.updateComment({
    owner: config.owner,
    repo: config.repo,
    comment_id: commentId,
    body,
  });
  return {
    id: data.id,
    body: data.body ?? '',
    created_at: data.created_at,
    updated_at: data.updated_at,
    user: data.user,
  };
}

export async function deleteComment(token: string, commentId: number): Promise<void> {
  await getOctokit(token).rest.issues.deleteComment({
    owner: config.owner,
    repo: config.repo,
    comment_id: commentId,
  });
}

// Labels CRUD
export async function createLabel(
  token: string,
  input: { name: string; color: string; description?: string },
): Promise<Label> {
  const { data } = await getOctokit(token).rest.issues.createLabel({
    owner: config.owner,
    repo: config.repo,
    ...input,
  });
  return {
    id: data.id,
    name: data.name,
    color: data.color,
    description: data.description ?? null,
  };
}

export async function updateLabel(
  token: string,
  currentName: string,
  input: { newName?: string; color?: string; description?: string },
): Promise<Label> {
  const { data } = await getOctokit(token).rest.issues.updateLabel({
    owner: config.owner,
    repo: config.repo,
    name: currentName,
    new_name: input.newName,
    color: input.color,
    description: input.description,
  });
  return {
    id: data.id,
    name: data.name,
    color: data.color,
    description: data.description ?? null,
  };
}

export async function deleteLabel(token: string, name: string): Promise<void> {
  await getOctokit(token).rest.issues.deleteLabel({
    owner: config.owner,
    repo: config.repo,
    name,
  });
}

// Default branch (cached forever via React Query staleTime: Infinity)
export async function getDefaultBranch(token?: string): Promise<string> {
  const { data } = await getOctokit(token).rest.repos.get({
    owner: config.owner,
    repo: config.repo,
  });
  return data.default_branch;
}

// Image upload via Contents API
export async function uploadAttachment(
  token: string,
  branch: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const date = new Date();
  const folder = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const id = crypto.randomUUID().replace(/-/g, '');
  const path = `${config.attachmentsDir}/${folder}/${id}.${ext}`;

  const buf = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buf);

  await getOctokit(token).rest.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path,
    branch,
    message: `chore(attachments): upload ${file.name}`,
    content: base64,
  });

  const url = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${branch}/${path}`;
  return { url, path };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
