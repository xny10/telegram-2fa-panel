const { Redis } = require('@upstash/redis');

let redis;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

const STATES = {
  IDLE: "IDLE",
  WAITING_ADD_ACCOUNT: "WAITING_ADD_ACCOUNT",
  WAITING_SEARCH: "WAITING_SEARCH",
  WAITING_RESTORE_BACKUP: "WAITING_RESTORE_BACKUP",
  WAITING_PIN: "WAITING_PIN",
  WAITING_NEW_PIN: "WAITING_NEW_PIN",
  WAITING_WHITELIST_USER: "WAITING_WHITELIST_USER"
};

async function getState(userId) {
  if (!redis) return STATES.IDLE;
  const state = await redis.get(`user:${userId}:state`);
  return state || STATES.IDLE;
}

async function setState(userId, state) {
  if (!redis) return;
  await redis.set(`user:${userId}:state`, state);
}

module.exports = {
  STATES,
  getState,
  setState,
  redis // exported for other storage
};
