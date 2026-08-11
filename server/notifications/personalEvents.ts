import type { SupplyLink, User } from "../../src/types.js";
import { getAllUsers } from "../repositories.js";
import { getUserSiteIds, hasFullMapAccess, isShipmentInUserScope } from "../../src/utils/permissions.js";
import { notifyUsers } from "./service.js";
import { getServerT } from "../../src/i18n/translations.js";

const st = getServerT("ru");

function notificationsEnabled(user: User): boolean {
  return user.notifications_enabled !== false;
}

/** Personal stake in a shipment (creator or own site), or managers on critical statuses. */
export function isPersonallyRelatedToShipment(
  user: User,
  shipment: SupplyLink,
  options?: { status?: string },
): boolean {
  if (shipment.created_by && shipment.created_by === user.id) return true;

  const sites = getUserSiteIds(user);
  if (sites.length > 0) {
    const set = new Set(sites);
    if (
      set.has(shipment.origin_id)
      || set.has(shipment.destination_id)
      || (shipment.site_id != null && set.has(shipment.site_id))
    ) {
      return true;
    }
  }

  // Broad roles: only critical delays/alerts unless they created the shipment
  if (hasFullMapAccess(user.role) && isShipmentInUserScope(shipment, user)) {
    const status = options?.status ?? shipment.status;
    return status === "delayed" || status === "alert";
  }

  return false;
}

export async function resolveShipmentRecipients(
  shipment: SupplyLink,
  options?: { excludeUserId?: string; status?: string },
): Promise<string[]> {
  const users = await getAllUsers();
  return users
    .filter(notificationsEnabled)
    .filter(u => u.id !== options?.excludeUserId)
    .filter(u => isPersonallyRelatedToShipment(u, shipment, { status: options?.status }))
    .map(u => u.id);
}

export async function notifyShipmentStatusChange(params: {
  shipment: SupplyLink;
  status: string;
  delayReason?: string | null;
  actorUserId?: string;
}): Promise<void> {
  const recipients = await resolveShipmentRecipients(params.shipment, {
    excludeUserId: params.actorUserId,
    status: params.status,
  });
  if (recipients.length === 0) return;

  await notifyUsers(recipients, {
    title: params.status === "delayed"
      ? st("notifications.shipmentDelayedTitle")
      : st("notifications.shipmentStatusTitle"),
    message: st("notifications.shipmentStatusMessage", {
      id: params.shipment.id.slice(0, 8),
      cargo: params.shipment.cargo_type || "",
      status: st(`status.${params.status}`),
    }),
    type: params.status === "delayed" || params.status === "alert" ? "alert" : "info",
    linkType: "shipment",
    linkId: params.shipment.id,
  });
}

export async function notifyShipmentCreated(params: {
  shipment: SupplyLink;
  actorUserId: string;
  actorName?: string;
}): Promise<void> {
  const recipients = await resolveShipmentRecipients(params.shipment, {
    excludeUserId: params.actorUserId,
    status: params.shipment.status,
  });
  // Also include site stakeholders even when status is not delayed (override full-access filter)
  const users = await getAllUsers();
  const siteRecipients = users
    .filter(notificationsEnabled)
    .filter(u => u.id !== params.actorUserId)
    .filter(u => {
      const sites = getUserSiteIds(u);
      if (sites.length === 0) return false;
      const set = new Set(sites);
      return set.has(params.shipment.origin_id)
        || set.has(params.shipment.destination_id)
        || (params.shipment.site_id != null && set.has(params.shipment.site_id));
    })
    .map(u => u.id);

  const unique = [...new Set([...recipients, ...siteRecipients])];
  if (unique.length === 0) return;

  const who = params.actorName || st("notifications.someone");
  await notifyUsers(unique, {
    title: st("notifications.shipmentCreatedTitle"),
    message: st("notifications.shipmentCreatedMessage", {
      who,
      cargo: params.shipment.cargo_type || "",
      id: params.shipment.id.slice(0, 8),
    }),
    type: "info",
    linkType: "shipment",
    linkId: params.shipment.id,
  });
}

