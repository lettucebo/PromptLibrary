import { useSyncExternalStore } from 'react';
import { getFavorites, isFavorite, subscribeFavorites } from '../lib/collections';
import type { PromptSnapshot } from '../lib/collections';

/** Reactive list of favorited prompt snapshots (localStorage-backed). */
export function useFavorites(): PromptSnapshot[] {
  return useSyncExternalStore(subscribeFavorites, getFavorites, getFavorites);
}

/** Reactive "is this prompt favorited?" flag. */
export function useIsFavorite(n: number): boolean {
  return useSyncExternalStore(
    subscribeFavorites,
    () => isFavorite(n),
    () => false,
  );
}
