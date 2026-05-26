const { sendMessage, editMessageText, deleteMessage, answerCallbackQuery } = require('./telegram');
const { STATES, getState, setState } = require('./state');
const { mainMenuKeyboard, accountCodeKeyboard, deleteAccountKeyboard, confirmDeleteKeyboard, codeResultKeyboard, settingsKeyboard, backupMenuKeyboard } = require('./keyboards');
const { addAccount, getAccount, listAccounts, markDeleted, getAllBackupData } = require('./storage');
const { encryptToString, decrypt } = require('./crypto');
const { generateTestCode, generateTOTP } = require('./totp');
const { sendBackupLog, sendBackupFile } = require('./channelBackup');

async function handleTextMessage(message) {
  const text = message.text;
  const userId = message.from.id;
  const chatId = message.chat.id;

  if (!text) return;

  const state = await getState(userId);

  if (text === '/start') {
    await setState(userId, STATES.IDLE);
    await sendMessage(chatId, "🔐 <b>2FA Manager Bot</b>\n\nPilih menu di bawah:", mainMenuKeyboard());
    return;
  }

  if (text === '➕ Tambah Code') {
    await setState(userId, STATES.WAITING_ADD_ACCOUNT);
    await sendMessage(chatId, "➕ <b>Tambah 2FA Account</b>\n\nKirim format:\n<code>nama_akun secret_2fa</code>\n\nContoh:\n<code>gmail-main JBSWY3DPEHPK3PXP</code>");
    return;
  }

  if (text === '🔐 Get 2FA Code') {
    await setState(userId, STATES.IDLE);
    const accounts = await listAccounts(userId);
    if (accounts.length === 0) {
      await sendMessage(chatId, "Belum ada account tersimpan.");
      return;
    }
    await sendMessage(chatId, "Pilih account:", accountCodeKeyboard(accounts));
    return;
  }

  if (text === '📋 List Account') {
    await setState(userId, STATES.IDLE);
    const accounts = await listAccounts(userId);
    let msg = "📋 <b>Saved Accounts</b>\n\n";
    if (accounts.length === 0) {
      msg += "Belum ada account.";
    } else {
      accounts.forEach((acc, i) => {
        msg += `${i + 1}. ${acc.label}\n`;
      });
      msg += `\nTotal: ${accounts.length} accounts`;
    }
    await sendMessage(chatId, msg);
    return;
  }

  if (text === '🔎 Search Account') {
    await setState(userId, STATES.WAITING_SEARCH);
    await sendMessage(chatId, "🔎 <b>Search Account</b>\n\nKetik keyword account:");
    return;
  }

  if (text === '🗑 Delete Account') {
    await setState(userId, STATES.IDLE);
    const accounts = await listAccounts(userId);
    if (accounts.length === 0) {
      await sendMessage(chatId, "Belum ada account tersimpan.");
      return;
    }
    await sendMessage(chatId, "Pilih account yang ingin dihapus:", deleteAccountKeyboard(accounts));
    return;
  }

  if (text === '📦 Backup Data') {
    await setState(userId, STATES.IDLE);
    const accounts = await listAccounts(userId, true);
    await sendMessage(chatId, `📦 <b>Backup Data</b>\n\nTotal accounts: ${accounts.length}\nStorage: Telegram Channel\nEncryption: ON\n\nPilih action:`, backupMenuKeyboard());
    return;
  }

  if (text === '⚙️ Setting') {
    await setState(userId, STATES.IDLE);
    await sendMessage(chatId, "⚙️ <b>Settings</b>", settingsKeyboard());
    return;
  }

  if (text === 'ℹ️ Help') {
    await setState(userId, STATES.IDLE);
    const helpMsg = `ℹ️ <b>Help</b>\n\nPanel:\n➕ Tambah Code - simpan secret 2FA\n🔐 Get 2FA Code - ambil kode terbaru\n📋 List Account - lihat akun tersimpan\n🔎 Search Account - cari akun\n🗑 Delete Account - hapus akun\n📦 Backup Data - export/restore backup\n⚙️ Setting - pengaturan bot`;
    await sendMessage(chatId, helpMsg);
    return;
  }

  // Handle State-based inputs
  if (state === STATES.WAITING_ADD_ACCOUNT) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await sendMessage(chatId, "❌ Format salah. Contoh:\n<code>gmail-main JBSWY3DPEHPK3PXP</code>");
      return;
    }
    const label = parts[0];
    const secret = parts[1];
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const testCode = generateTestCode(secret);
    if (!testCode) {
      await sendMessage(chatId, "❌ Secret TOTP tidak valid.");
      return;
    }

    const secret_enc = encryptToString(secret);
    const account = {
      id,
      label,
      secret_enc,
      category: 'default',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false
    };

    const saved = await addAccount(userId, account);
    if (saved) {
      await sendBackupLog({ type: '2fa_add', user_id: userId, ...account });
      await sendMessage(chatId, `✅ Account berhasil disimpan\n\nName: ${label}\n\nKlik 🔐 Get 2FA Code untuk ambil kode.`);
    } else {
      await sendMessage(chatId, "❌ Gagal menyimpan account (Redis error).");
    }
    await setState(userId, STATES.IDLE);
    return;
  }

  if (state === STATES.WAITING_SEARCH) {
    const keyword = text.toLowerCase();
    const accounts = await listAccounts(userId);
    const results = accounts.filter(acc => acc.label.toLowerCase().includes(keyword));

    if (results.length === 0) {
      await sendMessage(chatId, "Tidak ada account ditemukan.");
    } else {
      await sendMessage(chatId, `Search result for: <b>${text}</b>`, accountCodeKeyboard(results));
    }
    await setState(userId, STATES.IDLE);
    return;
  }

  // Default fallback
  await sendMessage(chatId, "Pilih menu dari keyboard di bawah:", mainMenuKeyboard());
}

