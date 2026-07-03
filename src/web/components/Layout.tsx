import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import CommandBar from './CommandBar';
import ToastViewport from './ToastViewport';
import { STORAGE_KEYS } from '../config';

export default function Layout() {
  const { i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR) === 'collapsed';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', i18n.resolvedLanguage ?? 'zh-TW');
    document.documentElement.setAttribute('data-color-mode', darkMode ? 'dark' : 'light');
  }, [i18n.resolvedLanguage, darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR, collapsed ? 'collapsed' : 'expanded');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-page transition-colors duration-200">
      <div className="flex">
        <Sidebar
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((p) => !p)}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <CommandBar
            darkMode={darkMode}
            onToggleDark={() => setDarkMode((p) => !p)}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      <ToastViewport />
    </div>
  );
}


