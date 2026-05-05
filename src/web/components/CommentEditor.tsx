import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownEditor from './MarkdownEditor';

interface CommentEditorProps {
  initialValue?: string;
  isPending?: boolean;
  onSubmit: (body: string) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  height?: number;
}

export default function CommentEditor({
  initialValue = '',
  isPending,
  onSubmit,
  onCancel,
  submitLabel,
  height = 240,
}: CommentEditorProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      await onSubmit(value);
      if (!initialValue) setValue('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
  };

  return (
    <div className="space-y-2">
      <MarkdownEditor value={value} onChange={setValue} preview="edit" height={height} />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('comment.cancel')}
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isPending || !value.trim()}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? t('common.saving') : submitLabel ?? t('comment.save')}
        </button>
      </div>
    </div>
  );
}
