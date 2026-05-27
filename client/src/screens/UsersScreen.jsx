import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";
import "./UsersScreen.css";
import { API_BASE } from "../config";

const API = `${API_BASE}/api/auth`;

const Eye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("sk-SK", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Modál pre nového / editovaného používateľa ────────
function UserModal({ user, onClose, onSave }) {
  const t = useT();
  const isEdit = !!user;
  const [form, setForm] = useState({
    username:         user?.username         ?? "",
    email:            user?.email            ?? "",
    password:         "",
    role:             user?.role             ?? "viewer",
    is_active:        user?.is_active        ?? true,
    personal_name:    user?.personal_name    ?? "",
    personal_surname: user?.personal_surname ?? "",
    company:          user?.company          ?? "",
    phone:            user?.phone            ?? "",
    address:          user?.address          ?? "",
  });
  const [error, setError]     = useState(null);
  const [notice, setNotice]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const result = await onSave(form);
      if (result?.emailStatus === "sent")    setNotice(t("users.emailSent"));
      else if (result?.emailStatus === "failed") setNotice(t("users.emailFailed"));
      else onClose();
      if (result?.emailStatus) {
        // zostaneme v modáli ešte chvíľu, potom zavreme
        setTimeout(onClose, 2200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal-card" onSubmit={handleSubmit}>
        <h3>{isEdit ? t("users.editTitle")(user.username) : t("users.newTitle")}</h3>

        {!isEdit && (
          <div className="modal-field">
            <label>{t("users.username")}</label>
            <input
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              required
              autoFocus
            />
          </div>
        )}

        <div className="modal-field">
          <label>{t("users.email")}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>{isEdit ? t("users.passwordNew") : t("users.passwordReq")}</label>
          <div className="pw-wrap">
            <input
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required={!isEdit}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPwd((v) => !v)}>
              {showPwd ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        <div className="modal-field">
          <label>{t("users.role")}</label>
          <select value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="reviewer">reviewer</option>
            <option value="admin">admin</option>
          </select>
        </div>

        {isEdit && (
          <div className="modal-field">
            <label>{t("users.status")}</label>
            <select
              value={form.is_active ? "1" : "0"}
              onChange={(e) => set("is_active", e.target.value === "1")}
            >
              <option value="1">{t("users.active")}</option>
              <option value="0">{t("users.inactive")}</option>
            </select>
          </div>
        )}

        <div className="modal-sep" />

        <div className="modal-two-col">
          <div className="modal-field">
            <label>{t("users.personalName")}</label>
            <input
              value={form.personal_name}
              onChange={(e) => set("personal_name", e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>{t("users.personalSurname")}</label>
            <input
              value={form.personal_surname}
              onChange={(e) => set("personal_surname", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-two-col">
          <div className="modal-field">
            <label>{t("users.company")}</label>
            <input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>{t("users.phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-field">
          <label>{t("users.address")}</label>
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>

        {error  && <div className="modal-error">{error}</div>}
        {notice && <div className="modal-notice">{notice}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Hlavná obrazovka ──────────────────────────────────
export default function UsersScreen() {
  const { token } = useAuth();
  const t = useT();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(null); // null | "create" | user-object

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/users`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleCreate(form) {
    const res = await fetch(`${API}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username:         form.username,
        email:            form.email            || undefined,
        password:         form.password,
        role:             form.role,
        sendEmail:        !!form.email,
        personal_name:    form.personal_name    || undefined,
        personal_surname: form.personal_surname || undefined,
        company:          form.company          || undefined,
        phone:            form.phone            || undefined,
        address:          form.address          || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await loadUsers();
    return data; // obsahuje emailStatus
  }

  async function handleEdit(userId, form) {
    const body = {
      role:             form.role,
      is_active:        form.is_active,
      personal_name:    form.personal_name,
      personal_surname: form.personal_surname,
      company:          form.company,
      phone:            form.phone,
      address:          form.address,
    };
    if (form.password) body.password = form.password;
    if (form.email !== undefined) body.email = form.email;

    const res = await fetch(`${API}/users/${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await loadUsers();
  }

  async function toggleActive(user) {
    const res = await fetch(`${API}/users/${user.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    if (res.ok) await loadUsers();
  }

  return (
    <div className="users-screen">
      <div className="users-header">
        <h2>{t("users.title")}</h2>
        <button className="btn-primary" onClick={() => setModal("create")}>
          {t("users.newUser")}
        </button>
      </div>

      {loading && <div style={{ color: "#6b8cae" }}>{t("users.loading")}</div>}
      {error   && <div className="modal-error">{error}</div>}

      {!loading && !error && (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>{t("users.table.id")}</th>
                <th>{t("users.table.username")}</th>
                <th>{t("users.table.name")}</th>
                <th>{t("users.table.company")}</th>
                <th>{t("users.table.email")}</th>
                <th>{t("users.table.role")}</th>
                <th>{t("users.table.status")}</th>
                <th>{t("users.table.lastLogin")}</th>
                <th>{t("users.table.createdAt")}</th>
                <th>{t("users.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: "#4a6a8a" }}>{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td>{[u.personal_name, u.personal_surname].filter(Boolean).join(" ") || "—"}</td>
                  <td style={{ color: "#6b8cae" }}>{u.company || "—"}</td>
                  <td style={{ color: "#6b8cae" }}>{u.email || "—"}</td>
                  <td>
                    <span className={`badge-role ${u.role}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge-status ${u.is_active ? "active" : "inactive"}`}>
                      {u.is_active ? t("users.active") : t("users.inactive")}
                    </span>
                  </td>
                  <td style={{ color: "#6b8cae" }}>{formatDate(u.last_login)}</td>
                  <td style={{ color: "#6b8cae" }}>{formatDate(u.created_at)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-secondary" onClick={() => setModal(u)}>
                        {t("common.edit")}
                      </button>
                      <button
                        className={u.is_active ? "btn-danger" : "btn-secondary"}
                        onClick={() => toggleActive(u)}
                      >
                        {u.is_active ? t("common.deactivate") : t("common.activate")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "create" && (
        <UserModal
          user={null}
          onClose={() => setModal(null)}
          onSave={handleCreate}
        />
      )}

      {modal && modal !== "create" && (
        <UserModal
          user={modal}
          onClose={() => setModal(null)}
          onSave={(form) => handleEdit(modal.id, form)}
        />
      )}
    </div>
  );
}
