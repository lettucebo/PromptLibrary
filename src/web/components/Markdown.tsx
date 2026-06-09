import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlightPlaceholders from '../lib/rehypeHighlightPlaceholders';

interface MarkdownProps {
  children: string;
  className?: string;
}

// Allow the <mark> + class emitted by rehypeHighlightPlaceholders through sanitize.
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'mark'],
  attributes: {
    ...defaultSchema.attributes,
    mark: [...((defaultSchema.attributes?.mark as unknown[]) ?? []), 'className'],
  },
};

/**
 * Shared read-only Markdown renderer. Always applies `rehype-sanitize` so every
 * public surface (prompt body, comments, …) renders consistently and safely.
 * Highlights `{{var}}` / `[VAR]` placeholders for quick scanning.
 */
export default function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className ?? 'prose prose-sm dark:prose-invert max-w-none'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlightPlaceholders, [rehypeSanitize, schema]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
