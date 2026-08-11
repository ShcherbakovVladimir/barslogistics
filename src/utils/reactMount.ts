import { createRoot, type Root } from 'react-dom/client';
import { isPortalEmbed } from '../auth/portalAuth';

const ROOT_KEY = '__barsLogisticsReactRoot';

type MountHost = HTMLElement & { [ROOT_KEY]?: Root };

/**
 * WordPress must ship an empty #root (bars-portal ≥ 1.0.26).
 * Strip leftover placeholder nodes before createRoot — mixed DOM causes removeChild / #321.
 */
export function preparePortalMountElement(el: HTMLElement): void {
  if (!isPortalEmbed() || el.dataset.barsReactMounted === '1') return;
  if (el.childNodes.length > 0) {
    el.replaceChildren();
  }
}

/** Single React root — safe if host script evaluates the module more than once. */
export function getOrCreateReactRoot(el: HTMLElement): Root {
  const host = el as MountHost;
  if (!host[ROOT_KEY]) {
    host[ROOT_KEY] = createRoot(el);
    el.dataset.barsReactMounted = '1';
  }
  return host[ROOT_KEY]!;
}

/** SW + mixed asset versions on portal path → invalid hook call in lazy chunks. */
export async function purgePortalServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map(reg => reg.unregister()));
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }
}
