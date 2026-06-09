import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import MarkdownEditor from '../components/MarkdownEditor';
import OutputExampleEditor from '../components/OutputExampleEditor';
import LabelMultiSelect from '../components/LabelMultiSelect';
import InlineLabelCreator from '../components/InlineLabelCreator';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useCreatePrompt, usePrompt, useUpdatePrompt } from '../hooks/usePrompts';
import { useToast } from '../contexts/ToastContext';
import { errorMessageKey } from '../lib/errors';
import { countChars, estimateTokens } from '../lib/tokens';
import { serializePromptBody } from '../lib/promptBody';
import type { OutputExample } from '../types';

interface DraftShape {
  title: string;
  prompt: string;
  notes: string;
  outputs: OutputExample[];
  labels: string[];
}

function serialize(d: DraftShape): string {
  return JSON.stringify({
    title: d.title,
    prompt: d.prompt,
    notes: d.notes,
    outputs: d.outputs,
    labels: [...d.labels].sort(),
  });
}

/** Coerce a parsed draft into the current shape (tolerates the pre-sections
 *  `{title, body, labels}` format by mapping legacy `body` onto `prompt`). */
function normalizeDraft(raw: unknown): DraftShape {
  const d = (raw ?? {}) as Record<string, unknown>;
  return {
    title: typeof d.title === 'string' ? d.title : '',
    prompt: typeof d.prompt === 'string' ? d.prompt : typeof d.body === 'string' ? d.body : '',
    notes: typeof d.notes === 'string' ? d.notes : '',
    outputs: Array.isArray(d.outputs) ? (d.outputs as OutputExample[]) : [],
    labels: Array.isArray(d.labels) ? (d.labels as string[]) : [],
  };
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
  const [promptText, setPromptText] = useState('');
  const [notes, setNotes] = useState('');
  const [outputs, setOutputs] = useState<OutputExample[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState<DraftShape | null>(null);

  const initialRef = useRef<DraftShape>({ title: '', prompt: '', notes: '', outputs: [], labels: [] });
  const draftCheckedRef = useRef(false);

  useEffect(() => {
    if (editing && existing) {
      initialRef.current = {
        title: existing.title,
        prompt: existing.promptText,
        notes: existing.notes,
        outputs: existing.outputs,
        labels: existing.labels.map((l) => l.name),
      };
      setTitle(existing.title);
      setPromptText(existing.promptText);
      setNotes(existing.notes);
      setOutputs(existing.outputs);
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
      const draft = normalizeDraft(JSON.parse(raw));
      if (serialize(draft) !== serialize(initialRef.current)) setDraftAvailable(draft);
    } catch {
      /* ignore malformed draft */
    }
  }, [editing, existing, draftKey]);

  const isDirty = () =>
    serialize({ title, prompt: promptText, notes, outputs, labels }) !== serialize(initialRef.current);

  // Autosave draft (debounced).
  useEffect(() => {
    if (editing && !existing) return;
    const id2 = window.setTimeout(() => {
      if (isDirty()) {
        localStorage.setItem(draftKey, JSON.stringify({ title, prompt: promptText, notes, outputs, labels }));
      } else {
        localStorage.removeItem(draftKey);
      }
    }, 500);
    return () => window.clearTimeout(id2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, promptText, notes, outputs, labels, editing, existing, draftKey]);

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
  }, [title, promptText, notes, outputs, labels]);

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
    const body = serializePromptBody({ prompt: promptText, notes, outputs });
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
    setPromptText(draftAvailable.prompt);
    setNotes(draftAvailable.notes);
    setOutputs(draftAvailable.outputs);
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
        className="inline-flex items-center gap-1.5 text-sm text-content-soft hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('prompt.back')}
      </button>

      <h1 className="text-xl font-bold text-content mb-6">
        {editing ? t('prompt.editor.editTitle') : t('prompt.editor.newTitle')}
      </h1>

      {draftAvailable && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <span className="text-sm text-primary">{t('prompt.editor.draftFound')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-dark"
            >
              {t('prompt.editor.restoreDraft')}
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/15"
            >
              {t('prompt.editor.discardDraft')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 bg-card rounded-2xl border border-line p-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="title" className="block text-sm font-medium text-content-soft">
              {t('prompt.editor.fieldTitle')}
            </label>
            <span className={`text-xs ${titleLen > 256 ? 'text-error' : 'text-content-faint'}`}>
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
            className="w-full px-3 py-2 rounded-lg border border-line bg-card text-content focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {titleError && <p className="mt-1 text-xs text-error">{titleError}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-content-soft">
              {t('prompt.editor.fieldPrompt')}
            </label>
            <span className="text-xs text-content-faint">
              {t('common.charsTokens', { chars: countChars(promptText), tokens: estimateTokens(promptText) })}
            </span>
          </div>
          <MarkdownEditor value={promptText} onChange={setPromptText} onUploadError={setUploadError} />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-soft mb-1">
            {t('prompt.editor.fieldNotes')}
          </label>
          <p className="text-xs text-content-faint mb-2">{t('prompt.editor.fieldNotesHint')}</p>
          <MarkdownEditor value={notes} onChange={setNotes} onUploadError={setUploadError} height={200} />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-soft mb-1">
            {t('prompt.editor.fieldOutputs')}
          </label>
          <p className="text-xs text-content-faint mb-2">{t('prompt.editor.fieldOutputsHint')}</p>
          <OutputExampleEditor value={outputs} onChange={setOutputs} onUploadError={setUploadError} />
        </div>

        {uploadError && <p className="text-xs text-error">{uploadError}</p>}

        <div>
          <label className="block text-sm font-medium text-content-soft mb-2">
            {t('prompt.editor.fieldLabels')}
          </label>
          <LabelMultiSelect selected={labels} onChange={setLabels} />
          <InlineLabelCreator
            onCreated={(name) => setLabels((prev) => (prev.includes(name) ? prev : [...prev, name]))}
          />
        </div>

        {submitError && (
          <div className="rounded-lg border border-error/40 bg-error-container p-3 text-sm text-error flex items-center justify-between gap-3">
            <span>{t(submitError, { defaultValue: t('errors.unknown') })}</span>
            <button
              type="button"
              onClick={() => void doSubmit()}
              disabled={isPending}
              className="px-3 py-1 rounded-md text-xs font-medium bg-error text-on-error hover:bg-error/90 disabled:opacity-50"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={tryLeave}
            className="px-4 py-2 rounded-lg text-sm font-medium text-content-soft hover:bg-subtle"
          >
            {t('prompt.editor.discard')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-dark disabled:opacity-50"
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
