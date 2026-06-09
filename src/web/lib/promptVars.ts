/**
 * Detect and fill `{{variable}}` / `[VARIABLE]` placeholders in prompt text.
 *
 * `[...]` tokens immediately followed by `(` are treated as Markdown links and
 * ignored; `[ ]` / `[x]` task-list markers are ignored too.
 */

export interface PromptVariable {
  /** The raw token incl. delimiters, e.g. "{{topic}}" or "[SUBJECT]". */
  token: string;
  /** The inner name, e.g. "topic" or "SUBJECT". */
  name: string;
}

const CURLY_RE = /\{\{\s*([^{}\n]{1,60}?)\s*\}\}/g;
const SQUARE_RE = /\[\s*([^\]\n]{1,60}?)\s*\]/g;

/** Unique placeholders in document order. */
export function extractVariables(text: string): PromptVariable[] {
  if (!text) return [];
  const seen = new Map<string, PromptVariable>();
  let m: RegExpExecArray | null;

  CURLY_RE.lastIndex = 0;
  while ((m = CURLY_RE.exec(text))) {
    const name = m[1].trim();
    if (name && !seen.has(m[0])) seen.set(m[0], { token: m[0], name });
  }

  SQUARE_RE.lastIndex = 0;
  while ((m = SQUARE_RE.exec(text))) {
    if (text[m.index + m[0].length] === '(') continue; // Markdown link
    const name = m[1].trim();
    if (!name || name.toLowerCase() === 'x') continue; // task-list marker [ ] / [x] / [X]
    if (!seen.has(m[0])) seen.set(m[0], { token: m[0], name });
  }

  return [...seen.values()];
}

export function hasVariables(text: string): boolean {
  return extractVariables(text).length > 0;
}

/**
 * Replace each placeholder token with its filled value. Empty values leave the
 * original placeholder untouched. `values` is keyed by the raw token.
 */
export function fillTemplate(text: string, values: Record<string, string>): string {
  let out = text;
  for (const { token } of extractVariables(text)) {
    const value = values[token];
    if (value == null || value === '') continue;
    out = out.split(token).join(value);
  }
  return out;
}
