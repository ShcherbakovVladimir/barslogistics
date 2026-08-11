import { getPortalShellElement, measurePortalAppHeight } from './portalShell.js';

export type LayoutViewportHeightMode = 'stable' | 'large';

/**
 * Reliable layout viewport in CSS px.
 * - stable: min of candidates (avoids inflated first paint / Safari URL-bar jump)
 * - large: max of candidates (edge-to-edge map under Safari chrome)
 */
export function getLayoutViewportSize(
  options?: { heightMode?: LayoutViewportHeightMode },
): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 0, height: 0 };

  const vv = window.visualViewport;
  const docEl = document.documentElement;
  const heightMode = options?.heightMode ?? 'stable';

  const widthCandidates = [
    vv?.width,
    docEl.clientWidth,
    window.innerWidth,
  ].filter((n): n is number => typeof n === 'number' && n > 0);

  const heightCandidates = [
    document.documentElement.classList.contains('portal-embed')
      ? measurePortalAppHeight() || undefined
      : undefined,
    vv?.height,
    docEl.clientHeight,
    window.innerHeight,
  ].filter((n): n is number => typeof n === 'number' && n > 0);

  const width = widthCandidates.length > 0 ? Math.min(...widthCandidates) : 0;
  const height = heightCandidates.length > 0
    ? (heightMode === 'large' ? Math.max(...heightCandidates) : Math.min(...heightCandidates))
    : 0;

  return { width, height };
}

function layoutViewportWidth(): number {
  return getLayoutViewportSize().width;
}

function layoutViewportHeight(): number {
  return getLayoutViewportSize().height;
}

function touchPrimaryDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches
    && window.matchMedia('(hover: none)').matches;
}

/** Write measured viewport + touch hint to CSS vars on <html>. */
export function applyLayoutViewportVars(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (root.classList.contains('portal-embed')) {
    const height = measurePortalAppHeight();

    if (height > 0) {
      root.style.setProperty('--layout-vh', `${height}px`);
      root.dataset.layoutVh = String(Math.round(height));
    }

    const shell = getPortalShellElement();
    const width = shell && shell.clientWidth > 0
      ? shell.clientWidth
      : getLayoutViewportSize().width;
    if (width > 0) {
      root.style.setProperty('--layout-vw', `${width}px`);
      root.dataset.layoutVw = String(Math.round(width));
    }
    return;
  }

  const isTouchShell =
    root.classList.contains('layout-mobile') || root.classList.contains('layout-fold');
  /* Map tab: fill large viewport so tiles reach the physical bottom under Safari chrome */
  const edgeToEdgeMap = isTouchShell && root.classList.contains('app-tab-map');
  const { width, height } = getLayoutViewportSize({
    heightMode: edgeToEdgeMap ? 'large' : 'stable',
  });
  if (width > 0) root.style.setProperty('--layout-vw', `${width}px`);
  if (height > 0) root.style.setProperty('--layout-vh', `${height}px`);
  root.dataset.layoutVw = width > 0 ? String(Math.round(width)) : '';
  root.dataset.layoutVh = height > 0 ? String(Math.round(height)) : '';
  root.dataset.layoutVhMode = edgeToEdgeMap ? 'large' : 'stable';
}

export type DeviceLayoutClass =
  | 'layout-mobile'
  | 'layout-tablet'
  | 'layout-desktop'
  | 'layout-fold'
  | 'layout-landscape-phone'
  | 'layout-ios'
  | 'layout-android'
  | 'layout-portrait'
  | 'layout-portrait-inverted'
  | 'layout-landscape'
  | 'layout-landscape-inverted'
  | 'layout-orientation-inverted';

/** Discrete orientation from system angle (0 / 90 / 180 / 270). */
export type ScreenOrientationKind =
  | 'portrait'
  | 'portrait-inverted'
  | 'landscape'
  | 'landscape-inverted'
  | 'unknown';

function normalizeOrientationAngle(angle: number): number {
  return ((Math.round(angle) % 360) + 360) % 360;
}

