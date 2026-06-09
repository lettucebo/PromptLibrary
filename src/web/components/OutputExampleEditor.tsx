import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Youtube, Type, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useUploadAttachment } from '../hooks/usePrompts';
import { parseYouTubeId, youtubeThumbnailUrl } from '../lib/youtube';
import type { OutputExample } from '../types';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_IMAGE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

interface Props {
  value: OutputExample[];
  onChange: (next: OutputExample[]) => void;
  /** Called when an image upload fails. Provides a translated error string. */
  onUploadError?: (message: string) => void;
}

/**
 * Editor for a prompt's typed output examples (image upload / YouTube link /
 * text). Supports add, remove and reorder. Images reuse the existing attachment
 * upload pipeline; video is YouTube-only (paste a link).
 */
export default function OutputExampleEditor({ value, onChange, onUploadError }: Props) {
  const { t } = useTranslation();
  const upload = useUploadAttachment();
  const fileRef = useRef<HTMLInputElement | null>(null);
  // Track the latest value so an append after a slow upload doesn't clobber
  // edits the user made while the upload was in flight.
  const valueRef = useRef(value);
  valueRef.current = value;

  const update = (i: number, patch: Partial<OutputExample>) =>
    onChange(value.map((o, idx) => (idx === i ? ({ ...o, ...patch } as OutputExample) : o)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addYouTube = () => onChange([...value, { type: 'youtube', url: '' }]);
  const addText = () => onChange([...value, { type: 'text', text: '' }]);

  const onFile = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onUploadError?.(t('prompt.editor.uploadTypeError'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onUploadError?.(t('prompt.editor.uploadSizeError', { max: MAX_IMAGE_MB }));
      return;
    }
    try {
      const res = await upload.mutateAsync(file);
      onChange([...valueRef.current, { type: 'image', url: res.url }]);
    } catch (err) {
      onUploadError?.(
        t('prompt.editor.uploadFailed', { error: err instanceof Error ? err.message : 'unknown' }),
      );
    }
  };

  const typeLabelKey = (type: OutputExample['type']) =>
    type === 'youtube' ? 'prompt.editor.outputTypeYouTube' : type === 'image' ? 'prompt.editor.outputTypeImage' : 'prompt.editor.outputTypeText';

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-xs text-content-faint">{t('prompt.editor.outputEmpty')}</p>}

      {value.map((o, i) => {
        const ytId = o.type === 'youtube' ? parseYouTubeId(o.url) : null;
        return (
          <div key={i} className="rounded-lg border border-line bg-subtle p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-content-soft">
                {o.type === 'image' && <ImageIcon className="h-3.5 w-3.5" />}
                {o.type === 'youtube' && <Youtube className="h-3.5 w-3.5" />}
                {o.type === 'text' && <Type className="h-3.5 w-3.5" />}
                {t(typeLabelKey(o.type))}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1 rounded text-content-faint hover:text-primary hover:bg-card disabled:opacity-40"
                  title={t('prompt.editor.outputMoveUp')}
                  aria-label={t('prompt.editor.outputMoveUp')}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="p-1 rounded text-content-faint hover:text-primary hover:bg-card disabled:opacity-40"
                  title={t('prompt.editor.outputMoveDown')}
                  aria-label={t('prompt.editor.outputMoveDown')}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1 rounded text-content-faint hover:text-error hover:bg-card"
                  title={t('prompt.editor.outputRemove')}
                  aria-label={t('prompt.editor.outputRemove')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {o.type === 'image' && (
              <img src={o.url} alt="" className="max-h-40 w-auto rounded border border-line" />
            )}

            {o.type === 'youtube' && (
              <>
                <input
                  type="url"
                  value={o.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder={t('prompt.editor.outputYouTubePlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-card text-content text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {o.url.trim() && !ytId && (
                  <p className="text-xs text-error">{t('prompt.editor.outputYouTubeInvalid')}</p>
                )}
                {ytId && (
                  <img src={youtubeThumbnailUrl(ytId)} alt="" className="max-h-32 w-auto rounded border border-line" />
                )}
              </>
            )}

            {o.type === 'text' && (
              <textarea
                value={o.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder={t('prompt.editor.outputTextPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-line bg-card text-content text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}

            <input
              type="text"
              value={o.caption ?? ''}
              onChange={(e) => update(i, { caption: e.target.value })}
              placeholder={t('prompt.editor.outputCaptionPlaceholder')}
              className="w-full px-3 py-1.5 rounded-lg border border-line bg-card text-content text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-card text-content-soft border border-line hover:bg-subtle disabled:opacity-50"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {t('prompt.editor.outputAddImage')}
        </button>
        <button
          type="button"
          onClick={addYouTube}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-card text-content-soft border border-line hover:bg-subtle"
        >
          <Youtube className="h-3.5 w-3.5" />
          {t('prompt.editor.outputAddYouTube')}
        </button>
        <button
          type="button"
          onClick={addText}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-card text-content-soft border border-line hover:bg-subtle"
        >
          <Type className="h-3.5 w-3.5" />
          {t('prompt.editor.outputAddText')}
        </button>
        {upload.isPending && (
          <span className="text-xs text-primary">{t('prompt.editor.outputImageUploading')}</span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
