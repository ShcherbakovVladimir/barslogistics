import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import App from './App.tsx';
import { applyPortalEmbedClass, isPortalEmbed } from './auth/portalAuth';
import { I18nProvider } from './i18n';
import { store } from './store';
import { ThemeSync } from './components/Theme/ThemeSync';
import { applyMapChromeDensityClass } from './utils/viewport';
import {
  bootstrapDeviceLayout,
  applyDeviceLayoutClasses,
  scheduleLayoutBootstrap,
  subscribeDeviceLayout,
} from './utils/deviceLayout';
import { subscribeSafeAreaSync, syncSafeAreaCssVars } from './utils/androidSafeArea';
import { subscribePortalShellResize } from './utils/portalShell';
import {
  getOrCreateReactRoot,
  preparePortalMountElement,
  purgePortalServiceWorkers,
} from './utils/reactMount';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import './types/portal';

/** Optional local portal bootstrap — only when VITE_DEV_JWT is set (never forced). */
if (import.meta.env.DEV && import.meta.env.VITE_DEV_JWT && !window.__BARS_PORTAL__) {
  window.__BARS_PORTAL__ = {
    apiBase: import.meta.env.VITE_API_BASE || 'https://barslogistics.almaz-t.ru/api',
    authProxy: '/bars/wp-json/bars-auth/v1',
    authBase: 'https://requestchainrestproxy.almaz-t.ru',
    basename: '/bars/logistics',
    token: String(import.meta.env.VITE_DEV_JWT),
    user: { samaccountname: 'dev', role: 'user', creator_id: '0' },
    embed: true,
    shell: {
      appHeightVar: '--bars-app-height',
      headerVar: '--bars-shell-top',
      footerVar: '--bars-footer-h',
    },
  };
}

applyPortalEmbedClass();
bootstrapDeviceLayout();
applyMapChromeDensityClass();
syncSafeAreaCssVars();
subscribeSafeAreaSync();
scheduleLayoutBootstrap(() => {
  applyMapChromeDensityClass();
  syncSafeAreaCssVars();
});
subscribeDeviceLayout(() => {
  applyDeviceLayoutClasses();
  applyMapChromeDensityClass();
  syncSafeAreaCssVars();
});

if ('serviceWorker' in navigator) {
  if (isPortalEmbed()) {
    void purgePortalServiceWorkers();
  } else if (import.meta.env.PROD) {
    // Soft reload must pick up the new SW controller immediately after deploy.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        void updateSW(true);
      },
    });
  } else {
    // Dev (Vite middleware): unregister leftover production SW — it caches old assets
    // and makes F5 show a stale build (chat button missing) while Ctrl+Shift+R works.
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) void reg.unregister();
    });
    if ('caches' in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    }
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Mount point #root not found');
}

preparePortalMountElement(rootEl);

const appTree = (
  <Provider store={store}>
    <I18nProvider>
      <ThemeSync />
      <App />
    </I18nProvider>
  </Provider>
);

getOrCreateReactRoot(rootEl).render(
  isPortalEmbed() ? appTree : <StrictMode>{appTree}</StrictMode>,
);

subscribePortalShellResize(() => {
  applyDeviceLayoutClasses();
  applyMapChromeDensityClass();
});
