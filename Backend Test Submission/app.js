// Backend Test Submission/app.js
require("dotenv").config();
const express = require("express");
const routes = require("./routes");
const { Log } = require("../Logging Middleware");

const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

app.get("/api/health", async (req, res) => {
  await Log("backend", "debug", "route", "health check hit");
  return res.status(200).json({ status: "ok", service: "url-shortener" });
});

app.use("/", routes);

// start server and log with logger
app.listen(PORT, async () => {
  // log via Logging Middleware (no console.log)
  try {
    await Log("backend", "info", "service", `server listening on :${PORT}`);
  } catch (_) { /* silently ignore logging errors on startup */ }
});
