import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import MarkdownEditor from '../components/MarkdownEditor';
import LabelMultiSelect from '../components/LabelMultiSelect';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCreatePrompt, usePrompt, useUpdatePrompt } from '../hooks/usePrompts';

export default function PromptEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const issueNumber = id ? parseInt(id, 10) : 0;
  const editing = !!issueNumber;

  const { data: existing, isLoading: loadingExisting } = usePrompt(editing ? issueNumber : 0);
  const createMut = useCreatePrompt();
  const updateMut = useUpdatePrompt();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (editing && existing) {
      setTitle(existing.title);
      setBody(existing.body);
      setLabels(existing.labels.map((l) => l.name));
    }
  }, [editing, existing]);

  if (editing && loadingExisting) return <LoadingSpinner className="py-20" />;

  const validateTitle = (v: string): string | null => {
    if (!v.trim()) return t('prompt.editor.titleRequired');
    if (v.length > 256) return t('prompt.editor.titleTooLong');
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const err = validateTitle(title);
    setTitleError(err);
    if (err) return;
    try {
      if (editing) {
        await updateMut.mutateAsync({ issueNumber, title, body, labels });
        navigate(`/prompt/${issueNumber}`, { replace: true });
      } else {
        const created = await createMut.mutateAsync({ title, body, labels });
        navigate(`/prompt/${created.number}`, { replace: true });
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'unknown');
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
      <Link
        to={editing ? `/prompt/${issueNumber}` : '/'}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('prompt.back')}
      </Link>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {editing ? t('prompt.editor.editTitle') : t('prompt.editor.newTitle')}
      </h1>

      <div className="space-y-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t('prompt.editor.fieldTitle')}
          </label>
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
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => navigate(editing ? `/prompt/${issueNumber}` : '/')}
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
    </form>
  );
}
