// Backend Test Submission/store.js
const { Log } = require("../Logging Middleware");

// simple in-memory store
const db = new Map();

module.exports = {
  exists(code) { return db.has(code); },
  get(code) { return db.get(code); },
  put(code, record) {
    db.set(code, record);
    // fire-and-forget local repo log (non-blocking)
    Log("backend", "debug", "repository", `store: upsert ${code}`).catch(()=>{});
    return true;
  }
};
