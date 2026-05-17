import express from "express";
import { getPool, sql } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

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

export default router;
