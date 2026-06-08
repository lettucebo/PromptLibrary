import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { useCreateLabel } from '../hooks/useLabels';
import { useToast } from '../contexts/ToastContext';
import { errorMessageKey } from '../lib/errors';
import { config } from '../config';

const CATEGORIES = Object.keys(config.labelPrefixes) as Array<keyof typeof config.labelPrefixes>;

function randomColor(): string {
  return Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

interface InlineLabelCreatorProps {
  /** Called with the full label name (incl. category prefix) once created. */
  onCreated: (name: string) => void;
}

/** Inline "create label" form embedded in the prompt editor's label section. */
export default function InlineLabelCreator({ onCreated }: InlineLabelCreatorProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const createMut = useCreateLabel();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<keyof typeof config.labelPrefixes>('model');
  const [color, setColor] = useState(randomColor());
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setCategory('model');
    setColor(randomColor());
    setError(null);
  };

  const submit = async () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('label.name'));
      return;
    }
    const prefix = config.labelPrefixes[category];
    const fullName = `${prefix}${trimmed}`;
    try {
      await createMut.mutateAsync({ name: fullName, color });
      toast.success('toast.labelCreated');
      onCreated(fullName);
      reset();
      setOpen(false);
    } catch (e) {
      setError(t(errorMessageKey(e), { defaultValue: t('errors.unknown') }));
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        {t('label.addLabel')}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex flex-wrap items-center gap-2">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as keyof typeof config.labelPrefixes)}
        className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {t(`filter.${cat}`)}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('label.name')}
        className="flex-1 min-w-[140px] px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <span
        className="inline-block h-5 w-5 rounded-full border border-gray-200 dark:border-gray-600 flex-shrink-0"
        style={{ backgroundColor: `#${color}` }}
      />
      <input
        type="text"
        value={color}
        onChange={(e) => setColor(e.target.value.replace(/^#/, '').toLowerCase())}
        maxLength={6}
        className="w-20 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={createMut.isPending}
        className="px-3 py-1 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {t('label.save')}
      </button>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(false);
        }}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label={t('common.cancel')}
      >
        <X className="h-4 w-4" />
      </button>
      {error && <p className="basis-full text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
