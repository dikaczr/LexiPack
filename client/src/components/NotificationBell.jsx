import { useState, useRef, useEffect } from "react";
import "./NotificationBell.css";

export default function NotificationBell({ hasNotification = true }) {
  const [open, setOpen] = useState(false);
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
    <div className={`nbell-wrap${open ? " open" : ""}`} ref={wrapRef}>
      <button
        className={`nbell-btn${hasNotification ? " has-notif" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Notifikácie"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasNotification && <span className="nbell-dot" />}
      </button>

      {open && (
        <div className="nbell-dropdown">
          <div className="nbell-header">Notifikácie</div>
          <div className="nbell-empty">Žiadne správy</div>
        </div>
      )}
    </div>
  );
}