async function handleCallbackQuery(callback) {
  const data = callback.data;
  const userId = callback.from.id;
  const messageId = callback.message.message_id;
  const chatId = callback.message.chat.id;

  if (data.startsWith('code:')) {
    const accountId = data.split(':')[1];
    const acc = await getAccount(userId, accountId);
    
    if (!acc) {
      await answerCallbackQuery(callback.id, { text: "Account tidak ditemukan", show_alert: true });
      return;
    }

    const secret = decrypt(acc.secret_enc);
    const totp = generateTOTP(secret);

    if (!totp) {
        await answerCallbackQuery(callback.id, { text: "Gagal generate kode", show_alert: true });
        return;
    }

    const msg = `🔐 <b>${acc.label}</b>\n\nCode: <code>${totp.code}</code>\nExpired in: ${totp.timeRemaining}s`;
    const sent = await sendMessage(chatId, msg, codeResultKeyboard(accountId));
    
    // Auto-delete after 30 seconds for MVP
    if (sent && sent.result && sent.result.message_id) {
        setTimeout(async () => {
            try {
                await deleteMessage(chatId, sent.result.message_id);
            } catch (e) {
                // Ignore if already deleted
            }
        }, 30000);
    }
    
    await answerCallbackQuery(callback.id);
    return;
  }

  if (data.startsWith('refresh:')) {
    const accountId = data.split(':')[1];
    const acc = await getAccount(userId, accountId);
    
    if (!acc) {
      await answerCallbackQuery(callback.id, { text: "Account tidak ditemukan", show_alert: true });
      return;
    }

    const secret = decrypt(acc.secret_enc);
    const totp = generateTOTP(secret);

    if (!totp) {
        await answerCallbackQuery(callback.id, { text: "Gagal generate kode", show_alert: true });
        return;
    }

    const msg = `🔐 <b>${acc.label}</b>\n\nCode: <code>${totp.code}</code>\nExpired in: ${totp.timeRemaining}s`;
    await editMessageText(chatId, messageId, msg, codeResultKeyboard(accountId));
    await answerCallbackQuery(callback.id, { text: "Refreshed!" });
    return;
  }

  if (data === 'back:code_list') {
      const accounts = await listAccounts(userId);
      await deleteMessage(chatId, messageId);
      if (accounts.length > 0) {
          await sendMessage(chatId, "Pilih account:", accountCodeKeyboard(accounts));
      }
      await answerCallbackQuery(callback.id);
      return;
  }

  if (data.startsWith('delete:')) {
    const accountId = data.split(':')[1];
    const acc = await getAccount(userId, accountId);
    if (!acc) {
      await answerCallbackQuery(callback.id, { text: "Account tidak ditemukan", show_alert: true });
      return;
    }
    const msg = `Yakin hapus account ini?\n\n<b>${acc.label}</b>`;
    await editMessageText(chatId, messageId, msg, confirmDeleteKeyboard(accountId));
    await answerCallbackQuery(callback.id);
    return;
  }

  if (data.startsWith('confirm_delete:')) {
    const accountId = data.split(':')[1];
    const acc = await getAccount(userId, accountId);
    if (acc) {
      await markDeleted(userId, accountId);
      await sendBackupLog({ type: '2fa_delete', id: accountId, deleted_at: new Date().toISOString() });
      await editMessageText(chatId, messageId, `🗑 Deleted:\n<b>${acc.label}</b>`);
    } else {
      await editMessageText(chatId, messageId, "Account tidak ditemukan.");
    }
    await answerCallbackQuery(callback.id, { text: "Deleted" });
    return;
  }

  if (data === 'cancel') {
    await deleteMessage(chatId, messageId);
    await answerCallbackQuery(callback.id);
    return;
  }

  if (data === 'backup:export') {
      const accounts = await getAllBackupData(userId);
      const backupData = JSON.stringify(accounts, null, 2);
      const filename = `2fa-backup-${new Date().toISOString().slice(0,10)}.json`;
      
      await answerCallbackQuery(callback.id, { text: "Exporting backup..." });
      await sendBackupFile(backupData, filename);
      await sendMessage(chatId, `✅ Backup exported to Storage Channel.\nFile: ${filename}`);
      return;
  }

  if (data.startsWith('setting:') || data.startsWith('backup:')) {
      await answerCallbackQuery(callback.id, { text: "Feature coming soon!", show_alert: true });
      return;
  }

  await answerCallbackQuery(callback.id);
}

module.exports = {
  handleTextMessage,
  handleCallbackQuery
};
