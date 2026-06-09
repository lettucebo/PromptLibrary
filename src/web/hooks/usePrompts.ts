import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archivePrompt,
  createComment,
  createPrompt,
  deleteComment,
  fetchPrompt,
  fetchPromptComments,
  fetchPrompts,
  getDefaultBranch,
  restorePrompt,
  searchPrompts,
  updateComment,
  updatePrompt,
  uploadAttachment,
} from '../lib/github';
import type { PromptSort, SortOrder } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: () => fetchPrompts(),
    staleTime: 5 * 60 * 1000,
  });
}

export interface SearchPromptsArgs {
  text: string;
  filters: Partial<Record<'model' | 'type' | 'usecase' | 'output' | 'lang' | 'difficulty', string[]>>;
  sort: PromptSort;
  order: SortOrder;
}

/** Infinite, server-side search over prompt issues (GitHub Search API). */
export function useSearchPrompts(args: SearchPromptsArgs) {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: ['prompts', 'search', args.text, args.sort, args.order, args.filters],
    queryFn: ({ pageParam }) =>
      searchPrompts({
        text: args.text,
        filters: args.filters,
        sort: args.sort,
        order: args.order,
        page: pageParam,
        token: session?.token,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    staleTime: 60 * 1000,
  });
}

/** Prefetch a single prompt (used for hover prefetch on cards). */
export function usePrefetchPrompt() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return (issueNumber: number) =>
    void qc.prefetchQuery({
      queryKey: ['prompt', issueNumber],
      queryFn: () => fetchPrompt(issueNumber, session?.token),
      staleTime: 5 * 60 * 1000,
    });
}

export function usePrompt(issueNumber: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['prompt', issueNumber],
    queryFn: () => fetchPrompt(issueNumber, session?.token),
    enabled: !!issueNumber,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePromptComments(issueNumber: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['prompt-comments', issueNumber],
    queryFn: () => fetchPromptComments(issueNumber, session?.token),
    enabled: !!issueNumber,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDefaultBranch() {
  return useQuery({
    queryKey: ['default-branch'],
    queryFn: () => getDefaultBranch(),
    staleTime: Infinity,
  });
}

export function useCreatePrompt() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (input: { title: string; body: string; labels: string[] }) => {
      if (!session) throw new Error('not authenticated');
      return createPrompt(session.token, input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}

export function useUpdatePrompt() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (input: { issueNumber: number; title?: string; body?: string; labels?: string[] }) => {
      if (!session) throw new Error('not authenticated');
      const { issueNumber, ...rest } = input;
      return updatePrompt(session.token, issueNumber, rest);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['prompts'] });
      void qc.invalidateQueries({ queryKey: ['prompt', vars.issueNumber] });
    },
  });
}

export function useArchivePrompt() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (issueNumber: number) => {
      if (!session) throw new Error('not authenticated');
      return archivePrompt(session.token, issueNumber);
    },
    onSuccess: (_data, issueNumber) => {
      void qc.invalidateQueries({ queryKey: ['prompts'] });
      void qc.invalidateQueries({ queryKey: ['prompt', issueNumber] });
    },
  });
}

export function useRestorePrompt() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (issueNumber: number) => {
      if (!session) throw new Error('not authenticated');
      return restorePrompt(session.token, issueNumber);
    },
    onSuccess: (_data, issueNumber) => {
      void qc.invalidateQueries({ queryKey: ['prompts'] });
      void qc.invalidateQueries({ queryKey: ['prompt', issueNumber] });
    },
  });
}

export function useUploadAttachment() {
  const { session } = useAuth();
  const { data: branch } = useDefaultBranch();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!session) throw new Error('not authenticated');
      if (!branch) throw new Error('default branch not loaded');
      return uploadAttachment(session.token, branch, file);
    },
  });
}

export function useCreateComment(issueNumber: number) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (body: string) => {
      if (!session) throw new Error('not authenticated');
      return createComment(session.token, issueNumber, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prompt-comments', issueNumber] });
      void qc.invalidateQueries({ queryKey: ['prompt', issueNumber] });
    },
  });
}

export function useUpdateComment(issueNumber: number) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (input: { commentId: number; body: string }) => {
      if (!session) throw new Error('not authenticated');
      return updateComment(session.token, input.commentId, input.body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prompt-comments', issueNumber] });
    },
  });
}

export function useDeleteComment(issueNumber: number) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (commentId: number) => {
      if (!session) throw new Error('not authenticated');
      return deleteComment(session.token, commentId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prompt-comments', issueNumber] });
      void qc.invalidateQueries({ queryKey: ['prompt', issueNumber] });
    },
  });
}
