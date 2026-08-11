/**
 * Android / Chromium edge-to-edge + safe-area helpers.
 * Use with viewport-fit=cover; never assume inset == 0 without measuring.
 */

import { isAndroidDevice } from './deviceLayout';

export { isAndroidDevice };

/** Probe computed env(safe-area-inset-*) — works when CSS env resolves (WebView 136+, Chrome 135+). */
export function measureCssSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof document === 'undefined' || !document.body) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:0',
    'height:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding-top:env(safe-area-inset-top, 0px)',
    'padding-right:env(safe-area-inset-right, 0px)',
    'padding-bottom:env(safe-area-inset-bottom, 0px)',
    'padding-left:env(safe-area-inset-left, 0px)',
  ].join(';');

  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const insets = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
  probe.remove();
  return insets;
}

/**
 * Mirror env() into --bars-safe-* so layout can use them consistently.
 * Does not invent fake insets when env is 0 (non-edge-to-edge Chrome).
 */
export function syncSafeAreaCssVars(): void {
  if (typeof document === 'undefined') return;
  if (document.documentElement.classList.contains('portal-embed')) return;

  const root = document.documentElement;
  const { top, right, bottom, left } = measureCssSafeAreaInsets();

  root.style.setProperty('--bars-safe-top', `${top}px`);
  root.style.setProperty('--bars-safe-right', `${right}px`);
  root.style.setProperty('--bars-safe-bottom', `${bottom}px`);
  root.style.setProperty('--bars-safe-left', `${left}px`);
  root.dataset.safeTop = String(Math.round(top));
  root.dataset.safeBottom = String(Math.round(bottom));
  if (isAndroidDevice()) {
    root.dataset.safeAreaSource = top > 0 || bottom > 0 ? 'css-env' : 'zero';
  }
}

let safeAreaSubscribed = false;

/** Keep --bars-safe-* fresh (Chrome edge-to-edge / rotation / toolbar resize). */
export function subscribeSafeAreaSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  const run = () => {
    try {
      syncSafeAreaCssVars();
    } catch {
      /* ignore */
    }
  };

  run();
  if (safeAreaSubscribed) {
    return () => {};
  }

  safeAreaSubscribed = true;
  window.addEventListener('resize', run);
  window.addEventListener('orientationchange', run);
  window.visualViewport?.addEventListener('resize', run);
  window.visualViewport?.addEventListener('scroll', run);

  return () => {
    window.removeEventListener('resize', run);
    window.removeEventListener('orientationchange', run);
    window.visualViewport?.removeEventListener('resize', run);
    window.visualViewport?.removeEventListener('scroll', run);
    safeAreaSubscribed = false;
  };
}