/**
 * System screen angle in degrees: 0 portrait, 90 landscape (clockwise),
 * 180 upside-down portrait, 270 inverted landscape.
 * Uses Screen Orientation API → legacy window.orientation → matchMedia fallback.
 */
export function getScreenOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const apiAngle = screen.orientation?.angle;
    if (typeof apiAngle === 'number' && Number.isFinite(apiAngle)) {
      return normalizeOrientationAngle(apiAngle);
    }
  } catch {
    /* orientation locked or unavailable */
  }

  const legacy = (window as Window & { orientation?: number }).orientation;
  if (typeof legacy === 'number' && Number.isFinite(legacy)) {
    return normalizeOrientationAngle(legacy);
  }

  if (window.matchMedia('(orientation: landscape)').matches) {
    const w = layoutViewportWidth();
    const h = layoutViewportHeight();
    // Heuristic: if width shrank vs height swap, assume primary landscape.
    return w >= h ? 90 : 270;
  }

  return 0;
}

export function getScreenOrientationKind(): ScreenOrientationKind {
  const angle = getScreenOrientationAngle();

  if (angle === 0) return 'portrait';
  if (angle === 90) return 'landscape';
  if (angle === 180) return 'portrait-inverted';
  if (angle === 270) return 'landscape-inverted';

  if (angle > 45 && angle < 135) return 'landscape';
  if (angle > 135 && angle < 225) return 'portrait-inverted';
  if (angle > 225 && angle < 315) return 'landscape-inverted';
  return 'portrait';
}

export function isLandscapeOrientation(): boolean {
  const kind = getScreenOrientationKind();
  return kind === 'landscape' || kind === 'landscape-inverted';
}

export function isPortraitOrientation(): boolean {
  const kind = getScreenOrientationKind();
  return kind === 'portrait' || kind === 'portrait-inverted';
}

export function isInvertedOrientation(): boolean {
  const kind = getScreenOrientationKind();
  return kind === 'portrait-inverted' || kind === 'landscape-inverted';
}

/** Touch-first phone — includes landscape (short side ≤480px). */
export function isMobilePhoneViewport(): boolean {
  if (typeof window === 'undefined') return false;

  const { width: w, height: h } = getLayoutViewportSize();
  if (w <= 0 || h <= 0) return false;

  const touchPrimary = touchPrimaryDevice();
  const minSide = Math.min(w, h);
  const maxSide = Math.max(w, h);

  if (minSide <= 480 && touchPrimary) return true;
  if (w <= 639 && touchPrimary) return true;

  // Landscape phone: e.g. iPhone 390×844 → 844×390 in landscape.
  if (touchPrimary && minSide <= 520 && maxSide <= 980) return true;

  return false;
}

/** Samsung Fold / Huawei Mate X style spanning or square inner display. */
export function isFoldableViewport(): boolean {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia('(horizontal-viewport-segments: 2)').matches) return true;
  if (window.matchMedia('(spanning: single-fold-vertical)').matches) return true;
  if (window.matchMedia('(spanning: single-fold-horizontal)').matches) return true;

  const w = layoutViewportWidth();
  const h = layoutViewportHeight();
  if (w <= 0 || h <= 0) return false;

  const aspect = w / h;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const squareUnfolded = w >= 600 && w <= 980 && aspect >= 0.72 && aspect <= 1.35;

  return squareUnfolded && coarse;
}

export function isTabletViewport(): boolean {
  if (typeof window === 'undefined') return false;
  const w = layoutViewportWidth();
  return w >= 640 && w < 1024 && window.matchMedia('(pointer: coarse)').matches;
}

/** Phone / fold in landscape — uses system angle, not only width > height. */
export function isLandscapePhone(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isMobilePhoneViewport() && !isFoldableViewport()) return false;
  return isLandscapeOrientation();
}

/** iPhone / iOS WebKit — safe-area + standalone quirks. */
export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Android (Chrome / WebView) — edge-to-edge + theme-color quirks. */
export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isMobileLayout(): boolean {
  return isMobilePhoneViewport() || isFoldableViewport();
}

