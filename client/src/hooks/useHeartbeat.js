import { useEffect, useRef } from "react";
import { API_BASE } from "../config";

const INTERVAL_MS = 30_000;
const IDLE_THRESHOLD_MS = 180_000;

export function useHeartbeat(packFileName, token) {
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    function onActivity() { lastActivityRef.current = Date.now(); }
    document.addEventListener("mousemove", onActivity);
    document.addEventListener("keydown",   onActivity);
    return () => {
      document.removeEventListener("mousemove", onActivity);
      document.removeEventListener("keydown",   onActivity);
    };
  }, []);

  useEffect(() => {
    if (!packFileName || !token) return;

    const timer = setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS) return;
      fetch(`${API_BASE}/api/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pack: packFileName }),
      }).catch(() => {});
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [packFileName, token]);
}
