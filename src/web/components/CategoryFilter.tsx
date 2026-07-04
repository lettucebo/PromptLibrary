import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroupedLabels } from '../hooks/useLabels';

/**
 * Category filter panel. Self-contained: reads/writes the selected values
 * directly on the URL (so it can live in the shell sidebar independent of any
 * page). Multiple values in one category are ANDed by the GitHub Search API,
 * hence the "match all" hint. Toggling a filter resets the collection view back
 * to the default browse view.
 */
export default function CategoryFilter() {
  const { t } = useTranslation();
  const grouped = useGroupedLabels();
  const [params, setParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCat = (cat: string) => setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  const selectedFor = (cat: string) => (params.get(cat) ?? '').split(',').filter(Boolean);

  const toggleValue = (cat: string, value: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      const cur = (next.get(cat) ?? '').split(',').filter(Boolean);
      const upd = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      if (upd.length) next.set(cat, upd.join(','));
      else next.delete(cat);
      next.delete('view'); // filtering implies the default browse view
      return next;
    });
  };

  const hasAny = Object.values(grouped).some((v) => v.length > 0);
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([category, values]) => {
        if (values.length === 0) return null;
        const isCollapsed = collapsed[category];
        const selected = selectedFor(category);

        return (
          <div key={category} className="rounded-xl border border-line bg-page/40 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCat(category)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-content-soft hover:bg-subtle"
            >
              <span>{t(`filter.${category}`, { defaultValue: category })}</span>
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
            {!isCollapsed && (
              <div className="px-3 pb-2.5 space-y-1.5">
                {values.map((value) => {
                  const isSelected = selected.includes(value);
                  return (
                    <label key={value} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleValue(category, value)}
                        className="rounded border-line-strong text-primary focus:ring-primary"
                      />
                      <span className={`text-sm ${isSelected ? 'text-primary font-medium' : 'text-content-soft group-hover:text-content'}`}>
                        {value}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
