import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';

/** Applies Redux theme to <html> for global CSS variables and light overrides */
export function ThemeSync() {
  const mode = useAppSelector(state => state.theme.mode);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;
  }, [mode]);

  return null;
}
