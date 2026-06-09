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
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        {t('label.addLabel')}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-line p-3 flex flex-wrap items-center gap-2">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as keyof typeof config.labelPrefixes)}
        className="px-2 py-1 rounded-md border border-line bg-card text-sm text-content-soft focus:outline-none focus:ring-1 focus:ring-primary"
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
        className="flex-1 min-w-[140px] px-2 py-1 rounded-md border border-line bg-card text-sm text-content focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <span
        className="inline-block h-5 w-5 rounded-full border border-line flex-shrink-0"
        style={{ backgroundColor: `#${color}` }}
      />
      <input
        type="text"
        value={color}
        onChange={(e) => setColor(e.target.value.replace(/^#/, '').toLowerCase())}
        maxLength={6}
        className="w-20 px-2 py-1 rounded-md border border-line bg-card text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={createMut.isPending}
        className="px-3 py-1 rounded-md text-sm font-medium bg-primary text-on-primary hover:bg-primary-dark disabled:opacity-50"
      >
        {t('label.save')}
      </button>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(false);
        }}
        className="p-1.5 rounded-md text-content-faint hover:text-content-soft"
        aria-label={t('common.cancel')}
      >
        <X className="h-4 w-4" />
      </button>
      {error && <p className="basis-full text-xs text-error">{error}</p>}
    </div>
  );
}
