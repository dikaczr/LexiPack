import { API_BASE } from "../config";

export async function logAudit(token, action, details = {}) {
  try {
    await fetch(`${API_BASE}/api/audit/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, details }),
    });
  } catch (err) {
    console.warn("Audit log failed:", err.message);
  }
}
