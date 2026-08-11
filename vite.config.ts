import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { pwaPlugin } from './vite.pwa.config';

/** Normalize to trailing slash — Vite `base` requirement. */
function normalizeBase(base: string): string {
  if (!base || base === '/') return '/';
  const withLeading = base.startsWith('/') ? base : `/${base}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export default defineConfig(({ mode }) => {
  const isEmbed = mode === 'embed';
  const isDev = mode === 'development';
  const env = loadEnv(mode, process.cwd(), '');
  const portalBase = normalizeBase(env.VITE_PORTAL_BASE || '/bars/logistics/');

  // Standalone: /. Portal embed: /bars/logistics/ so lazy chunks resolve on WP path.
  const base = isEmbed ? portalBase : '/';

  return {
    plugins: [react(), tailwindcss(), ...(isEmbed ? [] : [pwaPlugin()])],
    base,
    build: {
      outDir: isEmbed ? 'dist-embed' : 'dist',
      assetsDir: 'assets',
      sourcemap: isDev,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        ...(isEmbed
          ? { 'virtual:pwa-register': path.resolve(__dirname, 'src/pwa-register-stub.ts') }
          : {}),
      },
      dedupe: ['react', 'react-dom', 'react-redux'],
    },
    define: {
      'import.meta.env.VITE_EMBED_BUILD': JSON.stringify(isEmbed ? 'true' : 'false'),
    },
    server: isDev
      ? {
          hmr: process.env.DISABLE_HMR !== 'true',
          watch: process.env.DISABLE_HMR === 'true' ? null : {},
          proxy: {
            '/bars/wp-json': {
              target: process.env.VITE_PORTAL_PROXY_TARGET || 'https://portal.almaz-t.ru',
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
  };
});
