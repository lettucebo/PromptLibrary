import type { ReactNode } from 'react';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Wraps occurrences of `query` within `text` in <mark> for search highlighting.
 * Case-insensitive; returns the original text when the query is empty.
 */
export function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
