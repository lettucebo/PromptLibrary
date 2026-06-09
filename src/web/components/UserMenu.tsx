import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Plus, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserMenu() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!session) return null;
  const { user } = session;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={t('nav.userMenu')}
      >
        <img src={user.avatarUrl} alt={user.login} className="h-8 w-8 rounded-full" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-line shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-medium text-content">{user.name ?? user.login}</p>
            <p className="text-xs text-content-soft">@{user.login}</p>
          </div>
          <div className="py-1">
            <Link
              to="/prompt/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-content-soft hover:bg-subtle"
            >
              <Plus className="h-4 w-4" />
              {t('nav.newPrompt')}
            </Link>
            <Link
              to="/admin/labels"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-content-soft hover:bg-subtle"
            >
              <Tag className="h-4 w-4" />
              {t('nav.labels')}
            </Link>
          </div>
          <div className="border-t border-line py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-content-soft hover:bg-subtle"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
