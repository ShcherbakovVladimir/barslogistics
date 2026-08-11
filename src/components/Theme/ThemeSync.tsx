import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import type { ThemeMode } from '../../store/themeSlice';
import { isAndroidDevice } from '../../utils/deviceLayout';
import { syncSafeAreaCssVars } from '../../utils/androidSafeArea';

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
 * Chrome Android often ignores in-place theme-color updates.
 * Remove + recreate (and set matching media variants) so the toolbar repaints.
 */
function setThemeColorForBrowser(color: string) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((node) => node.remove());

  const primary = document.createElement('meta');
  primary.name = 'theme-color';
  primary.content = color;
  document.head.appendChild(primary);

  /* Android Chrome may pick media-qualified tags based on OS scheme — force both. */
  if (isAndroidDevice()) {
    for (const scheme of ['light', 'dark'] as const) {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.content = color;
      m.media = `(prefers-color-scheme: ${scheme})`;
      document.head.appendChild(m);
    }
  }
}

/**
 * Sync page theme → browser UI chrome
 * (Chrome/Android address bar, PWA title bar, Safari status bar, form controls).
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

  setThemeColorForBrowser(cfg.themeColor);
  upsertNamedMeta('color-scheme', mode);
  upsertNamedMeta('apple-mobile-web-app-status-bar-style', cfg.statusBar);
  upsertNamedMeta('msapplication-navbutton-color', cfg.themeColor);
  upsertNamedMeta('msapplication-TileColor', cfg.themeColor);

  try {
    syncSafeAreaCssVars();
  } catch {
    /* ignore */
  }
}

/** Applies Redux theme to <html> and browser chrome when the user toggles theme */
export function ThemeSync() {
  const mode = useAppSelector(state => state.theme.mode);

  useEffect(() => {
    applyBrowserTheme(mode);
  }, [mode]);

  return null;
}
