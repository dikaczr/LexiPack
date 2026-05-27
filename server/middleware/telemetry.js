import { getPool, sql } from "../db.js";

export async function trackAI(user, action, packFile = null, requestAt = null, tokenCount = null) {
  if (!user?.id) return;
  try {
    const pool = await getPool();
    await pool.request()
      .input("user_id",     sql.Int,       user.id)
      .input("username",    sql.NVarChar,  user.username)
      .input("pack_file",   sql.NVarChar,  packFile ?? null)
      .input("action",      sql.NVarChar,  action)
      .input("request_at",  sql.DateTime2, requestAt ?? new Date())
      .input("token_count", sql.Int,       tokenCount ?? null)
      .query(`
        INSERT INTO AiTelemetry (user_id, username, pack_file, action, request_at, token_count)
        VALUES (@user_id, @username, @pack_file, @action, @request_at, @token_count)
      `);
  } catch (err) {
    console.error("AiTelemetry write failed:", err.message);
  }
}
