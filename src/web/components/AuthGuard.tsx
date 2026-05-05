import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps a route. If the user is not signed in, automatically triggers the
 * GitHub login flow with the current path as `returnTo`.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, startLogin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated) {
      startLogin(`${location.pathname}${location.search}${location.hash}`);
    }
  }, [isAuthenticated, location, startLogin]);

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center">
        <LoadingSpinner className="mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('auth.loginRequired')}</p>
      </div>
    );
  }
  return <>{children}</>;
}
