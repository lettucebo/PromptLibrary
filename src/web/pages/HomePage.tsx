import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrompts } from '../hooks/usePrompts';
import { useAuth } from '../contexts/AuthContext';
import PromptCard from '../components/PromptCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { FilterState, Prompt } from '../types';

function matchesFilters(prompt: Prompt, filters: FilterState): boolean {
  const { search, model, type, usecase, lang, difficulty } = filters;

  if (search) {
    const q = search.toLowerCase();
    const inTitle = prompt.title.toLowerCase().includes(q);
    const inBody = prompt.body.toLowerCase().includes(q);
    if (!inTitle && !inBody) return false;
  }

  const checks: Array<[string[], string]> = [
    [model, 'model'],
    [type, 'type'],
    [usecase, 'usecase'],
    [lang, 'lang'],
    [difficulty, 'difficulty'],
  ];

  for (const [selected, category] of checks) {
    if (selected.length === 0) continue;
    const promptValues = prompt.parsedLabels
      .filter((l) => l.category === category)
      .map((l) => l.value);
    if (!selected.some((s) => promptValues.includes(s))) return false;
  }

  return true;
}

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data: prompts = [], isLoading, error } = usePrompts();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    model: [],
    type: [],
    usecase: [],
    lang: [],
    difficulty: [],
  });

  const handleFilterChange = (category: string, value: string) => {
    setFilters((prev) => {
      const current = prev[category as keyof FilterState] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: next };
    });
  };

  const clearFilters = () => {
    setFilters({ search: '', model: [], type: [], usecase: [], lang: [], difficulty: [] });
  };

  const activeFilterCount = Object.entries(filters)
    .filter(([key]) => key !== 'search')
    .reduce((sum, [, arr]) => sum + (arr as string[]).length, 0);

  const filtered = useMemo(() => prompts.filter((p) => matchesFilters(p, filters)), [prompts, filters]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={filters.search}
            onChange={(v) => setFilters((p) => ({ ...p, search: v }))}
          />
        </div>
        {isAuthenticated && (
          <Link
            to="/prompt/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('home.newPrompt')}
          </Link>
        )}
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
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">{t('home.activeFilters')}</span>
          {Object.entries(filters)
            .filter(([key]) => key !== 'search')
            .flatMap(([category, values]) =>
              (values as string[]).map((value) => (
                <button
                  key={`${category}:${value}`}
                  onClick={() => handleFilterChange(category, value)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60"
                >
                  {category}:{value}
                  <X className="h-3 w-3" />
                </button>
              ))
            )}
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
            {t('home.clearAll')}
          </button>
        </div>
      )}

      <div className="flex gap-6">
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-56 xl:w-64 flex-shrink-0`}>
          <CategoryFilter filters={filters} onChange={handleFilterChange} />
        </div>

        <div className={`${showFilters ? 'hidden' : 'block'} lg:block flex-1 min-w-0`}>
          {isLoading && <LoadingSpinner className="py-20" />}

          {error && (
            <div className="text-center py-20 text-red-500 dark:text-red-400">
              <p className="font-medium">{t('home.loadFailed')}</p>
              <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                {error instanceof Error ? error.message : t('home.unknownError')}
              </p>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <EmptyState
              title={prompts.length === 0 ? t('empty.noPrompts') : t('empty.noMatching')}
              description={
                prompts.length === 0
                  ? t('empty.createFirst')
                  : t('empty.tryAdjusting')
              }
            />
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('home.showingResults', { filtered: filtered.length, total: prompts.length, count: prompts.length })}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
