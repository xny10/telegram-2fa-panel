async function sendMessage(chatId, text, options = {}) {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      ...options
    })
  });
  return response.json();
}

async function editMessageText(chatId, messageId, text, options = {}) {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/editMessageText`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML',
      ...options
    })
  });
  return response.json();
}

async function deleteMessage(chatId, messageId) {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/deleteMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId
    })
  });
  return response.json();
}

async function answerCallbackQuery(callbackQueryId, options = {}) {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/answerCallbackQuery`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      ...options
    })
  });
  return response.json();
}

module.exports = {
  sendMessage,
  editMessageText,
  deleteMessage,
  answerCallbackQuery
};
