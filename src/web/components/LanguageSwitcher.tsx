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
        className="appearance-none pl-8 pr-6 py-2 rounded-lg text-sm bg-transparent text-content-soft hover:bg-subtle cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng} className="bg-card text-content">
            {LANG_LABELS[lng]}
          </option>
        ))}
      </select>
      <Languages className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-content-faint" />
    </div>
  );
}
