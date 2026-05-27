import express from "express";
import { getPool, sql } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { auditLog } from "../middleware/audit.js";

const router = express.Router();

// ── ZAPÍSAŤ ZÁZNAM (autentifikovaný user) ─────────────
router.post("/log", requireAuth, async (req, res) => {
  const { action, details } = req.body;
  if (!action) return res.status(400).json({ error: "action required" });
  await auditLog(req.user, action, details ?? {}, req.ip);
  res.json({ ok: true });
});

// ── AUDIT LOG (len admin) ─────────────────────────────
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { limit = 200, action, username } = req.query;

    let query = `
      SELECT TOP (@limit) id, user_id, username, role, action, details, ip_address, created_at
      FROM AuditLog
      WHERE 1=1
    `;

    const request = (await getPool()).request().input("limit", sql.Int, parseInt(limit));

    if (action) {
      query += " AND action = @action";
      request.input("action", sql.NVarChar, action);
    }
    if (username) {
      query += " AND username LIKE @username";
      request.input("username", sql.NVarChar, `%${username}%`);
    }

    query += " ORDER BY created_at DESC";

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load audit log" });
  }
});

export default router;
