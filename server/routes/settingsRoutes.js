import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPool, sql } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

function getWorkspaceBase() {
  return process.env.WORKSPACE_BASE
    ? path.resolve(process.env.WORKSPACE_BASE)
    : path.join(__dirname, "../packs");
}

// ── SERVEROM VYPOČÍTANÉ DEFAULTY ─────────────────────
router.get("/defaults", requireAuth, (req, res) => {
  const userWorkspace = path.join(getWorkspaceBase(), req.user.username);
  try { fs.mkdirSync(userWorkspace, { recursive: true }); } catch { /* ignoruj */ }
  res.json({ workspace: userWorkspace, workspaceBase: getWorkspaceBase() });
});

// ── NAČÍTAJ NASTAVENIA USERA ──────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("user_id", sql.Int, req.user.id)
      .query("SELECT [key], value FROM UserSettings WHERE user_id = @user_id");

    const settings = {};
    for (const row of result.recordset) settings[row.key] = row.value;
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// ── ULOŽ NASTAVENIA (UPSERT) ──────────────────────────
router.patch("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    for (const [key, value] of Object.entries(req.body)) {
      await pool.request()
        .input("user_id", sql.Int,      req.user.id)
        .input("key",     sql.NVarChar, key)
        .input("value",   sql.NVarChar, String(value))
        .query(`
          MERGE UserSettings AS target
          USING (SELECT @user_id AS user_id, @key AS [key]) AS source
            ON target.user_id = source.user_id AND target.[key] = source.[key]
          WHEN MATCHED THEN
            UPDATE SET value = @value, updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (user_id, [key], value) VALUES (@user_id, @key, @value);
        `);
    }
    res.json({ message: "Settings saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// ── GLOBÁLNE NASTAVENIA (čítanie — všetci, zápis — len admin) ───
router.get("/global", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT [key], value FROM GlobalSettings");
    const settings = {};
    for (const row of result.recordset) settings[row.key] = row.value;
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load global settings" });
  }
});

router.patch("/global", requireAuth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  try {
    const pool = await getPool();
    for (const [key, value] of Object.entries(req.body)) {
      await pool.request()
        .input("key",   sql.NVarChar, key)
        .input("value", sql.NVarChar, String(value))
        .query(`
          MERGE GlobalSettings AS target
          USING (SELECT @key AS [key]) AS source ON target.[key] = source.[key]
          WHEN MATCHED THEN UPDATE SET value = @value, updated_at = GETDATE()
          WHEN NOT MATCHED THEN INSERT ([key], value) VALUES (@key, @value);
        `);
    }
    res.json({ message: "Global settings saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save global settings" });
  }
});

export default router;
