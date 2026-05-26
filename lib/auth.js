function isAuthorized(userId) {
  const ownerId = process.env.OWNER_TELEGRAM_ID;
  return String(userId) === String(ownerId);
}

module.exports = {
  isAuthorized
};
