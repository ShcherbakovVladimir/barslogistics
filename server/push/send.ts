import { isUserWsOnline } from "../wsPresence.js";
import { deletePushSubscriptionByEndpoint, listPushSubscriptionsForUser } from "./repository.js";
import { isWebPushConfigured, webpush } from "./vapid.js";

export type ChatWebPushPayload = {
  conversationId: string;
  senderName: string;
  body: string;
  recipientIds: string[];
};

function buildPushPayload(payload: ChatWebPushPayload) {
  const preview = payload.body.trim().slice(0, 180) || "…";
  return {
    title: `💬 ${payload.senderName}`,
    body: preview,
    tag: `chat-${payload.conversationId}`,
    data: {
      conversationId: payload.conversationId,
      type: "chat",
    },
  };
}

async function sendToSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: ReturnType<typeof buildPushPayload>,
): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    JSON.stringify(payload),
    { TTL: 60 * 60 * 4 },
  );
}

export async function notifyChatRecipientsViaWebPush(payload: ChatWebPushPayload): Promise<void> {
  if (!isWebPushConfigured()) return;

  const pushBody = buildPushPayload(payload);

  for (const userId of payload.recipientIds) {
    if (isUserWsOnline(userId)) continue;

    const subscriptions = await listPushSubscriptionsForUser(userId);
    for (const sub of subscriptions) {
      try {
        await sendToSubscription(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          pushBody,
        );
      } catch (error) {
        const status = error && typeof error === "object" && "statusCode" in error
          ? Number((error as { statusCode: number }).statusCode)
          : 0;
        if (status === 404 || status === 410) {
          await deletePushSubscriptionByEndpoint(sub.endpoint);
        } else {
          console.error(`Web Push failed for user ${userId}:`, error);
        }
      }
    }
  }
}
