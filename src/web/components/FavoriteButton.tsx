import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsFavorite } from '../hooks/useFavorites';
import { toggleFavorite } from '../lib/collections';
import type { PromptSnapshot } from '../lib/collections';

interface Props {
  /** Snapshot to persist when toggled on. */
  snapshot: PromptSnapshot;
  className?: string;
  /** Prevent click from bubbling to an enclosing link/card. */
  stopPropagation?: boolean;
}

/** Star toggle that adds/removes a prompt from localStorage favorites. */
export default function FavoriteButton({ snapshot, className = '', stopPropagation }: Props) {
  const { t } = useTranslation();
  const fav = useIsFavorite(snapshot.number);
  const label = fav ? t('favorite.remove') : t('favorite.add');

  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={label}
      title={label}
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        toggleFavorite(snapshot);
      }}
      className={`inline-grid place-items-center rounded-lg p-1.5 transition-colors ${
        fav ? 'text-accent-yellow hover:text-accent-yellow' : 'text-content-faint hover:text-content-soft hover:bg-subtle'
      } ${className}`}
    >
      <Star className="h-4 w-4" fill={fav ? 'currentColor' : 'none'} />
    </button>
  );
}
