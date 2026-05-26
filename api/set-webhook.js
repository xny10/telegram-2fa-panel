export default async function handler(req, res) {
  const token = process.env.BOT_TOKEN;
  const appUrl = process.env.APP_URL;

  if (!token || !appUrl) {
    return res.status(500).json({ error: 'BOT_TOKEN or APP_URL is missing' });
  }

  const webhookUrl = `${appUrl}/api/telegram`;
  const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

  try {
    const response = await fetch(telegramUrl);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
