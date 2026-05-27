import { useState, useRef, useEffect } from "react";
import "./NotificationBell.css";

export default function NotificationBell({ notifications = [], onClear }) {
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const wrapRef = useRef(null);
  const prevCountRef = useRef(notifications.length);

  useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      setRinging(true);
      setTimeout(() => setRinging(false), 800);
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length]);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasNotif = notifications.length > 0;

  return (
    <div className={`nbell-wrap${open ? " open" : ""}`} ref={wrapRef}>
      <button
        className={`nbell-btn${hasNotif ? " has-notif" : ""}${ringing ? " ringing" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Notifikácie"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasNotif && <span className="nbell-dot">{notifications.length}</span>}
      </button>

      {open && (
        <div className="nbell-dropdown">
          <div className="nbell-header">
            <span>Notifikácie</span>
            {hasNotif && <button className="nbell-clear" onClick={onClear}>Vymazať</button>}
          </div>
          {notifications.length === 0
            ? <div className="nbell-empty">Žiadne správy</div>
            : notifications.map((n, i) => (
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
  );
}
