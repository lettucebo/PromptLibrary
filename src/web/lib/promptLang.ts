/**
 * Bilingual prompts store both languages inside the pl:prompt section, delimited
 * by language headings, e.g.:
 *
 *   ## 🇺🇸 English Version
 *   <english prompt>
 *   ## 🇹🇼 繁體中文版本
 *   <chinese prompt>
 *
 * `promptForLang` returns only the section matching the current UI language so
 * that display / copy / variable-fill give the language the user is viewing.
 * Non-bilingual prompts are returned unchanged.
 */

const EN_HEADING = /^#{1,6}\s+.*English Version.*$/im;
const ZH_HEADING = /^#{1,6}\s+.*(?:繁體中文|中文版).*$/im;

export function promptForLang(text: string | undefined, lang: string | undefined): string {
  if (!text) return text ?? '';
  const en = EN_HEADING.exec(text);
  const zh = ZH_HEADING.exec(text);
  if (!en || !zh) return text; // not the bilingual format → leave as-is

  let enBody: string;
  let zhBody: string;
  if (en.index < zh.index) {
    enBody = text.slice(en.index + en[0].length, zh.index).trim();
    zhBody = text.slice(zh.index + zh[0].length).trim();
  } else {
    zhBody = text.slice(zh.index + zh[0].length, en.index).trim();
    enBody = text.slice(en.index + en[0].length).trim();
  }

  const wantZh = (lang ?? '').toLowerCase().startsWith('zh');
  return (wantZh ? zhBody || enBody : enBody || zhBody) || text;
}
