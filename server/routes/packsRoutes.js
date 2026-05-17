import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");
import { getPool, sql } from "../db.js";
import { registerPack, unregisterPack, setPackStatus } from "../packs-sync.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const packsPath = path.join(__dirname, "../packs");

/**
 * Normalizuje JSON balík do štandardného LexiPack formátu.
 * Podporuje:
 *  - root pole  [ {...}, ... ]  →  { words: [...] }
 *  - examples[].en/sk           →  example_en / example_sk
 */
function normalizePack(json) {
  // root pole → obal do objektu
  const pack = Array.isArray(json) ? { words: json } : { ...json };

  pack.words = (pack.words || []).map((w) => {
    const word = { ...w };

    // examples[0].en → example_en
    if (!word.example_en && Array.isArray(word.examples) && word.examples[0]?.en) {
      word.example_en = word.examples[0].en;
    }
    // examples[0].sk → example_sk
    if (!word.example_sk && Array.isArray(word.examples) && word.examples[0]?.sk) {
      word.example_sk = word.examples[0].sk;
    }

    return word;
  });

  return pack;
}

async function syncTags(tags) {
  if (!tags?.length) return;
  const pool = await getPool();
  for (const tag of tags) {
    const name = tag.trim();
    if (!name) continue;
    await pool.request()
      .input("name", sql.NVarChar, name)
      .query(`IF NOT EXISTS (SELECT 1 FROM Tags WHERE name = @name) INSERT INTO Tags (name) VALUES (@name)`);
  }
}

// ── ZOZNAM TAGOV ──────────────────────────────────────
router.get("/tags", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT name FROM Tags ORDER BY name");
    res.json(result.recordset.map(r => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load tags" });
  }
});

// ── ZOZNAM BALÍKOV ────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const EXCLUDED = new Set(["manifest.json"]);
    const files = fs.readdirSync(packsPath).filter(f =>
      f.toLowerCase().endsWith(".json") && !EXCLUDED.has(f.toLowerCase())
    );

    // načítaj SQL záznamy naraz
    const pool = await getPool();
    const sqlResult = await pool.request().query(
      "SELECT file_name, status, created_at, updated_at FROM Packs"
    );
    const sqlMap = {};
    for (const row of sqlResult.recordset) sqlMap[row.file_name] = row;

    const packs = files.map((file) => {
      const fullPath = path.join(packsPath, file);
      const content = fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, "");
      const json = normalizePack(JSON.parse(content));
      const words = json.words || [];
      const FIELDS = ["word", "translation", "phonetic", "definition", "type", "level", "example_en", "example_sk"];
      const totalSlots = words.length * FIELDS.length;
      const filledSlots = words.reduce((sum, w) =>
        sum + FIELDS.filter(f => w[f] && String(w[f]).trim() !== "").length, 0
      );
      const progress = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

      return {
        fileName:    file,
        packId:      json.packId    || "-",
        name:        json.name      || file,
        description: json.description || "-",
        targetLang:  json.targetLang  || "-",
        nativeLang:  json.nativeLang  || "-",
        level:       json.level       || "-",
        category:    json.category    || "-",
        icon:        json.icon        || "",
        author:      json.author      || "-",
        createdAt:   json.createdAt   || "-",
        version:     json.version     || "-",
        tags:        json.tags        || [],
        words:       words.length,
        progress:    `${progress} %`,
        status:      sqlMap[file]?.status ?? "Draft",
      };
    });

    res.json(packs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load packs" });
  }
});

