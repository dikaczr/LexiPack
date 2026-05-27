import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth, requireRole } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

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

export default router;
