import express from "express";
import { getPool, sql } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/notifications/users — zoznam aktívnych userov pre compose (bez seba)
router.get("/users", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("me", sql.Int, req.user.id)
      .query(`
        SELECT id, username, personal_name, personal_surname
        FROM Users
        WHERE is_active = 1 AND id <> @me
        ORDER BY COALESCE(personal_surname, username)
      `);
    res.json({ users: result.recordset });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// GET /api/notifications — moje notifikácie (max 50, najnovšie prvé)
router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("to_user_id", sql.Int, req.user.id)
      .query(`
        SELECT
          n.id, n.type, n.title, n.body, n.ref_pack, n.is_read, n.created_at,
          u.username AS from_username,
          u.personal_name AS from_name,
          u.personal_surname AS from_surname
        FROM Notifications n
        LEFT JOIN Users u ON u.id = n.from_user_id
        WHERE n.to_user_id = @to_user_id
        ORDER BY n.created_at DESC
        OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
      `);
    const unread = result.recordset.filter(n => !n.is_read).length;
    res.json({ notifications: result.recordset, unread });
  } catch (err) {
    console.error("GET /notifications failed:", err.message);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

// POST /api/notifications — odoslať notifikáciu (editor/reviewer/admin)
router.post("/", requireAuth, async (req, res) => {
  const { to_user_id, type = "message", title, body, ref_pack } = req.body;
  if (!to_user_id || !title)
    return res.status(400).json({ error: "to_user_id and title are required" });

  try {
    const pool = await getPool();

    // Over že príjemca existuje
    const userCheck = await pool.request()
      .input("id", sql.Int, to_user_id)
      .query("SELECT id FROM Users WHERE id = @id AND is_active = 1");
    if (userCheck.recordset.length === 0)
      return res.status(404).json({ error: "Recipient not found" });

    const result = await pool.request()
      .input("from_user_id", sql.Int,      req.user.id)
      .input("to_user_id",   sql.Int,      to_user_id)
      .input("type",         sql.NVarChar, type)
      .input("title",        sql.NVarChar, title)
      .input("body",         sql.NVarChar, body ?? null)
      .input("ref_pack",     sql.NVarChar, ref_pack ?? null)
      .query(`
        INSERT INTO Notifications (from_user_id, to_user_id, type, title, body, ref_pack)
        OUTPUT INSERTED.id
        VALUES (@from_user_id, @to_user_id, @type, @title, @body, @ref_pack)
      `);
    res.json({ id: result.recordset[0].id });
  } catch (err) {
    console.error("POST /notifications failed:", err.message);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// PATCH /api/notifications/:id/read — označiť ako prečítanú
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input("id",         sql.Int, parseInt(req.params.id))
      .input("to_user_id", sql.Int, req.user.id)
      .query("UPDATE Notifications SET is_read = 1 WHERE id = @id AND to_user_id = @to_user_id");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// PATCH /api/notifications/read-all — označiť všetky ako prečítané
router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input("to_user_id", sql.Int, req.user.id)
      .query("UPDATE Notifications SET is_read = 1 WHERE to_user_id = @to_user_id AND is_read = 0");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// DELETE /api/notifications/:id — zmazať notifikáciu
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input("id",         sql.Int, parseInt(req.params.id))
      .input("to_user_id", sql.Int, req.user.id)
      .query("DELETE FROM Notifications WHERE id = @id AND to_user_id = @to_user_id");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// DELETE /api/notifications — zmazať všetky moje notifikácie
router.delete("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input("to_user_id", sql.Int, req.user.id)
      .query("DELETE FROM Notifications WHERE to_user_id = @to_user_id");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
