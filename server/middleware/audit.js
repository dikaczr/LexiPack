import { getPool, sql } from "../db.js";

/**
 * Zapíše záznam do AuditLog.
 * @param {object} user   - { id, username, role } z req.user
 * @param {string} action - LOGIN | LOGOUT | DELETE_ROWS | AI_GENERATE | AI_FILL_COLUMN | AI_SUGGEST_WORDS | EXPORT_JSON | IMPORT
 * @param {object} details - ľubovoľný objekt s kontextom (bude uložený ako JSON)
 * @param {string} ip
 */
export async function auditLog(user, action, details = {}, ip = null) {
  try {
    const pool = await getPool();
    await pool.request()
      .input("user_id",  sql.Int,       user?.id   ?? null)
      .input("username", sql.NVarChar,  user?.username ?? "anonymous")
      .input("role",     sql.NVarChar,  user?.role ?? null)
      .input("action",   sql.NVarChar,  action)
      .input("details",  sql.NVarChar,  JSON.stringify(details))
      .input("ip",       sql.NVarChar,  ip ?? null)
      .query(`
        INSERT INTO AuditLog (user_id, username, role, action, details, ip_address)
        VALUES (@user_id, @username, @role, @action, @details, @ip)
      `);
  } catch (err) {
    console.error("AuditLog write failed:", err.message);
  }
}
