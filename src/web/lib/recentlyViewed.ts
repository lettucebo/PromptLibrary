import { STORAGE_KEYS } from '../config';
import type { PromptSnapshot } from './collections';

const MAX = 12;

/** @deprecated use PromptSnapshot */
export type RecentItem = PromptSnapshot;

export function getRecentlyViewed(): PromptSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT);
    if (!raw) return [];
    const arr = JSON.parse(raw) as PromptSnapshot[];
    return Array.isArray(arr) ? arr.filter((r) => r && typeof r.number === 'number') : [];
  } catch {
    return [];
  }
}

/** Record a viewed prompt snapshot (most-recent first, deduped, capped). */
export function addRecentlyViewed(snap: PromptSnapshot): void {
  try {
    const list = getRecentlyViewed().filter((r) => r.number !== snap.number);
    list.unshift({ ...snap, at: Date.now() });
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore quota / disabled storage */
  }
}
