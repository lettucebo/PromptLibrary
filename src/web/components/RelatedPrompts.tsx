import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { searchPrompts } from '../lib/github';
import { useAuth } from '../contexts/AuthContext';
import LabelBadge from './LabelBadge';
import type { Prompt } from '../types';

const PICK_ORDER = ['usecase', 'type', 'model', 'lang', 'difficulty'] as const;

/**
 * Shows up to 4 prompts that share a representative label with the current one.
 * The Search API ANDs labels and can't OR, so we pick one label by priority.
 */
export default function RelatedPrompts({ prompt }: { prompt: Prompt }) {
  const { t } = useTranslation();
  const { session } = useAuth();

  const pick = useMemo(() => {
    for (const cat of PICK_ORDER) {
      const p = prompt.parsedLabels.find((l) => l.category === cat);
      if (p) return { cat, value: p.value };
    }
    return null;
  }, [prompt]);

  const { data } = useQuery({
    queryKey: ['related', prompt.number, pick?.cat, pick?.value],
    enabled: !!pick,
    queryFn: () =>
      searchPrompts({
        filters: { [pick!.cat]: [pick!.value] },
        perPage: 8,
        token: session?.token,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const items = (data?.items ?? []).filter((p) => p.number !== prompt.number).slice(0, 4);
  if (!pick || items.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-content mb-4">{t('prompt.related')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/prompt/${p.number}`}
            className="block bg-card rounded-xl border border-line p-4 hover:border-primary/60 hover:shadow-sm transition-all"
          >
            <h3 className="text-sm font-medium text-content line-clamp-2">{p.title}</h3>
            {p.parsedLabels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.parsedLabels.slice(0, 3).map((l) => (
                  <LabelBadge key={l.raw.id} label={l} />
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
