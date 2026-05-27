import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useT } from "../i18n";
import { API_BASE } from "../config";
import "./UserMenu.css";

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

const SHORTCUT_KEYS = [
  { group: "rows",  key: "Alt + Insert",     label: "addRow" },
  { group: "rows",  key: "Delete",            label: "deleteSelected" },
  { group: "rows",  key: "Ctrl + D",          label: "duplicate" },
  { group: "rows",  key: "Ctrl + Shift + D",  label: "duplicateEdit" },
  { group: "rows",  key: "Ctrl + ↑ / ↓",     label: "moveRow" },
  { group: "ai",    key: "Ctrl + Enter",      label: "aiGenerate" },
  { group: "ai",    key: "Ctrl + Shift + G",  label: "aiBulk" },
  { group: "ai",    key: "Ctrl + Delete",     label: "aiClear" },
  { group: "other", key: "Ctrl + Z",          label: "undo" },
  { group: "other", key: "Ctrl + Y",          label: "redo" },
  { group: "other", key: "Ctrl + S",          label: "save" },
  { group: "other", key: "Ctrl + F",          label: "search" },
  { group: "other", key: "Esc",               label: "closeDialog" },
  { group: "other", key: "F1",                label: "showShortcuts" },
  { group: "cell",  key: "Ctrl + C",          label: "copyCell" },
  { group: "cell",  key: "Ctrl + X",          label: "cutCell" },
  { group: "cell",  key: "Ctrl + V",          label: "pasteCell" },
];

const GROUP_ORDER = ["rows", "ai", "other", "cell"];

