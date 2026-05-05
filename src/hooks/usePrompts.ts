import { useQuery } from '@tanstack/react-query';
import { fetchPrompts, fetchPrompt, fetchPromptComments } from '../lib/github';
import { useAuth } from '../contexts/AuthContext';

export function usePrompts() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['prompts', token],
    queryFn: () => fetchPrompts(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePrompt(issueNumber: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['prompt', issueNumber, token],
    queryFn: () => fetchPrompt(token!, issueNumber),
    enabled: !!token && !!issueNumber,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePromptComments(issueNumber: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['prompt-comments', issueNumber, token],
    queryFn: () => fetchPromptComments(token!, issueNumber),
    enabled: !!token && !!issueNumber,
    staleTime: 5 * 60 * 1000,
  });
}
