import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { X, Plus, AlertTriangle, Play, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchPrompts } from '../hooks/usePrompts';
import { useFavorites } from '../hooks/useFavorites';
import { useListView } from '../hooks/useListView';
import { useAuth } from '../contexts/AuthContext';
import { getRecentlyViewed } from '../lib/recentlyViewed';
import {
  promptToCardItem,
  snapshotToCardItem,
  cardItemToSnapshot,
  type PromptCardItem,
} from '../lib/promptCardItem';
import { sortKeyFromParam, SORT_MAP } from '../lib/promptSort';
import PromptCard from '../components/PromptCard';
import FavoriteButton from '../components/FavoriteButton';
import LabelBadge from '../components/LabelBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { errorMessageKey, isRateLimitError } from '../lib/errors';

const CATS = ['output', 'model', 'type', 'usecase', 'lang', 'difficulty'] as const;
type Cat = (typeof CATS)[number];

function FeaturedLead({ item }: { item: PromptCardItem }) {
  const { t } = useTranslation();
  const snapshot = cardItemToSnapshot(item);
  const isVideo = item.thumb?.kind === 'video';
  return (
    <article className="group relative flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-line md:col-span-2">
      {item.thumb ? (
        <>
          <img
            src={item.thumb.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-subtle" />
      )}
      {isVideo && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-black/55 text-white">
            <Play className="h-6 w-6" fill="currentColor" />
          </span>
        </div>
      )}
      <div className={`relative z-[1] mt-auto p-6 ${item.thumb ? 'text-white' : ''}`}>
        <span className="mb-2 inline-flex items-center rounded-full bg-primary px-2 py-1 text-xs font-medium text-on-primary">
          {t('home.featured')}
        </span>
        {item.parsedLabels.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {item.thumb
              ? item.parsedLabels.slice(0, 3).map((l) => (
                  <span
                    key={l.raw.id}
                    className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white"
                  >
                    {l.prefix}
                    {l.value}
                  </span>
                ))
              : item.parsedLabels.slice(0, 3).map((l) => <LabelBadge key={l.raw.id} label={l} />)}
          </div>
        )}
        <h3 className={`font-title text-2xl font-bold ${item.thumb ? '' : 'text-content'}`}>{item.title}</h3>
        {item.preview && (
          <p className={`mt-1 line-clamp-2 max-w-xl text-sm ${item.thumb ? 'text-white/80' : 'text-content-soft'}`}>
            {item.preview}
          </p>
        )}
      </div>
      <Link to={`/prompt/${item.number}`} aria-label={item.title} className="absolute inset-0 z-[2]" />
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton snapshot={snapshot} stopPropagation className="bg-black/30 text-white hover:bg-black/40" />
      </div>
    </article>
  );
}

