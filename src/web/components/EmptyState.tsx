import { FileQuestion } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  const { t } = useTranslation();
  const heading = title ?? t('empty.defaultTitle');
  const desc = description ?? t('empty.defaultDescription');
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileQuestion className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{heading}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}
