import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

const LANG_LABELS: Record<SupportedLanguage, string> = {
  'zh-TW': '繁體中文',
  en: 'English',
};

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage as SupportedLanguage) ?? 'zh-TW';

  return (
    <div className="relative">
      <select
        value={current}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        aria-label={t('nav.language')}
        className="appearance-none pl-8 pr-6 py-2 rounded-lg text-sm bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            {LANG_LABELS[lng]}
          </option>
        ))}
      </select>
      <Languages className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  );
}
