import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Save, Trash2, X } from 'lucide-react';
import { useCreateLabel, useDeleteLabel, useLabels, useUpdateLabel } from '../hooks/useLabels';
import { parseLabel } from '../lib/github';
import { config } from '../config';
import { useToast } from '../contexts/ToastContext';
import { errorMessageKey } from '../lib/errors';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Label } from '../types';

const CATEGORY_ORDER = ['model', 'type', 'usecase', 'output', 'lang', 'difficulty', 'other'] as const;

function colorIsValid(c: string): boolean {
  return /^[0-9a-f]{6}$/i.test(c);
}

export default function LabelsAdminPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: labels = [], isLoading } = useLabels();
  const createMut = useCreateLabel();
  const updateMut = useUpdateLabel();
  const deleteMut = useDeleteLabel();

  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Label | null>(null);

  const grouped = new Map<(typeof CATEGORY_ORDER)[number], Label[]>();
  for (const cat of CATEGORY_ORDER) grouped.set(cat, []);
  for (const lbl of labels) {
    const cat = parseLabel(lbl).category;
    grouped.get(cat)?.push(lbl);
  }

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.name, {
      onSuccess: () => {
        toast.success('toast.labelDeleted');
        setDeleteTarget(null);
      },
      onError: (e) => toast.error(errorMessageKey(e)),
    });
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-content-soft hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('prompt.back')}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-content">{t('label.managePageTitle')}</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          {t('label.addLabel')}
        </button>
      </div>

      {creating && (
        <LabelRow
          mode="create"
          isPending={createMut.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={async (input) => {
            await createMut.mutateAsync(input);
            toast.success('toast.labelCreated');
            setCreating(false);
          }}
        />
      )}

      <div className="space-y-6">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat) ?? [];
          if (items.length === 0) return null;
          const heading = cat === 'other' ? t('label.name') : t(`filter.${cat}`);
          return (
            <section key={cat}>
              <h2 className="text-sm font-semibold text-content-soft mb-2">{heading}</h2>
              <div className="space-y-2">
                {items.map((lbl) => (
                  <LabelRow
                    key={lbl.id}
                    mode="edit"
                    label={lbl}
                    isPending={updateMut.isPending || deleteMut.isPending}
                    onSubmit={async (input) => {
                      await updateMut.mutateAsync({ currentName: lbl.name, ...input });
                      toast.success('toast.labelUpdated');
                    }}
                    onDelete={() => setDeleteTarget(lbl)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('label.delete')}
        body={deleteTarget ? t('label.deleteConfirm', { name: deleteTarget.name }) : ''}
        confirmLabel={t('label.delete')}
        tone="danger"
        isPending={deleteMut.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface LabelRowProps {
  mode: 'create' | 'edit';
  label?: Label;
  isPending?: boolean;
  onSubmit: (input: { name: string; color: string; description?: string }) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void;
}

function LabelRow({ mode, label, isPending, onSubmit, onCancel, onDelete }: LabelRowProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(label?.name ?? '');
  const [color, setColor] = useState(label?.color ?? '6b7280');
  const [description, setDescription] = useState(label?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const isProtected = mode === 'edit' && (label?.name === config.archivedLabel || label?.name === config.metaLabel);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t('label.name'));
      return;
    }
    if (!colorIsValid(color)) {
      setError('color');
      return;
    }
    try {
      await onSubmit({ name: name.trim(), color, description: description || undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  };

  return (
    <div className="bg-card rounded-xl border border-line p-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <span
          className="inline-block h-4 w-4 rounded-full border border-line"
          style={{ backgroundColor: `#${colorIsValid(color) ? color : '6b7280'}` }}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isProtected}
          placeholder={t('label.name')}
          className="flex-1 px-2 py-1 rounded-md border border-line bg-card text-sm text-content focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>
      <input
        type="text"
        value={color}
        onChange={(e) => setColor(e.target.value.replace(/^#/, '').toLowerCase())}
        placeholder="6b7280"
        maxLength={6}
        className="w-24 px-2 py-1 rounded-md border border-line bg-card text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('label.description')}
        className="flex-1 min-w-[160px] px-2 py-1 rounded-md border border-line bg-card text-sm text-content-soft focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isPending}
          className="p-1.5 rounded-md text-content-soft hover:text-primary hover:bg-subtle disabled:opacity-50"
          title={t('label.save')}
          aria-label={t('label.save')}
        >
          <Save className="h-4 w-4" />
        </button>
        {mode === 'edit' && onDelete && !isProtected && (
          <button
            type="button"
            onClick={() => onDelete()}
            disabled={isPending}
            className="p-1.5 rounded-md text-content-soft hover:text-error hover:bg-subtle disabled:opacity-50"
            title={t('label.delete')}
            aria-label={t('label.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {mode === 'create' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-md text-content-soft hover:text-content-soft hover:bg-subtle"
            title={t('common.cancel')}
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p className="basis-full text-xs text-error">{error}</p>}
    </div>
  );
}
