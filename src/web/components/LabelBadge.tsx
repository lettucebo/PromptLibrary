import type { ParsedLabel } from '../types';

const categoryColors: Record<string, string> = {
  model: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  type: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  usecase: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  lang: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  difficulty: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
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
