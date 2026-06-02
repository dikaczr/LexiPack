import express from "express";
import { getPool, sql } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const { pack } = req.body;
  if (!pack) return res.status(400).json({ error: "pack required" });
  try {
    const pool = await getPool();
    await pool.request()
      .input("user_id",   sql.Int,      req.user.id)
      .input("pack_file", sql.NVarChar, pack)
      .query("INSERT INTO Heartbeats (user_id, pack_file) VALUES (@user_id, @pack_file)");
    res.json({ ok: true });
  } catch (err) {
    console.error("Heartbeat write failed:", err.message);
    res.status(500).json({ error: "Failed" });
  }
});

// Vráti agregované beaty za posledných N dní (default 30), per pack + per deň
router.get("/stats", requireAuth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days ?? 30), 365);
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("user_id", sql.Int, req.user.id)
      .input("days",    sql.Int, days)
      .query(`
        SELECT
          pack_file,
          CONVERT(NVARCHAR(10), ts, 23) AS day,
          COUNT(*) AS beats
        FROM Heartbeats
        WHERE user_id = @user_id
          AND ts >= DATEADD(day, -@days, GETDATE())
        GROUP BY pack_file, CONVERT(NVARCHAR(10), ts, 23)
        ORDER BY day DESC, beats DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// Celkový čas výroby balíka v sekundách (počet beatov × 30)
router.get("/production", requireAuth, async (req, res) => {
  const { pack } = req.query;
  if (!pack) return res.status(400).json({ error: "pack required" });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("pack_file", sql.NVarChar, pack)
      .query("SELECT COUNT(*) AS beats FROM Heartbeats WHERE pack_file = @pack_file");
    const beats = result.recordset[0]?.beats ?? 0;
    res.json({ seconds: beats * 30 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
