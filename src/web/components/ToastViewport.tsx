import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import type { ToastItem, ToastType } from '../contexts/ToastContext';

const TONE: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-indigo-600 text-white',
};

function ToastIcon({ type }: { type: ToastType }) {
  const cls = 'h-4 w-4 flex-shrink-0';
  if (type === 'success') return <CheckCircle2 className={cls} />;
  if (type === 'error') return <AlertCircle className={cls} />;
  return <Info className={cls} />;
}

/**
 * Renders the stack of active toasts. Messages may be provided as an i18n key
 * (`messageKey` + `params`) or a pre-translated `message`.
 */
export default function ToastViewport() {
  const { t } = useTranslation();
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  const text = (toast: ToastItem): string => {
    if (toast.messageKey) {
      return t(toast.messageKey, { defaultValue: toast.message ?? toast.messageKey, ...toast.params });
    }
    return toast.message ?? '';
  };

  return (
    <div className="fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-3 rounded-lg shadow-lg px-4 py-2 text-sm max-w-md ${TONE[toast.type]}`}
        >
          <ToastIcon type={toast.type} />
          <span className="flex-1">{text(toast)}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="opacity-80 hover:opacity-100"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
