import { Link } from 'react-router-dom';
import { Sparkles, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Navbar({ darkMode, onToggleDark }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline">Prompt Library</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-7 w-7 rounded-full ring-2 ring-indigo-500/30"
              />
              <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
                {user.name ?? user.login}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
