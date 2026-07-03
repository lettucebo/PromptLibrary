import type { PromptSort, SortOrder } from '../types';

/** UI-facing sort options (mapped to Search API sort/order pairs). */
export type SortKey = 'newest' | 'oldest' | 'updated' | 'versions';

export const SORT_MAP: Record<SortKey, { sort: PromptSort; order: SortOrder }> = {
  newest: { sort: 'created', order: 'desc' },
  oldest: { sort: 'created', order: 'asc' },
  updated: { sort: 'updated', order: 'desc' },
  versions: { sort: 'comments', order: 'desc' },
};

export const SORT_KEYS: SortKey[] = ['newest', 'oldest', 'updated', 'versions'];

export function sortKeyFromParam(raw: string | null): SortKey {
  return raw && raw in SORT_MAP ? (raw as SortKey) : 'newest';
}
