import type { OutputExample } from '../types';

/**
 * Parse / serialize the structured prompt body stored in a GitHub issue.
 *
 * Format (Approach C): HTML-comment delimited text sections + a JSON-typed
 * outputs list. Comments are invisible when the issue is viewed directly on
 * GitHub.
 *
 *   <!-- pl:prompt:start -->
 *   ...the copyable prompt...
 *   <!-- pl:prompt:end -->
 *
 *   <!-- pl:notes:start -->
 *   ...optional notes (not copied)...
 *   <!-- pl:notes:end -->
 *
 *   <!-- pl:outputs
 *   [{"type":"youtube","url":"..."}, ...]
 *   -->
 *
 * Backward compatible: a body with no markers is treated entirely as the
 * prompt, so legacy prompts copy correctly without migration. A malformed
 * outputs block degrades gracefully to an empty list.
 */

export interface ParsedPromptBody {
  prompt: string;
  notes: string;
  outputs: OutputExample[];
}

const PROMPT_RE = /<!--\s*pl:prompt:start\s*-->\s*([\s\S]*?)\s*<!--\s*pl:prompt:end\s*-->/;
const NOTES_RE = /<!--\s*pl:notes:start\s*-->\s*([\s\S]*?)\s*<!--\s*pl:notes:end\s*-->/;
const OUTPUTS_RE = /<!--\s*pl:outputs\s*([\s\S]*?)-->/;

function extractBlock(src: string, re: RegExp): string | null {
  const m = src.match(re);
  return m ? m[1] : null;
}

function isValidOutput(o: unknown): o is OutputExample {
  if (!o || typeof o !== 'object') return false;
  const rec = o as Record<string, unknown>;
  if (rec.type === 'youtube' || rec.type === 'image') {
    return typeof rec.url === 'string' && rec.url.length > 0;
  }
  if (rec.type === 'text') {
    return typeof rec.text === 'string';
  }
  return false;
}

function parseOutputs(raw: string | null): OutputExample[] {
  if (!raw || !raw.trim()) return [];
  try {
    const data = JSON.parse(raw.trim());
    if (!Array.isArray(data)) return [];
    return data.filter(isValidOutput);
  } catch {
    return [];
  }
}

export function parsePromptBody(body: string | null | undefined): ParsedPromptBody {
  const src = body ?? '';

  const marked = extractBlock(src, PROMPT_RE);
  // Search notes/outputs outside the prompt section so marker-like text typed
  // inside the prompt can't hijack the metadata blocks.
  const meta = marked !== null ? src.replace(PROMPT_RE, '') : src;

  const notes = extractBlock(meta, NOTES_RE);
  const outputs = parseOutputs(extractBlock(meta, OUTPUTS_RE));

  const prompt =
    marked !== null ? marked : src.replace(NOTES_RE, '').replace(OUTPUTS_RE, '').trim();

  return {
    prompt: prompt.trim(),
    notes: (notes ?? '').trim(),
    outputs,
  };
}

/** Keep only known fields so we never persist arbitrary data. */
function sanitizeOutputs(outputs: OutputExample[]): OutputExample[] {
  const out: OutputExample[] = [];
  for (const o of outputs) {
    const caption = o.caption?.trim();
    if (o.type === 'text') {
      if (!o.text.trim()) continue;
      out.push({ type: 'text', text: o.text, ...(caption ? { caption } : {}) });
    } else {
      if (!o.url.trim()) continue;
      out.push({ type: o.type, url: o.url.trim(), ...(caption ? { caption } : {}) });
    }
  }
  return out;
}

export function serializePromptBody(input: ParsedPromptBody): string {
  const prompt = (input.prompt ?? '').trim();
  const notes = (input.notes ?? '').trim();
  const outputs = sanitizeOutputs(input.outputs ?? []);

  // Keep simple prompts marker-free for a clean view on GitHub.
  if (!notes && outputs.length === 0) return prompt;

  const parts: string[] = [`<!-- pl:prompt:start -->\n${prompt}\n<!-- pl:prompt:end -->`];
  if (notes) parts.push(`<!-- pl:notes:start -->\n${notes}\n<!-- pl:notes:end -->`);
  if (outputs.length > 0) {
    // Escape '>' as the JSON unicode escape so output text/captions can never
    // contain a stray '-->' that would terminate the comment early. JSON.parse
    // restores '\u003e' back to '>' transparently on read.
    const json = JSON.stringify(outputs, null, 2).replace(/>/g, '\\u003e');
    parts.push(`<!-- pl:outputs\n${json}\n-->`);
  }
  return parts.join('\n\n');
}
