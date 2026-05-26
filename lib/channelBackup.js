const { sendMessage } = require('./telegram');

async function sendBackupLog(logObject) {
  const channelId = process.env.STORAGE_CHANNEL_ID;
  if (!channelId) return;

  const message = `<pre>${JSON.stringify(logObject, null, 2)}</pre>`;
  try {
    await sendMessage(channelId, message);
  } catch (error) {
    console.error('Failed to send backup log to channel:', error);
  }
}

async function sendBackupFile(dataString, filename) {
  const channelId = process.env.STORAGE_CHANNEL_ID;
  if (!channelId) return;
  
  if (dataString.length < 4000) {
      const message = `<b>Backup: ${filename}</b>\n<pre>${dataString}</pre>`;
      await sendMessage(channelId, message);
  } else {
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      let body = `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
      body += `${channelId}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n`;
      body += `Content-Type: application/json\r\n\r\n`;
      body += `${dataString}\r\n`;
      body += `--${boundary}--\r\n`;

      const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`;
      await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: body
      });
  }
}

module.exports = {
  sendBackupLog,
  sendBackupFile
};
