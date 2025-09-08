// Backend Test Submission/routes.js
const { Router } = require("express");
const Log = require("../Logging Middleware");
const store = require("./store");
const { isValidUrl, isValidShortcode, generateShortcode, nowUTC, minutesFromNowUTC } = require("./utils");

const router = Router();

/**
 * POST /shorturls
 */
router.post("/shorturls", async (req, res) => {
  const { url, validity, shortcode } = req.body || {};
  try {
    await Log("backend", "debug", "controller", "POST /shorturls received");

    if (!url || !isValidUrl(url)) {
      await Log("backend", "warn", "handler", "shorturls: invalid or missing url");
      return res.status(400).json({ error: "Invalid or missing 'url' field" });
    }

    let ttlMins = 30;
    if (validity !== undefined) {
      if (!Number.isInteger(validity) || validity <= 0) {
        await Log("backend", "warn", "handler", "shorturls: invalid validity");
        return res.status(400).json({ error: "'validity' must be a positive integer (minutes)" });
      }
      ttlMins = validity;
    }

    let code = shortcode;
    if (code !== undefined) {
      if (!isValidShortcode(code)) {
        await Log("backend", "warn", "handler", "shorturls: invalid custom shortcode");
        return res.status(400).json({ error: "Invalid 'shortcode'. 3–32 alphanumeric characters." });
      }
      if (store.exists(code)) {
        await Log("backend", "error", "repository", `shorturls: shortcode collision for ${code}`);
        return res.status(409).json({ error: "Shortcode already in use" });
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const candidate = generateShortcode();
        if (!store.exists(candidate)) { code = candidate; break; }
      }
      if (!code) {
        await Log("backend", "fatal", "service", "shorturls: failed to generate unique shortcode");
        return res.status(500).json({ error: "Failed to generate unique shortcode" });
      }
    }

    const createdAt = nowUTC();
    const expiresAt = minutesFromNowUTC(ttlMins);
    const record = {
      shortcode: code,
      longUrl: url,
      createdAt,
      expiresAt,
      clicks: 0,
      lastAccessed: null,
      clickDetails: []
    };
    store.put(code, record);
    await Log("backend", "info", "repository", `shorturls: created shortcode ${code}`);

    const shortLink = `${req.protocol}://${req.get("host")}/${code}`;
    return res.status(201).json({ shortLink, expiry: expiresAt });
  } catch (err) {
    await Log("backend", "error", "handler", `shorturls: unexpected error - ${err.message}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Redirect GET /:code
 */
router.get("/:code", async (req, res) => {
  const code = (req.params.code || "").trim();
  try {
    await Log("backend", "debug", "route", `GET /${code} redirect requested`);
    if (!code || !isValidShortcode(code)) {
      await Log("backend", "warn", "handler", "redirect: invalid shortcode format");
      return res.status(400).json({ error: "Invalid shortcode" });
    }
    const record = store.get(code);
    if (!record) {
      await Log("backend", "error", "repository", `redirect: shortcode not found ${code}`);
      return res.status(404).json({ error: "Shortcode not found" });
    }
    if (new Date(nowUTC()) > new Date(record.expiresAt)) {
      await Log("backend", "warn", "controller", `redirect: shortcode expired ${code}`);
      return res.status(410).json({ error: "Short link has expired" });
    }

    // capture click details
    const click = {
      timestamp: nowUTC(),
      referrer: req.get("referer") || "direct",
      geo: (req.headers["x-forwarded-for"] || req.ip || "unknown").toString()
    };
    record.clicks += 1;
    record.lastAccessed = click.timestamp;
    record.clickDetails.push(click);
    store.put(code, record);

    await Log("backend", "info", "controller", `redirect: ${code} -> ${record.longUrl}`);
    return res.redirect(302, record.longUrl);
  } catch (err) {
    await Log("backend", "error", "handler", `redirect: unexpected error - ${err.message}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /shorturls/:code  (stats)
 */
router.get("/shorturls/:code", async (req, res) => {
  const code = (req.params.code || "").trim();
  try {
    await Log("backend", "debug", "controller", `GET /shorturls/${code} stats requested`);
    if (!code || !isValidShortcode(code)) {
      await Log("backend", "warn", "handler", "stats: invalid shortcode format");
      return res.status(400).json({ error: "Invalid shortcode" });
    }
    const record = store.get(code);
    if (!record) {
      await Log("backend", "error", "repository", `stats: shortcode not found ${code}`);
      return res.status(404).json({ error: "Shortcode not found" });
    }
    const isExpired = new Date(nowUTC()) > new Date(record.expiresAt);
    await Log("backend", "info", "controller", `stats: returned for ${code}`);
    return res.status(200).json({
      shortcode: record.shortcode,
      longUrl: record.longUrl,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      totalClicks: record.clicks,
      isExpired,
      clicks: record.clickDetails
    });
  } catch (err) {
    await Log("backend", "error", "handler", `stats: unexpected error - ${err.message}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
