import { useCallback, useSyncExternalStore } from 'react';
import { STORAGE_KEYS } from '../config';

export type ListView = 'grid' | 'list';

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function get(): ListView {
  try {
    return localStorage.getItem(STORAGE_KEYS.VIEW) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

/** Persisted grid/list preference for the results list (localStorage `pl_view`). */
export function useListView(): [ListView, (v: ListView) => void] {
  const view = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    get,
    () => 'grid' as ListView,
  );

  const set = useCallback((v: ListView) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, v);
    } catch {
      /* ignore */
    }
    emit();
  }, []);

  return [view, set];
}
