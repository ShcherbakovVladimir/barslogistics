import { isFoldableViewport, isMobilePhoneViewport, getLayoutViewportSize } from './deviceLayout.js';
import { getPortalShellElement, measurePortalAppHeight } from './portalShell.js';

/** CSS px per CSS inch (not physical). Used only as a scale reference. */
const CSS_PX_PER_IN = 96;

export type MapChromeDensity = 'comfortable' | 'cozy' | 'compact' | 'tight';

/**
 * Legacy MQ — kept for listeners that fire on viewport changes.
 * Real compact detection is multi-signal (see getMapChromeDensity).
 */
export const COMPACT_LAPTOP_QUERY =
  '(max-height: 960px), (max-width: 1600px), (max-resolution: 2.5dppx)';

/** App surface for bounds — prefer React shell, then portal wrapper (never measure #root on embed). */
function getAppBoundsElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const appShell = document.querySelector('.app-shell');
  if (appShell instanceof HTMLElement) return appShell;
  if (document.documentElement.classList.contains('portal-embed')) {
    return getPortalShellElement();
  }
  const mount = document.getElementById('root');
  return mount;
}

/** Available app width: layout viewport, then app surface when mounted. */
export function getAppViewportWidth(): number {
  if (typeof window === 'undefined') return 0;

  const layoutW = getLayoutViewportSize().width;
  const surface = getAppBoundsElement();
  if (surface && surface.clientWidth > 0) {
    return layoutW > 0 ? Math.min(surface.clientWidth, layoutW) : surface.clientWidth;
  }
  return layoutW > 0 ? layoutW : window.innerWidth;
}

/** Visible app box for positioning fixed/portaled UI (dropdowns, pickers). */
export function getAppViewportRect(): {
  top: number;
  left: number;
  width: number;
  height: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, width: 0, height: 0 };
  }

  const embed = typeof document !== 'undefined' && document.documentElement.classList.contains('portal-embed');
  const surface = getAppBoundsElement();

  if (embed && surface) {
    const rect = surface.getBoundingClientRect();
    const height = getAppViewportHeight() || rect.height;
    const width = getAppViewportWidth() || rect.width;
    return {
      top: rect.top,
      left: rect.left,
      width: width > 0 ? width : rect.width,
      height: height > 0 ? height : rect.height,
    };
  }

  const vv = window.visualViewport;
  const width = getAppViewportWidth();
  const height = getAppViewportHeight();
  return {
    top: vv?.offsetTop ?? 0,
    left: vv?.offsetLeft ?? 0,
    width: width > 0 ? width : window.innerWidth,
    height: height > 0 ? height : window.innerHeight,
  };
}

/** Available app height: portal shell var / wrapper, layout viewport, then app surface. */
export function getAppViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  const root = document.documentElement;
  if (root.classList.contains('portal-embed')) {
    const fromPortal = measurePortalAppHeight();
    if (fromPortal > 0) return fromPortal;
  }

  const layoutH = getLayoutViewportSize().height;
  const surface = getAppBoundsElement();
  if (surface && surface.clientHeight > 0) {
    return layoutH > 0 ? Math.min(surface.clientHeight, layoutH) : surface.clientHeight;
  }
  return layoutH > 0 ? layoutH : window.innerHeight;
}

/**
 * Guess panel PPI for laptop-class screens.
 * OS scaling is already baked into CSS px; DPR recovers device pixels.
 */
function estimatePanelPpi(dpr: number, physDiagPx: number): number {
  for (const dpi of [96, 110, 120, 135, 144, 160, 180, 200, 220, 240, 260, 280, 300]) {
    if (window.matchMedia(`(resolution: ${dpi}dpi)`).matches) {
      return dpi;
    }
  }

  // 11–12" Retina / HiDPI (2560×1600@2×, 2880×1800@2× class).
  if (physDiagPx <= 3200 && dpr >= 2) {
    if (physDiagPx <= 2600) return 270;
    return 240;
  }

  // 11–12" 1366×768 / 1920×1080 @1× or mild scale.
  if (physDiagPx <= 2200) {
    if (dpr >= 1.5) return 180;
    return 145;
  }

  if (dpr >= 2.5) return 260;
  if (dpr >= 2) {
    if (physDiagPx >= 3800) return 200;
    if (physDiagPx >= 3200) return 220;
    return 240;
  }
  if (dpr >= 1.75) return 180;
  if (dpr >= 1.5) return 150;
  if (dpr >= 1.25) return 130;
  if (physDiagPx <= 2300) return 150;
  return 110;
}

