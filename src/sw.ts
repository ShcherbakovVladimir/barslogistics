/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

/** Soft refresh must get fresh HTML — never serve stale index.html from precache. */
const precacheManifest = (self.__WB_MANIFEST || []).filter((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url;
  return !url.endsWith('index.html') && url !== '/';
});

precacheAndRoute(precacheManifest);
cleanupOutdatedCaches();

self.skipWaiting();
clientsClaim();

registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'bars-html-pages',
      networkTimeoutSeconds: 3,
      plugins: [],
    }),
  ),
);

self.addEventListener('push', (event: PushEvent) => {
  let payload: {
    title?: string;
    body?: string;
    tag?: string;
    data?: { conversationId?: string; type?: string };
  } = {};

  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { title: 'BarsLogistics', body: event.data?.text() ?? '' };
  }

  const title = payload.title ?? '💬 BarsLogistics';
  const options = {
    body: payload.body ?? '',
    icon: '/bars.svg',
    badge: '/bars.svg',
    tag: payload.tag ?? 'chat',
    renotify: true,
    data: payload.data ?? {},
  } as NotificationOptions;

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const conversationId =
    typeof event.notification.data?.conversationId === 'string'
      ? event.notification.data.conversationId
      : null;

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({
          type: 'CHAT_NOTIFICATION_CLICK',
          conversationId,
        });
        await client.focus();
        return;
      }
      await self.clients.openWindow('/');
    })(),
  );
});
