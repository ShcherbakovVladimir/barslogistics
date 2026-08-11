import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';

function ensureThemeColorMeta(content: string) {
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/** Applies Redux theme to <html> for global CSS variables and light overrides */
export function ThemeSync() {
  const mode = useAppSelector(state => state.theme.mode);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;
    /* Browser / PWA chrome tint — matches header / safe-area fill */
    ensureThemeColorMeta(mode === 'light' ? '#ffffff' : '#0f172a');
  }, [mode]);

  return null;
}
