import { Link } from 'react-router-dom';
import { MessageSquare, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LabelBadge from './LabelBadge';
import CopyButton from './CopyButton';
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
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
          {highlight(prompt.title, query)}
        </h3>
        {prompt.body && (
          <CopyButton text={prompt.body} iconOnly stopPropagation className="flex-shrink-0" />
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
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">
          {highlight(preview, query)}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
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
