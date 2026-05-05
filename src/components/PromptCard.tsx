import { Link } from 'react-router-dom';
import { MessageSquare, Calendar } from 'lucide-react';
import LabelBadge from './LabelBadge';
import type { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
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

export default function PromptCard({ prompt }: PromptCardProps) {
  return (
    <Link
      to={`/prompt/${prompt.number}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 group"
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
        {prompt.title}
      </h3>

      {prompt.parsedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {prompt.parsedLabels.map((label) => (
            <LabelBadge key={label.raw.id} label={label} />
          ))}
        </div>
      )}

      {prompt.body && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">
          {previewText(prompt.body)}
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
            {prompt.comments} version{prompt.comments !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  );
}
