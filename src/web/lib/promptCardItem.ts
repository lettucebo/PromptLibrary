import type { Prompt, ParsedLabel } from '../types';
import type { PromptSnapshot } from './collections';
import type { Thumb } from './promptThumbnail';
import { deriveThumb, hasVideoOutput } from './promptThumbnail';
import { previewText } from './promptPreview';
import { parseLabel } from './github';

/**
 * Normalized shape consumed by <PromptCard>. Both full prompts (search results)
 * and lightweight localStorage snapshots (favorites / recent) convert to this,
 * so the same card renders in every context. `promptText` is only present for
 * full prompts and gates the quick-copy button.
 */
export interface PromptCardItem {
  number: number;
  title: string;
  parsedLabels: ParsedLabel[];
  preview: string;
  thumb: Thumb | null;
  hasVideo: boolean;
  comments: number;
  created_at: string;
  promptText?: string;
}

export function promptToCardItem(p: Prompt): PromptCardItem {
  return {
    number: p.number,
    title: p.title,
    parsedLabels: p.parsedLabels,
    preview: previewText(p.promptText || ''),
    thumb: deriveThumb(p.outputs),
    hasVideo: hasVideoOutput(p.outputs),
    comments: p.comments,
    created_at: p.created_at,
    promptText: p.promptText || undefined,
  };
}

export function snapshotToCardItem(s: PromptSnapshot): PromptCardItem {
  return {
    number: s.number,
    title: s.title,
    parsedLabels: (s.labels ?? []).map(parseLabel),
    preview: s.preview ?? '',
    thumb: s.thumb ?? null,
    hasVideo: s.hasVideo ?? false,
    comments: s.comments ?? 0,
    created_at: s.created_at ?? new Date(s.at ?? Date.now()).toISOString(),
  };
}

export function cardItemToSnapshot(item: PromptCardItem): PromptSnapshot {
  return {
    number: item.number,
    title: item.title,
    labels: item.parsedLabels.map((pl) => pl.raw),
    preview: item.preview,
    thumb: item.thumb,
    hasVideo: item.hasVideo,
    comments: item.comments,
    created_at: item.created_at,
    at: Date.now(),
  };
}
