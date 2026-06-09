import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import MarkdownEditor from '../components/MarkdownEditor';
import LabelMultiSelect from '../components/LabelMultiSelect';
import InlineLabelCreator from '../components/InlineLabelCreator';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useCreatePrompt, usePrompt, useUpdatePrompt } from '../hooks/usePrompts';
import { useToast } from '../contexts/ToastContext';
import { errorMessageKey } from '../lib/errors';

interface DraftShape {
  title: string;
  body: string;
  labels: string[];
}

function serialize(d: DraftShape): string {
  return JSON.stringify({ title: d.title, body: d.body, labels: [...d.labels].sort() });
}

export default function PromptEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id?: string }>();
  const issueNumber = id ? parseInt(id, 10) : 0;
  const editing = !!issueNumber;
  const draftKey = `pl_draft_${editing ? issueNumber : 'new'}`;

  const { data: existing, isLoading: loadingExisting } = usePrompt(editing ? issueNumber : 0);
  const createMut = useCreatePrompt();
  const updateMut = useUpdatePrompt();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState<DraftShape | null>(null);

  const initialRef = useRef<DraftShape>({ title: '', body: '', labels: [] });
  const draftCheckedRef = useRef(false);

  useEffect(() => {
    if (editing && existing) {
      initialRef.current = { title: existing.title, body: existing.body, labels: existing.labels.map((l) => l.name) };
      setTitle(existing.title);
      setBody(existing.body);
      setLabels(existing.labels.map((l) => l.name));
    }
  }, [editing, existing]);

  // Offer to restore a saved draft (once initial state is known).
  useEffect(() => {
    if (draftCheckedRef.current) return;
    if (editing && !existing) return; // wait for existing to load
    draftCheckedRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as DraftShape;
      if (serialize(draft) !== serialize(initialRef.current)) setDraftAvailable(draft);
    } catch {
      /* ignore malformed draft */
    }
  }, [editing, existing, draftKey]);

  const isDirty = () => serialize({ title, body, labels }) !== serialize(initialRef.current);

  // Autosave draft (debounced).
  useEffect(() => {
    if (editing && !existing) return;
    const id2 = window.setTimeout(() => {
      if (isDirty()) localStorage.setItem(draftKey, JSON.stringify({ title, body, labels }));
      else localStorage.removeItem(draftKey);
    }, 500);
    return () => window.clearTimeout(id2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, labels, editing, existing, draftKey]);

  // Warn on tab close / reload while dirty.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, labels]);

  if (editing && loadingExisting) return <LoadingSpinner className="py-20" />;

  const validateTitle = (v: string): string | null => {
    if (!v.trim()) return t('prompt.editor.titleRequired');
    if (v.length > 256) return t('prompt.editor.titleTooLong');
    return null;
  };

  const clearDraft = () => localStorage.removeItem(draftKey);

  const doSubmit = async () => {
    setSubmitError(null);
    const err = validateTitle(title);
    setTitleError(err);
    if (err) return;
    try {
      if (editing) {
        await updateMut.mutateAsync({ issueNumber, title, body, labels });
        clearDraft();
        toast.success('toast.promptUpdated');
        navigate(`/prompt/${issueNumber}`, { replace: true });
      } else {
        const created = await createMut.mutateAsync({ title, body, labels });
        clearDraft();
        toast.success('toast.promptCreated');
        navigate(`/prompt/${created.number}`, { replace: true });
      }
    } catch (e) {
      setSubmitError(errorMessageKey(e));
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void doSubmit();
  };

  const leaveTarget = () => navigate(editing ? `/prompt/${issueNumber}` : '/');
  const tryLeave = () => {
    if (isDirty()) setConfirmDiscard(true);
    else leaveTarget();
  };

  const restoreDraft = () => {
    if (!draftAvailable) return;
    setTitle(draftAvailable.title);
    setBody(draftAvailable.body);
    setLabels(draftAvailable.labels);
    setDraftAvailable(null);
  };
  const dismissDraft = () => {
    clearDraft();
    setDraftAvailable(null);
  };

  const isPending = createMut.isPending || updateMut.isPending;
  const titleLen = title.length;

  return (
    <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={tryLeave}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('prompt.back')}
      </button>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {editing ? t('prompt.editor.editTitle') : t('prompt.editor.newTitle')}
      </h1>

      {draftAvailable && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3">
          <span className="text-sm text-indigo-800 dark:text-indigo-300">{t('prompt.editor.draftFound')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {t('prompt.editor.restoreDraft')}
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
            >
              {t('prompt.editor.discardDraft')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('prompt.editor.fieldTitle')}
            </label>
            <span className={`text-xs ${titleLen > 256 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {titleLen}/256
            </span>
          </div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(validateTitle(e.target.value));
            }}
            placeholder={t('prompt.editor.fieldTitlePlaceholder')}
            maxLength={256}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {titleError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{titleError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t('prompt.editor.fieldBody')}
          </label>
          <MarkdownEditor value={body} onChange={setBody} onUploadError={setUploadError} />
          {uploadError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {t('prompt.editor.fieldLabels')}
          </label>
          <LabelMultiSelect selected={labels} onChange={setLabels} />
          <InlineLabelCreator
            onCreated={(name) => setLabels((prev) => (prev.includes(name) ? prev : [...prev, name]))}
          />
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
            <span>{t(submitError, { defaultValue: t('errors.unknown') })}</span>
            <button
              type="button"
              onClick={() => void doSubmit()}
              disabled={isPending}
              className="px-3 py-1 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={tryLeave}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('prompt.editor.discard')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? t('prompt.editor.submitting') : t('prompt.editor.submit')}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title={t('prompt.editor.unsavedTitle')}
        body={t('prompt.editor.unsavedBody')}
        confirmLabel={t('prompt.editor.leave')}
        cancelLabel={t('prompt.editor.stay')}
        tone="danger"
        onConfirm={() => {
          clearDraft();
          setConfirmDiscard(false);
          leaveTarget();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </form>
  );
}
