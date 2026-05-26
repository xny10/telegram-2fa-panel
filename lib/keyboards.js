function mainMenuKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [
          { text: "➕ Tambah Code" },
          { text: "🔐 Get 2FA Code" }
        ],
        [
          { text: "📋 List Account" },
          { text: "🔎 Search Account" }
        ],
        [
          { text: "🗑 Delete Account" },
          { text: "📦 Backup Data" }
        ],
        [
          { text: "⚙️ Setting" },
          { text: "ℹ️ Help" }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

function accountCodeKeyboard(accounts) {
  return {
    reply_markup: {
      inline_keyboard: accounts.map((acc) => [
        {
          text: `🔐 ${acc.label}`,
          callback_data: `code:${acc.id}`
        }
      ])
    }
  };
}

function deleteAccountKeyboard(accounts) {
  return {
    reply_markup: {
      inline_keyboard: accounts.map((acc) => [
        {
          text: `🗑 ${acc.label}`,
          callback_data: `delete:${acc.id}`
        }
      ])
    }
  };
}

function confirmDeleteKeyboard(accountId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ Yes, Delete",
            callback_data: `confirm_delete:${accountId}`
          },
          {
            text: "❌ Cancel",
            callback_data: "cancel"
          }
        ]
      ]
    }
  };
}

function codeResultKeyboard(accountId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔄 Refresh Code",
            callback_data: `refresh:${accountId}`
          }
        ],
        [
          {
            text: "⬅️ Back to List",
            callback_data: "back:code_list"
          }
        ]
      ]
    }
  };
}

function settingsKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔐 Change PIN", callback_data: "setting:pin" },
          { text: "⏱ Auto Delete: ON", callback_data: "setting:auto_delete" }
        ],
        [
          { text: "👤 Whitelist User", callback_data: "setting:whitelist" },
          { text: "🔁 Restore Backup", callback_data: "setting:restore" }
        ],
        [
          { text: "🧹 Clear Session", callback_data: "setting:clear_session" },
          { text: "⬅️ Back", callback_data: "setting:back" }
        ]
      ]
    }
  };
}

function backupMenuKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📤 Export Backup", callback_data: "backup:export" },
                    { text: "🔁 Restore Backup", callback_data: "backup:restore" }
                ],
                [
                    { text: "🧾 View Backup Log", callback_data: "backup:log" }
                ]
            ]
        }
    }
}

module.exports = {
  mainMenuKeyboard,
  accountCodeKeyboard,
  deleteAccountKeyboard,
  confirmDeleteKeyboard,
  codeResultKeyboard,
  settingsKeyboard,
  backupMenuKeyboard
};
