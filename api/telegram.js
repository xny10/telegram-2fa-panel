const { isAuthorized } = require('../lib/auth');
const { handleTextMessage, handleCallbackQuery } = require('../lib/commands');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;

    if (update.message) {
      const userId = update.message.from.id;
      if (!isAuthorized(userId)) {
        return res.status(200).json({ ok: true, message: 'Unauthorized' });
      }
      await handleTextMessage(update.message);
    }

    if (update.callback_query) {
      const userId = update.callback_query.from.id;
      if (!isAuthorized(userId)) {
        return res.status(200).json({ ok: true, message: 'Unauthorized' });
      }
      await handleCallbackQuery(update.callback_query);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error handling update:', error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