/**
 * Approximate physical screen diagonal in inches.
 * Accounts for DPR so scaled / Retina panels land in the right size band.
 */
export function estimateScreenDiagonalInches(): number {
  if (typeof window === 'undefined') return 0;
  const dpr = window.devicePixelRatio || 1;
  const cssW = window.screen.width || window.innerWidth;
  const cssH = window.screen.height || window.innerHeight;
  const physW = cssW * dpr;
  const physH = cssH * dpr;
  const physDiag = Math.hypot(physW, physH);
  const ppi = estimatePanelPpi(dpr, physDiag);
  const inches = physDiag / ppi;
  if (!Number.isFinite(inches) || inches < 4 || inches > 40) {
    return Math.hypot(cssW, cssH) / CSS_PX_PER_IN;
  }
  return inches;
}

/**
 * 11–12" class across DPI / OS scale:
 * - 11.6" 1366×768, 12" 1920×1080 @100–125%
 * - 11–12" Retina (CSS ~1152×720 … 1280×800 @2×)
 * - Surface / ultraportable @150% scale
 */
export function isElevenTwelveInchClass(): boolean {
  if (typeof window === 'undefined') return false;

  const dpr = window.devicePixelRatio || 1;
  const sw = window.screen.width || 0;
  const sh = window.screen.height || 0;
  const availH = getAppViewportHeight();
  const availW = getAppViewportWidth();
  const diagonalIn = estimateScreenDiagonalInches();

  if (diagonalIn >= 10.0 && diagonalIn <= 12.5) return true;

  const screenDiagCss = Math.hypot(sw, sh);

  // Classic 11.6" / 12" low-height panels.
  if (sw >= 1024 && sw <= 1400 && sh >= 600 && sh <= 900 && screenDiagCss <= 1750) {
    return true;
  }

  // Retina 11–12": high DPR, modest CSS viewport.
  if (dpr >= 1.75 && sw >= 1024 && sw <= 1440 && sh >= 640 && sh <= 920 && screenDiagCss <= 1900) {
    return true;
  }

  // Heavy OS scale on FHD-class ultraportables.
  if (dpr >= 1.25 && dpr < 1.75 && sw <= 1280 && sh <= 820) return true;

  // Portal / windowed ultraportable usable box.
  if (availW > 0 && availW <= 1280 && availH > 0 && availH <= 760) return true;

  return false;
}

/**
 * 13–14" class (excludes 11–12" band when diagonal is reliable).
 */
export function isThirteenFourteenInchClass(): boolean {
  if (typeof window === 'undefined') return false;
  if (isElevenTwelveInchClass()) {
    const diagonalIn = estimateScreenDiagonalInches();
    if (diagonalIn >= 10.0 && diagonalIn <= 12.5) return false;
  }

  const dpr = window.devicePixelRatio || 1;
  const sw = window.screen.width || 0;
  const sh = window.screen.height || 0;
  const availH = getAppViewportHeight();
  const availW = getAppViewportWidth();
  const diagonalIn = estimateScreenDiagonalInches();

  if (diagonalIn >= 12.6 && diagonalIn <= 15.2) return true;

  const screenDiagCss = Math.hypot(sw, sh);
  const laptopCssBand =
    sw >= 1100 &&
    sw <= 2000 &&
    sh >= 650 &&
    sh <= 1300 &&
    screenDiagCss <= 2350;

  if (dpr >= 1.75 && laptopCssBand) return true;
  if (dpr > 1.05 && dpr < 1.75 && sw <= 1760 && sh <= 1100) return true;
  if (dpr <= 1.05 && sw <= 1760 && sh <= 1050 && sw >= 1100) return true;

  if (dpr <= 1.05 && sw >= 1800 && sw <= 2048 && sh >= 1000 && sh <= 1280) {
    if (availH > 0 && availH <= 980) return true;
  }

  if (availH > 0 && availH <= 900 && availW > 0 && availW <= 1680 && availW > 1280) return true;

  return false;
}

