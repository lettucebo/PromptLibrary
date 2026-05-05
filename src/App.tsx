import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PromptDetailPage from './pages/PromptDetailPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import LoadingSpinner from './components/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="prompt/:id" element={<PromptDetailPage />} />
      </Route>
    </Routes>
  );
}

function LoginPageWrapper() {
  const { token } = useAuth();
  if (token) return <Navigate to="/" replace />;
  return <LoginPage />;
}

/**
 * GitHub OAuth redirects back with query params BEFORE the hash:
 *   https://lettucebo.github.io/PromptLibrary/?code=xxx&state=yyy
 *
 * Since we use HashRouter, we detect this in the top-level component
 * and route the hash to /callback so the OAuthCallbackPage can handle it.
 */
function useOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('code') && params.has('state')) {
    // The OAuthCallbackPage reads from window.location.search directly
    window.location.hash = '#/callback';
  }
}

export default function App() {
  useOAuthRedirect();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPageWrapper />} />
            <Route path="/callback" element={<OAuthCallbackPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
