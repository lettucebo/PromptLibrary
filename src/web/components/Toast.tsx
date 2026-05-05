import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Renders a transient toast based on AuthContext.notice. Auto-dismisses after 6s.
 * Translation lookup: a `notice.message` of `tokenInvalid` resolves to `auth.tokenInvalid`.
 */
export default function Toast() {
  const { t } = useTranslation();
  const { notice, clearNotice } = useAuth();

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(clearNotice, 6000);
    return () => window.clearTimeout(id);
  }, [notice, clearNotice]);

  if (!notice) return null;
  const text = t(`auth.${notice.message}`, { defaultValue: notice.message });
  const tone =
    notice.type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-indigo-600 text-white';

  return (
    <div className="fixed inset-x-0 top-4 flex justify-center z-[100] pointer-events-none">
      <div className={`pointer-events-auto flex items-center gap-3 rounded-lg shadow-lg px-4 py-2 text-sm ${tone}`}>
        <span>{text}</span>
        <button
          type="button"
          onClick={clearNotice}
          className="opacity-80 hover:opacity-100"
          aria-label="dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
