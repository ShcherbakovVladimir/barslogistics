/** Stub when PWA plugin is disabled (embed build). */
export function registerSW(_options?: unknown): () => Promise<void> {
  return () => Promise.resolve();
}
