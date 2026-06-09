/**
 * YouTube URL helpers for the output-example embeds.
 *
 * Embeds use the privacy-preserving `youtube-nocookie.com` origin (allow-listed
 * in the CSP `frame-src`). Only a validated 11-char video id is ever used to
 * build URLs, so no untrusted string reaches an iframe `src`.
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extract an 11-char YouTube video id from a URL or bare id, else `null`. */
export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (ID_RE.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.split('/')[1] ?? '';
    return ID_RE.test(id) ? id : null;
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v');
    if (v && ID_RE.test(v)) return v;
    const m = url.pathname.match(/^\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }

  return null;
}

/** True when the input contains a recognizable YouTube video id. */
export function isYouTubeUrl(input: string): boolean {
  return parseYouTubeId(input) !== null;
}

/** Privacy-preserving embed URL for a validated video id. */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

/** Thumbnail URL (served from i.ytimg.com; allow-listed in CSP `img-src`). */
export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