function FeaturedMini({ item }: { item: PromptCardItem }) {
  const isVideo = item.thumb?.kind === 'video';
  return (
    <article className="group relative flex gap-3 rounded-xl border border-line bg-card p-3 transition-colors hover:border-primary">
      {item.thumb ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-subtle">
          <img src={item.thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
          {isVideo && (
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              <Play className="h-4 w-4 text-white drop-shadow" fill="currentColor" />
            </span>
          )}
        </div>
      ) : (
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-subtle text-content-faint">
          <FileText className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {item.parsedLabels.length > 0 && (
          <p className="truncate font-mono text-[11px] text-content-faint">
            {item.parsedLabels
              .slice(0, 2)
              .map((l) => `${l.prefix ?? ''}${l.value}`)
              .join(' · ')}
          </p>
        )}
        <h4 className="line-clamp-1 text-sm font-semibold text-content group-hover:text-primary">{item.title}</h4>
        {item.preview && <p className="mt-0.5 line-clamp-2 text-xs text-content-soft">{item.preview}</p>}
      </div>
      <Link to={`/prompt/${item.number}`} aria-label={item.title} className="absolute inset-0" />
    </article>
  );
}

function FeaturedBand({ items }: { items: PromptCardItem[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  const [lead, ...rest] = items;
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-title text-lg font-bold text-content">{t('home.featured')}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FeaturedLead item={lead} />
        <div className="flex flex-col gap-4">
          {rest.slice(0, 2).map((it) => (
            <FeaturedMini key={it.number} item={it} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const [listView] = useListView();

  const q = params.get('q') ?? '';
  const view = params.get('view'); // null | 'favorites' | 'recent'
  const sortKey = sortKeyFromParam(params.get('sort'));
  const activeSort = SORT_MAP[sortKey];
  const isBrowse = !view;

  const filters = useMemo<Record<Cat, string[]>>(() => {
    const out = {} as Record<Cat, string[]>;
    for (const c of CATS) {
      const raw = params.get(c);
      // Sort values so query keys are stable regardless of click order.
      out[c] = raw ? raw.split(',').filter(Boolean).sort() : [];
    }
    return out;
  }, [params]);

  const searchArgs = useMemo(
    () => ({ text: q, filters, sort: activeSort.sort, order: activeSort.order }),
    [q, filters, activeSort.sort, activeSort.order],
  );
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchPrompts(searchArgs, isBrowse);

  const favorites = useFavorites();
  const recent = useMemo(() => getRecentlyViewed(), [view]);

  const activeFilterCount = CATS.reduce((sum, c) => sum + filters[c].length, 0);
  const hasCriteria = !!q || activeFilterCount > 0;

  const browseItems = useMemo<PromptCardItem[]>(
    () => (data?.pages.flatMap((p) => p.items) ?? []).map(promptToCardItem),
    [data],
  );
  const items: PromptCardItem[] = isBrowse
    ? browseItems
    : view === 'favorites'
      ? favorites.map(snapshotToCardItem)
      : recent.map(snapshotToCardItem);

  const totalCount = isBrowse ? data?.pages[0]?.totalCount ?? 0 : items.length;

  const removeFilter = useCallback(
    (category: string, value: string) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        const cur = (next.get(category) ?? '').split(',').filter(Boolean);
        const upd = cur.filter((v) => v !== value);
        if (upd.length) next.set(category, upd.join(','));
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

  // Infinite scroll (browse view only).
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isBrowse) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isBrowse, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const showFeatured = isBrowse && !hasCriteria && listView === 'grid' && items.length >= 4;
  const featured = showFeatured ? items.slice(0, 3) : [];
  const gridItems = showFeatured ? items.slice(3) : items;

  const heading = view === 'favorites' ? t('view.favorites') : view === 'recent' ? t('view.recent') : null;

  return (
    <div>
      {heading && <h1 className="mb-4 font-title text-2xl font-bold text-content">{heading}</h1>}

      {activeFilterCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-content-soft">{t('home.activeFilters')}</span>
          {CATS.flatMap((category) =>
            filters[category].map((value) => (
              <button
                key={`${category}:${value}`}
                onClick={() => removeFilter(category, value)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
              >
                {t(`filter.${category}`, { defaultValue: category })}: {value}
                <X className="h-3 w-3" />
              </button>
            )),
          )}
          <button onClick={clearFilters} className="text-xs text-content-soft underline hover:text-content">
            {t('home.clearAll')}
          </button>
        </div>
      )}

      {isBrowse && isLoading && <LoadingSpinner className="py-20" />}

      {isBrowse && isError && (
        <div className="py-20 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-error" />
          <p className="font-medium text-error">{t('home.loadFailed')}</p>
          <p className="mt-1 text-sm text-content-soft">
            {t(errorMessageKey(error), { defaultValue: t('home.unknownError') })}
          </p>
          {isRateLimitError(error) && (
            <p className="mt-1 text-sm text-content-soft">{t('errors.rateLimitedHint')}</p>
          )}
        </div>
      )}

      {!isBrowse && view === 'favorites' && items.length === 0 && (
        <EmptyState title={t('empty.noFavorites')} description={t('empty.noFavoritesDesc')} />
      )}
      {!isBrowse && view === 'recent' && items.length === 0 && (
        <EmptyState title={t('empty.noRecent')} description={t('empty.noRecentDesc')} />
      )}

      {isBrowse && !isLoading && !isError && items.length === 0 && (
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" />
                {t('nav.newPrompt')}
              </Link>
            ) : undefined
          }
        />
      )}

      {items.length > 0 && (
        <>
          {showFeatured && <FeaturedBand items={featured} />}

          <p className="mb-4 text-sm text-content-soft">{t('home.totalResults', { count: totalCount })}</p>

          {listView === 'list' ? (
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
              {items.map((it) => (
                <PromptCard key={it.number} item={it} query={q} variant="list" enablePrefetch={isBrowse} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gridItems.map((it) => (
                <PromptCard key={it.number} item={it} query={q} variant="grid" enablePrefetch={isBrowse} />
              ))}
            </div>
          )}

          {isBrowse && (
            <>
              <div ref={sentinelRef} className="h-10" />
              {isFetchingNextPage && <LoadingSpinner className="py-6" />}
              {!hasNextPage && items.length > 6 && (
                <p className="py-6 text-center text-xs text-content-faint">{t('home.endOfResults')}</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
