import express from "express";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");
import { getPool, sql } from "../db.js";
import { registerPack, unregisterPack, setPackStatus } from "../packs-sync.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { auditLog } from "../middleware/audit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

function getWorkspaceBase() {
  return process.env.WORKSPACE_BASE
    ? path.resolve(process.env.WORKSPACE_BASE)
    : path.join(__dirname, "../packs");
}

function userRootDir(username) {
  return path.join(getWorkspaceBase(), username);
}

function isInsideDir(target, root) {
  const t = path.resolve(target);
  const r = path.resolve(root);
  return t === r || t.startsWith(r + path.sep);
}

// Vráti aktívny workspace adresár z nastavení usera (vždy v rámci jeho root)
async function getActiveWorkspaceDir(pool, userId, username) {
  const userRoot = userRootDir(username);
  try {
    const result = await pool.request()
      .input("uid", sql.Int, userId)
      .input("key", sql.NVarChar, "workspace")
      .query("SELECT value FROM UserSettings WHERE user_id = @uid AND [key] = @key");
    const saved = result.recordset[0]?.value?.trim();
    if (saved && isInsideDir(saved, userRoot)) return path.resolve(saved);
  } catch {}
  return userRoot;
}

// DB kľúč: "admin/Test/astronomy.json" alebo "admin/astronomy.json"
function packDbKey(workspaceDir, fileName) {
  const base = getWorkspaceBase();
  const rel = path.relative(base, workspaceDir).replace(/\\/g, "/");
  return `${rel}/${fileName}`;
}

