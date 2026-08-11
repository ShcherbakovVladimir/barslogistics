type TaskBroadcastFn = (userIds: string[], payload: Record<string, unknown>) => void;

let broadcastFn: TaskBroadcastFn | null = null;

export function setTaskBroadcast(fn: TaskBroadcastFn): void {
  broadcastFn = fn;
}

export function broadcastTaskEvent(userIds: string[], payload: Record<string, unknown>): void {
  if (!broadcastFn || userIds.length === 0) return;
  const unique = [...new Set(userIds.filter(Boolean))];
  broadcastFn(unique, payload);
}