function ShortcutsModal({ onClose }) {
  const t = useT();

  const grouped = GROUP_ORDER.map((g) => ({
    key: g,
    title: t(`shortcuts.groups.${g}`),
    items: SHORTCUT_KEYS.filter((s) => s.group === g),
  }));

  return (
    <div className="shortcuts-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="shortcuts-panel">
        <h3>{t("shortcuts.title")}</h3>
        {grouped.map((group) => (
          <div key={group.key}>
            <div className="shortcuts-group-title">{group.title}</div>
            <div className="shortcuts-grid">
              {group.items.map((s) => (
                <div className="shortcut-row" key={s.key}>
                  <span>{t(`shortcuts.labels.${s.label}`)}</span>
                  <span className="shortcut-key">{s.key}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="shortcuts-close" onClick={onClose}>{t("shortcuts.close")}</button>
      </div>
    </div>
  );
}

function PrivacyDialog({ onClose }) {
  const t = useT();
  return (
    <div className="shortcuts-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="privacy-panel">
        <div className="privacy-header">
          <h3>{t("privacy.title")}</h3>
          <div className="privacy-subtitle">{t("privacy.subtitle")}</div>
        </div>

        <div className="privacy-body">

          <section>
            <h4>{t("privacy.s1.title")}</h4>
            <p>{t("privacy.s1.body")}</p>
          </section>

          <section>
            <h4>{t("privacy.s2.title")}</h4>
            <p>{t("privacy.s2.body")}</p>
            <ul>
              {t("privacy.s2.items").map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h4>{t("privacy.s3.title")}</h4>
            <p>{t("privacy.s3.body")}</p>
            <ul>
              {t("privacy.s3.items").map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h4>{t("privacy.s4.title")}</h4>
            <p>{t("privacy.s4.body")}</p>
          </section>

          <section>
            <h4>{t("privacy.s5.title")}</h4>
            <p>{t("privacy.s5.body")}</p>
          </section>

          <section>
            <h4>{t("privacy.s6.title")}</h4>
            <p>{t("privacy.s6.body")}</p>
            <ul>
              {t("privacy.s6.items").map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h4>{t("privacy.s7.title")}</h4>
            <p>{t("privacy.s7.body")}</p>
          </section>

          <section className="privacy-last">
            <h4>{t("privacy.s8.title")}</h4>
            <p>{t("privacy.s8.body")}</p>
          </section>

        </div>

        <div className="privacy-footer">
          <button className="contact-send-btn" onClick={onClose}>{t("common.close")}</button>
        </div>
      </div>
    </div>
  );
}

function AboutDialog({ onClose }) {
  const t = useT();
  return (
    <div className="shortcuts-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="about-panel">
        <div className="about-logo">LexiPack</div>
        <div className="about-tagline">{t("about.tagline")}</div>

        <div className="about-divider" />

        <div className="about-rows">
          <div className="about-row">
            <span className="about-key">{t("about.version")}</span>
            <span className="about-val">{__APP_VERSION__}</span>
          </div>
          <div className="about-row">
            <span className="about-key">{t("about.developer")}</span>
            <span className="about-val">Techdoc s.r.o.</span>
          </div>
          <div className="about-row">
            <span className="about-key">{t("about.platform")}</span>
            <span className="about-val">React 18 · Express · SQL Server</span>
          </div>
          <div className="about-row">
            <span className="about-key">{t("about.ai")}</span>
            <span className="about-val">OpenAI · DeepL</span>
          </div>
        </div>

        <div className="about-divider" />

        <div className="about-copy">{t("about.copyright")}</div>

        <button className="shortcuts-close" style={{ marginTop: "1.25rem" }} onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}

function MyAccountDialog({ onClose }) {
  const t = useT();
  const { user, token } = useAuth();

  // ── profil ──────────────────────────────────────────
  const [profile, setProfile] = useState({
    personal_name: "", personal_surname: "", company: "", phone: "", address: "",
  });
  const [profileStatus, setProfileStatus] = useState(null); // null | "saving" | "saved" | "error"
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          personal_name:    data.personal_name    ?? "",
          personal_surname: data.personal_surname ?? "",
          company:          data.company          ?? "",
          phone:            data.phone            ?? "",
          address:          data.address          ?? "",
        });
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, [token]);

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileStatus("saving");
    try {
      const res = await fetch(`${API_BASE}/api/auth/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      setProfileStatus(res.ok ? "saved" : "error");
    } catch {
      setProfileStatus("error");
    }
  }

  // ── heslo ───────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdStatus, setPwdStatus]   = useState(null);
  const [pwdError,  setPwdError]    = useState("");
  const [showCur,   setShowCur]     = useState(false);
  const [showNew,   setShowNew]     = useState(false);
  const [showConf,  setShowConf]    = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwdStatus(null);
    setPwdError("");
    if (newPassword.length < 6) { setPwdError(t("myAccount.errorTooShort")); return; }
    if (newPassword !== confirmPassword) { setPwdError(t("myAccount.errorMismatch")); return; }
    setPwdStatus("submitting");
    try {
      const res = await fetch(`${API_BASE}/api/auth/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPwdStatus("success");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        const data = await res.json().catch(() => ({}));
        setPwdError(res.status === 401 ? t("myAccount.errorWrong") : (data.error || t("myAccount.errorGeneric")));
        setPwdStatus("error");
      }
    } catch {
      setPwdError(t("myAccount.errorGeneric"));
      setPwdStatus("error");
    }
  }

  return (
    <div className="shortcuts-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="myaccount-panel">
        <div className="myaccount-header">
          <div className="myaccount-avatar">{user.username?.[0]?.toUpperCase()}</div>
          <div className="myaccount-header-meta">
            <h3>{t("myAccount.title")}</h3>
            <div className="myaccount-header-username">{user.username}</div>
          </div>
        </div>

        <div className="myaccount-body">
          {/* ── Informácie o účte ── */}
          <div className="myaccount-section-title">{t("myAccount.sectionInfo")}</div>
          <div className="myaccount-info-grid">
            <span className="myaccount-label">{t("myAccount.username")}</span>
            <span className="myaccount-value">{user.username}</span>
            <span className="myaccount-label">{t("myAccount.email")}</span>
            <span className="myaccount-value">{user.email || t("myAccount.emailNone")}</span>
            <span className="myaccount-label">{t("myAccount.role")}</span>
            <span className="myaccount-value myaccount-role">{user.role}</span>
          </div>

          <div className="myaccount-divider" />

          {/* ── Osobné údaje ── */}
          <div className="myaccount-section-title">{t("myAccount.sectionProfile")}</div>
          <form className="myaccount-form" onSubmit={handleProfileSave}>
            <div className="myaccount-two-col">
              <div className="contact-field">
                <label className="contact-label">{t("myAccount.personalName")}</label>
                <input
                  className="contact-input"
                  value={profile.personal_name}
                  onChange={(e) => setProfile((p) => ({ ...p, personal_name: e.target.value }))}
                  disabled={!profileLoaded || profileStatus === "saving"}
                />
              </div>
              <div className="contact-field">
                <label className="contact-label">{t("myAccount.personalSurname")}</label>
                <input
                  className="contact-input"
                  value={profile.personal_surname}
                  onChange={(e) => setProfile((p) => ({ ...p, personal_surname: e.target.value }))}
                  disabled={!profileLoaded || profileStatus === "saving"}
                />
              </div>
            </div>
            <div className="myaccount-two-col">
              <div className="contact-field">
                <label className="contact-label">{t("myAccount.company")}</label>
                <input
                  className="contact-input"
                  value={profile.company}
                  onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                  disabled={!profileLoaded || profileStatus === "saving"}
                />
              </div>
              <div className="contact-field">
                <label className="contact-label">{t("myAccount.phone")}</label>
                <input
                  className="contact-input"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  disabled={!profileLoaded || profileStatus === "saving"}
                />
              </div>
            </div>
            <div className="contact-field">
              <label className="contact-label">{t("myAccount.address")}</label>
              <input
                className="contact-input"
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                disabled={!profileLoaded || profileStatus === "saving"}
              />
            </div>
            {profileStatus === "saved"  && <p className="myaccount-success">{t("myAccount.profileSaved")}</p>}
            {profileStatus === "error"  && <p className="contact-error">{t("myAccount.profileError")}</p>}
            <div className="contact-actions" style={{ marginTop: 0 }}>
              <button
                type="submit"
                className="contact-send-btn"
                disabled={!profileLoaded || profileStatus === "saving"}
              >
                {profileStatus === "saving" ? t("myAccount.savingProfile") : t("myAccount.saveProfile")}
              </button>
            </div>
          </form>

          <div className="myaccount-divider" />

          {/* ── Zmena hesla ── */}
          <div className="myaccount-section-title">{t("myAccount.sectionPassword")}</div>
          {pwdStatus === "success" && <div className="myaccount-success">{t("myAccount.success")}</div>}
          <form className="myaccount-form" onSubmit={handlePasswordSubmit}>
            <div className="contact-field">
              <label className="contact-label">{t("myAccount.currentPassword")}</label>
              <div className="pw-wrap">
                <input
                  className="contact-input"
                  type={showCur ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={pwdStatus === "submitting"}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowCur((v) => !v)}>
                  {showCur ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="myaccount-two-col">
              <div className="contact-field">
                <label className="contact-label">{t("myAccount.newPassword")}</label>
                <div className="pw-wrap">
                  <input
                    className="contact-input"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={pwdStatus === "submitting"}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowNew((v) => !v)}>
                    {showNew ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              <div className="contact-field">
                <label className="contact-label">{t("myAccount.confirmPassword")}</label>
                <div className="pw-wrap">
                  <input
                    className="contact-input"
                    type={showConf ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={pwdStatus === "submitting"}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowConf((v) => !v)}>
                    {showConf ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            </div>
            {pwdError && <p className="contact-error">{pwdError}</p>}
            <div className="contact-actions" style={{ marginTop: 0 }}>
              <button type="button" className="shortcuts-close" onClick={onClose}>
                {t("common.close")}
              </button>
              <button
                type="submit"
                className="contact-send-btn"
                disabled={pwdStatus === "submitting" || !currentPassword || !newPassword || !confirmPassword}
              >
                {pwdStatus === "submitting" ? t("myAccount.submitting") : t("myAccount.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ContactDialog({ onClose }) {
  const t = useT();
  const { token } = useAuth();
  const { globalSettings } = useSettings();
  const contactEmail = globalSettings?.contactEmail ?? "";

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState(null); // null | "sending" | "sent" | "error"

  async function handleSend(e) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(`${API_BASE}/api/mail/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="shortcuts-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="contact-panel">
        <h3>{t("contact.title")}</h3>

        {!contactEmail && (
          <p className="contact-no-email">{t("contact.noEmail")}</p>
        )}

        {contactEmail && status !== "sent" && (
          <form onSubmit={handleSend} className="contact-form">
            <div className="contact-field">
              <label className="contact-label">{t("contact.to")}</label>
              <div className="contact-to">{contactEmail}</div>
            </div>
            <div className="contact-field">
              <label className="contact-label">{t("contact.subject")}</label>
              <input
                className="contact-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("contact.subjectPlaceholder")}
                required
                disabled={status === "sending"}
              />
            </div>
            <div className="contact-field">
              <label className="contact-label">{t("contact.message")}</label>
              <textarea
                className="contact-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("contact.messagePlaceholder")}
                rows={6}
                required
                disabled={status === "sending"}
              />
            </div>
            {status === "error" && <p className="contact-error">{t("contact.error")}</p>}
            <div className="contact-actions">
              <button type="button" className="shortcuts-close" onClick={onClose}>{t("common.cancel")}</button>
              <button type="submit" className="contact-send-btn" disabled={status === "sending"}>
                {status === "sending" ? t("contact.sending") : t("contact.send")}
              </button>
            </div>
          </form>
        )}

        {status === "sent" && (
          <>
            <p className="contact-sent">{t("contact.sent")}</p>
            <div className="contact-actions">
              <button className="contact-send-btn" onClick={onClose}>{t("common.close")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UserMenu({ onNavigate }) {
  const { user, logout } = useAuth();
  const t = useT();
  const [open, setOpen]               = useState(false);
  const [showShortcuts,  setShowShortcuts]  = useState(false);
  const [showContact,    setShowContact]    = useState(false);
  const [showAbout,      setShowAbout]      = useState(false);
  const [showPrivacy,    setShowPrivacy]    = useState(false);
  const [showMyAccount,  setShowMyAccount]  = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <div className={`user-menu-wrap${open ? " open" : ""}`} ref={wrapRef}>
        <div
          className="user-menu-trigger"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="user-menu-username">{user.username}</span>
          <span className="user-menu-role">{user.role}</span>
        </div>

        {open && (
          <div className="user-menu-dropdown">
            <div className="user-menu-info">
              <div className="user-menu-info-name">{user.username}</div>
              <div className="user-menu-info-role">{user.role}</div>
            </div>

            <div className="user-menu-items">
              <button
                className="user-menu-item"
                onClick={() => { setShowMyAccount(true); setOpen(false); }}
              >
                {t("userMenu.myAccount")}
              </button>

              <div className="user-menu-sep" />

              <button
                className="user-menu-item"
                onClick={() => { setShowShortcuts(true); setOpen(false); }}
              >
                {t("userMenu.shortcuts")}
              </button>

              <button
                className="user-menu-item"
                onClick={() => { window.open("https://lexico.techdoc.sk/lexipack/docs", "_blank"); setOpen(false); }}
              >
                {t("userMenu.docs")}
              </button>

              <button
                className="user-menu-item"
                onClick={() => { setShowContact(true); setOpen(false); }}
              >
                {t("userMenu.sendEmail")}
              </button>

              <div className="user-menu-sep" />

              <button
                className="user-menu-item"
                onClick={() => { onNavigate?.("settings"); setOpen(false); }}
              >
                {t("userMenu.settings")}
              </button>

              <button
                className="user-menu-item"
                onClick={() => { setShowPrivacy(true); setOpen(false); }}
              >
                {t("userMenu.privacy")}
              </button>

              <button
                className="user-menu-item"
                onClick={() => { setShowAbout(true); setOpen(false); }}
              >
                {t("userMenu.about")}
              </button>

              <div className="user-menu-sep" />

              <button
                className="user-menu-item danger"
                onClick={() => { setOpen(false); logout(); }}
              >
                {t("userMenu.logout")}
              </button>
            </div>
          </div>
        )}
      </div>

      {showMyAccount  && <MyAccountDialog onClose={() => setShowMyAccount(false)} />}
      {showShortcuts  && <ShortcutsModal  onClose={() => setShowShortcuts(false)} />}
      {showAbout      && <AboutDialog     onClose={() => setShowAbout(false)} />}
      {showPrivacy    && <PrivacyDialog   onClose={() => setShowPrivacy(false)} />}
      {showContact    && <ContactDialog   onClose={() => setShowContact(false)} />}
    </>
  );
}