// ── VYTVOR NOVÝ BALÍK ─────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, description, packId, targetLang, nativeLang, level,
            category, icon, author, version, tags } = req.body;

    if (!name) return res.status(400).json({ error: "name is required" });

    let fileName = req.body.fileName;
    if (!fileName) {
      const slug = (packId || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      fileName = `${slug}.json`;
    }
    if (!fileName.endsWith(".json")) fileName += ".json";
    const fullPath = path.join(packsPath, fileName);

    if (fs.existsSync(fullPath))
      return res.status(409).json({ error: "Pack with this name already exists" });

    const finalPackId = packId || fileName.replace(".json", "");
    const pack = {
      packId:      finalPackId,
      name,
      description: description || "",
      targetLang:  targetLang  || "en",
      nativeLang:  nativeLang  || "sk",
      level:       level       || "B1",
      category:    category    || "",
      icon:        icon        || "",
      author:      author      || "",
      createdAt:   new Date().toISOString().slice(0, 10),
      version:     version     || "1.0",
      tags:        Array.isArray(tags) ? tags : (tags || "").split(",").map(t => t.trim()).filter(Boolean),
      words:       [],
    };

    fs.writeFileSync(fullPath, JSON.stringify(pack, null, 2), "utf8");

    await registerPack(fileName, finalPackId, req.user?.id ?? null);
    await syncTags(pack.tags);

    res.status(201).json({ fileName, pack });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create pack" });
  }
});

// ── ULOŽ BALÍK ────────────────────────────────────────
router.put("/:fileName", requireAuth, async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const fullPath = path.join(packsPath, fileName);
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "Pack not found" });
    fs.writeFileSync(fullPath, JSON.stringify(req.body, null, 2), "utf8");

    const pool = await getPool();
    await pool.request()
      .input("file_name", sql.NVarChar, fileName)
      .query("UPDATE Packs SET updated_at = GETDATE() WHERE file_name = @file_name");

    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : (req.body.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    await syncTags(tags);

    const COMPLETE_FIELDS = ["word", "translation", "phonetic", "definition", "type", "level", "example_en", "example_sk"];
    const words = req.body.words || [];
    const allComplete = words.length > 0 && words.every((w) =>
      COMPLETE_FIELDS.every((f) => w[f] && String(w[f]).trim() !== "")
    );

    let autoStatus = null;
    if (allComplete) {
      const statusRow = await pool.request()
        .input("fn", sql.NVarChar, fileName)
        .query("SELECT status FROM Packs WHERE file_name = @fn");
      const currentStatus = statusRow.recordset[0]?.status;
      if (currentStatus === "Draft") {
        await setPackStatus(fileName, "Complete");
        autoStatus = "Complete";
      }
    }

    res.json({ message: "Saved", autoStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save pack" });
  }
});

