const levels = { info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m" };
const reset = "\x1b[0m";

function log(level, msg) {
  const ts = new Date().toISOString();
  console.log(`${levels[level] || ""}[${ts}] [${level.toUpperCase()}] ${msg}${reset}`);
}

export default {
  info: (msg) => log("info", msg),
  warn: (msg) => log("warn", msg),
  error: (msg) => log("error", msg),
};