import express from "express";
import { getPool, sql } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/telemetry/ai?days=30
// Admin vidí všetkých userov, ostatní len seba
router.get("/ai", requireAuth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days ?? 30), 365);
  const isAdmin = req.user.role === "admin";
  try {
    const pool = await getPool();
    const request = pool.request()
      .input("days", sql.Int, days);

    let whereUser = "";
    if (!isAdmin) {
      request.input("user_id", sql.Int, req.user.id);
      whereUser = "AND user_id = @user_id";
    }

    const result = await request.query(`
      SELECT
        username,
        pack_file,
        action,
        CONVERT(NVARCHAR(10), ts, 23) AS day,
        COUNT(*) AS cnt
      FROM AiTelemetry
      WHERE ts >= DATEADD(day, -@days, GETDATE())
        ${whereUser}
      GROUP BY username, pack_file, action, CONVERT(NVARCHAR(10), ts, 23)
      ORDER BY day DESC, cnt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load AI telemetry" });
  }
});

// GET /api/telemetry/ai/latency?days=14
// ms_per_token per deň per action — normalizovaná odozva
router.get("/ai/latency", requireAuth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days ?? 14), 90);
  const isAdmin = req.user.role === "admin";
  try {
    const pool = await getPool();
    const request = pool.request().input("days", sql.Int, days);

    let whereUser = "";
    if (!isAdmin) {
      request.input("user_id", sql.Int, req.user.id);
      whereUser = "AND user_id = @user_id";
    }

    const result = await request.query(`
      SELECT
        action,
        CONVERT(NVARCHAR(10), request_at, 23)                                              AS day,
        AVG(CAST(DATEDIFF(millisecond, request_at, ts) AS FLOAT)
            / NULLIF(token_count, 0))                                                      AS ms_per_token,
        AVG(DATEDIFF(millisecond, request_at, ts))                                         AS avg_ms,
        AVG(CAST(token_count AS FLOAT))                                                    AS avg_tokens,
        COUNT(*)                                                                            AS cnt
      FROM AiTelemetry
      WHERE request_at >= DATEADD(day, -@days, GETDATE())
        AND token_count IS NOT NULL AND token_count > 0
        ${whereUser}
      GROUP BY action, CONVERT(NVARCHAR(10), request_at, 23)
      ORDER BY day ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load latency stats" });
  }
});

// POST /api/telemetry/ai-acceptance  — batch record acceptance/correction events
router.post("/ai-acceptance", requireAuth, async (req, res) => {
  const entries = Array.isArray(req.body) ? req.body : [];
  if (entries.length === 0) return res.json({ message: "ok" });
  try {
    const pool = await getPool();
    for (const { action, packFile, accepted, correctedFields } of entries) {
      await pool.request()
        .input("user_id",          sql.Int,      req.user.id)
        .input("username",         sql.NVarChar,  req.user.username)
        .input("pack_file",        sql.NVarChar,  packFile ?? null)
        .input("action",           sql.NVarChar,  action)
        .input("accepted",         sql.Bit,       accepted ? 1 : 0)
        .input("corrected_fields", sql.NVarChar,  correctedFields ?? null)
        .query(`
          INSERT INTO AiAcceptance (user_id, username, pack_file, action, accepted, corrected_fields)
          VALUES (@user_id, @username, @pack_file, @action, @accepted, @corrected_fields)
        `);
    }
    res.json({ message: "recorded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record acceptance" });
  }
});

// GET /api/telemetry/ai-correction?days=30
// Returns overall acceptance rate and breakdown by action
router.get("/ai-correction", requireAuth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days ?? 30), 365);
  const isAdmin = req.user.role === "admin";
  try {
    const pool = await getPool();
    const request = pool.request().input("days", sql.Int, days);

    let whereUser = "";
    if (!isAdmin) {
      request.input("user_id", sql.Int, req.user.id);
      whereUser = "AND user_id = @user_id";
    }

    const result = await request.query(`
      SELECT
        action,
        COUNT(*)                              AS total,
        SUM(CAST(accepted AS INT))            AS accepted
      FROM AiAcceptance
      WHERE ts >= DATEADD(day, -@days, GETDATE())
        ${whereUser}
      GROUP BY action
      ORDER BY total DESC
    `);

    const rows = result.recordset;
    const total    = rows.reduce((s, r) => s + r.total,    0);
    const accepted = rows.reduce((s, r) => s + r.accepted, 0);
    const byAction = rows.map((r) => ({
      action:   r.action,
      total:    r.total,
      accepted: r.accepted,
      rate:     r.total > 0 ? Math.round((r.accepted / r.total) * 100) : null,
    }));

    res.json({ total, accepted, rate: total > 0 ? Math.round((accepted / total) * 100) : null, byAction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load correction stats" });
  }
});

export default router;
