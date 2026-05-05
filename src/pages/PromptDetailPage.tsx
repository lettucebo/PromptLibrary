import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Calendar, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePrompt, usePromptComments } from '../hooks/usePrompts';
import LabelBadge from '../components/LabelBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import type { PromptComment } from '../types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        copied
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function CommentCard({ comment }: { comment: PromptComment }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {comment.user && (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.login}
              className="h-7 w-7 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {comment.user?.login ?? 'Unknown'}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Calendar className="h-3 w-3" />
            {formatDate(comment.created_at)}
          </span>
        </div>
        <CopyButton text={comment.body} />
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
      </div>
    </div>
  );
}

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const issueNumber = parseInt(id ?? '0', 10);

  const { data: prompt, isLoading: loadingPrompt } = usePrompt(issueNumber);
  const { data: comments = [], isLoading: loadingComments } = usePromptComments(issueNumber);

  if (loadingPrompt) return <LoadingSpinner className="py-20" />;

  if (!prompt) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Prompt not found.</p>
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mt-2 inline-block">
          ← Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Library
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {prompt.title}
          </h1>
          <a
            href={prompt.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="View on GitHub"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {prompt.parsedLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {prompt.parsedLabels.map((label) => (
              <LabelBadge key={label.raw.id} label={label} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Created {formatDate(prompt.created_at)}
          </span>
          {prompt.updated_at !== prompt.created_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Updated {formatDate(prompt.updated_at)}
            </span>
          )}
          {prompt.user && (
            <span className="flex items-center gap-1">
              by {prompt.user.login}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Prompt
          </h2>
          <CopyButton text={prompt.body} />
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{prompt.body}</ReactMarkdown>
        </div>
      </div>

      {(loadingComments || comments.length > 0) && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            版本紀錄 (Version History)
            {comments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                {comments.length} version{comments.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>

          {loadingComments && <LoadingSpinner />}

          <div className="space-y-4">
            {comments.map((comment, idx) => (
              <div key={comment.id} className="relative">
                <div className="absolute -left-3 top-5 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold hidden sm:flex">
                  v{idx + 2}
                </div>
                <div className="sm:ml-6">
                  <CommentCard comment={comment} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
