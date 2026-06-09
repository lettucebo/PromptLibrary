import { useTranslation } from 'react-i18next';
import { useLabels } from '../hooks/useLabels';
import { parseLabel } from '../lib/github';
import { config } from '../config';

interface LabelMultiSelectProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const CATEGORY_ORDER: Array<keyof typeof config.labelPrefixes> = [
  'model',
  'type',
  'usecase',
  'lang',
  'difficulty',
];

export default function LabelMultiSelect({ selected, onChange }: LabelMultiSelectProps) {
  const { t } = useTranslation();
  const { data: labels = [] } = useLabels();

  const grouped = new Map<string, { name: string; color: string }[]>();
  for (const lbl of labels) {
    const parsed = parseLabel(lbl);
    const cat = parsed.category;
    if (cat === 'other') continue; // only show prefixed categories
    const arr = grouped.get(cat) ?? [];
    arr.push({ name: lbl.name, color: lbl.color });
    grouped.set(cat, arr);
  }

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  };

  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat) ?? [];
        if (items.length === 0) return null;
        const heading = t(`filter.${cat}`);
        return (
          <div key={cat}>
            <p className="text-xs font-medium text-content-soft mb-1">{heading}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map(({ name, color }) => {
                const isSelected = selected.includes(name);
                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => toggle(name)}
                    style={isSelected ? { backgroundColor: `#${color}` } : undefined}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      isSelected
                        ? 'text-white border-transparent'
                        : 'bg-card border-line text-content-soft hover:bg-subtle'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
