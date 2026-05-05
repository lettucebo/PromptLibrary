import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthError } from '../lib/auth';

export default function AuthCallbackPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { exchange } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const errorCode = params.get('error');

    if (errorCode === 'access_denied') {
      setError(t('auth.userCancelled'));
      return;
    }
    if (errorCode) {
      setError(t('auth.exchangeFailed', { error: params.get('error_description') ?? errorCode }));
      return;
    }
    if (!code || !state) {
      setError(t('auth.exchangeFailed', { error: 'missing parameters' }));
      return;
    }

    void (async () => {
      try {
        const { returnTo } = await exchange(code, state);
        const target = returnTo && returnTo !== '/auth/callback' ? returnTo : '/';
        navigate(target, { replace: true });
      } catch (err) {
        if (err instanceof AuthError) {
          if (err.code === 'state_mismatch') setError(t('auth.stateMismatch'));
          else if (err.code === 'permission_denied') setError(t('auth.permissionDenied'));
          else setError(t('auth.exchangeFailed', { error: err.message }));
        } else {
          setError(
            t('auth.exchangeFailed', {
              error: err instanceof Error ? err.message : 'unknown',
            }),
          );
        }
      }
    })();
  }, [exchange, navigate, params, t]);

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          {t('prompt.back')}
        </button>
      </div>
    );
  }
  return (
    <div className="py-20 text-center">
      <LoadingSpinner className="mb-4" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('auth.checkingPermission')}</p>
    </div>
  );
}
