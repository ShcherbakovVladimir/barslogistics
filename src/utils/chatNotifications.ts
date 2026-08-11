/** Tracks chat UI state so push is suppressed when the user is reading that thread. */
let chatUiState = {
  open: false,
  activeConversationId: null as string | null,
};

export function setChatUiState(partial: Partial<typeof chatUiState>): void {
  chatUiState = { ...chatUiState, ...partial };
}

export function getChatNotificationPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

export async function requestChatNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export interface ChatPushPayload {
  conversationId: string;
  senderName: string;
  body: string;
  notificationsEnabled: boolean;
  isOwn: boolean;
}

function shouldShowLocalChatPush(payload: ChatPushPayload): boolean {
  if (!payload.notificationsEnabled || payload.isOwn) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;

  const readingThisChat =
    !document.hidden
    && chatUiState.open
    && chatUiState.activeConversationId === payload.conversationId;

  return !readingThisChat;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function showViaServiceWorker(title: string, options: NotificationOptions): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, options);
    return true;
  } catch {
    return false;
  }
}

/** Local notification when the app is open (WebSocket path). Offline delivery uses server Web Push. */
export async function showChatPushNotification(payload: ChatPushPayload): Promise<void> {
  if (!shouldShowLocalChatPush(payload)) return;

  const preview = payload.body.trim().slice(0, 180) || '…';
  const title = `💬 ${payload.senderName}`;
  const options = {
    body: preview,
    icon: '/bars.svg',
    badge: '/bars.svg',
    tag: `chat-${payload.conversationId}`,
    renotify: true,
    data: { conversationId: payload.conversationId, type: 'chat' },
    silent: false,
  } as NotificationOptions;

  const viaSw = await showViaServiceWorker(title, options);
  if (viaSw) return;

  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      window.dispatchEvent(
        new CustomEvent('bars-chat-open', { detail: { conversationId: payload.conversationId } }),
      );
      notification.close();
    };
  } catch {
    /* ignore */
  }
}

export async function syncWebPushSubscription(
  fetchVapidKey: () => Promise<string | null>,
  saveSubscription: (subscription: PushSubscriptionJSON) => Promise<void>,
): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const publicKey = await fetchVapidKey();
  if (!publicKey) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    await saveSubscription({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
    return true;
  } catch (error) {
    console.error('Web Push subscription failed:', error);
    return false;
  }
}

export async function unsubscribeWebPush(
  removeSubscription: (endpoint?: string) => Promise<void>,
): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await removeSubscription(endpoint);
  } catch (error) {
    console.error('Web Push unsubscribe failed:', error);
  }
}

export function subscribeChatNotificationClicks(onOpen: (conversationId: string) => void): () => void {
  if (!('serviceWorker' in navigator)) return () => {};

  const onMessage = (event: MessageEvent) => {
    const data = event.data as { type?: string; conversationId?: string } | undefined;
    if (data?.type === 'CHAT_NOTIFICATION_CLICK' && data.conversationId) {
      onOpen(data.conversationId);
    }
  };

  navigator.serviceWorker.addEventListener('message', onMessage);
  return () => navigator.serviceWorker.removeEventListener('message', onMessage);
}