function normalizePack(json) {
  const pack = Array.isArray(json) ? { words: json } : { ...json };
  const tl = pack.targetLang || "en";
  const nl = pack.nativeLang || "sk";
  const exTarget = `example_${tl}`;
  const exNative = `example_${nl}`;
  pack.words = (pack.words || []).map((w) => {
    const word = { ...w };
    if (Array.isArray(word.examples) && word.examples[0]) {
      const ex = word.examples[0];
      if (!word[exTarget]) word[exTarget] = ex[tl] || ex.en || "";
      if (!word[exNative]) word[exNative] = ex[nl] || ex.sk || "";
      delete word.examples;
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

// ── KATEGÓRIE ─────────────────────────────────────────
router.get("/categories", async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categories' AND xtype='U')
      CREATE TABLE Categories (id INT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(100) NOT NULL UNIQUE)
    `);
    const result = await pool.request().query("SELECT name FROM Categories ORDER BY name");
    res.json(result.recordset.map(r => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

router.post("/categories", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const pool = await getPool();
    await pool.request()
      .input("name", sql.NVarChar, name.trim())
      .query(`IF NOT EXISTS (SELECT 1 FROM Categories WHERE name = @name) INSERT INTO Categories (name) VALUES (@name)`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save category" });
  }
});

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

const PACK_FIELDS_BASE = ["word", "translation", "phonetic", "definition", "type", "level"];

function buildPackSummary(file, fullPath, dbRow) {
  const content = fs.readFileSync(fullPath, "utf8").replace(/^﻿/, "");
  const json = normalizePack(JSON.parse(content));
  const words = json.words || [];
  const tl = json.targetLang || "en";
  const nl = json.nativeLang || "sk";
  const PACK_FIELDS = [...PACK_FIELDS_BASE, `example_${tl}`, `example_${nl}`];
  const totalSlots = words.length * PACK_FIELDS.length;
  const filledSlots = words.reduce((sum, w) =>
    sum + PACK_FIELDS.filter(f => w[f] && String(w[f]).trim() !== "").length, 0
  );
  const progress = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  return {
    fileName:    file,
    packDbId:    dbRow?.id    ?? null,
    packId:      json.packId      || "-",
    name:        json.name        || file,
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
    words:        words.length,
    progress:     `${progress} %`,
    status:       dbRow?.status    ?? "Draft",
    reviewSentBy:     json.reviewSentBy     || null,
    reviewSentAt:     json.reviewSentAt     || null,
    comments:         json.comments         || "",
    reviewerComments: json.reviewerComments || "",
  };
}

// ── ZOZNAM BALÍKOV ────────────────────────────────────
router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.json([]);
  let username, userId, role;
  try {
    const decoded = jwt.verify(authHeader.slice(7), process.env.SESSION_SECRET);
    username = decoded.username;
    userId   = decoded.id;
    role     = decoded.role;
  } catch { return res.json([]); }

  try {
    const pool = await getPool();

    // ── Reviewer vidí In Review aj Approved packy zo všetkých workspace-ov ──
    if (role === "reviewer") {
      const result = await pool.request()
        .query("SELECT id, file_name, status FROM Packs WHERE status IN ('In Review', 'Approved')");
      const packs = [];
      for (const row of result.recordset) {
        const parts = row.file_name.replace(/\\/g, "/").split("/");
        const fullPath = path.join(getWorkspaceBase(), ...parts);
        if (!fs.existsSync(fullPath)) continue;
        try { packs.push(buildPackSummary(parts[parts.length - 1], fullPath, row)); }
        catch { /* preskočí poškodený súbor */ }
      }
      return res.json(packs);
    }

    // ── Admin / editor vidí vlastný workspace ──
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    fs.mkdirSync(workspaceDir, { recursive: true });

    const EXCLUDED = new Set(["manifest.json"]);
    const files = fs.readdirSync(workspaceDir).filter(f =>
      f.toLowerCase().endsWith(".json") && !EXCLUDED.has(f.toLowerCase())
    );

    const dbPrefix = packDbKey(workspaceDir, "").replace(/\/$/, "");
    const sqlResult = await pool.request()
      .input("prefix", sql.NVarChar, `${dbPrefix}/%`)
      .query("SELECT id, file_name, status FROM Packs WHERE file_name LIKE @prefix");

    const sqlMap = {};
    for (const row of sqlResult.recordset) {
      const parts = row.file_name.split("/");
      const basename = parts[parts.length - 1];
      if (row.file_name === `${dbPrefix}/${basename}`) sqlMap[basename] = row;
    }

    const packs = files.map((file) =>
      buildPackSummary(file, path.join(workspaceDir, file), sqlMap[file] ?? null)
    );

    res.json(packs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load packs" });
  }
});

// ── NAČÍTAJ BALÍK PODĽA DB ID (pre reviewer / cross-workspace) ──
router.get("/by-id/:packDbId", requireAuth, async (req, res) => {
  try {
    const { role } = req.user;
    const pool = await getPool();
    const packRow = await pool.request()
      .input("id", sql.Int, parseInt(req.params.packDbId))
      .query("SELECT file_name, status FROM Packs WHERE id = @id");
    const pack = packRow.recordset[0];
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    if (role === "reviewer" && !["In Review", "Approved"].includes(pack.status))
      return res.status(403).json({ error: "Access denied" });

    const parts = pack.file_name.replace(/\\/g, "/").split("/");
    const fullPath = path.join(getWorkspaceBase(), ...parts);
    if (!isInsideDir(fullPath, getWorkspaceBase()))
      return res.status(403).json({ error: "Access denied" });

    const content = fs.readFileSync(fullPath, "utf8").replace(/^﻿/, "");
    res.json(normalizePack(JSON.parse(content)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load pack" });
  }
});

// ── ULOŽ BALÍK PODĽA DB ID (reviewer opravuje chyby) ─
router.put("/by-id/:packDbId", requireAuth, async (req, res) => {
  try {
    const { role } = req.user;
    const pool = await getPool();
    const packRow = await pool.request()
      .input("id", sql.Int, parseInt(req.params.packDbId))
      .query("SELECT file_name, status FROM Packs WHERE id = @id");
    const pack = packRow.recordset[0];
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    if (role === "reviewer" && pack.status !== "In Review")
      return res.status(403).json({ error: "Access denied" });

    const parts = pack.file_name.replace(/\\/g, "/").split("/");
    const fullPath = path.join(getWorkspaceBase(), ...parts);
    if (!isInsideDir(fullPath, getWorkspaceBase()))
      return res.status(403).json({ error: "Access denied" });
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "File not found" });

    fs.writeFileSync(fullPath, JSON.stringify(req.body, null, 2), "utf8");
    await pool.request()
      .input("id", sql.Int, parseInt(req.params.packDbId))
      .query("UPDATE Packs SET updated_at = GETDATE() WHERE id = @id");

    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : (req.body.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    await syncTags(tags);

    const targetLang = (req.body.targetLang || "en").toLowerCase();
    const nativeLang = (req.body.nativeLang || "sk").toLowerCase();
    const COMPLETE_FIELDS = ["word", "translation", "phonetic", "definition", "type", "level", `example_${targetLang}`, `example_${nativeLang}`, "topic"];
    const LANGS_WITH_ARTICLES = new Set(["de", "fr", "es", "it"]);
    const hasArticleLang = LANGS_WITH_ARTICLES.has(targetLang);
    const words = req.body.words || [];
    const incompleteWords = words.filter((w) => {
      if (!COMPLETE_FIELDS.every((f) => w[f] && String(w[f]).trim() !== "")) return true;
      if (hasArticleLang && w.type?.toLowerCase() === "noun" && (!w.article || String(w.article).trim() === "")) return true;
      return false;
    });
    const allComplete = words.length > 0 && incompleteWords.length === 0;
    let autoStatus = null;
    if (allComplete && pack.status === "Draft") {
      await setPackStatus(pack.file_name, "Complete");
      autoStatus = "Complete";
    } else if (!allComplete && pack.status === "Complete") {
      await setPackStatus(pack.file_name, "Draft");
      autoStatus = "Draft";
    }
    const debugIncomplete = incompleteWords.map((w) => {
      const missingFields = COMPLETE_FIELDS.filter((f) => !w[f] || String(w[f]).trim() === "");
      if (hasArticleLang && w.type?.toLowerCase() === "noun" && (!w.article || String(w.article).trim() === ""))
        missingFields.push("article");
      return { word: w.word || w.id, missing: missingFields };
    });
    res.json({ message: "Saved", autoStatus, ...(debugIncomplete.length > 0 && { incompleteWords: debugIncomplete }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save pack" });
  }
});

// ── VYTVOR NOVÝ BALÍK ─────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const { username, id: userId } = req.user;
    const { name, description, packId, targetLang, nativeLang, level,
            category, icon, author, version, tags } = req.body;

    if (!name) return res.status(400).json({ error: "name is required" });

    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    fs.mkdirSync(workspaceDir, { recursive: true });

    let fileName = req.body.fileName;
    if (!fileName) {
      const slug = (packId || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      fileName = `${slug}.json`;
    }
    if (!fileName.endsWith(".json")) fileName += ".json";

    const fullPath = path.join(workspaceDir, fileName);
    if (fs.existsSync(fullPath))
      return res.status(409).json({ error: "Pack with this name already exists" });

    const finalPackId = packId || fileName.replace(".json", "");
    const pack = {
      packId:           finalPackId,
      name,
      description:      description || "",
      targetLang:       targetLang  || "en",
      nativeLang:       nativeLang  || "sk",
      level:            level       || "B1",
      category:         category    || "",
      icon:             icon        || "",
      author:           author      || "",
      createdAt:        new Date().toISOString().slice(0, 10),
      version:          version     || "1.0",
      tags:             Array.isArray(tags) ? tags : (tags || "").split(",").map(t => t.trim()).filter(Boolean),
      comments:         "",
      reviewerComments: "",
      words:            [],
    };

    fs.writeFileSync(fullPath, JSON.stringify(pack, null, 2), "utf8");
    await registerPack(packDbKey(workspaceDir, fileName), finalPackId, userId);
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
    const { username, id: userId, role } = req.user;
    const { fileName } = req.params;
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const fullPath = path.join(workspaceDir, fileName);
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "Pack not found" });

    const dbKey = packDbKey(workspaceDir, fileName);

    if (role !== "reviewer") {
      const statusRow = await pool.request()
        .input("fn", sql.NVarChar, dbKey)
        .query("SELECT status FROM Packs WHERE file_name = @fn");
      if (statusRow.recordset[0]?.status === "In Review")
        return res.status(403).json({ error: "Pack is In Review — editing is locked" });
    }

    fs.writeFileSync(fullPath, JSON.stringify(req.body, null, 2), "utf8");
    await pool.request()
      .input("file_name", sql.NVarChar, dbKey)
      .query("UPDATE Packs SET updated_at = GETDATE() WHERE file_name = @file_name");

    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : (req.body.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    await syncTags(tags);

    const targetLang = (req.body.targetLang || "en").toLowerCase();
    const nativeLang = (req.body.nativeLang || "sk").toLowerCase();
    const COMPLETE_FIELDS = ["word", "translation", "phonetic", "definition", "type", "level", `example_${targetLang}`, `example_${nativeLang}`, "topic"];
    const LANGS_WITH_ARTICLES = new Set(["de", "fr", "es", "it"]);
    const hasArticleLang = LANGS_WITH_ARTICLES.has(targetLang);
    const words = req.body.words || [];
    const incompleteWords = words.filter((w) => {
      const missingBasic = COMPLETE_FIELDS.filter((f) => !w[f] || String(w[f]).trim() === "");
      if (missingBasic.length > 0) return true;
      if (hasArticleLang && w.type?.toLowerCase() === "noun" && (!w.article || String(w.article).trim() === "")) return true;
      return false;
    });
    const allComplete = words.length > 0 && incompleteWords.length === 0;
    console.log(`[AUTO-COMPLETE] pack=${dbKey} lang=${targetLang} words=${words.length} incomplete=${incompleteWords.length}`);
    if (incompleteWords.length > 0) {
      console.log(`[AUTO-COMPLETE] first 3 blocking:`, incompleteWords.slice(0, 3).map((w) => {
        const missing = COMPLETE_FIELDS.filter((f) => !w[f] || String(w[f]).trim() === "");
        if (hasArticleLang && w.type?.toLowerCase() === "noun" && !w.article) missing.push("article");
        return { word: w.word, missing };
      }));
    }

    const currentStatusRow = await pool.request()
      .input("fn", sql.NVarChar, dbKey)
      .query("SELECT status FROM Packs WHERE file_name = @fn");
    const currentStatus = currentStatusRow.recordset[0]?.status ?? "Draft";

    let autoStatus = null;
    if (allComplete && currentStatus === "Draft") {
      await setPackStatus(dbKey, "Complete");
      autoStatus = "Complete";
    } else if (!allComplete && currentStatus === "Complete") {
      await setPackStatus(dbKey, "Draft");
      autoStatus = "Draft";
    }

    const tmpPath = fullPath + ".tmp";
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    const debugIncomplete = incompleteWords.map((w) => {
      const missingFields = COMPLETE_FIELDS.filter((f) => !w[f] || String(w[f]).trim() === "");
      if (hasArticleLang && w.type?.toLowerCase() === "noun" && (!w.article || String(w.article).trim() === ""))
        missingFields.push("article");
      return { word: w.word || w.id, missing: missingFields };
    });
    res.json({ message: "Saved", autoStatus, ...(debugIncomplete.length > 0 && { incompleteWords: debugIncomplete }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save pack" });
  }
});

// ── ULOŽ IKONU BALÍKA ─────────────────────────────────
router.patch("/:fileName/icon", requireAuth, async (req, res) => {
  try {
    const { username, id: userId } = req.user;
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const fullPath = path.join(workspaceDir, req.params.fileName);
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

// ── ZMEŇ STATUS PODĽA DB ID (pre reviewer / cross-workspace) ──
router.patch("/by-id/:packDbId/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const VALID = ["Draft", "Complete", "In Review", "Approved", "Published", "Archived"];
  if (!VALID.includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const { role, username, id: userId } = req.user;
  const restrictions = {
    "Published": ["admin"],
    "Approved":  ["admin", "reviewer"],
    "Archived":  ["admin"],
  };
  if (restrictions[status] && !restrictions[status].includes(role))
    return res.status(403).json({ error: `Role '${role}' is not allowed to perform this action.` });

  try {
    const pool = await getPool();
    const packRow = await pool.request()
      .input("id", sql.Int, parseInt(req.params.packDbId))
      .query("SELECT file_name, status FROM Packs WHERE id = @id");
    const pack = packRow.recordset[0];
    if (!pack) return res.status(404).json({ error: "Pack not found" });

    await setPackStatus(pack.file_name, status);
    await auditLog(req.user, "STATUS_CHANGED", { pack: pack.file_name, from: pack.status, to: status }, req.ip);
    res.json({ message: "Status updated", status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ── ZMEŇ STATUS BALÍKA ────────────────────────────────
const VALID_STATUSES = ["Draft", "Complete", "In Review", "Approved", "Published", "Archived"];

router.patch("/:fileName/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const { role, username, id: userId } = req.user;
  const restrictions = {
    "Published": ["admin"],
    "Approved":  ["admin", "reviewer"],
    "Archived":  ["admin"],
  };
  if (restrictions[status] && !restrictions[status].includes(role))
    return res.status(403).json({ error: `Role '${role}' cannot set status '${status}'` });

  try {
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const dbKey = packDbKey(workspaceDir, req.params.fileName);

    const prevRow = await pool.request()
      .input("fn", sql.NVarChar, dbKey)
      .query("SELECT status FROM Packs WHERE file_name = @fn");
    const prevStatus = prevRow.recordset[0]?.status ?? null;

    await setPackStatus(dbKey, status);

    if (status === "In Review") {
      const fullPath = path.join(workspaceDir, req.params.fileName);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, "utf8").replace(/^﻿/, "");
          const packJson = JSON.parse(content);
          packJson.reviewSentBy = username;
          packJson.reviewSentAt = new Date().toISOString();
          fs.writeFileSync(fullPath, JSON.stringify(packJson, null, 2), "utf8");
        } catch (e) {
          console.error("Could not write reviewSentBy to pack:", e);
        }
      }
    }

    if (status === "Approved" || status === "In Review") {
      const packRow = await pool.request()
        .input("fn", sql.NVarChar, dbKey)
        .query("SELECT id FROM Packs WHERE file_name = @fn");
      const packDbId = packRow.recordset[0]?.id;
      if (packDbId) {
        await pool.request()
          .input("pack_id",       sql.Int,      packDbId)
          .input("reviewer_id",   sql.Int,      userId)
          .input("reviewer_name", sql.NVarChar, username)
          .input("action",        sql.NVarChar, status === "Approved" ? "APPROVED" : "SUBMITTED")
          .input("note",          sql.NVarChar, req.body.note ?? null)
          .query(`
            INSERT INTO PackReviews (pack_id, reviewer_id, reviewer_name, action, note)
            VALUES (@pack_id, @reviewer_id, @reviewer_name, @action, @note)
          `);
      }

      if (status === "Approved") {
        await auditLog(req.user, "PACK_APPROVED", { packDbKey: dbKey, packId: packDbId }, req.ip);
      }
    }

    await auditLog(req.user, "STATUS_CHANGED", { pack: dbKey, from: prevStatus, to: status }, req.ip);
    res.json({ message: "Status updated", status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ── PUBLIKUJ BALÍK ────────────────────────────────────
router.post("/:fileName/publish", requireAuth, requireRole("admin", "editor"), async (req, res) => {
  try {
    const { username, id: userId } = req.user;
    const { fileName } = req.params;
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const srcPath = path.join(workspaceDir, fileName);
    if (!fs.existsSync(srcPath))
      return res.status(404).json({ error: "Pack not found" });

    const dbKey = packDbKey(workspaceDir, fileName);
    const packRow = await pool.request()
      .input("fn", sql.NVarChar, dbKey)
      .query("SELECT id, status FROM Packs WHERE file_name = @fn");
    const pack = packRow.recordset[0];
    if (!pack) return res.status(404).json({ error: "Pack not found in DB" });
    if (pack.status !== "Approved")
      return res.status(400).json({ error: "Pack must have Approved status" });

    const packJson = JSON.parse(fs.readFileSync(srcPath, "utf8").replace(/^﻿/, ""));
    const tl = (packJson.targetLang || "XX").toUpperCase();

    const settingRow = await pool.request()
      .input("key", sql.NVarChar, "publishPath")
      .query(`
        SELECT TOP 1 us.value FROM UserSettings us
        JOIN Users u ON u.id = us.user_id
        WHERE us.[key] = @key AND u.role = 'admin'
        ORDER BY u.id ASC
      `);
    const basePath = settingRow.recordset[0]?.value?.trim() || process.env.PUBLISH_PATH || "/publish";
    const publishDir = path.join(basePath, "all", tl);

    fs.mkdirSync(publishDir, { recursive: true });
    const destPath = path.join(publishDir, fileName);
    fs.copyFileSync(srcPath, destPath);

    await setPackStatus(dbKey, "Published");

    await pool.request()
      .input("pack_id",       sql.Int,      pack.id)
      .input("reviewer_id",   sql.Int,      userId)
      .input("reviewer_name", sql.NVarChar, username)
      .input("action",        sql.NVarChar, "PUBLISHED")
      .input("note",          sql.NVarChar, `Publikovaný do: ${destPath}`)
      .query(`
        INSERT INTO PackReviews (pack_id, reviewer_id, reviewer_name, action, note)
        VALUES (@pack_id, @reviewer_id, @reviewer_name, @action, @note)
      `);

    await auditLog(req.user, "PACK_PUBLISHED", { fileName, destPath, packId: pack.id }, req.ip);

    let archivePath = null;
    let archiveError = null;
    const archiveBase = process.env.ARCHIVE_PATH || "";

    if (archiveBase) {
      try {
        const archiveLangDir = path.join(archiveBase, "all", tl);
        fs.mkdirSync(archiveLangDir, { recursive: true });
        const zipName = fileName.replace(/\.json$/i, ".zip");
        archivePath = path.join(archiveLangDir, zipName);
        const zip = new AdmZip();
        zip.addLocalFile(srcPath);
        zip.writeZip(archivePath);
        await auditLog(req.user, "PACK_ARCHIVED", { fileName, archivePath, packId: pack.id }, req.ip);
      } catch (zipErr) {
        console.error("ARCHIVE ERROR:", zipErr.message);
        archiveError = zipErr.message;
        archivePath = null;
      }
    }

    res.json({ message: "Pack published", destPath, archivePath, archiveError });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── VYMAŽ BALÍK ───────────────────────────────────────
router.delete("/:fileName", requireAuth, requireRole("admin", "editor"), async (req, res) => {
  try {
    const { username, id: userId } = req.user;
    const { fileName } = req.params;
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const fullPath = path.join(workspaceDir, fileName);
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "Pack not found" });

    const dbKey = packDbKey(workspaceDir, fileName);
    const statusRow = await pool.request()
      .input("fn", sql.NVarChar, dbKey)
      .query("SELECT status FROM Packs WHERE file_name = @fn");
    const status = statusRow.recordset[0]?.status;

    if (status === "Published") {
      const archiveBase = process.env.ARCHIVE_PATH || "";
      if (!archiveBase) {
        return res.status(403).json({
          error: "Balík je Published. Zálohovanie nie je nakonfigurované (ARCHIVE_PATH) — zip záloha neexistuje. Vymazanie nie je povolené.",
        });
      }
      const packJson = JSON.parse(fs.readFileSync(fullPath, "utf8").replace(/^﻿/, ""));
      const tl = (packJson.targetLang || "XX").toUpperCase();
      const zipPath = path.join(archiveBase, "all", tl, fileName.replace(/\.json$/i, ".zip"));
      if (!fs.existsSync(zipPath)) {
        return res.status(403).json({
          error: `Balík je Published, ale zip záloha nebola nájdená (${zipPath}). Pred vymazaním najprv znova publikujte balík.`,
        });
      }
    }

    fs.unlinkSync(fullPath);
    await unregisterPack(dbKey);
    await auditLog(req.user, "PACK_DELETED", { fileName, status }, req.ip);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete pack" });
  }
});

// ── AUTOSAVE (.tmp) ───────────────────────────────────
router.post("/:fileName/autosave", requireAuth, async (req, res) => {
  try {
    const { username, id: userId } = req.user;
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const tmpPath = path.join(workspaceDir, req.params.fileName + ".tmp");
    const { rows, savedAt } = req.body;
    fs.writeFileSync(tmpPath, JSON.stringify({ rows, savedAt }), "utf8");
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Autosave failed" });
  }
});

router.get("/:fileName/autosave", requireAuth, async (req, res) => {
  try {
    const { username, id: userId } = req.user;
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const tmpPath = path.join(workspaceDir, req.params.fileName + ".tmp");
    if (!fs.existsSync(tmpPath)) return res.status(404).json({ error: "No draft" });
    const content = fs.readFileSync(tmpPath, "utf8");
    res.json(JSON.parse(content));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load draft" });
  }
});

router.delete("/:fileName/autosave", requireAuth, async (req, res) => {
  try {
    const { username, id: userId } = req.user;
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const tmpPath = path.join(workspaceDir, req.params.fileName + ".tmp");
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete draft" });
  }
});

// ── NAČÍTAJ BALÍK ─────────────────────────────────────
router.get("/:fileName", requireAuth, async (req, res) => {
  try {
    const { username, id: userId } = req.user;
    const pool = await getPool();
    const workspaceDir = await getActiveWorkspaceDir(pool, userId, username);
    const fullPath = path.join(workspaceDir, req.params.fileName);
    const content = fs.readFileSync(fullPath, "utf8").replace(/^﻿/, "");
    res.json(normalizePack(JSON.parse(content)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load pack" });
  }
});

export default router;
