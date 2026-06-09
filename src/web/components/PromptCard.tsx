import { Link } from 'react-router-dom';
import { MessageSquare, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LabelBadge from './LabelBadge';
import CopyButton from './CopyButton';
import OpenInAIButton from './OpenInAIButton';
import { usePrefetchPrompt } from '../hooks/usePrompts';
import { highlight } from '../lib/highlight';
import type { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  query?: string;
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

function previewText(body: string, maxLen = 200): string {
  const stripped = body.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[#*`_~]/g, '').trim();
  if (stripped.length <= maxLen) return stripped;
  return stripped.slice(0, maxLen).trimEnd() + '…';
}

export default function PromptCard({ prompt, query = '' }: PromptCardProps) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const prefetch = usePrefetchPrompt();
  const preview = prompt.body ? previewText(prompt.body) : '';

  return (
    <Link
      to={`/prompt/${prompt.number}`}
      onMouseEnter={() => prefetch(prompt.number)}
      onFocus={() => prefetch(prompt.number)}
      className="block bg-card rounded-xl border border-line p-5 hover:shadow-md hover:border-primary transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-content group-hover:text-primary line-clamp-2">
          {highlight(prompt.title, query)}
        </h3>
        {prompt.body && (
          <div className="flex-shrink-0 flex items-center gap-1">
            <OpenInAIButton
              text={prompt.body}
              compact
              stopPropagation
              className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
            />
            <CopyButton text={prompt.body} iconOnly stopPropagation notifyTokens />
          </div>
        )}
      </div>

      {prompt.parsedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {prompt.parsedLabels.map((label) => (
            <LabelBadge key={label.raw.id} label={label} />
          ))}
        </div>
      )}

      {preview && (
        <p className="text-sm text-content-soft line-clamp-3 mb-4">
          {highlight(preview, query)}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-content-faint">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(prompt.created_at)}
        </span>
        {prompt.comments > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {t('prompt.versionCount', { count: prompt.comments })}
          </span>
        )}
      </div>
    </Link>
  );
}
