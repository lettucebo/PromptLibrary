import type { OutputExample } from '../types';
import { parseYouTubeId, youtubeThumbnailUrl } from './youtube';

export type ThumbKind = 'image' | 'video';
export interface Thumb {
  url: string;
  kind: ThumbKind;
}

/**
 * Pick a card thumbnail from a prompt's outputs: first image output, else a
 * thumbnail from the first valid YouTube output (marked as a video so the card
 * can overlay a play affordance).
 */
export function deriveThumb(outputs: OutputExample[]): Thumb | null {
  for (const o of outputs) {
    if (o.type === 'image') return { url: o.url, kind: 'image' };
  }
  for (const o of outputs) {
    if (o.type === 'youtube') {
      const id = parseYouTubeId(o.url);
      if (id) return { url: youtubeThumbnailUrl(id), kind: 'video' };
    }
  }
  return null;
}

/** True when any output is a playable YouTube video (even if the thumb is an image). */
export function hasVideoOutput(outputs: OutputExample[]): boolean {
  return outputs.some((o) => o.type === 'youtube' && parseYouTubeId(o.url) !== null);
}
