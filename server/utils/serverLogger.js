import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const LOGS_DIR   = path.join(__dirname, "../logs");
const AUDIT_FILE = path.join(LOGS_DIR, "ServerAudit.log");
const ERROR_FILE = path.join(LOGS_DIR, "ServerError.log");

fs.mkdirSync(LOGS_DIR, { recursive: true });

export function serverLog(level, message, details = null) {
  const ts   = new Date().toISOString();
  const det  = details ? " | " + JSON.stringify(details) : "";
  const line = `[${ts}] [${level.padEnd(5)}] ${message}${det}\n`;

  fs.appendFile(AUDIT_FILE, line, () => {});
  if (level === "ERROR" || level === "WARN") {
    fs.appendFile(ERROR_FILE, line, () => {});
  }

  if (level === "ERROR") console.error(line.trimEnd());
  else console.log(line.trimEnd());
}

export function patchConsole() {
  const _error = console.error.bind(console);
  const _warn  = console.warn.bind(console);

  console.error = (...args) => {
    const msg = args.map(a => (a instanceof Error ? a.stack ?? a.message : String(a))).join(" ");
    const ts  = new Date().toISOString();
    fs.appendFile(ERROR_FILE, `[${ts}] [ERROR] ${msg}\n`, () => {});
    _error(...args);
  };

  console.warn = (...args) => {
    const msg = args.map(a => (a instanceof Error ? a.stack ?? a.message : String(a))).join(" ");
    const ts  = new Date().toISOString();
    fs.appendFile(ERROR_FILE, `[${ts}] [WARN ] ${msg}\n`, () => {});
    _warn(...args);
  };
}
