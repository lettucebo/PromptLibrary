import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check } from 'lucide-react';
import { copyText } from '../lib/clipboard';
import { useToast } from '../contexts/ToastContext';

interface CopyButtonProps {
  text: string;
  className?: string;
  /** When true, render an icon-only button (e.g. on cards). */
  iconOnly?: boolean;
  /** Optional label shown instead of the default "Copy". */
  label?: string;
  /** Stop click from bubbling (useful inside a clickable card). */
  stopPropagation?: boolean;
}

/**
 * Robust copy-to-clipboard button: handles insecure contexts via fallback and
 * surfaces a toast on failure.
 */
export default function CopyButton({
  text,
  className = '',
  iconOnly = false,
  label,
  stopPropagation = false,
}: CopyButtonProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    const ok = await copyText(text);
    if (!ok) {
      toast.error('errors.copyFailed');
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const base = iconOnly
    ? 'p-1.5 rounded-md'
    : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium';
  const tone = copied
    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${base} ${tone} transition-colors ${className}`}
      title={copied ? t('common.copied') : t('common.copy')}
      aria-label={copied ? t('common.copied') : t('common.copy')}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {!iconOnly && (copied ? t('common.copied') : (label ?? t('common.copy')))}
    </button>
  );
}
