const fetch = require('node-fetch');

async function sendMessage(chatId, text) {
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram: missing chatId or token, skipping');
    return;
  }
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
  const json = await res.json();
  if (!json.ok) console.error('Telegram error:', json.description);
  return json;
}

module.exports = { sendMessage };
