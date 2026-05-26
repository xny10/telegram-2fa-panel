const { authenticator } = require('otplib');

function generateTestCode(secret) {
  try {
    return authenticator.generate(secret.replace(/\s+/g, ''));
  } catch (err) {
    return null;
  }
}

function generateTOTP(secret) {
  try {
    const cleanSecret = secret.replace(/\s+/g, '');
    const code = authenticator.generate(cleanSecret);
    const timeRemaining = authenticator.timeRemaining();
    return { code, timeRemaining };
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateTestCode,
  generateTOTP
};
