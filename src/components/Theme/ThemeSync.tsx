import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import type { ThemeMode } from '../../store/themeSlice';

/** Browser / PWA chrome colors — match header & safe-area fills */
export const BROWSER_THEME = {
  dark: {
    themeColor: '#0f172a',
    statusBar: 'black-translucent',
  },
  light: {
    themeColor: '#ffffff',
    statusBar: 'default',
  },
} as const;

function upsertNamedMeta(name: string, content: string) {
  if (name === 'theme-color') {
    /* Drop prefers-color-scheme variants — site theme is explicit */
    document.querySelectorAll('meta[name="theme-color"][media]').forEach((node) => node.remove());
  }

  let meta = document.querySelector(
    `meta[name="${name}"]:not([media])`,
  ) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/**
 * Sync page theme → browser UI chrome
 * (address bar, PWA title bar, Safari status bar, native form controls).
 */
export function applyBrowserTheme(mode: ThemeMode) {
  const cfg = BROWSER_THEME[mode];
  const root = document.documentElement;

  root.setAttribute('data-theme', mode);
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
  if (document.body) {
    document.body.style.colorScheme = mode;
  }

  upsertNamedMeta('theme-color', cfg.themeColor);
  upsertNamedMeta('color-scheme', mode);
  upsertNamedMeta('apple-mobile-web-app-status-bar-style', cfg.statusBar);
  upsertNamedMeta('msapplication-navbutton-color', cfg.themeColor);
  upsertNamedMeta('msapplication-TileColor', cfg.themeColor);
}

/** Applies Redux theme to <html> and browser chrome when the user toggles theme */
export function ThemeSync() {
  const mode = useAppSelector(state => state.theme.mode);

  useEffect(() => {
    applyBrowserTheme(mode);
  }, [mode]);

  return null;
}
