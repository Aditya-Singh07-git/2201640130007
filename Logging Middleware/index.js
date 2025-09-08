const path = require("path");
const axios = require("axios");

// 🔹 Load .env from project root (adjust path based on your folder structure)
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

let cachedToken = null;

// 🔹 Fetch new access token
async function getAccessToken() {
  try {
    if (cachedToken) return cachedToken; // reuse cached token if valid

    const res = await axios.post(process.env.AUTH_URL, {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    });

    cachedToken = res.data.access_token;
    console.log("✅ Access token fetched");
    return cachedToken;
  } catch (err) {
    console.error("❌ Failed to fetch access token:", err.response?.data || err.message);
    throw new Error("Unable to fetch access token");
  }
}

// 🔹 Main Log function
async function Log(stack, level, pkg, message) {
  try {
    if (!cachedToken) await getAccessToken();

    const res = await axios.post(
      process.env.LOG_URL,
      { stack, level, package: pkg, message },
      {
        headers: {
          Authorization: `Bearer ${cachedToken}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    console.log("✅ Log sent:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Log API error:", err.response?.data || err.message);

    // retry once if token expired
    if (err.response?.status === 401) {
      cachedToken = null;
      console.log("🔄 Token expired, refreshing and retrying...");
      return await Log(stack, level, pkg, message);
    }

    throw new Error("Logging failed: " + (err.response?.data?.message || err.message));
  }
}

module.exports = Log;
