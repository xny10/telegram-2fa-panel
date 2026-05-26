const { redis } = require('./state');

async function addAccount(userId, account) {
  if (!redis) return false;
  // account = { id, label, secret_enc, category, created_at, updated_at, deleted }
  await redis.set(`user:${userId}:account:${account.id}`, JSON.stringify(account));
  await redis.sadd(`user:${userId}:accounts`, account.id);
  return true;
}

async function getAccount(userId, accountId) {
  if (!redis) return null;
  const data = await redis.get(`user:${userId}:account:${accountId}`);
  return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
}

async function listAccounts(userId, includeDeleted = false) {
  if (!redis) return [];
  const accountIds = await redis.smembers(`user:${userId}:accounts`);
  const accounts = [];
  
  for (const id of accountIds) {
    const acc = await getAccount(userId, id);
    if (acc) {
      if (!acc.deleted || includeDeleted) {
        accounts.push(acc);
      }
    }
  }
  
  return accounts.sort((a, b) => a.label.localeCompare(b.label));
}

async function markDeleted(userId, accountId) {
  if (!redis) return false;
  const acc = await getAccount(userId, accountId);
  if (acc) {
    acc.deleted = true;
    acc.updated_at = new Date().toISOString();
    await redis.set(`user:${userId}:account:${accountId}`, JSON.stringify(acc));
    return true;
  }
  return false;
}

async function getAllBackupData(userId) {
   return await listAccounts(userId, true);
}

module.exports = {
  addAccount,
  getAccount,
  listAccounts,
  markDeleted,
  getAllBackupData
};
