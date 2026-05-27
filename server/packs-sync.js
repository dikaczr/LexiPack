import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPool, sql } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getWorkspaceBase() {
  return process.env.WORKSPACE_BASE
    ? path.resolve(process.env.WORKSPACE_BASE)
    : path.join(__dirname, "packs");
}

// "robert/astronomy.json" → absolútna cesta na disku
function resolvePackPath(dbFileName) {
  const parts = dbFileName.replace(/\\/g, "/").split("/");
  return path.join(getWorkspaceBase(), ...parts);
}

export async function registerPack(fileName, packId = null, userId = null) {
  const pool = await getPool();
  await pool.request()
    .input("file_name", sql.NVarChar, fileName)
    .input("pack_id",   sql.NVarChar, packId ?? null)
    .input("created_by",sql.Int,      userId ?? null)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM Packs WHERE file_name = @file_name)
        INSERT INTO Packs (file_name, pack_id, created_by)
        VALUES (@file_name, @pack_id, @created_by)
    `);
}

export async function unregisterPack(fileName) {
  const pool = await getPool();
  const packRow = await pool.request()
    .input("file_name", sql.NVarChar, fileName)
    .query("SELECT id FROM Packs WHERE file_name = @file_name");
  const packId = packRow.recordset[0]?.id;
  if (!packId) return;
  await pool.request().input("pack_id", sql.Int, packId).query("DELETE FROM WordReviews WHERE pack_id = @pack_id");
  await pool.request().input("pack_id", sql.Int, packId).query("DELETE FROM PackReviews WHERE pack_id = @pack_id");
  await pool.request().input("pack_id", sql.Int, packId).query("DELETE FROM Packs WHERE id = @pack_id");
}

export async function getPackRecord(fileName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("file_name", sql.NVarChar, fileName)
    .query("SELECT * FROM Packs WHERE file_name = @file_name");
  return result.recordset[0] ?? null;
}

export async function setPackStatus(fileName, status) {
  const pool = await getPool();
  await pool.request()
    .input("file_name", sql.NVarChar, fileName)
    .input("status",    sql.NVarChar, status)
    .query(`
      UPDATE Packs
      SET status = @status, updated_at = GETDATE()
      WHERE file_name = @file_name
    `);
}

const PROGRESS_FIELDS = ["word", "translation", "phonetic", "definition", "type", "level", "example_en", "example_sk", "topic"];

export async function evaluatePackStatusAfterReview(fileName, packDbId, user) {
  const fullPath = resolvePackPath(fileName);
  if (!fs.existsSync(fullPath)) return null;

  const content = fs.readFileSync(fullPath, "utf8").replace(/^﻿/, "");
  const json = JSON.parse(content);
  const words = json.words || [];
  if (words.length === 0) return null;

  const wordIds = words.map((w) => w.id).filter(Boolean);
  if (wordIds.length === 0) return null;

  const pool = await getPool();

  const packRow = await pool.request()
    .input("pack_id", sql.Int, packDbId)
    .query("SELECT status FROM Packs WHERE id = @pack_id");
  const currentStatus = packRow.recordset[0]?.status;
  if (["Published", "Archived"].includes(currentStatus)) return null;

  const reviewsResult = await pool.request()
    .input("pack_id", sql.Int, packDbId)
    .query(`
      WITH Ranked AS (
        SELECT word_id, action,
          ROW_NUMBER() OVER (PARTITION BY word_id ORDER BY created_at DESC) AS rn
        FROM WordReviews
        WHERE pack_id = @pack_id AND action IN ('OK', 'FLAG')
      )
      SELECT word_id, action FROM Ranked WHERE rn = 1
    `);

  const reviewMap = {};
  for (const r of reviewsResult.recordset) reviewMap[r.word_id] = r.action;

  const allApproved = wordIds.every((id) => reviewMap[id] === "OK");

  if (allApproved) {
    if (currentStatus === "Approved") return null;
    await setPackStatus(fileName, "Approved");
    await pool.request()
      .input("pack_id",       sql.Int,      packDbId)
      .input("reviewer_id",   sql.Int,      user.id)
      .input("reviewer_name", sql.NVarChar, user.username)
      .input("action",        sql.NVarChar, "APPROVED")
      .input("note",          sql.NVarChar, "Auto-approved: všetky slová schválené")
      .query(`
        INSERT INTO PackReviews (pack_id, reviewer_id, reviewer_name, action, note)
        VALUES (@pack_id, @reviewer_id, @reviewer_name, @action, @note)
      `);
    return "Approved";
  }

  const allComplete = words.every((w) =>
    PROGRESS_FIELDS.every((f) => w[f] && String(w[f]).trim() !== "")
  );
  if (!allComplete) return null;
  if (currentStatus === "In Review") return null;
  await setPackStatus(fileName, "In Review");
  return "In Review";
}

// Startup sync — prehľadá všetky user podadresáre v WORKSPACE_BASE
export async function syncPacksOnStartup() {
  const base = getWorkspaceBase();
  if (!fs.existsSync(base)) return;

  let registered = 0;
  const entries = fs.readdirSync(base, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const username = entry.name;
    const userDir = path.join(base, username);

    let files = [];
    try { files = fs.readdirSync(userDir).filter(f => f.toLowerCase().endsWith(".json")); }
    catch { continue; }

    for (const fileName of files) {
      const dbFileName = `${username}/${fileName}`;
      try {
        const content = fs.readFileSync(path.join(userDir, fileName), "utf8").replace(/^﻿/, "");
        const json = JSON.parse(content);
        const pool = await getPool();
        const exists = await pool.request()
          .input("file_name", sql.NVarChar, dbFileName)
          .query("SELECT 1 FROM Packs WHERE file_name = @file_name");
        if (exists.recordset.length === 0) {
          await registerPack(dbFileName, json.packId ?? null, null);
          registered++;
        }
      } catch {
        // preskočí poškodený súbor
      }
    }
  }

  if (registered > 0)
    console.log(`✅ Packs sync: ${registered} nových balíkov zaregistrovaných`);
  else
    console.log("✅ Packs sync: všetky balíky sú v SQL");
}
