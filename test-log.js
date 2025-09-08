// test-log.js
require("dotenv").config();
const { Log } = require("./Logging Middleware");

(async () => {
  try {
    const res = await Log("backend", "info", "service", "test log from test-log.js");
    console.log("Log API response:", res);
  } catch (err) {
    console.error("Test log failed:", err.message);
  }
})();
