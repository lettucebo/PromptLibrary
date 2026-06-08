import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A confirm/cancel dialog built on top of {@link Modal}. */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  const confirmTone =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-indigo-600 hover:bg-indigo-700';

  return (
    <Modal open={open} onClose={onCancel} title={title} hideCloseButton>
      {body && (
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-5 whitespace-pre-line">
          {body}
        </div>
      )}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {cancelLabel ?? t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${confirmTone}`}
        >
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}
