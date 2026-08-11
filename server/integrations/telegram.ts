import { getTelegramSettings } from "./settings.js";

export interface TelegramSendResult {
  ok: boolean;
  message_id?: number;
  error?: string;
}

export async function sendTelegramMessage(
  chatId: string,
  message: string,
  overrideToken?: string
): Promise<TelegramSendResult> {
  const settings = await getTelegramSettings();
  const token = overrideToken || settings.bot_token;
  if (!token) {
    return { ok: false, error: "Telegram bot token not configured" };
  }
  if (!chatId) {
    return { ok: false, error: "Chat ID is required" };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data = (await res.json()) as { ok: boolean; description?: string; result?: { message_id: number } };
  if (!res.ok || !data.ok) {
    return { ok: false, error: data.description || `HTTP ${res.status}` };
  }
  return { ok: true, message_id: data.result?.message_id };
}

export async function testTelegramConnection(chatId?: string): Promise<TelegramSendResult> {
  const settings = await getTelegramSettings();
  const target = chatId || settings.default_chat_id;
  return sendTelegramMessage(target, "✅ BarsLogistics: тестовое сообщение интеграции Telegram");
}

export async function maybeSendStatusAlert(params: {
  shipmentId: string;
  cargoType: string;
  status: string;
  delayReason?: string;
}) {
  const settings = await getTelegramSettings();
  if (!settings.enabled || !settings.bot_token || !settings.default_chat_id) return;

  const shouldSend =
    (params.status === "delayed" && settings.alert_on_delay) ||
    (params.status !== "delayed" && settings.alert_on_status_change);

  if (!shouldSend) return;

  const icon = params.status === "delayed" ? "🚨" : "📦";
  const reason = params.delayReason ? `\nПричина: ${params.delayReason}` : "";
  const text = `${icon} <b>Маршрут ${params.shipmentId.slice(0, 8)}</b>\nГруз: ${params.cargoType}\nСтатус: ${params.status}${reason}`;

  await sendTelegramMessage(settings.default_chat_id, text);
}