/**
 * Density for map filter + legend.
 * tight → 11–12" | compact → 13" 768p / short | cozy → 13–14" | comfortable → large.
 */
export function getMapChromeDensity(): MapChromeDensity {
  if (typeof window === 'undefined') return 'comfortable';

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (root.classList.contains('layout-mobile') && !root.classList.contains('layout-fold')) {
      return 'comfortable';
    }
  }

  // Phones use layout-mobile CSS — avoid compact-laptop shrinking.
  if (isMobilePhoneViewport() && !isFoldableViewport()) {
    return 'comfortable';
  }

  const h = getAppViewportHeight();
  const w = getAppViewportWidth();
  const laptop1112 = isElevenTwelveInchClass();
  const laptop1314 = isThirteenFourteenInchClass();
  const diagonalIn = estimateScreenDiagonalInches();

  // 11–12": tightest chrome.
  if (laptop1112) {
    if (h > 0 && h <= 700) return 'tight';
    if (w > 0 && w <= 1180 && h > 0 && h <= 740) return 'tight';
    if (diagonalIn >= 10.0 && diagonalIn <= 11.5 && h <= 780) return 'tight';
    if (h > 0 && h <= 820) return 'compact';
    return 'compact';
  }

  if (h > 0 && h <= 680) return 'tight';
  if (w > 0 && w <= 1180 && h > 0 && h <= 700) return 'tight';

  if (h > 0 && h <= 740) return 'compact';
  if (laptop1314 && h > 0 && h <= 820) return 'compact';
  if (w > 0 && w <= 1280 && h > 0 && h <= 820) return 'compact';
  if (diagonalIn >= 12.6 && diagonalIn <= 13.6 && h <= 900) return 'compact';

  if (laptop1314) return 'cozy';
  if (h > 0 && h <= 920) return 'cozy';
  if (w > 0 && w <= 1440 && h > 0 && h <= 1000) return 'cozy';

  return 'comfortable';
}

export function isCompactLaptopViewport(): boolean {
  return getMapChromeDensity() !== 'comfortable';
}

export function shouldExpandMapPanelsByDefault(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('layout-mobile')) {
    return false;
  }
  if (isMobilePhoneViewport() && !isFoldableViewport()) return false;
  if (isFoldableViewport()) return false;
  if (isCompactLaptopViewport()) return false;
  return window.matchMedia('(min-width: 640px)').matches;
}

/** Apply density classes on <html> for CSS hooks. */
export function applyMapChromeDensityClass(density: MapChromeDensity = getMapChromeDensity()): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const forceComfortable = root.classList.contains('layout-mobile') && !root.classList.contains('layout-fold');
  const effective = forceComfortable ? 'comfortable' : density;
  root.classList.toggle('compact-laptop', effective !== 'comfortable');
  root.classList.toggle('map-chrome-cozy', effective === 'cozy');
  root.classList.toggle('map-chrome-compact', effective === 'compact' || effective === 'tight');
  root.classList.toggle('map-chrome-tight', effective === 'tight');
  root.dataset.mapChrome = effective;
}

/** Listen to resize / DPR / visualViewport changes. */
export function subscribeViewportChange(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mq = window.matchMedia(COMPACT_LAPTOP_QUERY);
  const mqDpr = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  const run = () => onChange();

  mq.addEventListener('change', run);
  mqDpr.addEventListener('change', run);
  window.addEventListener('resize', run);
  window.visualViewport?.addEventListener('resize', run);
  window.visualViewport?.addEventListener('scroll', run);

  return () => {
    mq.removeEventListener('change', run);
    mqDpr.removeEventListener('change', run);
    window.removeEventListener('resize', run);
    window.visualViewport?.removeEventListener('resize', run);
    window.visualViewport?.removeEventListener('scroll', run);
  };
}
