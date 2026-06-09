import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import MDEditor, { commands as defaultCommands } from '@uiw/react-md-editor/nohighlight';
import { getCommands as getCommandsCN, getExtraCommands as getExtraCommandsCN } from '@uiw/react-md-editor/commands-cn';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import '@uiw/react-md-editor/markdown-editor.css';
import { useUploadAttachment } from '../hooks/usePrompts';
import { STORAGE_KEYS } from '../config';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  preview?: 'live' | 'edit' | 'preview';
  /** Called when an image upload fails. Provides translated error string. */
  onUploadError?: (message: string) => void;
}

const PREVIEW_OPTIONS = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [[rehypeSanitize]] as never,
};

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_IMAGE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 420,
  preview,
  onUploadError,
}: MarkdownEditorProps) {
  const { t, i18n } = useTranslation();
  const upload = useUploadAttachment();
  const valueRef = useRef(value);
  valueRef.current = value;

  // Keep MDEditor color mode in sync with the document's data-color-mode.
  // (Layout sets data-color-mode on <html>; MDEditor reads from `data-color-mode`.)
  useEffect(() => {
    const mode = localStorage.getItem(STORAGE_KEYS.THEME) === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-color-mode', mode);
  }, []);

  const effectivePreview = preview ?? (isMobileViewport() ? 'edit' : 'live');

  const localizedCommands = useMemo(() => {
    if (i18n.resolvedLanguage === 'zh-TW') {
      return { commands: getCommandsCN(), extraCommands: getExtraCommandsCN() };
    }
    return { commands: undefined, extraCommands: undefined };
  }, [i18n.resolvedLanguage]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        onUploadError?.(t('prompt.editor.uploadTypeError'));
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        onUploadError?.(t('prompt.editor.uploadSizeError', { max: MAX_IMAGE_MB }));
        return;
      }
      const placeholder = `![uploading...](pending-${crypto.randomUUID()})`;
      onChange(`${valueRef.current}${valueRef.current.endsWith('\n') ? '' : '\n'}${placeholder}\n`);
      try {
        const res = await upload.mutateAsync(file);
        const replacement = `![${file.name}](${res.url})`;
        const next = valueRef.current.replace(placeholder, replacement);
        onChange(next);
      } catch (err) {
        const next = valueRef.current.replace(`${placeholder}\n`, '').replace(placeholder, '');
        onChange(next);
        const msg = t('prompt.editor.uploadFailed', {
          error: err instanceof Error ? err.message : 'unknown',
        });
        onUploadError?.(msg);
      }
    },
    [onChange, onUploadError, t, upload],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) return;
      e.preventDefault();
      void (async () => {
        for (const file of images) await handleFile(file);
      })();
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const files = Array.from(e.dataTransfer?.files ?? []);
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) return;
      e.preventDefault();
      void (async () => {
        for (const file of images) await handleFile(file);
      })();
    },
    [handleFile],
  );

  return (
    <div
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
      }}
      data-color-mode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
    >
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        height={height}
        preview={effectivePreview}
        commands={localizedCommands.commands ?? defaultCommands.getCommands()}
        extraCommands={localizedCommands.extraCommands}
        previewOptions={PREVIEW_OPTIONS}
      />
      {upload.isPending && (
        <p className="mt-2 text-xs text-primary">
          {t('prompt.editor.uploading')}
        </p>
      )}
    </div>
  );
}
