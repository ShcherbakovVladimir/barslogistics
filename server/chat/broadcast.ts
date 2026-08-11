type ChatBroadcastFn = (userIds: string[], payload: unknown) => void;

let broadcastFn: ChatBroadcastFn = () => {};

export function setChatBroadcast(fn: ChatBroadcastFn): void {
  broadcastFn = fn;
}

export function broadcastChatToUsers(userIds: string[], payload: unknown): void {
  broadcastFn(userIds, payload);
}
