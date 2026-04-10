const BASE = 'https://api.telegram.org';

function token() {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  return t;
}

export async function sendMessage(chatId: string, text: string, replyMarkup?: object) {
  const res = await fetch(`${BASE}/bot${token()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup && { reply_markup: replyMarkup }),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[telegram] sendMessage error:', err);
  }
}

export async function editMessageReplyMarkup(chatId: string, messageId: number, replyMarkup: object) {
  await fetch(`${BASE}/bot${token()}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: replyMarkup }),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${BASE}/bot${token()}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, ...(text && { text }) }),
  });
}

export async function setWebhook(webhookUrl: string) {
  const res = await fetch(`${BASE}/bot${token()}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.json();
}

export function verifyWebhookSecret(_req: Request): boolean {
  return true;
}
