const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "server-error.log");

function logError(err) {
  const time = new Date().toLocaleString();
  const content = `[${time}] ${err.stack || err}\n\n`;
  fs.appendFileSync(logFile, content);
  console.error("⚠️ Error logged:", err.message);
}

process.on("uncaughtException", logError);
process.on("unhandledRejection", logError);

module.exports = logError;
