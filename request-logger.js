/*
 * Lightweight request logger for debugging network-layer failures.
 */

function requestLogger(req, _res, next) {
  try {
    const origin = req.headers.origin || req.headers.host || '';
    console.log(`[REQ] ${req.method} ${req.originalUrl} origin=${origin}`);
  } catch (e) {
    // ignore
  }
  next();
}

module.exports = requestLogger;

