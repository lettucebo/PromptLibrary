import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Compass,
  Star,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CategoryFilter from './CategoryFilter';

interface SidebarProps {
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}

function NavItem({ to, icon: Icon, label, active, collapsed, onNavigate }: NavItemProps) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        collapsed ? 'justify-center' : ''
      } ${active ? 'bg-primary/10 text-primary' : 'text-content-soft hover:bg-subtle hover:text-content'}`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function Sidebar({ drawerOpen, onCloseDrawer, collapsed, onToggleCollapse }: SidebarProps) {
  const { t } = useTranslation();
  const { isAuthenticated, session } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const view = params.get('view');
  const onHome = location.pathname === '/';
  const isBrowse = onHome && !view;
  const isFavorites = onHome && view === 'favorites';
  const isRecent = onHome && view === 'recent';
  const isLabels = location.pathname.startsWith('/admin');

  // Mobile drawer a11y: Esc to close, scroll-lock, focus the close button on
  // open, and restore focus to the trigger on close. Uses a ref for the close
  // callback so unrelated Layout re-renders don't re-run this (which would yank
  // focus). A full focus-trap is intentionally omitted for a simple nav drawer.
  const onCloseRef = useRef(onCloseDrawer);
  useLayoutEffect(() => {
    onCloseRef.current = onCloseDrawer;
  });

  useEffect(() => {
    if (!drawerOpen) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [drawerOpen]);

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label={t('nav.appName')}
        role={drawerOpen ? 'dialog' : undefined}
        aria-modal={drawerOpen ? true : undefined}
        className={`fixed top-0 left-0 z-50 flex h-screen shrink-0 flex-col border-r border-line bg-card transition-[transform,width] duration-200 lg:sticky lg:z-30 lg:visible lg:translate-x-0 ${
          collapsed ? 'w-16' : 'w-72'
        } ${drawerOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
      >
        {/* Brand + collapse / close */}
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Link
            to="/"
            onClick={onCloseDrawer}
            className={`flex items-center gap-2 font-title font-bold text-primary ${collapsed ? 'justify-center' : ''}`}
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{t('nav.appName')}</span>}
          </Link>
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? t('nav.expand') : t('nav.collapse')}
            aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
            className="hidden h-8 w-8 place-items-center rounded-lg text-content-faint hover:bg-subtle lg:grid"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onCloseDrawer}
            aria-label={t('nav.closeMenu')}
            className="grid h-8 w-8 place-items-center rounded-lg text-content-faint hover:bg-subtle lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav + filters (scrollable) */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <NavItem to="/" icon={Compass} label={t('nav.browse')} active={isBrowse} collapsed={collapsed} onNavigate={onCloseDrawer} />
            <NavItem to="/?view=favorites" icon={Star} label={t('nav.favorites')} active={isFavorites} collapsed={collapsed} onNavigate={onCloseDrawer} />
            <NavItem to="/?view=recent" icon={Clock} label={t('nav.recent')} active={isRecent} collapsed={collapsed} onNavigate={onCloseDrawer} />
            {isAuthenticated && (
              <NavItem to="/admin/labels" icon={Tag} label={t('nav.labels')} active={isLabels} collapsed={collapsed} onNavigate={onCloseDrawer} />
            )}
          </div>

          {isBrowse && !collapsed && (
            <div className="mt-6">
              <div className="mb-2 flex items-baseline justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-faint">
                  {t('home.filtersButton')}
                </span>
                <span className="text-[11px] text-content-faint">{t('filter.matchAll')}</span>
              </div>
              <CategoryFilter />
            </div>
          )}
        </nav>

        {/* Identity (bottom) */}
        {isAuthenticated && session && !collapsed && (
          <div className="border-t border-line p-3">
            <a
              href={session.user.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-subtle"
            >
              <img src={session.user.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-content">
                  {session.user.name ?? session.user.login}
                </p>
                <p className="truncate text-xs text-content-faint">@{session.user.login}</p>
              </div>
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
