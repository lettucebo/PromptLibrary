import { useQuery } from '@tanstack/react-query';
import { fetchLabels, parseLabel } from '../lib/github';
import { config } from '../config';

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
