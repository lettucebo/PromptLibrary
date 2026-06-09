import { FileQuestion } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  const { t } = useTranslation();
  const heading = title ?? t('empty.defaultTitle');
  const desc = description ?? t('empty.defaultDescription');
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileQuestion className="h-16 w-16 text-content-faint mb-4" />
      <h3 className="text-lg font-medium text-content mb-2">{heading}</h3>
      <p className="text-sm text-content-soft">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
