/**
 * Maps GitHub / network errors to friendly i18n keys and exposes rate-limit
 * detection used by the search-backed list and mutation feedback.
 */

interface HttpLikeError {
  status?: number;
  message?: string;
  response?: {
    headers?: Record<string, string>;
  };
}

function asHttpError(err: unknown): HttpLikeError {
  return (err ?? {}) as HttpLikeError;
}

/** True when the error is a GitHub primary/secondary rate-limit rejection. */
export function isRateLimitError(err: unknown): boolean {
  const e = asHttpError(err);
  if (e.status === 429) return true;
  if (e.status === 403 || e.status === 422) {
    const remaining = e.response?.headers?.['x-ratelimit-remaining'];
    if (remaining === '0') return true;
    const msg = (e.message ?? '').toLowerCase();
    if (msg.includes('rate limit') || msg.includes('secondary rate')) return true;
  }
  return false;
}

/** Epoch seconds when the rate limit resets, if the header is present. */
export function rateLimitResetSeconds(err: unknown): number | null {
  const reset = asHttpError(err).response?.headers?.['x-ratelimit-reset'];
  if (!reset) return null;
  const n = Number(reset);
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolve an error to an i18n key under the `errors.*` namespace.
 * Falls back to `errors.unknown` so the UI never shows a raw stack/message.
 */
export function errorMessageKey(err: unknown): string {
  if (isRateLimitError(err)) return 'errors.rateLimited';
  const e = asHttpError(err);
  switch (e.status) {
    case 401:
      return 'errors.unauthorized';
    case 403:
      return 'errors.forbidden';
    case 404:
      return 'errors.notFound';
    case 422:
      return 'errors.validation';
    default:
      break;
  }
  const msg = (e.message ?? '').toLowerCase();
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'errors.network';
  return 'errors.unknown';
}
