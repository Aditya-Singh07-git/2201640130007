// Logging Middleware/auth.js
require("dotenv").config();
const axios = require("axios");

const AUTH_URL = process.env.AUTH_URL || "http://20.244.56.144/evaluation-service/auth";

// credentials taken from env
const credentials = {
  email: process.env.EMAIL,
  name: process.env.NAME,
  rollNo: process.env.ROLL_NO,
  accessCode: process.env.ACCESS_CODE,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
};

let tokenCache = {
  token: null,
  expiry: 0 // ms epoch
};

async function getAccessToken() {
  // return cached if not expired (with 60s buffer)
  if (tokenCache.token && Date.now() + 60000 < tokenCache.expiry) {
    return tokenCache.token;
  }

  try {
    const res = await axios.post(AUTH_URL, credentials, {
      headers: { "Content-Type": "application/json" }
    });

    const data = res.data;
    const token = data.access_token || data.token || null;
    // expires_in is seconds from auth response if present
    let ttl = (data.expires_in && Number(data.expires_in)) ? Number(data.expires_in) * 1000 : 15 * 60 * 1000; // default 15m
    tokenCache.token = token;
    tokenCache.expiry = Date.now() + ttl;
    return tokenCache.token;
  } catch (err) {
    throw new Error(`Auth error: ${err.response?.data || err.message}`);
  }
}

module.exports = { getAccessToken };
