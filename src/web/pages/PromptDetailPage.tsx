import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Pencil,
  Archive,
  ArchiveRestore,
  Plus,
  Trash2,
  Share2,
  GitCompare,
  Hash,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { diffLines } from 'diff';
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
import { useToast } from '../contexts/ToastContext';
import { config } from '../config';
import { copyText } from '../lib/clipboard';
import { errorMessageKey } from '../lib/errors';
import { countChars, estimateTokens } from '../lib/tokens';
import { promptForLang } from '../lib/promptLang';
import LabelBadge from '../components/LabelBadge';
import FavoriteButton from '../components/FavoriteButton';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentEditor from '../components/CommentEditor';
import CopyButton from '../components/CopyButton';
import CopyMenu from '../components/CopyMenu';
import VariableFiller from '../components/VariableFiller';
import RelatedPrompts from '../components/RelatedPrompts';
import OutputExamples from '../components/OutputExamples';
import { addRecentlyViewed } from '../lib/recentlyViewed';
import { snapshotFromPrompt } from '../lib/collections';
import ConfirmDialog from '../components/ConfirmDialog';
import Markdown from '../components/Markdown';
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

function VersionBadge({ version }: { version: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
      v{version}
    </span>
  );
}

function VersionDiff({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = diffLines(oldText, newText);
  const rows: { type: 'add' | 'del' | 'ctx'; text: string }[] = [];
  for (const part of parts) {
    const type = part.added ? 'add' : part.removed ? 'del' : 'ctx';
    const lines = part.value.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    for (const line of lines) rows.push({ type, text: line });
  }
  return (
    <pre className="text-xs leading-5 rounded-lg overflow-x-auto border border-line bg-subtle p-2">
      {rows.map((r, i) => (
        <div
          key={i}
          className={
            r.type === 'add'
              ? 'bg-success-container text-accent-green'
              : r.type === 'del'
                ? 'bg-error-container text-accent-red'
                : 'text-content-soft'
          }
        >
          <span className="select-none inline-block w-4 text-center opacity-60">
            {r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '}
          </span>
          <span className="whitespace-pre-wrap break-words">{r.text || ' '}</span>
        </div>
      ))}
    </pre>
  );
}

function CommentCard({
  comment,
  issueNumber,
  version,
  previousText,
}: {
  comment: PromptComment;
  issueNumber: number;
  version: number;
  previousText: string;
}) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const { session } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateMut = useUpdateComment(issueNumber);
  const deleteMut = useDeleteComment(issueNumber);
  const isAuthor = !!session && !!comment.user && session.user.login === comment.user.login;

  const onSave = async (body: string) => {
    try {
      await updateMut.mutateAsync({ commentId: comment.id, body });
      setEditing(false);
      toast.success('toast.versionUpdated');
    } catch (e) {
      toast.error(errorMessageKey(e));
    }
  };

  const onDelete = () => {
    deleteMut.mutate(comment.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        toast.success('toast.versionDeleted');
      },
      onError: (e) => toast.error(errorMessageKey(e)),
    });
  };

  return (
    <div className="bg-card rounded-xl border border-line p-5">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <VersionBadge version={version} />
          {comment.user && (
            <img src={comment.user.avatar_url} alt={comment.user.login} className="h-7 w-7 rounded-full" />
          )}
          <span className="text-sm font-medium text-content-soft truncate">
            {comment.user?.login ?? t('comment.unknownAuthor')}
          </span>
          <span className="hidden sm:flex items-center gap-1 text-xs text-content-faint">
            <Calendar className="h-3 w-3" />
            {formatDate(comment.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowDiff((v) => !v)}
            className={`p-1.5 rounded-md hover:bg-subtle ${
              showDiff ? 'text-primary' : 'text-content-faint hover:text-primary'
            }`}
            title={t('prompt.compareWithPrevious')}
            aria-label={t('prompt.compareWithPrevious')}
          >
            <GitCompare className="h-3.5 w-3.5" />
          </button>
          {isAuthor && !editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-content-faint hover:text-primary hover:bg-subtle"
                title={t('comment.edit')}
                aria-label={t('comment.edit')}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={deleteMut.isPending}
                className="p-1.5 rounded-md text-content-faint hover:text-error hover:bg-subtle disabled:opacity-50"
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
      ) : showDiff ? (
        <VersionDiff oldText={previousText} newText={comment.body} />
      ) : (
        <Markdown>{comment.body}</Markdown>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t('prompt.deleteCommentConfirmTitle')}
        body={t('prompt.deleteCommentConfirm')}
        confirmLabel={t('comment.delete')}
        tone="danger"
        isPending={deleteMut.isPending}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default function PromptDetailPage() {
  const { t, i18n } = useTranslation();
  const formatDate = useFormatDate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const issueNumber = parseInt(id ?? '0', 10);

  const { isAuthenticated } = useAuth();
  const { data: prompt, isLoading: loadingPrompt } = usePrompt(issueNumber);
  const { data: comments = [], isLoading: loadingComments } = usePromptComments(issueNumber);
  const archiveMut = useArchivePrompt();
  const restoreMut = useRestorePrompt();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const isArchived = prompt?.labels.some((l) => l.name === config.archivedLabel) ?? false;

  useEffect(() => {
    if (prompt) addRecentlyViewed(snapshotFromPrompt(prompt));
  }, [prompt?.number, prompt?.title]);

  const handleArchive = () => {
    archiveMut.mutate(issueNumber, {
      onSuccess: () => {
        setConfirmArchive(false);
        toast.success('toast.archived');
      },
      onError: (e) => toast.error(errorMessageKey(e)),
    });
  };
  const handleRestore = () => {
    restoreMut.mutate(issueNumber, {
      onSuccess: () => toast.success('toast.restored'),
      onError: (e) => toast.error(errorMessageKey(e)),
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/prompt/${issueNumber}`;
    const ok = await copyText(url);
    if (ok) toast.success('toast.linkCopied');
    else toast.error('errors.copyFailed');
  };

  if (loadingPrompt) return <LoadingSpinner className="py-20" />;

  if (!prompt) {
    return (
      <div className="text-center py-20">
        <p className="text-content-soft">{t('prompt.notFound')}</p>
        <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          {t('prompt.back')}
        </Link>
      </div>
    );
  }

  const displayPrompt = promptForLang(prompt.promptText, i18n.language);

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-content-soft hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('prompt.back')}
      </Link>

      {isArchived && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/50 bg-warning-container px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-accent-yellow">
            <Archive className="h-4 w-4 flex-shrink-0" />
            <span>{t('prompt.archivedBanner')}</span>
          </div>
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoreMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-warning text-on-warning hover:bg-warning/90 disabled:opacity-50"
            >
              <ArchiveRestore className="h-4 w-4" />
              {t('prompt.restore')}
            </button>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-line p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-title text-2xl font-bold leading-tight text-content">{prompt.title}</h1>
          <div className="flex-shrink-0 flex items-center gap-1">
            <FavoriteButton snapshot={snapshotFromPrompt(prompt)} className="border border-line" />
            {isAuthenticated && (
              <>
                <Link
                  to={`/prompt/${issueNumber}/edit`}
                  className="p-2 rounded-lg text-content-faint hover:text-primary hover:bg-subtle"
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
                    className="p-2 rounded-lg text-content-faint hover:text-accent-green hover:bg-subtle disabled:opacity-50"
                    title={t('prompt.restore')}
                    aria-label={t('prompt.restore')}
                  >
                    <ArchiveRestore className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmArchive(true)}
                    disabled={archiveMut.isPending}
                    className="p-2 rounded-lg text-content-faint hover:text-error hover:bg-subtle disabled:opacity-50"
                    title={t('prompt.archive')}
                    aria-label={t('prompt.archive')}
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-lg text-content-faint hover:text-primary hover:bg-subtle transition-colors"
              title={t('prompt.share')}
              aria-label={t('prompt.share')}
            >
              <Share2 className="h-4 w-4" />
            </button>
            <a
              href={prompt.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-content-faint hover:text-content-soft hover:bg-subtle transition-colors"
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

        <div className="flex flex-wrap items-center gap-4 text-xs text-content-faint">
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
          {prompt.user && <span className="flex items-center gap-1">{t('prompt.by', { user: prompt.user.login })}</span>}
          {displayPrompt && (
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {t('common.charsTokens', {
                chars: countChars(displayPrompt),
                tokens: estimateTokens(displayPrompt),
              })}
            </span>
          )}
        </div>
      </div>

      <VariableFiller template={displayPrompt} />

      <div className="bg-card rounded-2xl border border-line p-6 mb-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <VersionBadge version={1} />
            <h2 className="text-sm font-semibold text-content-soft uppercase tracking-wider">
              {t('prompt.promptHeading')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <CopyMenu prompt={prompt} text={displayPrompt} />
          </div>
        </div>

        <Markdown>{displayPrompt}</Markdown>
      </div>

      {prompt.notes && (
        <div className="bg-card rounded-2xl border border-line p-6 mb-6">
          <h2 className="text-sm font-semibold text-content-soft uppercase tracking-wider mb-4">
            {t('prompt.notesHeading')}
          </h2>
          <Markdown>{promptForLang(prompt.notes, i18n.language)}</Markdown>
        </div>
      )}

      <OutputExamples outputs={prompt.outputs} />

      {(loadingComments || comments.length > 0) && (
        <div>
          <h2 className="text-base font-semibold text-content mb-4">
            {t('prompt.versionHistory')}
            {comments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-content-soft">
                {t('prompt.versionCount', { count: comments.length })}
              </span>
            )}
          </h2>

          {loadingComments && <LoadingSpinner />}

          <div className="space-y-4">
            {comments.map((comment, idx) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                issueNumber={issueNumber}
                version={idx + 2}
                previousText={idx === 0 ? prompt.promptText : comments[idx - 1].body}
              />
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && <AddVersionSection issueNumber={issueNumber} />}

      <RelatedPrompts prompt={prompt} />

      <ConfirmDialog
        open={confirmArchive}
        title={t('prompt.archiveConfirmTitle')}
        body={t('prompt.archiveConfirmBody')}
        confirmLabel={t('prompt.archiveConfirm')}
        tone="danger"
        isPending={archiveMut.isPending}
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}

function AddVersionSection({ issueNumber }: { issueNumber: number }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const createMut = useCreateComment(issueNumber);

  if (!open) {
    return (
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-card text-content-soft border border-line hover:bg-subtle"
        >
          <Plus className="h-4 w-4" />
          {t('prompt.addVersion')}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-6 bg-card rounded-2xl border border-line p-5">
      <h3 className="text-sm font-semibold text-content-soft mb-3">{t('prompt.addVersion')}</h3>
      <CommentEditor
        isPending={createMut.isPending}
        onSubmit={async (body) => {
          try {
            await createMut.mutateAsync(body);
            setOpen(false);
            toast.success('toast.versionAdded');
          } catch (e) {
            toast.error(errorMessageKey(e));
          }
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
