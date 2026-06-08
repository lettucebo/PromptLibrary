import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  /** i18n key resolved at render time (preferred). */
  messageKey?: string;
  /** Params for the i18n key. */
  params?: Record<string, unknown>;
  /** Pre-translated raw message (used when no key is available). */
  message?: string;
}

export type ToastInput = Omit<ToastItem, 'id'> & { duration?: number };

interface ToastContextValue {
  toasts: ToastItem[];
  push: (input: ToastInput) => number;
  dismiss: (id: number) => void;
  success: (messageKey: string, params?: Record<string, unknown>) => number;
  error: (messageKey: string, params?: Record<string, unknown>) => number;
  info: (messageKey: string, params?: Record<string, unknown>) => number;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = ++idRef.current;
      const { duration = DEFAULT_DURATION, ...rest } = input;
      setToasts((prev) => [...prev, { id, ...rest }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (messageKey: string, params?: Record<string, unknown>) =>
      push({ type: 'success', messageKey, params }),
    [push],
  );
  const error = useCallback(
    (messageKey: string, params?: Record<string, unknown>) =>
      push({ type: 'error', messageKey, params }),
    [push],
  );
  const info = useCallback(
    (messageKey: string, params?: Record<string, unknown>) =>
      push({ type: 'info', messageKey, params }),
    [push],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, success, error, info }),
    [toasts, push, dismiss, success, error, info],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
