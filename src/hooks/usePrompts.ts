import { useQuery } from '@tanstack/react-query';
import { fetchPrompts, fetchPrompt, fetchPromptComments } from '../lib/github';

export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: () => fetchPrompts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePrompt(issueNumber: number) {
  return useQuery({
    queryKey: ['prompt', issueNumber],
    queryFn: () => fetchPrompt(issueNumber),
    enabled: !!issueNumber,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePromptComments(issueNumber: number) {
  return useQuery({
    queryKey: ['prompt-comments', issueNumber],
    queryFn: () => fetchPromptComments(issueNumber),
    enabled: !!issueNumber,
    staleTime: 5 * 60 * 1000,
  });
}
