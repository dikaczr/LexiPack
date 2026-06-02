import { useState, useRef, useEffect } from "react";
import "./NotificationBell.css";

function fmtTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
}

export default function NotificationBell({
  sysNotifications = [],
  internalNotifs = [],
  onClearSys,
  onMarkRead,
  onMarkAllRead,
  onDeleteInternal,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("internal"); // "internal" | "system"
  const [ringing, setRinging] = useState(false);
  const wrapRef = useRef(null);
  const prevUnreadRef = useRef(0);

  const unreadInternal = internalNotifs.filter(n => !n.is_read).length;
  const totalBadge = unreadInternal + sysNotifications.length;

  useEffect(() => {
    if (unreadInternal > prevUnreadRef.current) {
      setRinging(true);
      setTimeout(() => setRinging(false), 800);
    }
    prevUnreadRef.current = unreadInternal;
  }, [unreadInternal]);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOpen() {
    setOpen(v => !v);
  }

  return (
    <div className={`nbell-wrap${open ? " open" : ""}`} ref={wrapRef}>
      <button
        className={`nbell-btn${totalBadge > 0 ? " has-notif" : ""}${ringing ? " ringing" : ""}`}
        onClick={handleOpen}
        title="Notifikácie"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {totalBadge > 0 && <span className="nbell-dot">{totalBadge}</span>}
      </button>

      {open && (
        <div className="nbell-dropdown">
          <div className="nbell-header">
            <div className="nbell-tabs">
              <button
                className={`nbell-tab${tab === "internal" ? " active" : ""}`}
                onClick={() => setTab("internal")}
              >
                Správy {unreadInternal > 0 && <span className="nbell-tab-badge">{unreadInternal}</span>}
              </button>
              <button
                className={`nbell-tab${tab === "system" ? " active" : ""}`}
                onClick={() => setTab("system")}
              >
                Systém {sysNotifications.length > 0 && <span className="nbell-tab-badge">{sysNotifications.length}</span>}
              </button>
            </div>
            <div className="nbell-actions">
              {tab === "internal" && unreadInternal > 0 && (
                <button className="nbell-clear" onClick={onMarkAllRead} title="Označiť všetky ako prečítané">✓ Všetky</button>
              )}
              {tab === "system" && sysNotifications.length > 0 && (
                <button className="nbell-clear" onClick={onClearSys}>Vymazať</button>
              )}
            </div>
          </div>

          {tab === "internal" && (
            <div className="nbell-list">
              {internalNotifs.length === 0
                ? <div className="nbell-empty">Žiadne správy</div>
                : internalNotifs.map(n => (
                    <div
                      key={n.id}
                      className={`nbell-item${n.is_read ? "" : " unread"}`}
                      onClick={() => !n.is_read && onMarkRead(n.id)}
                    >
                      <span className="nbell-item-icon">{typeIcon(n.type)}</span>
                      <div className="nbell-item-body">
                        <div className="nbell-item-title">{n.title}</div>
                        {n.body && <div className="nbell-item-body-text">{n.body}</div>}
                        <div className="nbell-item-meta">
                          {n.from_username && <span className="nbell-item-from">{n.from_name || n.from_username}</span>}
                          <span className="nbell-item-time">{fmtTime(n.created_at)}</span>
                        </div>
                      </div>
                      <button
                        className="nbell-item-del"
                        onClick={e => { e.stopPropagation(); onDeleteInternal(n.id); }}
                        title="Zmazať"
                      >×</button>
                    </div>
                  ))
              }
            </div>
          )}

          {tab === "system" && (
            <div className="nbell-list">
              {sysNotifications.length === 0
                ? <div className="nbell-empty">Žiadne správy</div>
                : sysNotifications.map((n, i) => (
                    <div key={i} className="nbell-item">
                      <span className="nbell-item-icon">{n.icon || "📦"}</span>
                      <div className="nbell-item-body">
                        <div className="nbell-item-title">{n.title}</div>
                        <div className="nbell-item-time">{n.time}</div>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function typeIcon(type) {
  switch (type) {
    case "pack_review":   return "📋";
    case "pack_approved": return "✅";
    case "pack_flagged":  return "🚩";
    case "comment":       return "💬";
    default:              return "📩";
  }
}
