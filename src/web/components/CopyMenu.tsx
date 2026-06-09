import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { copyText } from '../lib/clipboard';
import { useToast } from '../contexts/ToastContext';
import { estimateTokens } from '../lib/tokens';
import { stripMarkdown, promptToJson } from '../lib/promptFormat';
import type { Prompt } from '../types';

type Kind = 'text' | 'md' | 'json';

/** Copy-to-clipboard with a format menu: plain text / Markdown / JSON. */
export default function CopyMenu({ prompt }: { prompt: Prompt }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const doCopy = async (kind: Kind) => {
    const payload =
      kind === 'json' ? promptToJson(prompt) : kind === 'text' ? stripMarkdown(prompt.promptText) : prompt.promptText;
    const ok = await copyText(payload);
    if (!ok) {
      toast.error('errors.copyFailed');
      return;
    }
    setCopied(true);
    if (kind === 'json') toast.success('toast.copiedJson');
    else toast.success('toast.copiedTokens', { tokens: estimateTokens(payload) });
    window.setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const items: { kind: Kind; label: string }[] = [
    { kind: 'text', label: t('prompt.copyText') },
    { kind: 'md', label: t('prompt.copyMarkdown') },
    { kind: 'json', label: t('prompt.copyJson') },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          copied
            ? 'bg-success-container text-accent-green'
            : 'bg-subtle text-content-soft hover:bg-line'
        }`}
        title={t('common.copy')}
        aria-label={t('common.copy')}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t('common.copied') : t('common.copy')}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-lg bg-card border border-line shadow-lg overflow-hidden z-50">
          {items.map((it) => (
            <button
              key={it.kind}
              type="button"
              onClick={() => void doCopy(it.kind)}
              className="w-full px-3 py-2 text-sm text-content-soft hover:bg-subtle text-left"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
