#!/usr/bin/env node
/**
 * Telegram webhook helper.
 *
 * Usage (loads .env.local automatically):
 *   node scripts/webhook.mjs info                 -> show current webhook status
 *   node scripts/webhook.mjs set <https-url>      -> register webhook at <url>/api/telegram
 *   node scripts/webhook.mjs delete               -> remove the webhook
 *
 * Examples:
 *   node scripts/webhook.mjs info
 *   node scripts/webhook.mjs set https://your-app.vercel.app
 */

import fs from "node:fs";
import path from "node:path";

// --- tiny .env.local loader (no dependency) ---
function loadEnv() {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!TOKEN) {
  console.error("ERROR: TELEGRAM_BOT_TOKEN is not set (.env.local or env).");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

async function call(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const [, , cmd, urlArg] = process.argv;

async function main() {
  switch (cmd) {
    case "info": {
      const info = await call("getWebhookInfo");
      console.log(JSON.stringify(info, null, 2));
      const me = await call("getMe");
      if (me.ok) {
        console.log(`\nBot: @${me.result.username} (id ${me.result.id})`);
      } else {
        console.log("\ngetMe failed — is TELEGRAM_BOT_TOKEN correct?");
      }
      break;
    }

    case "set": {
      if (!urlArg) {
        console.error("Usage: node scripts/webhook.mjs set <https-url>");
        process.exit(1);
      }
      if (!urlArg.startsWith("https://")) {
        console.error("URL must be https:// (Telegram requires HTTPS).");
        process.exit(1);
      }
      if (!SECRET) {
        console.error("ERROR: TELEGRAM_WEBHOOK_SECRET is not set.");
        process.exit(1);
      }
      const base = urlArg.replace(/\/+$/, "");
      const webhookUrl = `${base}/api/telegram`;
      const result = await call("setWebhook", {
        url: webhookUrl,
        secret_token: SECRET,
        allowed_updates: ["message"],
        drop_pending_updates: true,
      });
      console.log(`Webhook URL: ${webhookUrl}`);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "delete": {
      const result = await call("deleteWebhook", {
        drop_pending_updates: false,
      });
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.log(
        [
          "Telegram webhook helper",
          "",
          "  node scripts/webhook.mjs info",
          "  node scripts/webhook.mjs set https://your-app.vercel.app",
          "  node scripts/webhook.mjs delete",
        ].join("\n"),
      );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
