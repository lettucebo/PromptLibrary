/**
 * Lightweight, dependency-free character & token estimation.
 *
 * Token counts are approximations — no real tokenizer is bundled. The heuristic
 * follows the project guidance: CJK characters cost ~0.5 tokens each and other
 * characters ~0.25 tokens each (roughly "Chinese ÷2, English ÷4"). This aims to
 * land within ±15% of OpenAI tokenizers for typical prompt text. For higher
 * precision a real tokenizer (e.g. `gpt-tokenizer`) could be swapped in here
 * without touching call sites.
 */

// Common CJK / full-width ranges: CJK symbols & punctuation, Hiragana, Katakana,
// CJK Unified Ideographs (+Ext A), Hangul syllables, CJK compatibility ideographs,
// and half/full-width forms.
const CJK_RE =
  /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/;

/** Count user-perceived characters (code points; handles emoji/surrogate pairs). */
export function countChars(text: string): number {
  if (!text) return 0;
  return [...text].length;
}

/**
 * Rough token estimate. Not exact; see the module docs for the heuristic.
 * Returns 0 for empty input and at least 1 for any non-empty text.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (CJK_RE.test(ch)) cjk++;
    else other++;
  }
  const tokens = cjk / 2 + other / 4;
  return tokens > 0 ? Math.max(1, Math.round(tokens)) : 0;
}
