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
      <div className={useChromeToggle ? className : `theme-toggle-standalone theme-toggle-standalone--compact ${className}`}>
        <button
          type="button"
          onClick={() => dispatch(setTheme('dark'))}
          className={`theme-toggle-standalone-btn${mode === 'dark' ? ' is-active' : ''}`}
          title={t('theme.dark')}
        >
          {t('map.tileDark')}
        </button>
        <button
          type="button"
          onClick={() => dispatch(setTheme('light'))}
          className={`theme-toggle-standalone-btn${mode === 'light' ? ' is-active' : ''}`}
          title={t('theme.light')}
        >
          {t('map.tileLight')}
        </button>
      </div>
    );
  }

  return (
    <div className={`theme-toggle-standalone ${className}`}>
      <button
        type="button"
        onClick={() => dispatch(setTheme('dark'))}
        className={`theme-toggle-standalone-btn theme-toggle-standalone-btn--icon${mode === 'dark' ? ' is-active' : ''}`}
        title={t('theme.dark')}
        aria-label={t('theme.dark')}
      >
        <Moon aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => dispatch(setTheme('light'))}
        className={`theme-toggle-standalone-btn theme-toggle-standalone-btn--icon${mode === 'light' ? ' is-active' : ''}`}
        title={t('theme.light')}
        aria-label={t('theme.light')}
      >
        <Sun aria-hidden="true" />
      </button>
    </div>
  );
};
