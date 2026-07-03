/** Strip common Markdown noise into a short plain-text preview. */
export function previewText(body: string, maxLen = 200): string {
  const stripped = body
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~]/g, '')
    .trim();
  if (stripped.length <= maxLen) return stripped;
  return stripped.slice(0, maxLen).trimEnd() + '…';
}
