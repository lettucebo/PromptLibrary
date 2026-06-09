import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Sun, Moon, LogIn, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Navbar({ darkMode, onToggleDark }: NavbarProps) {
  const { t } = useTranslation();
  const { isAuthenticated, startLogin } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = () => {
    setLoggingIn(true);
    startLogin();
  };
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline">{t('nav.appName')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={darkMode ? t('nav.lightMode') : t('nav.darkMode')}
            aria-label={darkMode ? t('nav.lightMode') : t('nav.darkMode')}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              disabled={loggingIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              <span className="hidden sm:inline">{loggingIn ? t('common.loading') : t('nav.login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


