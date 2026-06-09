import type { ParsedLabel } from '../types';

const categoryColors: Record<string, string> = {
  model: 'bg-info/15 text-accent-blue',
  type: 'bg-primary/15 text-primary',
  usecase: 'bg-success-container text-accent-green',
  lang: 'bg-warning-container text-accent-yellow',
  difficulty: 'bg-error-container text-accent-red',
  other: 'bg-subtle text-content-soft',
};

interface LabelBadgeProps {
  label: ParsedLabel;
  onClick?: () => void;
}

export default function LabelBadge({ label, onClick }: LabelBadgeProps) {
  const colorClass = categoryColors[label.category] ?? categoryColors.other;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={onClick}
    >
      {label.prefix && (
        <span className="opacity-60 mr-0.5">{label.prefix}</span>
      )}
      {label.value}
    </span>
  );
}
