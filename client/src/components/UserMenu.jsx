import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";
import "./UserMenu.css";

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

export default function UserMenu() {
  const { user, logout } = useAuth();
  const t = useT();
  const [open, setOpen]             = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
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
                onClick={() => { setShowShortcuts(true); setOpen(false); }}
              >
                {t("userMenu.shortcuts")}
              </button>

              <button
                className="user-menu-item"
                onClick={() => { setOpen(false); }}
                disabled
                style={{ opacity: 0.45, cursor: "default" }}
              >
                {t("userMenu.help")}
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

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
