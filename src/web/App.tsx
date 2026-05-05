import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import AuthGuard from './components/AuthGuard';
import HomePage from './pages/HomePage';

const PromptDetailPage = lazy(() => import('./pages/PromptDetailPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const PromptEditorPage = lazy(() => import('./pages/PromptEditorPage'));
const LabelsAdminPage = lazy(() => import('./pages/LabelsAdminPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LazyFallback() {
  return <LoadingSpinner className="py-20" />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route
                path="prompt/:id"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <PromptDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="prompt/new"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <AuthGuard>
                      <PromptEditorPage />
                    </AuthGuard>
                  </Suspense>
                }
              />
              <Route
                path="prompt/:id/edit"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <AuthGuard>
                      <PromptEditorPage />
                    </AuthGuard>
                  </Suspense>
                }
              />
              <Route
                path="admin/labels"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <AuthGuard>
                      <LabelsAdminPage />
                    </AuthGuard>
                  </Suspense>
                }
              />
              <Route
                path="auth/callback"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <AuthCallbackPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}


