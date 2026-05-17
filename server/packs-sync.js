import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPool, sql } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packsPath = path.join(__dirname, "packs");

/**
 * Zaregistruje balík v SQL ak ešte neexistuje.
 * @param {string} fileName  - napr. "astronomy.json"
 * @param {string} packId    - z JSON metadát
 * @param {number|null} userId - id usera ktorý ho vytvoril (null = neznámy)
 */
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

/**
 * Zmaže záznam balíka z SQL.
 */
export async function unregisterPack(fileName) {
  const pool = await getPool();
  await pool.request()
    .input("file_name", sql.NVarChar, fileName)
    .query("DELETE FROM Packs WHERE file_name = @file_name");
}

/**
 * Vráti SQL záznam balíka (status, dátumy...).
 */
export async function getPackRecord(fileName) {
  const pool = await getPool();
  const result = await pool.request()
    .input("file_name", sql.NVarChar, fileName)
    .query("SELECT * FROM Packs WHERE file_name = @file_name");
  return result.recordset[0] ?? null;
}

/**
 * Aktualizuje status balíka.
 */
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

const PROGRESS_FIELDS = ["word", "translation", "phonetic", "definition", "type", "level", "example_en", "example_sk"];

/**
 * Po pridaní review prehodnotí status balíka podľa pravidiel:
 *  - Nie všetky progress polia vyplnené        → žiadna zmena
 *  - Všetky progress polia + všetky reviews OK  → Approved
 *  - Všetky progress polia + aspoň 1 review     → In Review
 * @returns {string|null} nový status ak sa zmenil, inak null
 */
export async function evaluatePackStatusAfterReview(fileName, packDbId, user) {
  const fullPath = path.join(packsPath, fileName);
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

  // Najnovší FLAG/OK review pre každé slovo
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

  // In Review len ak sú všetky progress polia vyplnené
  const allComplete = words.every((w) =>
    PROGRESS_FIELDS.every((f) => w[f] && String(w[f]).trim() !== "")
  );
  if (!allComplete) return null;
  if (currentStatus === "In Review") return null;
  await setPackStatus(fileName, "In Review");
  return "In Review";
}

/**
 * Sync sken — pri štarte servera zaregistruje všetky .json súbory
 * z adresára /packs ktoré ešte nie sú v SQL.
 */
export async function syncPacksOnStartup() {
  if (!fs.existsSync(packsPath)) return;
  const files = fs.readdirSync(packsPath).filter(f => f.toLowerCase().endsWith(".json"));
  let registered = 0;
  for (const fileName of files) {
    try {
      const content = fs.readFileSync(path.join(packsPath, fileName), "utf8").replace(/^\uFEFF/, "");
      const json = JSON.parse(content);
      const pool = await getPool();
      const exists = await pool.request()
        .input("file_name", sql.NVarChar, fileName)
        .query("SELECT 1 FROM Packs WHERE file_name = @file_name");
      if (exists.recordset.length === 0) {
        await registerPack(fileName, json.packId ?? null, null);
        registered++;
      }
    } catch {
      // preskočí poškodený súbor
    }
  }
  if (registered > 0)
    console.log(`✅ Packs sync: ${registered} nových balíkov zaregistrovaných`);
  else
    console.log("✅ Packs sync: všetky balíky sú v SQL");
}
