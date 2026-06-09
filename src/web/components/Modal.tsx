import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Hide the default close (X) button in the header. */
  hideCloseButton?: boolean;
  className?: string;
}

/** Accessible-ish modal dialog rendered in a portal. ESC and backdrop close. */
export default function Modal({
  open,
  onClose,
  title,
  children,
  hideCloseButton = false,
  className = '',
}: ModalProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl outline-none ${className}`}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4 p-5 pb-0">
            {title && (
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            )}
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 -m-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
