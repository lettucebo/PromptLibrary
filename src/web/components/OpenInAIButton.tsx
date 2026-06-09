import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronDown } from 'lucide-react';
import { AI_TOOLS, aiUrl } from '../lib/aiTools';
import { copyText } from '../lib/clipboard';
import { useToast } from '../contexts/ToastContext';

interface OpenInAIButtonProps {
  text: string;
  /** Icon-only trigger (e.g. on cards). */
  compact?: boolean;
  className?: string;
  /** Prevent clicks bubbling to a clickable ancestor (e.g. a card link). */
  stopPropagation?: boolean;
}

/**
 * Opens the prompt in an external AI tool. The text is always copied to the
 * clipboard first so it works even when a tool has no prefill parameter or the
 * prompt is too long for a URL.
 */
export default function OpenInAIButton({
  text,
  compact = false,
  className = '',
  stopPropagation = false,
}: OpenInAIButtonProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const guard = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const openTool = (e: React.MouseEvent, toolId: string) => {
    guard(e);
    const tool = AI_TOOLS.find((x) => x.id === toolId);
    if (!tool) return;
    // Open synchronously within the user gesture so WebKit/iOS doesn't block the
    // popup; start the clipboard copy in the same tick (before focus shifts).
    void copyText(text);
    window.open(aiUrl(tool, text), '_blank', 'noopener,noreferrer');
    toast.success('toast.openedInAI', { tool: tool.label });
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          guard(e);
          setOpen((v) => !v);
        }}
        className={
          compact
            ? 'p-1.5 rounded-md bg-subtle text-content-soft hover:bg-line transition-colors'
            : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-dark transition-colors'
        }
        title={t('prompt.openInAI')}
        aria-label={t('prompt.openInAI')}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {!compact && (
          <>
            {t('prompt.openInAI')}
            <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg bg-card border border-line shadow-lg overflow-hidden z-50">
          {AI_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={(e) => openTool(e, tool.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-content-soft hover:bg-subtle text-left"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              {tool.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
