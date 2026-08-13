import type { NotificationItem } from '../types';

export function dispatchSupportOpenFromNotification(linkId?: string): void {
  window.dispatchEvent(
    new CustomEvent('bars-support-open', { detail: { ticketId: linkId } }),
  );
}

export function dispatchTasksOpenFromNotification(linkType?: string, linkId?: string): void {
  if (linkType === 'support') {
    dispatchSupportOpenFromNotification(linkId);
    return;
  }
  if (!linkId) return;
  if (linkType === 'board' || linkId.startsWith('kboard_')) {
    window.dispatchEvent(
      new CustomEvent('bars-tasks-open', { detail: { boardId: linkId } }),
    );
    return;
  }
  if (linkType === 'task') {
    window.dispatchEvent(
      new CustomEvent('bars-tasks-open', { detail: { taskId: linkId } }),
    );
  }
}

export function openNotificationLink(notification: NotificationItem): void {
  if (notification.link_type === 'chat' && notification.link_id) {
    window.dispatchEvent(
      new CustomEvent('bars-chat-open', { detail: { conversationId: notification.link_id } }),
    );
    return;
  }
  if (notification.link_type === 'task' || notification.link_type === 'board') {
    dispatchTasksOpenFromNotification(notification.link_type, notification.link_id);
    return;
  }
  if (notification.link_type === 'support') {
    dispatchSupportOpenFromNotification(notification.link_id);
    return;
  }
  if (notification.link_type === 'shipment' && notification.link_id) {
    window.dispatchEvent(
      new CustomEvent('bars-shipment-open', { detail: { shipmentId: notification.link_id } }),
    );
  }
}
