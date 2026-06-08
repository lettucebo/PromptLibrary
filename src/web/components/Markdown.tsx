import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Shared read-only Markdown renderer. Always applies `rehype-sanitize` so every
 * public surface (prompt body, comments, …) renders consistently and safely.
 */
export default function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className ?? 'prose prose-sm dark:prose-invert max-w-none'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
