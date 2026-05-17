import express from "express";
import fs from "fs";
import path from "path";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ── PREHLIADAČ ADRESÁROV ──────────────────────────────
router.get("/browse", requireAuth, requireRole("admin"), (req, res) => {
  try {
    let target = req.query.path || "";

    // Fallback na root podľa platformy
    if (!target) {
      target = process.platform === "win32" ? "C:\\" : "/";
    }

    if (!fs.existsSync(target)) {
      return res.status(404).json({ error: "Path does not exist" });
    }

    const stat = fs.statSync(target);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: "Not a directory" });
    }

    const entries = fs.readdirSync(target, { withFileTypes: true });
    const dirs = entries
      .filter((e) => {
        try { return e.isDirectory() && !e.name.startsWith("."); } catch { return false; }
      })
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    const parent = path.dirname(target);
    const hasParent = parent !== target; // na roote sú rovnaké

    res.json({ path: target, dirs, parent: hasParent ? parent : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── VYTVOR ADRESÁR ────────────────────────────────────
router.post("/mkdir", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const { path: dirPath } = req.body;
    if (!dirPath) return res.status(400).json({ error: "path is required" });
    fs.mkdirSync(dirPath, { recursive: true });
    res.json({ message: "Created", path: dirPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
