import { Link } from 'react-router-dom';
import { MessageSquare, Calendar, Play, Film, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LabelBadge from './LabelBadge';
import CopyButton from './CopyButton';
import FavoriteButton from './FavoriteButton';
import { usePrefetchPrompt } from '../hooks/usePrompts';
import { highlight } from '../lib/highlight';
import { cardItemToSnapshot, type PromptCardItem } from '../lib/promptCardItem';

interface PromptCardProps {
  item: PromptCardItem;
  query?: string;
  variant?: 'grid' | 'list';
  /** Prefetch the detail on hover/focus. Disable for local snapshot views
   * (favorites / recent) so they never trigger per-item GitHub API calls. */
  enablePrefetch?: boolean;
}

function useFormatDate() {
  const { i18n } = useTranslation();
  return (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(i18n.resolvedLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
}

export default function PromptCard({ item, query = '', variant = 'grid', enablePrefetch = true }: PromptCardProps) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const prefetch = usePrefetchPrompt();

  const snapshot = cardItemToSnapshot(item);
  const isVideoThumb = item.thumb?.kind === 'video';
  const badgeLabel = isVideoThumb ? t('card.video') : item.hasVideo ? t('card.hasVideo') : null;

  const link = (
    <Link
      to={`/prompt/${item.number}`}
      aria-label={item.title}
      onMouseEnter={enablePrefetch ? () => prefetch(item.number) : undefined}
      onFocus={enablePrefetch ? () => prefetch(item.number) : undefined}
      className="absolute inset-0"
    />
  );

  const actions = (
    <div
      className={`absolute z-10 flex items-center gap-1 ${
        variant === 'list' ? 'right-3 top-1/2 -translate-y-1/2' : 'right-2.5 top-2.5'
      }`}
    >
      {item.promptText && <CopyButton text={item.promptText} iconOnly stopPropagation notifyTokens />}
      <FavoriteButton snapshot={snapshot} stopPropagation />
    </div>
  );

  const meta = (
    <div className="flex items-center gap-4 text-xs text-content-faint">
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" />
        {formatDate(item.created_at)}
      </span>
      {item.comments > 0 && (
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {t('prompt.versionCount', { count: item.comments })}
        </span>
      )}
    </div>
  );

  if (variant === 'list') {
    return (
      <article className="group relative flex items-center gap-4 px-4 py-3 hover:bg-subtle transition-colors">
        {item.thumb ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-subtle">
            <img src={item.thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            {isVideoThumb && (
              <span className="absolute inset-0 grid place-items-center pointer-events-none">
                <Play className="h-4 w-4 text-white drop-shadow" fill="currentColor" />
              </span>
            )}
          </div>
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-subtle text-content-faint">
            <FileText className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-content truncate group-hover:text-primary">
              {highlight(item.title, query)}
            </h3>
            <span className="hidden md:flex gap-1.5 shrink-0">
              {item.parsedLabels.slice(0, 3).map((l) => (
                <LabelBadge key={l.raw.id} label={l} />
              ))}
            </span>
          </div>
          {item.preview && (
            <p className="text-sm text-content-soft truncate">{highlight(item.preview, query)}</p>
          )}
        </div>
        <div className="mr-20 hidden shrink-0 sm:block">{meta}</div>
        {link}
        {actions}
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col rounded-xl border border-line bg-card overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200">
      {item.thumb && (
        <div className="relative overflow-hidden bg-subtle" style={{ aspectRatio: '16 / 9' }}>
          <img
            src={item.thumb.url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isVideoThumb && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white">
                <Play className="h-5 w-5" fill="currentColor" />
              </span>
            </div>
          )}
          {badgeLabel && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white pointer-events-none">
              <Film className="h-3 w-3" />
              {badgeLabel}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        {item.parsedLabels.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5 pr-14">
            {item.parsedLabels.map((label) => (
              <LabelBadge key={label.raw.id} label={label} />
            ))}
          </div>
        )}
        <h3 className="font-semibold text-content group-hover:text-primary line-clamp-2 pr-14">
          {highlight(item.title, query)}
        </h3>
        {item.preview && (
          <p className={`mt-1 text-sm text-content-soft ${item.thumb ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {highlight(item.preview, query)}
          </p>
        )}
        <div className="mt-3 pt-1">{meta}</div>
      </div>
      {link}
      {actions}
    </article>
  );
}
