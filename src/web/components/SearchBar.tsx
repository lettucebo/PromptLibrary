import { Search, X } from 'lucide-react';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
}

export default function SearchBar({ value, onChange, placeholder, inputRef }: SearchBarProps) {
  const { t } = useTranslation();
  const ph = placeholder ?? t('home.searchPlaceholder');
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-faint" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-line bg-card text-content placeholder-content-faint focus:outline-none focus:ring-2 focus:ring-primary  text-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-faint hover:text-content-soft"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
