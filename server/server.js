import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import packsRoutes from "./routes/packsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import heartbeatRoutes from "./routes/heartbeatRoutes.js";
import telemetryRoutes from "./routes/telemetryRoutes.js";
import { syncPacksOnStartup } from "./packs-sync.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import wordReviewsRoutes from "./routes/wordReviewsRoutes.js";
import fsRoutes from "./routes/fsRoutes.js";
import mailRoutes from "./routes/mailRoutes.js";
import qualityRoutes from "./routes/qualityRoutes.js";
import autoCorrectRoutes from "./routes/autoCorrectRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import { fileURLToPath } from "url";
import path from "path";
import { serverLog } from "./utils/serverLogger.js";
import { getPool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

process.on("uncaughtException", (err) => {
  serverLog("ERROR", "uncaughtException", { message: err.message, stack: err.stack });
});
process.on("unhandledRejection", (reason) => {
  serverLog("ERROR", "unhandledRejection", { reason: String(reason) });
});

const app = express();

const ALLOWED_ORIGINS = [
  "https://lexico.techdoc.sk",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use("/api/packs", packsRoutes);
app.use("/api/packs", wordReviewsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/fs", fsRoutes);
app.use("/api/heartbeat", heartbeatRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/quality", qualityRoutes);
app.use("/api/autocorrect", autoCorrectRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api", aiRoutes);

app.get("/api/health", async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    res.json({ status: "OK", app: "LexiPack", db: "OK" });
  } catch (err) {
    serverLog("ERROR", "Health check: SQL connection failed", { error: err.message });
    res.status(503).json({ status: "ERROR", app: "LexiPack", db: "FAIL", error: err.message });
  }
});

/*
app.get("/api/debug/workspace", (req, res) => {
  import("path").then(({ default: path }) => {
    import("fs").then(({ default: fs }) => {
      const base = process.env.WORKSPACE_BASE
        ? path.resolve(process.env.WORKSPACE_BASE)
        : "(not set — fallback)";
      let entries = [];
      try { entries = fs.readdirSync(base); } catch (e) { entries = [`ERROR: ${e.message}`]; }
      res.json({ WORKSPACE_BASE: process.env.WORKSPACE_BASE, resolved: base, entries });
    });
  });
});
*/


app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }
  serverLog("ERROR", `Unhandled express error: ${req.method} ${req.path}`, { message: err.message });
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  serverLog("INFO", `Server started on port ${PORT}`);
  await syncPacksOnStartup();
});

