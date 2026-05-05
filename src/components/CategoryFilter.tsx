import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useGroupedLabels } from '../hooks/useLabels';
import type { FilterState } from '../types';

interface CategoryFilterProps {
  filters: FilterState;
  onChange: (category: string, value: string) => void;
}

const categoryLabels: Record<string, string> = {
  model: '🤖 Model',
  type: '📁 Type',
  usecase: '🎯 Use Case',
  lang: '🌐 Language',
  difficulty: '📊 Difficulty',
};

export default function CategoryFilter({ filters, onChange }: CategoryFilterProps) {
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
          <div key={category} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggle(category)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <span>{categoryLabels[category] ?? category}</span>
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
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`text-sm ${isSelected ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
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
