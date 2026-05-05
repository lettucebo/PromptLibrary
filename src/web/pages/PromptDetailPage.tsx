import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Calendar, ExternalLink, Pencil, Archive, ArchiveRestore, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useArchivePrompt,
  useCreateComment,
  useDeleteComment,
  usePrompt,
  usePromptComments,
  useRestorePrompt,
  useUpdateComment,
} from '../hooks/usePrompts';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';
import LabelBadge from '../components/LabelBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentEditor from '../components/CommentEditor';
import type { PromptComment } from '../types';

function useFormatDate() {
  const { i18n } = useTranslation();
  return (dateStr: string) =>
    new Date(dateStr).toLocaleString(i18n.resolvedLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const { t } = useTranslation();
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
      {copied ? t('common.copied') : t('common.copy')}
    </button>
  );
}

function CommentCard({ comment, issueNumber }: { comment: PromptComment; issueNumber: number }) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const { session } = useAuth();
  const [editing, setEditing] = useState(false);
  const updateMut = useUpdateComment(issueNumber);
  const deleteMut = useDeleteComment(issueNumber);
  const isAuthor = !!session && !!comment.user && session.user.login === comment.user.login;

  const onSave = async (body: string) => {
    await updateMut.mutateAsync({ commentId: comment.id, body });
    setEditing(false);
  };
  const onDelete = () => {
    if (!window.confirm(t('prompt.deleteCommentConfirm'))) return;
    deleteMut.mutate(comment.id);
  };

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
        <div className="flex items-center gap-1">
          {isAuthor && !editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                title={t('comment.edit')}
                aria-label={t('comment.edit')}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleteMut.isPending}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                title={t('comment.delete')}
                aria-label={t('comment.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <CopyButton text={comment.body} />
        </div>
      </div>

      {editing ? (
        <CommentEditor
          initialValue={comment.body}
          isPending={updateMut.isPending}
          onSubmit={onSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default function PromptDetailPage() {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const { id } = useParams<{ id: string }>();
  const issueNumber = parseInt(id ?? '0', 10);

  const { isAuthenticated } = useAuth();
  const { data: prompt, isLoading: loadingPrompt } = usePrompt(issueNumber);
  const { data: comments = [], isLoading: loadingComments } = usePromptComments(issueNumber);
  const archiveMut = useArchivePrompt();
  const restoreMut = useRestorePrompt();

  const isArchived = prompt?.labels.some((l) => l.name === config.archivedLabel) ?? false;

  const handleArchive = () => {
    if (!window.confirm(`${t('prompt.archiveConfirmTitle')}\n\n${t('prompt.archiveConfirmBody')}`)) return;
    archiveMut.mutate(issueNumber);
  };
  const handleRestore = () => {
    restoreMut.mutate(issueNumber);
  };

  if (loadingPrompt) return <LoadingSpinner className="py-20" />;

  if (!prompt) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">{t('prompt.notFound')}</p>
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mt-2 inline-block">
          ← {t('prompt.back')}
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
        {t('prompt.back')}
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {prompt.title}
          </h1>
          <div className="flex-shrink-0 flex items-center gap-1">
            {isAuthenticated && (
              <>
                <Link
                  to={`/prompt/${issueNumber}/edit`}
                  className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={t('prompt.edit')}
                  aria-label={t('prompt.edit')}
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                {isArchived ? (
                  <button
                    type="button"
                    onClick={handleRestore}
                    disabled={restoreMut.isPending}
                    className="p-2 rounded-lg text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    title={t('prompt.restore')}
                    aria-label={t('prompt.restore')}
                  >
                    <ArchiveRestore className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={archiveMut.isPending}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    title={t('prompt.archive')}
                    aria-label={t('prompt.archive')}
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            <a
              href={prompt.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('prompt.viewOnGitHub')}
              aria-label={t('prompt.viewOnGitHub')}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
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
            {t('prompt.createdAt', { date: formatDate(prompt.created_at) })}
          </span>
          {prompt.updated_at !== prompt.created_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {t('prompt.updatedAt', { date: formatDate(prompt.updated_at) })}
            </span>
          )}
          {prompt.user && (
            <span className="flex items-center gap-1">
              {t('prompt.by', { user: prompt.user.login })}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            {t('prompt.promptHeading')}
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
            {t('prompt.versionHistory')}
            {comments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                {t('prompt.versionCount', { count: comments.length })}
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
                  <CommentCard comment={comment} issueNumber={issueNumber} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && (
        <AddVersionSection issueNumber={issueNumber} />
      )}
    </div>
  );
}

function AddVersionSection({ issueNumber }: { issueNumber: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const createMut = useCreateComment(issueNumber);

  if (!open) {
    return (
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          {t('prompt.addVersion')}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('prompt.addVersion')}</h3>
      <CommentEditor
        isPending={createMut.isPending}
        onSubmit={async (body) => {
          await createMut.mutateAsync(body);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