export function getDeviceLayoutSnapshot() {
  const mobile = isMobilePhoneViewport();
  const fold = isFoldableViewport();
  const tablet = isTabletViewport();
  const orientationAngle = getScreenOrientationAngle();
  const orientationKind = getScreenOrientationKind();
  const touchMobile = mobile || fold;

  return {
    mobile,
    fold,
    tablet,
    desktop: !mobile && !fold && !tablet,
    ios: isIosDevice(),
    android: isAndroidDevice(),
    orientationAngle,
    orientationKind,
    landscapePhone: touchMobile && isLandscapeOrientation(),
    portraitPhone: touchMobile && isPortraitOrientation(),
    invertedOrientation: isInvertedOrientation(),
  };
}

/** Apply layout-* classes on <html> for CSS hooks. */
export function applyDeviceLayoutClasses(): void {
  if (typeof document === 'undefined') return;
  applyLayoutViewportVars();

  const root = document.documentElement;
  const s = getDeviceLayoutSnapshot();

  root.classList.toggle('layout-mobile', s.mobile);
  root.classList.toggle('layout-fold', s.fold);
  root.classList.toggle('layout-tablet', s.tablet);
  root.classList.toggle('layout-desktop', s.desktop);
  root.classList.toggle('layout-landscape-phone', s.landscapePhone);
  root.classList.toggle('layout-ios', s.ios);
  root.classList.toggle('layout-android', s.android);

  root.classList.toggle('layout-portrait', s.orientationKind === 'portrait' || s.orientationKind === 'portrait-inverted');
  root.classList.toggle('layout-portrait-inverted', s.orientationKind === 'portrait-inverted');
  root.classList.toggle('layout-landscape', s.orientationKind === 'landscape' || s.orientationKind === 'landscape-inverted');
  root.classList.toggle('layout-landscape-inverted', s.orientationKind === 'landscape-inverted');
  root.classList.toggle('layout-orientation-inverted', s.invertedOrientation);

  root.dataset.orientationAngle = String(s.orientationAngle);
  root.dataset.orientationKind = s.orientationKind;
}

/** Full layout pass — call before first React paint and after viewport settles. */
export function bootstrapDeviceLayout(): void {
  applyDeviceLayoutClasses();
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('layout-bootstrapped');
  }
}

/** Re-measure after fonts/layout settle (iOS address bar, portal shell vars). */
export function scheduleLayoutBootstrap(onReady?: () => void): void {
  if (typeof window === 'undefined') return;

  const finalize = () => {
    bootstrapDeviceLayout();
    document.documentElement.classList.add('layout-ready');
    onReady?.();
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(finalize);
  });

  window.addEventListener('load', finalize, { once: true });
}

/** iOS updates layout after orientationchange — defer until dimensions settle. */
function scheduleOrientationRelayout(onChange: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(onChange);
  });
}

export function subscribeDeviceLayout(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const run = () => onChange();
  const onOrient = () => scheduleOrientationRelayout(onChange);

  window.addEventListener('resize', run);
  window.addEventListener('orientationchange', onOrient);
  window.visualViewport?.addEventListener('resize', run);
  window.matchMedia('(pointer: coarse)').addEventListener('change', run);

  const landscapeMq = window.matchMedia('(orientation: landscape)');
  const onMqChange = () => scheduleOrientationRelayout(onChange);
  landscapeMq.addEventListener('change', onMqChange);

  try {
    screen.orientation?.addEventListener('change', onOrient);
  } catch {
    /* Screen Orientation API unavailable */
  }

  return () => {
    window.removeEventListener('resize', run);
    window.removeEventListener('orientationchange', onOrient);
    window.visualViewport?.removeEventListener('resize', run);
    window.matchMedia('(pointer: coarse)').removeEventListener('change', run);
    landscapeMq.removeEventListener('change', onMqChange);
    try {
      screen.orientation?.removeEventListener('change', onOrient);
    } catch {
      /* ignore */
    }
  };
}
