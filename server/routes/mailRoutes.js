import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendContactEmail } from "../mailer.js";
import { getPool, sql } from "../db.js";

const router = express.Router();

// POST /api/mail/contact
router.post("/contact", requireAuth, async (req, res) => {
  const { subject, message } = req.body;
  if (!subject?.trim() || !message?.trim())
    return res.status(400).json({ error: "subject and message are required" });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .query("SELECT value FROM GlobalSettings WHERE [key] = 'contactEmail'");
    const to = result.recordset[0]?.value;
    if (!to) return res.status(503).json({ error: "Contact email not configured" });

    await sendContactEmail({
      to,
      fromUser: req.user.username,
      subject:  subject.trim(),
      message:  message.trim(),
      replyTo:  req.user.email ?? undefined,
    });

    res.json({ message: "Email sent" });
  } catch (err) {
    console.error("Contact email failed:", err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
