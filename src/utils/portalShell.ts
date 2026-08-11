import { isPortalShellEmbed } from '../auth/portalAuth';

export interface PortalShellResizeDetail {
  appHeight?: number;
  headerHeight?: number;
  footerHeight?: number;
}

const SHELL_RESIZE_EVENT = 'bars-portal:shell-resize';
/** Match bars-portal embed-layout debounce (≥ 1.0.26). */
const RESIZE_DEBOUNCE_MS = 50;

function shellVarNames() {
  const shell = window.__BARS_PORTAL__?.shell;
  return {
    appHeight: shell?.appHeightVar || '--bars-app-height',
    header: shell?.headerVar || '--bars-shell-top',
    footer: shell?.footerVar || '--bars-footer-h',
  };
}

function readCssVarPx(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, ms);
  };
}

/**
 * Host-owned shell wrapper (bars-portal ≥ 1.0.26).
 * Do not measure or observe #root — React owns that subtree.
 */
export function getPortalShellElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  const wrapper = document.querySelector('.bars-logistics__app');
  if (wrapper instanceof HTMLElement) return wrapper;

  const mount = document.getElementById('root');
  const parent = mount?.parentElement;
  if (parent instanceof HTMLElement) return parent;

  return null;
}

/** Measure embed slot from portal shell / CSS var — never from #root.clientHeight. */
export function measurePortalAppHeight(): number {
  if (typeof document === 'undefined') return 0;

  const fromVar = readCssVarPx(shellVarNames().appHeight);
  if (fromVar > 0) return fromVar;

  const shell = getPortalShellElement();
  if (shell && shell.clientHeight > 0) return shell.clientHeight;

  return 0;
}

/**
 * Sync --bars-app-height / shell offsets and mirror into --layout-vh for existing CSS.
 * Standalone: no-op (deviceLayout owns --layout-vh from the browser viewport).
 */
export function applyPortalShellDimensions(detail?: PortalShellResizeDetail): void {
  if (typeof document === 'undefined' || !isPortalShellEmbed()) return;

  const root = document.documentElement;
  const vars = shellVarNames();

  let appHeight = detail?.appHeight;
  if (!(typeof appHeight === 'number' && appHeight > 0)) {
    appHeight = readCssVarPx(vars.appHeight) || measurePortalAppHeight();
  }

  if (appHeight > 0) {
    root.style.setProperty(vars.appHeight, `${appHeight}px`);
    root.style.setProperty('--layout-vh', `${appHeight}px`);
    root.dataset.barsAppHeight = String(Math.round(appHeight));
  }

  if (typeof detail?.headerHeight === 'number' && detail.headerHeight >= 0) {
    root.style.setProperty(vars.header, `${detail.headerHeight}px`);
  }

  if (typeof detail?.footerHeight === 'number' && detail.footerHeight >= 0) {
    root.style.setProperty(vars.footer, `${detail.footerHeight}px`);
  }
}

/**
 * Portal dispatches `bars-portal:shell-resize` when WP chrome changes (debounced on host).
 * React must not ResizeObserver #root — that races React commits (#321 / removeChild).
 */
export function subscribePortalShellResize(onChange?: () => void): () => void {
  if (typeof window === 'undefined' || !isPortalShellEmbed()) return () => {};

  const flush = (detail?: PortalShellResizeDetail) => {
    applyPortalShellDimensions(detail);
    if (!onChange) return;
    // Never touch layout classes synchronously — defer past React commit.
    requestAnimationFrame(() => {
      onChange();
    });
  };

  const debouncedFlush = debounce((detail?: PortalShellResizeDetail) => flush(detail), RESIZE_DEBOUNCE_MS);

  const onShellResize = (event: Event) => {
    debouncedFlush((event as CustomEvent<PortalShellResizeDetail>).detail);
  };

  /** Fallback when host events are unavailable (window resize / zoom only). */
  const onViewportChange = () => debouncedFlush();

  window.addEventListener(SHELL_RESIZE_EVENT, onShellResize);
  window.addEventListener('resize', onViewportChange);
  window.visualViewport?.addEventListener('resize', onViewportChange);

  requestAnimationFrame(() => flush());

  return () => {
    window.removeEventListener(SHELL_RESIZE_EVENT, onShellResize);
    window.removeEventListener('resize', onViewportChange);
    window.visualViewport?.removeEventListener('resize', onViewportChange);
  };
}
