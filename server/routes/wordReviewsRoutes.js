import express from "express";
import { getPool, sql } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { evaluatePackStatusAfterReview } from "../packs-sync.js";

const router = express.Router();

// ── NAČÍTAJ REVIEWS PRE BALÍK ─────────────────────────
router.get("/:fileName/word-reviews", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const packRow = await pool.request()
      .input("fn", sql.NVarChar, req.params.fileName)
      .query("SELECT id FROM Packs WHERE file_name = @fn");
    const packDbId = packRow.recordset[0]?.id;
    if (!packDbId) return res.json([]);

    const result = await pool.request()
      .input("pack_id", sql.Int, packDbId)
      .query(`
        SELECT id, word_id, word, reviewer_id, reviewer_name, action, comment, created_at
        FROM WordReviews
        WHERE pack_id = @pack_id
        ORDER BY created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load word reviews" });
  }
});

// ── PRIDAJ REVIEW K SLOVU ─────────────────────────────
router.post("/:fileName/word-reviews", requireAuth, async (req, res) => {
  const { word_id, word, action, comment } = req.body;
  if (!word_id || !word || !action)
    return res.status(400).json({ error: "word_id, word and action are required" });

  const VALID_ACTIONS = ["FLAG", "OK", "COMMENT"];
  if (!VALID_ACTIONS.includes(action))
    return res.status(400).json({ error: "Invalid action" });

  try {
    const pool = await getPool();
    const packRow = await pool.request()
      .input("fn", sql.NVarChar, req.params.fileName)
      .query("SELECT id FROM Packs WHERE file_name = @fn");
    const packDbId = packRow.recordset[0]?.id;
    if (!packDbId) return res.status(404).json({ error: "Pack not found" });

    const result = await pool.request()
      .input("pack_id",      sql.Int,      packDbId)
      .input("word_id",      sql.NVarChar, word_id)
      .input("word",         sql.NVarChar, word)
      .input("reviewer_id",  sql.Int,      req.user.id)
      .input("reviewer_name",sql.NVarChar, req.user.username)
      .input("action",       sql.NVarChar, action)
      .input("comment",      sql.NVarChar, comment ?? null)
      .query(`
        INSERT INTO WordReviews (pack_id, word_id, word, reviewer_id, reviewer_name, action, comment)
        OUTPUT INSERTED.*
        VALUES (@pack_id, @word_id, @word, @reviewer_id, @reviewer_name, @action, @comment)
      `);
    const review = result.recordset[0];
    const autoStatus = await evaluatePackStatusAfterReview(req.params.fileName, packDbId, req.user);
    res.status(201).json({ ...review, autoStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add word review" });
  }
});

// ── VYMAŽ REVIEW ─────────────────────────────────────
router.delete("/:fileName/word-reviews/:id", requireAuth, requireRole("admin", "reviewer"), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input("id", sql.Int, parseInt(req.params.id))
      .query("DELETE FROM WordReviews WHERE id = @id");
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

router.delete("/by-id/:packDbId/word-reviews/:id", requireAuth, requireRole("admin", "reviewer"), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input("id", sql.Int, parseInt(req.params.id))
      .query("DELETE FROM WordReviews WHERE id = @id");
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// ── REVIEWS PRE BALÍK PODĽA DB ID ────────────────────
router.get("/by-id/:packDbId/word-reviews", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("pack_id", sql.Int, parseInt(req.params.packDbId))
      .query(`
        SELECT id, word_id, word, reviewer_id, reviewer_name, action, comment, created_at
        FROM WordReviews
        WHERE pack_id = @pack_id
        ORDER BY created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load word reviews" });
  }
});

router.post("/by-id/:packDbId/word-reviews", requireAuth, async (req, res) => {
  const { word_id, word, action, comment } = req.body;
  if (!word_id || !word || !action)
    return res.status(400).json({ error: "word_id, word and action are required" });
  const VALID_ACTIONS = ["FLAG", "OK", "COMMENT"];
  if (!VALID_ACTIONS.includes(action))
    return res.status(400).json({ error: "Invalid action" });

  try {
    const pool = await getPool();
    const packDbId = parseInt(req.params.packDbId);
    const packRow = await pool.request()
      .input("id", sql.Int, packDbId)
      .query("SELECT file_name FROM Packs WHERE id = @id");
    if (!packRow.recordset[0]) return res.status(404).json({ error: "Pack not found" });

    const result = await pool.request()
      .input("pack_id",       sql.Int,      packDbId)
      .input("word_id",       sql.NVarChar, word_id)
      .input("word",          sql.NVarChar, word)
      .input("reviewer_id",   sql.Int,      req.user.id)
      .input("reviewer_name", sql.NVarChar, req.user.username)
      .input("action",        sql.NVarChar, action)
      .input("comment",       sql.NVarChar, comment ?? null)
      .query(`
        INSERT INTO WordReviews (pack_id, word_id, word, reviewer_id, reviewer_name, action, comment)
        OUTPUT INSERTED.*
        VALUES (@pack_id, @word_id, @word, @reviewer_id, @reviewer_name, @action, @comment)
      `);
    const review = result.recordset[0];
    const autoStatus = await evaluatePackStatusAfterReview(
      packRow.recordset[0].file_name, packDbId, req.user
    );
    res.status(201).json({ ...review, autoStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add word review" });
  }
});

export default router;
