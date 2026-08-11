import type { NotificationItem } from "../../src/types.js";
import { createNotification, type CreateNotificationInput } from "./repository.js";

type NotifyBroadcastFn = (userId: string, payload: unknown) => void;

let broadcastFn: NotifyBroadcastFn = () => {};

export function setNotificationBroadcast(fn: NotifyBroadcastFn): void {
  broadcastFn = fn;
}

export function emitNotificationUpdated(
  userId: string,
  notification: NotificationItem,
): void {
  broadcastFn(userId, {
    type: "NOTIFICATION_UPDATED",
    notification,
  });
}

export async function pushNotificationToUser(
  input: CreateNotificationInput,
): Promise<NotificationItem> {
  const notification = await createNotification(input);
  broadcastFn(input.userId, {
    type: "NOTIFICATION_NEW",
    notification,
  });
  return notification;
}

/** Create + WS push for each recipient. */
export async function notifyUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
): Promise<NotificationItem[]> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out: NotificationItem[] = [];
  for (const userId of unique) {
    out.push(await pushNotificationToUser({ ...input, userId }));
  }
  return out;
}
