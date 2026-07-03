import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  Search,
  X,
  LayoutGrid,
  List,
  Dices,
  Plus,
  Sun,
  Moon,
  LogIn,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { searchPrompts } from '../lib/github';
import { errorMessageKey } from '../lib/errors';
import { useListView } from '../hooks/useListView';
import { SORT_KEYS, sortKeyFromParam } from '../lib/promptSort';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';

interface CommandBarProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onOpenDrawer: () => void;
}

export default function CommandBar({ darkMode, onToggleDark, onOpenDrawer }: CommandBarProps) {
  const { t } = useTranslation();
  const { isAuthenticated, session, startLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const onHome = location.pathname === '/';
  const view = onHome ? params.get('view') : null;
  const browse = onHome && !view;

  const [view_, setListView] = useListView();
  const [loggingIn, setLoggingIn] = useState(false);
  const [surprising, setSurprising] = useState(false);

  // ---- global search (debounced -> URL; navigates home when elsewhere) ----
  const urlQ = onHome ? params.get('q') ?? '' : '';
  const [input, setInput] = useState(urlQ);
  useEffect(() => {
    setInput(urlQ);
  }, [urlQ]);

  const [debounced, setDebounced] = useState(input);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(input), 300);
    return () => window.clearTimeout(id);
  }, [input]);

  const prevDebounced = useRef(debounced);
  useEffect(() => {
    const changed = debounced !== prevDebounced.current;
    prevDebounced.current = debounced;
    if (onHome) {
      if (debounced === (params.get('q') ?? '')) return;
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (debounced) {
            next.set('q', debounced);
            next.delete('view');
          } else {
            next.delete('q');
          }
          return next;
        },
        { replace: true },
      );
    } else if (debounced && changed) {
      // Only navigate when the user actually typed a new query off-home — not
      // when leaving home (route transition) while a stale query is present.
      navigate(`/?q=${encodeURIComponent(debounced)}`);
    }
  }, [debounced, onHome, params, setParams, navigate]);

  // ---- "/" focuses search, Esc clears when focused ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setInput('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogin = () => {
    setLoggingIn(true);
    startLogin();
  };

  const handleSort = (key: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key === 'newest') next.delete('sort');
      else next.set('sort', key);
      return next;
    });
  };

  const handleSurprise = async () => {
    if (surprising) return;
    setSurprising(true);
    try {
      const first = await searchPrompts({ perPage: 1, token: session?.token });
      const total = Math.min(first.totalCount, 1000);
      if (total <= 0) return;
      const idx = Math.floor(Math.random() * total);
      const res = idx === 0 ? first : await searchPrompts({ perPage: 1, page: idx + 1, token: session?.token });
      const item = res.items[0] ?? first.items[0];
      if (item) navigate(`/prompt/${item.number}`);
    } catch (e) {
      toast.error(errorMessageKey(e));
    } finally {
      setSurprising(false);
    }
  };

  const sortKey = sortKeyFromParam(params.get('sort'));

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page/85 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label={t('nav.openMenu')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-content-soft hover:bg-subtle lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative min-w-0 flex-1 sm:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-faint" />
          <input
            ref={searchRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('command.searchPlaceholder')}
            aria-label={t('command.searchPlaceholder')}
            className="w-full rounded-xl border border-line bg-card py-2.5 pl-10 pr-9 text-sm text-content placeholder-content-faint focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              aria-label={t('common.close')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-faint hover:text-content-soft"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {browse && (
          <select
            value={sortKey}
            onChange={(e) => handleSort(e.target.value)}
            aria-label={t('home.sortLabel')}
            className="hidden shrink-0 rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-content-soft focus:outline-none focus:ring-2 focus:ring-primary md:block"
          >
            {SORT_KEYS.map((k) => (
              <option key={k} value={k}>
                {t(`home.sort.${k}`)}
              </option>
            ))}
          </select>
        )}

        {onHome && (
          <div className="hidden shrink-0 items-center gap-0.5 rounded-lg bg-subtle p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => setListView('grid')}
              aria-pressed={view_ === 'grid'}
              title={t('command.gridView')}
              aria-label={t('command.gridView')}
              className={`grid h-8 w-8 place-items-center rounded-md ${view_ === 'grid' ? 'bg-card text-content shadow-sm' : 'text-content-soft hover:text-content'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setListView('list')}
              aria-pressed={view_ === 'list'}
              title={t('command.listView')}
              aria-label={t('command.listView')}
              className={`grid h-8 w-8 place-items-center rounded-md ${view_ === 'list' ? 'bg-card text-content shadow-sm' : 'text-content-soft hover:text-content'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        )}

        {browse && (
          <button
            type="button"
            onClick={() => void handleSurprise()}
            disabled={surprising}
            title={t('home.surprise')}
            aria-label={t('home.surprise')}
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-content-soft hover:bg-subtle disabled:opacity-50 sm:grid"
          >
            <Dices className="h-4 w-4" />
          </button>
        )}

        {onHome && isAuthenticated && (
          <Link
            to="/prompt/new"
            className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-on-primary hover:bg-primary-dark sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">{t('nav.newPrompt')}</span>
          </Link>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={onToggleDark}
            title={darkMode ? t('nav.lightMode') : t('nav.darkMode')}
            aria-label={darkMode ? t('nav.lightMode') : t('nav.darkMode')}
            className="grid h-9 w-9 place-items-center rounded-lg text-content-soft hover:bg-subtle"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              disabled={loggingIn}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-dark disabled:opacity-70"
            >
              {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              <span className="hidden sm:inline">{loggingIn ? t('common.loading') : t('nav.login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
