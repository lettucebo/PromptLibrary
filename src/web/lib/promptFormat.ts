import type { Prompt } from '../types';

/** Best-effort Markdown → plain text (for "copy as plain text"). */
export function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')        // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')      // links → label
    .replace(/^```[^\n]*$/gm, '')                  // fenced code markers
    .replace(/`([^`]+)`/g, '$1')                   // inline code
    .replace(/^#{1,6}\s+/gm, '')                   // headings
    .replace(/^\s*>\s?/gm, '')                      // blockquotes
    .replace(/^\s{0,3}[-*+]\s+/gm, '')              // bullet markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')              // bold
    .replace(/\*([^*]+)\*/g, '$1')                  // italic
    .replace(/__([^_]+)__/g, '$1')                  // bold
    .replace(/~~([^~]+)~~/g, '$1')                  // strikethrough
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Structured JSON export of a prompt. `promptText` overrides the copied body
 * (e.g. the language-resolved prompt) when provided. */
export function promptToJson(prompt: Prompt, promptText?: string): string {
  return JSON.stringify(
    {
      title: prompt.title,
      prompt: promptText ?? prompt.promptText,
      ...(prompt.notes ? { notes: prompt.notes } : {}),
      ...(prompt.outputs.length ? { outputs: prompt.outputs } : {}),
      labels: prompt.labels.map((l) => l.name),
      url: prompt.html_url,
    },
    null,
    2,
  );
}
