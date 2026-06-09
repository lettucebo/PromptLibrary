import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { getRecentlyViewed } from '../lib/recentlyViewed';

/** Horizontal strip of recently viewed prompts (from localStorage). */
export default function RecentlyViewed() {
  const { t } = useTranslation();
  const items = getRecentlyViewed();
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-2 text-content-soft">
        <Clock className="h-4 w-4" />
        <h2 className="text-sm font-semibold">{t('home.recentlyViewed')}</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((it) => (
          <Link
            key={it.number}
            to={`/prompt/${it.number}`}
            title={it.title}
            className="flex-shrink-0 max-w-[220px] px-3 py-2 rounded-lg bg-card border border-line text-sm text-content-soft hover:border-primary/60 hover:text-content truncate transition-colors"
          >
            {it.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
