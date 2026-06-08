import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Plus, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchPrompts } from '../hooks/usePrompts';
import { useGroupedLabels } from '../hooks/useLabels';
import { useAuth } from '../contexts/AuthContext';
import PromptCard from '../components/PromptCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { errorMessageKey, isRateLimitError } from '../lib/errors';
import type { FilterState, PromptSort, SortOrder } from '../types';

const CATS = ['model', 'type', 'usecase', 'lang', 'difficulty'] as const;
type Cat = (typeof CATS)[number];

type SortKey = 'newest' | 'oldest' | 'updated' | 'versions';
const SORT_MAP: Record<SortKey, { sort: PromptSort; order: SortOrder }> = {
  newest: { sort: 'created', order: 'desc' },
  oldest: { sort: 'created', order: 'asc' },
  updated: { sort: 'updated', order: 'desc' },
  versions: { sort: 'comments', order: 'desc' },
};
const SORT_KEYS: SortKey[] = ['newest', 'oldest', 'updated', 'versions'];

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ---- URL-derived state
  const urlSearch = params.get('q') ?? '';
  const rawSort = params.get('sort');
  const sortKey: SortKey = rawSort && rawSort in SORT_MAP ? (rawSort as SortKey) : 'newest';
  const activeSort = SORT_MAP[sortKey];

  const filters = useMemo<Record<Cat, string[]>>(() => {
    const out = {} as Record<Cat, string[]>;
    for (const c of CATS) {
      const raw = params.get(c);
      out[c] = raw ? raw.split(',').filter(Boolean) : [];
    }
    return out;
  }, [params]);

  // ---- debounced search input -> URL
  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch) next.set('q', debouncedSearch);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, urlSearch, setParams]);

  // ---- query
  const searchArgs = useMemo(
    () => ({ text: debouncedSearch, filters, sort: activeSort.sort, order: activeSort.order }),
    [debouncedSearch, filters, activeSort.sort, activeSort.order],
  );
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchPrompts(searchArgs);

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // ---- handlers
  const toggleFilter = useCallback(
    (category: string, value: string) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        const current = (next.get(category) ?? '').split(',').filter(Boolean);
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        if (updated.length) next.set(category, updated.join(','));
        else next.delete(category);
        return next;
      });
    },
    [setParams],
  );

  const clearFilters = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const c of CATS) next.delete(c);
      return next;
    });
  }, [setParams]);

  const handleSortChange = (key: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key === 'newest') next.delete('sort');
      else next.set('sort', key);
      return next;
    });
  };

  const activeFilterCount = CATS.reduce((sum, c) => sum + filters[c].length, 0);
  const hasCriteria = !!debouncedSearch || activeFilterCount > 0;

  // ---- keyboard shortcuts: "/" focus, Esc clears search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing =
        el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchInput('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filterState: FilterState = { search: debouncedSearch, ...filters };
  const grouped = useGroupedLabels();
  const hasFilterGroups = Object.values(grouped).some((v) => v.length > 0);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <SearchBar value={searchInput} onChange={setSearchInput} inputRef={searchInputRef} />
        </div>

        <label className="sr-only" htmlFor="sort-select">
          {t('home.sortLabel')}
        </label>
        <select
          id="sort-select"
          value={sortKey}
          onChange={(e) => handleSortChange(e.target.value)}
          className="hidden sm:block px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SORT_KEYS.map((k) => (
            <option key={k} value={k}>
              {t(`home.sort.${k}`)}
            </option>
          ))}
        </select>

        {isAuthenticated && (
          <Link
            to="/prompt/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('home.newPrompt')}
          </Link>
        )}
        {hasFilterGroups && (
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors lg:hidden ${
              showFilters || activeFilterCount > 0
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('home.filtersButton')}
            {activeFilterCount > 0 && (
              <span className="bg-white text-indigo-600 rounded-full px-1.5 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Mobile sort */}
      <div className="mb-4 sm:hidden">
        <select
          value={sortKey}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SORT_KEYS.map((k) => (
            <option key={k} value={k}>
              {t(`home.sort.${k}`)}
            </option>
          ))}
        </select>
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">{t('home.activeFilters')}</span>
          {CATS.flatMap((category) =>
            filters[category].map((value) => (
              <button
                key={`${category}:${value}`}
                onClick={() => toggleFilter(category, value)}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60"
              >
                {t(`filter.${category}`, { defaultValue: category })}: {value}
                <X className="h-3 w-3" />
              </button>
            )),
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            {t('home.clearAll')}
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {hasFilterGroups && (
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-56 xl:w-64 flex-shrink-0`}>
            <CategoryFilter filters={filterState} onChange={toggleFilter} />
          </div>
        )}

        <div className={`${showFilters && hasFilterGroups ? 'hidden' : 'block'} lg:block flex-1 min-w-0`}>
          {isLoading && <LoadingSpinner className="py-20" />}

          {isError && (
            <div className="text-center py-20">
              <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="font-medium text-red-500 dark:text-red-400">{t('home.loadFailed')}</p>
              <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                {t(errorMessageKey(error), { defaultValue: t('home.unknownError') })}
              </p>
              {isRateLimitError(error) && (
                <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                  {t('errors.rateLimitedHint')}
                </p>
              )}
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <EmptyState
              title={hasCriteria ? t('empty.noMatching') : t('empty.noPrompts')}
              description={
                hasCriteria
                  ? t('empty.tryAdjusting')
                  : isAuthenticated
                    ? t('empty.createFirstAuthed')
                    : t('empty.createFirst')
              }
              action={
                !hasCriteria && isAuthenticated ? (
                  <Link
                    to="/prompt/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    {t('home.newPrompt')}
                  </Link>
                ) : undefined
              }
            />
          )}

          {!isLoading && !isError && items.length > 0 && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('home.totalResults', { count: totalCount })}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} query={debouncedSearch} />
                ))}
              </div>

              <div ref={sentinelRef} className="h-10" />
              {isFetchingNextPage && <LoadingSpinner className="py-6" />}
              {!hasNextPage && items.length > 6 && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-6">
                  {t('home.endOfResults')}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
