import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroupedLabels } from '../hooks/useLabels';
import type { FilterState } from '../types';

interface CategoryFilterProps {
  filters: FilterState;
  onChange: (category: string, value: string) => void;
}

export default function CategoryFilter({ filters, onChange }: CategoryFilterProps) {
  const { t } = useTranslation();
  const grouped = useGroupedLabels();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (cat: string) => setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  return (
    <aside className="space-y-4">
      {Object.entries(grouped).map(([category, values]) => {
        if (values.length === 0) return null;
        const isCollapsed = collapsed[category];
        const selected = (filters[category as keyof FilterState] as string[]) ?? [];

        return (
          <div key={category} className="bg-card rounded-xl border border-line overflow-hidden">
            <button
              onClick={() => toggle(category)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-content-soft hover:bg-subtle"
            >
              <span>{t(`filter.${category}`, { defaultValue: category })}</span>
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
            {!isCollapsed && (
              <div className="px-4 pb-3 space-y-1.5">
                {values.map((value) => {
                  const isSelected = selected.includes(value);
                  return (
                    <label
                      key={value}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onChange(category, value)}
                        className="rounded border-line-strong text-primary focus:ring-primary"
                      />
                      <span className={`text-sm ${isSelected ? 'text-primary font-medium' : 'text-content-soft'}`}>
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
    </aside>
  );
}
