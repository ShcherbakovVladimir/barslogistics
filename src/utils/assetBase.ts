/**
 * Vite `base` baked at build time. Embed build uses `/bars/logistics/` for portal lazy chunks.
 */
export function getViteBaseUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

/** True when built with `vite build --mode embed`. */
export function isEmbedBuild(): boolean {
  return import.meta.env.VITE_EMBED_BUILD === 'true';
}
