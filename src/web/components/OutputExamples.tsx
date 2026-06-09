import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OutputExample } from '../types';
import { parseYouTubeId, youtubeEmbedUrl } from '../lib/youtube';
import Markdown from './Markdown';
import Modal from './Modal';

/** Privacy-preserving 16:9 YouTube embed built from a validated video id. */
function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = parseYouTubeId(url);
  if (!id) return null;
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-line bg-subtle"
      style={{ aspectRatio: '16 / 9' }}
    >
      <iframe
        src={youtubeEmbedUrl(id)}
        title={title}
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

/**
 * Read-only gallery of a prompt's typed output examples (YouTube / image /
 * text). Renders nothing when there are no valid items.
 */
export default function OutputExamples({ outputs }: { outputs: OutputExample[] }) {
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState<{ url: string; caption?: string } | null>(null);

  const valid = outputs.filter((o) => (o.type === 'youtube' ? parseYouTubeId(o.url) !== null : true));
  if (valid.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-line p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-content uppercase tracking-wider">
          {t('prompt.outputHeading')}
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
          {valid.length}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {valid.map((o, i) => (
          <figure
            key={i}
            className={o.type === 'text' ? 'sm:col-span-2 space-y-2' : 'space-y-2'}
          >
            {o.type === 'youtube' && (
              <YouTubeEmbed url={o.url} title={o.caption || t('prompt.output.videoExample')} />
            )}
            {o.type === 'image' && (
              <button
                type="button"
                onClick={() => setLightbox({ url: o.url, caption: o.caption })}
                className="block w-full overflow-hidden rounded-lg border border-line hover:border-primary transition-colors"
                aria-label={t('prompt.output.viewImage')}
              >
                <img src={o.url} alt={o.caption || ''} className="w-full h-auto" loading="lazy" />
              </button>
            )}
            {o.type === 'text' && (
              <div className="rounded-lg border border-line bg-subtle p-3">
                <Markdown>{o.text}</Markdown>
              </div>
            )}
            {o.caption && <figcaption className="text-xs text-content-faint">{o.caption}</figcaption>}
          </figure>
        ))}
      </div>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} className="max-w-3xl" title={lightbox?.caption}>
        {lightbox && <img src={lightbox.url} alt={lightbox.caption || ''} className="w-full h-auto rounded-lg" />}
      </Modal>
    </div>
  );
}