export async function notifyTaskAssigned(params: {
  taskId: string;
  taskTitle: string;
  assigneeId: string;
  actorUserId: string;
  isNew?: boolean;
}): Promise<void> {
  if (!params.assigneeId || params.assigneeId === params.actorUserId) return;
  await notifyUsers([params.assigneeId], {
    title: params.isNew
      ? st("notifications.taskAssignedTitle")
      : st("notifications.taskReassignedTitle"),
    message: params.taskTitle,
    type: "info",
    linkType: "task",
    linkId: params.taskId,
  });
}

export async function notifyTaskStatus(params: {
  taskId: string;
  taskTitle: string;
  columnName: string;
  actorUserId: string;
  assigneeId?: string | null;
  creatorId?: string | null;
}): Promise<void> {
  const doneNames = new Set([
    "готово", "завершение", "done", "complete", "completed",
  ]);
  const isDone = doneNames.has(params.columnName.trim().toLowerCase());
  const recipients = new Set<string>();
  if (params.assigneeId && params.assigneeId !== params.actorUserId) {
    recipients.add(params.assigneeId);
  }
  if (params.creatorId && params.creatorId !== params.actorUserId) {
    recipients.add(params.creatorId);
  }
  if (recipients.size === 0) return;

  await notifyUsers([...recipients], {
    title: isDone
      ? st("notifications.taskDoneTitle")
      : st("notifications.taskMovedTitle"),
    message: st("notifications.taskMovedMessage", {
      title: params.taskTitle,
      column: params.columnName,
    }),
    type: isDone ? "success" : "info",
    linkType: "task",
    linkId: params.taskId,
  });
}

export async function notifyBoardMembersAdded(params: {
  boardId: string;
  boardName: string;
  memberIds: string[];
  actorUserId: string;
}): Promise<void> {
  const recipients = params.memberIds.filter(id => id && id !== params.actorUserId);
  if (recipients.length === 0) return;
  await notifyUsers(recipients, {
    title: st("notifications.boardInviteTitle"),
    message: st("notifications.boardInviteMessage", { name: params.boardName }),
    type: "info",
    linkType: "board",
    linkId: params.boardId,
  });
}

export async function notifyTaskMessage(params: {
  taskId: string;
  taskTitle: string;
  actorUserId: string;
  actorName: string;
  preview: string;
}): Promise<void> {
  const { getTaskParticipantIds } = await import("../tasks/workspace.js");
  const ids = await getTaskParticipantIds(params.taskId);
  const recipients = ids.filter(id => id !== params.actorUserId);
  if (recipients.length === 0) return;
  const preview = params.preview.trim().slice(0, 160) || "…";
  await notifyUsers(recipients, {
    title: st("notifications.taskMessageTitle"),
    message: st("notifications.taskMessageBody", {
      name: params.actorName,
      title: params.taskTitle,
      preview,
    }),
    type: "info",
    linkType: "task",
    linkId: params.taskId,
  });
}

export async function notifyTaskMilestone(params: {
  taskId: string;
  taskTitle: string;
  milestoneTitle: string;
  status: string;
  actorUserId: string;
}): Promise<void> {
  const { getTaskParticipantIds } = await import("../tasks/workspace.js");
  const ids = await getTaskParticipantIds(params.taskId);
  const recipients = ids.filter(id => id !== params.actorUserId);
  if (recipients.length === 0) return;
  const titleKey =
    params.status === "approved"
      ? "notifications.taskMilestoneApprovedTitle"
      : params.status === "rejected"
        ? "notifications.taskMilestoneRejectedTitle"
        : "notifications.taskMilestonePendingTitle";
  await notifyUsers(recipients, {
    title: st(titleKey),
    message: st("notifications.taskMilestoneMessage", {
      milestone: params.milestoneTitle,
      title: params.taskTitle,
    }),
    type: params.status === "approved" ? "success" : params.status === "rejected" ? "alert" : "info",
    linkType: "task",
    linkId: params.taskId,
  });
}
