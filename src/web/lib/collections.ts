import { STORAGE_KEYS } from '../config';
import type { Label, Prompt } from '../types';
import type { Thumb } from './promptThumbnail';
import { deriveThumb, hasVideoOutput } from './promptThumbnail';
import { previewText } from './promptPreview';

/**
 * A lightweight, self-contained snapshot of a prompt used to render cards in the
 * "favorites" / "recently viewed" collection views WITHOUT any GitHub API call.
 * Everything a card needs is stored in localStorage so these views render fully
 * offline (avoiding the 60 req/hr anonymous rate limit).
 */
export interface PromptSnapshot {
  number: number;
  title: string;
  labels: Label[];
  preview: string;
  thumb: Thumb | null;
  hasVideo: boolean;
  comments: number;
  created_at: string;
  /** When this snapshot was saved (favorite added / last viewed). */
  at: number;
}

/** Favorites are localStorage-only; keep a generous cap. */
const FAV_MAX = 60;

export function snapshotFromPrompt(p: Prompt): PromptSnapshot {
  return {
    number: p.number,
    title: p.title,
    labels: p.labels,
    preview: previewText(p.promptText || ''),
    thumb: deriveThumb(p.outputs),
    hasVideo: hasVideoOutput(p.outputs),
    comments: p.comments,
    created_at: p.created_at,
    at: Date.now(),
  };
}

function read(key: string): PromptSnapshot[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((r) => r && typeof r.number === 'number') : [];
  } catch {
    return [];
  }
}

function write(key: string, list: PromptSnapshot[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore quota / disabled storage */
  }
}

// ---- Favorites store (cached for useSyncExternalStore stability) ----

const listeners = new Set<() => void>();
let favCache: PromptSnapshot[] | null = null;

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribeFavorites(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Returns a cached, referentially-stable array (safe for useSyncExternalStore). */
export function getFavorites(): PromptSnapshot[] {
  if (!favCache) favCache = read(STORAGE_KEYS.FAVORITES);
  return favCache;
}

export function isFavorite(n: number): boolean {
  return getFavorites().some((f) => f.number === n);
}

export function toggleFavorite(snap: PromptSnapshot): boolean {
  const list = getFavorites();
  const exists = list.some((f) => f.number === snap.number);
  favCache = exists
    ? list.filter((f) => f.number !== snap.number)
    : [{ ...snap, at: Date.now() }, ...list].slice(0, FAV_MAX);
  write(STORAGE_KEYS.FAVORITES, favCache);
  emit();
  return !exists;
}

export function removeFavorite(n: number): void {
  favCache = getFavorites().filter((f) => f.number !== n);
  write(STORAGE_KEYS.FAVORITES, favCache);
  emit();
}

// Cross-tab sync: invalidate the cache when another tab writes favorites.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.FAVORITES) {
      favCache = null;
      emit();
    }
  });
}
