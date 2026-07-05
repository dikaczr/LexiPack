import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import http from "http";
import https from "https";
import { fileURLToPath } from "url";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getPool, sql } from "../db.js";
import { registerPack } from "../packs-sync.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

router.get("/ping", (req, res) => res.json({ ok: true }));

function getWorkspaceBase() {
  return process.env.WORKSPACE_BASE
    ? path.resolve(process.env.WORKSPACE_BASE)
    : path.join(__dirname, "../packs");
}

function getFsRoots() {
  const raw = process.env.FS_ROOT || process.cwd();
  return raw.split(";").map((p) => path.resolve(p.trim())).filter(Boolean);
}

const norm = (p) => p.toLowerCase().replace(/\//g, "\\").replace(/\\+$/, "");

function findContainingRoot(target, roots) {
  const t = norm(target);
  return roots.find((r) => {
    const n = norm(r);
    return t === n || t.startsWith(n + "\\");
  });
}

function isInsideDir(target, root) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot   = path.resolve(root);
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(resolvedRoot + path.sep);
}

function listDirs(target) {
  let entries = [];
  try { entries = fs.readdirSync(target, { withFileTypes: true }); } catch { /* ignoruj */ }
  return entries
    .filter((e) => { try { return e.isDirectory() && !e.name.startsWith("."); } catch { return false; } })
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

// ── PREHLIADAČ ADRESÁROV (FS_ROOT obmedzenie, admin) ──
router.get("/browse", requireAuth, (req, res) => {
  try {
    const roots = getFsRoots();
    const reqPath = req.query.path ? path.resolve(req.query.path) : null;

    if (!reqPath || !findContainingRoot(reqPath, roots)) {
      return res.json({ path: "", dirs: roots, parent: null, isRootList: true });
    }

    let target = reqPath;
    const containingRoot = findContainingRoot(target, roots);

    let valid = false;
    try { if (fs.existsSync(target) && fs.statSync(target).isDirectory()) valid = true; } catch {}
    if (!valid) target = containingRoot;

    const dirs = listDirs(target);
    const parentPath = path.dirname(target);
    const isAtRoot = norm(target) === norm(containingRoot);
    const hasParent = !isAtRoot && findContainingRoot(parentPath, roots);

    res.json({
      path: target,
      dirs,
      parent: hasParent ? parentPath : (roots.length > 1 ? "" : null),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── PREHLIADAČ BEZ OBMEDZENIA (admin, napr. publish/archive cesty) ──
router.get("/browse-any", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const reqPath = req.query.path ? path.resolve(req.query.path) : os.homedir();

    let target = reqPath;
    let valid = false;
    try { if (fs.existsSync(target) && fs.statSync(target).isDirectory()) valid = true; } catch {}
    if (!valid) target = os.homedir();

    const dirs = listDirs(target);
    const parentPath = path.dirname(target);
    const isRoot = parentPath === target;

    res.json({ path: target, dirs, parent: isRoot ? null : parentPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── PREHLIADAČ WORKSPACE USERA (len jeho vlastný priestor) ──
router.get("/browse-workspace", requireAuth, (req, res) => {
  try {
    const userRoot = path.join(getWorkspaceBase(), req.user.username);
    fs.mkdirSync(userRoot, { recursive: true });

    const reqPath = req.query.path ? path.resolve(req.query.path) : userRoot;
    const target  = isInsideDir(reqPath, userRoot) ? reqPath : userRoot;

    let valid = false;
    try { if (fs.existsSync(target) && fs.statSync(target).isDirectory()) valid = true; } catch {}
    const finalTarget = valid ? target : userRoot;

    const dirs = listDirs(finalTarget);
    const isAtRoot = path.resolve(finalTarget) === path.resolve(userRoot);
    const parentPath = path.dirname(finalTarget);

    res.json({
      path:   finalTarget,
      dirs,
      parent: isAtRoot ? null : parentPath,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── VYTVOR ADRESÁR (FS_ROOT obmedzenie) ──────────────
router.post("/mkdir", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const roots = getFsRoots();
    const { path: dirPath } = req.body;
    if (!dirPath) return res.status(400).json({ error: "path is required" });
    const resolved = path.resolve(dirPath);
    if (!findContainingRoot(resolved, roots))
      return res.status(403).json({ error: "Path outside allowed roots" });
    fs.mkdirSync(resolved, { recursive: true });
    res.json({ message: "Created", path: resolved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── VYTVOR ADRESÁR BEZ OBMEDZENIA (admin) ────────────
router.post("/mkdir-any", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const { path: dirPath } = req.body;
    if (!dirPath) return res.status(400).json({ error: "path is required" });
    const resolved = path.resolve(dirPath);
    fs.mkdirSync(resolved, { recursive: true });
    res.json({ message: "Created", path: resolved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── VYTVOR ADRESÁR V WORKSPACE USERA ─────────────────
router.post("/mkdir-workspace", requireAuth, (req, res) => {
  try {
    const userRoot = path.join(getWorkspaceBase(), req.user.username);
    const { path: dirPath } = req.body;
    if (!dirPath) return res.status(400).json({ error: "path is required" });
    const resolved = path.resolve(dirPath);
    if (!isInsideDir(resolved, userRoot))
      return res.status(403).json({ error: "Path outside workspace" });
    fs.mkdirSync(resolved, { recursive: true });
    res.json({ message: "Created", path: resolved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── FETCH URL — extrakcia textu z webovej stránky ─────
function fetchUrl(urlStr, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft === 0) return reject(new Error("Too many redirects"));
    let parsed;
    try { parsed = new URL(urlStr); } catch { return reject(new Error("Invalid URL")); }
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.get(urlStr, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LexiPack/1.0)" },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        res.resume();
        return fetchUrl(/^https?:\/\//i.test(loc) ? loc : new URL(loc, urlStr).href, redirectsLeft - 1)
          .then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({
        status:      res.statusCode,
        statusText:  res.statusMessage,
        contentType: res.headers["content-type"] || "",
        body:        Buffer.concat(chunks).toString("utf8"),
      }));
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Request timeout")); });
    req.on("error", reject);
  });
}

function extractPageText(html) {
  // Odstráň bloky ktoré neobsahujú čitateľný text
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // Blokové elementy → nové riadky
  text = text.replace(/<\/(p|div|h[1-6]|li|br|tr|article|section)>/gi, "\n");

  // Odstráň zostatok tagov
  text = text.replace(/<[^>]+>/g, "");

  // HTML entity
  text = text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

  // Uprac whitespace
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function extractPageTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}

router.post("/fetch-url", requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url?.trim()) return res.status(400).json({ error: "URL required" });

  try {
    const response = await fetchUrl(url.trim());
    if (response.status < 200 || response.status >= 300)
      return res.status(502).json({ error: `HTTP ${response.status}: ${response.statusText}` });
    if (!response.contentType.includes("text/html"))
      return res.status(415).json({ error: "URL nevracia HTML stránku" });

    const text  = extractPageText(response.body);
    const title = extractPageTitle(response.body);
    res.json({ text, title });
  } catch (err) {
    console.error("[fetch-url]", err.message);
    res.status(500).json({ error: err.message || "Nepodarilo sa načítať stránku" });
  }
});

// ── ZOZNAM JSON SÚBOROV Z PUBLISH ADRESÁRA (admin) ───────
router.get("/list-published", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const settingRow = await pool.request()
      .input("key", sql.NVarChar, "publishPath")
      .query(`SELECT TOP 1 us.value FROM UserSettings us
              JOIN Users u ON u.id = us.user_id
              WHERE us.[key] = @key AND u.role = 'admin' ORDER BY u.id ASC`);
    const basePath = settingRow.recordset[0]?.value?.trim() || process.env.PUBLISH_PATH;
    if (!basePath) return res.status(400).json({ error: "publishPath nie je nastavený" });

    const allDir = path.join(basePath, "all");
    if (!fs.existsSync(allDir)) return res.status(404).json({ error: `Adresár neexistuje: ${allDir}` });

    // Zoznam jazykových podadresárov
    const langDirs = fs.readdirSync(allDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    const { lang } = req.query;
    if (!lang) return res.json({ langs: langDirs, files: [] });

    const langDir = path.join(allDir, lang);
    if (!fs.existsSync(langDir)) return res.json({ langs: langDirs, files: [] });

    const files = fs.readdirSync(langDir)
      .filter(f => f.endsWith(".json"))
      .sort()
      .map(f => {
        const stat = fs.statSync(path.join(langDir, f));
        return { name: f, size: stat.size, mtime: stat.mtime };
      });

    res.json({ langs: langDirs, files, dir: langDir });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── NAČÍTAJ JSON SÚBOR Z PUBLISH ADRESÁRA (admin) ────────
// Vráti obsah súboru — klient ho importuje cez POST /api/packs (rovnaká cesta ako "Import Pack")
router.get("/read-published", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { lang, fileName } = req.query;
    if (!lang || !fileName) return res.status(400).json({ error: "lang a fileName sú povinné" });

    const pool = await getPool();
    const settingRow = await pool.request()
      .input("key", sql.NVarChar, "publishPath")
      .query(`SELECT TOP 1 us.value FROM UserSettings us
              JOIN Users u ON u.id = us.user_id
              WHERE us.[key] = @key AND u.role = 'admin' ORDER BY u.id ASC`);
    const basePath = settingRow.recordset[0]?.value?.trim() || process.env.PUBLISH_PATH;
    if (!basePath) return res.status(400).json({ error: "publishPath nie je nastavený" });

    const srcPath = path.join(basePath, "all", lang, fileName);
    if (!fs.existsSync(srcPath)) return res.status(404).json({ error: "Súbor neexistuje" });

    const content = fs.readFileSync(srcPath, "utf8").replace(/^﻿/, "");
    const packJson = JSON.parse(content);

    res.json({ fileName, data: packJson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
