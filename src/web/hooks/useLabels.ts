import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLabel,
  deleteLabel,
  fetchLabels,
  parseLabel,
  updateLabel,
} from '../lib/github';
import { config } from '../config';
import { useAuth } from '../contexts/AuthContext';

export function useLabels() {
  return useQuery({
    queryKey: ['labels'],
    queryFn: () => fetchLabels(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useGroupedLabels() {
  const { data: labels = [] } = useLabels();

  const grouped: Record<string, string[]> = {};
  for (const category of Object.keys(config.labelPrefixes)) {
    grouped[category] = [];
  }

  for (const label of labels) {
    const parsed = parseLabel(label);
    if (parsed.category !== 'other') {
      grouped[parsed.category] = grouped[parsed.category] || [];
      grouped[parsed.category].push(parsed.value);
    }
  }

  return grouped;
}

export function useCreateLabel() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (input: { name: string; color: string; description?: string }) => {
      if (!session) throw new Error('not authenticated');
      return createLabel(session.token, input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['labels'] });
    },
  });
}

export function useUpdateLabel() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (input: {
      currentName: string;
      newName?: string;
      color?: string;
      description?: string;
    }) => {
      if (!session) throw new Error('not authenticated');
      const { currentName, ...rest } = input;
      return updateLabel(session.token, currentName, rest);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['labels'] });
      void qc.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: (name: string) => {
      if (!session) throw new Error('not authenticated');
      return deleteLabel(session.token, name);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['labels'] });
      void qc.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}
