import { STORAGE_KEYS } from '../config';

const MAX = 12;

export interface RecentItem {
  number: number;
  title: string;
  at: number;
}

export function getRecentlyViewed(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT);
    if (!raw) return [];
    const arr = JSON.parse(raw) as RecentItem[];
    return Array.isArray(arr) ? arr.filter((r) => typeof r?.number === 'number') : [];
  } catch {
    return [];
  }
}

/** Record a viewed prompt (most-recent first, deduped, capped). */
export function addRecentlyViewed(item: { number: number; title: string }): void {
  try {
    const list = getRecentlyViewed().filter((r) => r.number !== item.number);
    list.unshift({ number: item.number, title: item.title, at: Date.now() });
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore quota / disabled storage */
  }
}