// ── ULOŽ IKONU BALÍKA ─────────────────────────────────
router.patch("/:fileName/icon", requireAuth, async (req, res) => {
  try {
    const fullPath = path.join(packsPath, req.params.fileName);
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "Pack not found" });
    const raw = fs.readFileSync(fullPath, "utf8").replace(/^﻿/, "");
    const parsed = JSON.parse(raw);
    const pack = Array.isArray(parsed) ? { words: parsed } : { ...parsed };
    pack.icon = req.body.icon ?? "";
    fs.writeFileSync(fullPath, JSON.stringify(pack, null, 2), "utf8");
    res.json({ message: "Icon saved" });
  } catch (err) {
    console.error("ICON SAVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── ZMEŇ STATUS BALÍKA ────────────────────────────────
const VALID_STATUSES = ["Draft", "Complete", "In Review", "Approved", "Published", "Archived"];

router.patch("/:fileName/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const { role } = req.user;

  // kontrola oprávnení
  const restrictions = {
    "Published": ["admin"],
    "Approved":  ["admin", "reviewer"],
    "Archived":  ["admin"],
  };
  if (restrictions[status] && !restrictions[status].includes(role))
    return res.status(403).json({ error: `Rola '${role}' nemôže nastaviť status '${status}'` });

  try {
    await setPackStatus(req.params.fileName, status);

    // záznam do PackReviews pri auditových akciách
    if (status === "Approved" || status === "In Review") {
      const pool = await getPool();
      const packRow = await pool.request()
        .input("fn", sql.NVarChar, req.params.fileName)
        .query("SELECT id FROM Packs WHERE file_name = @fn");
      const packDbId = packRow.recordset[0]?.id;
      if (packDbId) {
        await pool.request()
          .input("pack_id",       sql.Int,      packDbId)
          .input("reviewer_id",   sql.Int,      req.user.id)
          .input("reviewer_name", sql.NVarChar, req.user.username)
          .input("action",        sql.NVarChar, status === "Approved" ? "APPROVED" : "SUBMITTED")
          .input("note",          sql.NVarChar, req.body.note ?? null)
          .query(`
            INSERT INTO PackReviews (pack_id, reviewer_id, reviewer_name, action, note)
            VALUES (@pack_id, @reviewer_id, @reviewer_name, @action, @note)
          `);
      }
    }

    res.json({ message: "Status updated", status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ── PUBLIKUJ BALÍK ───────────────────────────────────
router.post("/:fileName/publish", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const srcPath = path.join(packsPath, fileName);
    if (!fs.existsSync(srcPath))
      return res.status(404).json({ error: "Pack not found" });

    const pool = await getPool();

    // Overíme že pack má status Approved
    const packRow = await pool.request()
      .input("fn", sql.NVarChar, fileName)
      .query("SELECT id, status FROM Packs WHERE file_name = @fn");
    const pack = packRow.recordset[0];
    if (!pack) return res.status(404).json({ error: "Pack not found in DB" });
    if (pack.status !== "Approved")
      return res.status(400).json({ error: "Pack musí mať status Approved" });

    // Načítaj publishPath z nastavení usera
    const settingRow = await pool.request()
      .input("user_id", sql.Int, req.user.id)
      .input("key",     sql.NVarChar, "publishPath")
      .query("SELECT value FROM UserSettings WHERE user_id = @user_id AND [key] = @key");
    const publishDir = settingRow.recordset[0]?.value?.trim() || "/publish";

    // Vytvor adresár ak neexistuje
    fs.mkdirSync(publishDir, { recursive: true });

    // Skopíruj súbor
    const destPath = path.join(publishDir, fileName);
    fs.copyFileSync(srcPath, destPath);

    // Nastav status Published
    await setPackStatus(fileName, "Published");

    // Audit záznam
    await pool.request()
      .input("pack_id",       sql.Int,      pack.id)
      .input("reviewer_id",   sql.Int,      req.user.id)
      .input("reviewer_name", sql.NVarChar, req.user.username)
      .input("action",        sql.NVarChar, "PUBLISHED")
      .input("note",          sql.NVarChar, `Publikovaný do: ${destPath}`)
      .query(`
        INSERT INTO PackReviews (pack_id, reviewer_id, reviewer_name, action, note)
        VALUES (@pack_id, @reviewer_id, @reviewer_name, @action, @note)
      `);

    // Archivovanie do ZIP (ak je nastavená cesta a adresár existuje)
    let archivePath = null;
    const archiveSettingRow = await pool.request()
      .input("user_id", sql.Int, req.user.id)
      .input("key",     sql.NVarChar, "archivePath")
      .query("SELECT value FROM UserSettings WHERE user_id = @user_id AND [key] = @key");
    const archiveDir = archiveSettingRow.recordset[0]?.value?.trim();

    if (archiveDir && fs.existsSync(archiveDir)) {
      const zipName = fileName.replace(/\.json$/i, ".zip");
      archivePath = path.join(archiveDir, zipName);

      const zip = new AdmZip();
      zip.addLocalFile(srcPath);
      zip.writeZip(archivePath);
    }

    res.json({ message: "Pack publikovaný", destPath, archivePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── VYMAŽ BALÍK ───────────────────────────────────────
router.delete("/:fileName", requireAuth, requireRole("admin", "editor"), async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const fullPath = path.join(packsPath, fileName);
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "Pack not found" });
    fs.unlinkSync(fullPath);
    await unregisterPack(fileName);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete pack" });
  }
});

// ── NAČÍTAJ BALÍK ─────────────────────────────────────
router.get("/:fileName", (req, res) => {
  try {
    const fileName = req.params.fileName;
    const fullPath = path.join(packsPath, fileName);
    const content = fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, "");
    res.json(normalizePack(JSON.parse(content)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load pack" });
  }
});

export default router;
