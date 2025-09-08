// Backend Test Submission/utils.js
const crypto = require("crypto");

function isValidUrl(u) {
  try {
    const parsed = new URL(u);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
function isValidShortcode(code) {
  if (typeof code !== "string") return false;
  if (code.length < 3 || code.length > 32) return false;
  return /^[a-zA-Z0-9]+$/.test(code);
}
function generateShortcode(length = 7) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
function nowUTC() {
  return new Date().toISOString();
}
function minutesFromNowUTC(mins) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}
module.exports = { isValidUrl, isValidShortcode, generateShortcode, nowUTC, minutesFromNowUTC };
