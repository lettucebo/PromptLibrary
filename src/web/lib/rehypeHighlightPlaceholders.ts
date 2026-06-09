/**
 * rehype plugin that wraps `{{variable}}` / `[VARIABLE]` placeholders in read-only
 * Markdown with a styled <mark>, so readers can spot fill-in slots at a glance.
 *
 * Runs before rehype-sanitize; the shared Markdown schema (components/Markdown.tsx)
 * allows <mark class>. Highlights inside code/pre too (this app renders code
 * without a syntax highlighter, so it is safe). Dependency-free (no
 * unist-util-visit) to avoid pulling an undeclared package.
 */

interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

const HAS = /(\{\{[^{}\n]{1,60}\}\}|\[[^\]\n]{1,60}\])/;
const SPLIT = /(\{\{[^{}\n]{1,60}\}\}|\[[^\]\n]{1,60}\])/g;

function makeMark(value: string): HNode {
  return {
    type: 'element',
    tagName: 'mark',
    properties: { className: ['pl-ph', 'rounded', 'px-0.5', 'bg-primary/15', 'text-primary', 'font-medium'] },
    children: [{ type: 'text', value }],
  };
}

function splitText(value: string): HNode[] {
  const parts: HNode[] = [];
  let last = 0;
  SPLIT.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPLIT.exec(value))) {
    if (m.index > last) parts.push({ type: 'text', value: value.slice(last, m.index) });
    parts.push(makeMark(m[0]));
    last = m.index + m[0].length;
  }
  if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
  return parts;
}

function walk(node: HNode): void {
  if (!node.children) return;
  const out: HNode[] = [];
  for (const child of node.children) {
    if (child.type === 'element') {
      // Skip the <mark> nodes we create to avoid re-processing; descend into
      // everything else (including code/pre — no syntax highlighter is used).
      if (child.tagName === 'mark') {
        out.push(child);
        continue;
      }
      walk(child);
      out.push(child);
    } else if (child.type === 'text' && child.value && HAS.test(child.value)) {
      out.push(...splitText(child.value));
    } else {
      out.push(child);
    }
  }
  node.children = out;
}

export default function rehypeHighlightPlaceholders() {
  return (tree: HNode): void => {
    walk(tree);
  };
}
