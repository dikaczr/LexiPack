import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getPool, sql } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { auditLog } from "../middleware/audit.js";
import { sendRegistrationEmail, sendPasswordResetEmail } from "../mailer.js";

const router = express.Router();

// ── LOGIN ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .query("SELECT * FROM Users WHERE username = @username AND is_active = 1");

    const user = result.recordset[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.SESSION_SECRET,
      { expiresIn: "30d" }
    );

    await pool.request()
      .input("id", sql.Int, user.id)
      .query("UPDATE Users SET last_login = GETDATE() WHERE id = @id");

    await auditLog(user, "LOGIN", {}, req.ip);

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── LOGOUT ────────────────────────────────────────────
router.post("/logout", requireAuth, async (req, res) => {
  await auditLog(req.user, "LOGOUT", {}, req.ip);
  res.json({ message: "Logged out" });
});

// ── AKTUÁLNY POUŽÍVATEĽ ───────────────────────────────
router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// ── ZABUDNUTÉ HESLO ───────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  // vždy vrátime 200 aby sme neodhalili existenciu emailu
  if (!email) return res.json({ message: "ok" });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id, username FROM Users WHERE email = @email AND is_active = 1");

    const user = result.recordset[0];
    if (!user) return res.json({ message: "ok" });

    // generuj dočasné heslo: 3 slová + číslo
    const words = ["Modrá", "Hora", "Rieka", "Hviezda", "Mesiac", "Slnko", "Vietor", "Orol"];
    const pick = () => words[Math.floor(Math.random() * words.length)];
    const num  = Math.floor(10 + Math.random() * 90);
    const tempPassword = `${pick()}${pick()}${num}`;

    const hash = await bcrypt.hash(tempPassword, 10);
    await pool.request()
      .input("id",   sql.Int,      user.id)
      .input("hash", sql.NVarChar, hash)
      .query("UPDATE Users SET password_hash = @hash WHERE id = @id");

    await sendPasswordResetEmail({ to: email, username: user.username, tempPassword });
  } catch (err) {
    console.error("Forgot-password error:", err.message);
  }

  res.json({ message: "ok" });
});

// ── ZOZNAM POUŽÍVATEĽOV (len admin) ──────────────────
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      "SELECT id, username, email, role, is_active, created_at, last_login FROM Users ORDER BY created_at DESC"
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to load users" });
  }
});

// ── VYTVOR POUŽÍVATEĽA (len admin) ───────────────────
router.post("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const { username, email, password, role, sendEmail } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: "username, password, role required" });
  if (!["admin", "editor", "reviewer", "viewer"].includes(role))
    return res.status(400).json({ error: "Invalid role" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const pool = await getPool();
    await pool.request()
      .input("username", sql.NVarChar, username)
      .input("email",    sql.NVarChar, email ?? null)
      .input("hash",     sql.NVarChar, hash)
      .input("role",     sql.NVarChar, role)
      .query("INSERT INTO Users (username, email, password_hash, role) VALUES (@username, @email, @hash, @role)");

    let emailStatus = null;
    if (sendEmail && email) {
      try {
        await sendRegistrationEmail({ to: email, username, password, role });
        emailStatus = "sent";
      } catch (mailErr) {
        console.error("Registration email failed:", mailErr.message);
        emailStatus = "failed";
      }
    }

    res.status(201).json({ message: "User created", emailStatus });
  } catch (err) {
    if (err.number === 2627)
      return res.status(409).json({ error: "Username already exists" });
    res.status(500).json({ error: "Failed to create user" });
  }
});

// ── UPRAV POUŽÍVATEĽA (len admin) ────────────────────
router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { role, is_active, password, email } = req.body;
  try {
    const pool = await getPool();
    if (role !== undefined) {
      await pool.request()
        .input("id",   sql.Int,      req.params.id)
        .input("role", sql.NVarChar, role)
        .query("UPDATE Users SET role = @role WHERE id = @id");
    }
    if (is_active !== undefined) {
      await pool.request()
        .input("id",        sql.Int, req.params.id)
        .input("is_active", sql.Bit, is_active ? 1 : 0)
        .query("UPDATE Users SET is_active = @is_active WHERE id = @id");
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.request()
        .input("id",   sql.Int,      req.params.id)
        .input("hash", sql.NVarChar, hash)
        .query("UPDATE Users SET password_hash = @hash WHERE id = @id");
    }
    if (email !== undefined) {
      await pool.request()
        .input("id",    sql.Int,      req.params.id)
        .input("email", sql.NVarChar, email || null)
        .query("UPDATE Users SET email = @email WHERE id = @id");
    }
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
