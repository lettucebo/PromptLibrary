import { useQuery } from '@tanstack/react-query';
import { fetchLabels, parseLabel } from '../lib/github';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';

export function useLabels() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['labels', token],
    queryFn: () => fetchLabels(token!),
    enabled: !!token,
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
