/** Tracks active WebSocket sessions per user (ref-counted for multiple tabs). */

const wsCountByUser = new Map<string, number>();

export function registerWsUser(userId: string): void {
  wsCountByUser.set(userId, (wsCountByUser.get(userId) ?? 0) + 1);
}

export function unregisterWsUser(userId: string): void {
  const count = wsCountByUser.get(userId) ?? 0;
  if (count <= 1) {
    wsCountByUser.delete(userId);
    return;
  }
  wsCountByUser.set(userId, count - 1);
}

export function isUserWsOnline(userId: string): boolean {
  return (wsCountByUser.get(userId) ?? 0) > 0;
}
