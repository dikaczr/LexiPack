import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const LOG_FILE   = path.join(__dirname, "../ServerAudit.log");

export function serverLog(level, message, details = null) {
  const ts   = new Date().toISOString();
  const det  = details ? " | " + JSON.stringify(details) : "";
  const line = `[${ts}] [${level.padEnd(5)}] ${message}${det}\n`;
  fs.appendFile(LOG_FILE, line, () => {});
  if (level === "ERROR") console.error(line.trimEnd());
  else console.log(line.trimEnd());
}
