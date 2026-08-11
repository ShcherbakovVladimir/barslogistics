/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_AUTH_VALIDATE_URL?: string;
  readonly VITE_DEV_JWT?: string;
  readonly VITE_EMBED_BUILD?: string;
  readonly VITE_PORTAL_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
