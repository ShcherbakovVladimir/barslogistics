import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setTheme } from '../../store/themeSlice';
import { useI18n } from '../../i18n';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false, className = '' }) => {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const mode = useAppSelector(state => state.theme.mode);

  if (compact) {
    const useChromeToggle =
      className.includes('app-header-theme-toggle') ||
      className.includes('map-desktop-theme-toggle');

    return (
      <div className={useChromeToggle ? className : `p-1 rounded-lg border border-slate-700/80 bg-slate-900/90 backdrop-blur-md shadow-lg ${className}`}>
        <button
          type="button"
          onClick={() => dispatch(setTheme('dark'))}
          className={
            useChromeToggle
              ? mode === 'dark'
                ? 'is-active'
                : ''
              : `px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  mode === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
          }
          title={t('theme.dark')}
        >
          {t('map.tileDark')}
        </button>
        <button
          type="button"
          onClick={() => dispatch(setTheme('light'))}
          className={
            useChromeToggle
              ? mode === 'light'
                ? 'is-active'
                : ''
              : `px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  mode === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
          }
          title={t('theme.light')}
        >
          {t('map.tileLight')}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 ${className}`}>
      <button
        type="button"
        onClick={() => dispatch(setTheme('dark'))}
        className={`p-1.5 rounded-md transition-colors ${
          mode === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
        }`}
        title={t('theme.dark')}
        aria-label={t('theme.dark')}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => dispatch(setTheme('light'))}
        className={`p-1.5 rounded-md transition-colors ${
          mode === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
        }`}
        title={t('theme.light')}
        aria-label={t('theme.light')}
      >
        <Sun className="w-4 h-4" />
      </button>
    </div>
  );
};
