import { VitePWA } from 'vite-plugin-pwa';

export function pwaPlugin() {
  return VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    registerType: 'autoUpdate',
    includeAssets: ['bars.svg'],
    manifest: {
      name: 'BarsLogistics',
      short_name: 'BarsLogistics',
      description: 'Логистическая карта — мониторинг поставок и площадок',
      theme_color: '#0f172a',
      background_color: '#020617',
      display: 'standalone',
      orientation: 'any',
      start_url: '/',
      scope: '/',
      lang: 'ru',
      icons: [
        {
          src: '/bars.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: '/bars.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'maskable',
        },
      ],
    },
    injectManifest: {
      // Do not precache HTML — soft refresh must always hit the network for index.html
      globPatterns: ['**/*.{js,css,svg,ico,png,woff2}'],
    },
    devOptions: {
      enabled: false,
    },
  });
}
