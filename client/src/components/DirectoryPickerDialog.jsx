import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config";
import { useAuth } from "../context/AuthContext";
import "./DirectoryPickerDialog.css";

export default function DirectoryPickerDialog({ initialPath = "", onSelect, onClose }) {
  const { token } = useAuth();
  const [currentPath, setCurrentPath] = useState("");
  const [dirs, setDirs]               = useState([]);
  const [parent, setParent]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [newDirName, setNewDirName]   = useState("");
  const [showNewDir, setShowNewDir]   = useState(false);
  const [creating, setCreating]       = useState(false);

  const browse = useCallback(async (targetPath) => {
    setLoading(true);
    setError(null);
    try {
      const url = targetPath
        ? `${API_BASE}/api/fs/browse?path=${encodeURIComponent(targetPath)}`
        : `${API_BASE}/api/fs/browse`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPath(data.path);
      setDirs(data.dirs);
      setParent(data.parent);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    browse(initialPath || "");
  }, []);

  async function handleMkdir() {
    if (!newDirName.trim()) return;
    const sep = currentPath.includes("\\") ? "\\" : "/";
    const newPath = currentPath.replace(/[/\\]$/, "") + sep + newDirName.trim();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/fs/mkdir`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ path: newPath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewDirName("");
      setShowNewDir(false);
      await browse(currentPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="dp-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dp-modal">
        <div className="dp-header">
          <span className="dp-title">Vybrať adresár</span>
          <button className="dp-close" onClick={onClose}>✕</button>
        </div>

        <div className="dp-path">{currentPath || "…"}</div>

        <div className="dp-list">
          {loading && <div className="dp-empty">Načítavam…</div>}
          {!loading && error && <div className="dp-error">{error}</div>}

          {!loading && !error && parent && (
            <div className="dp-item dp-item--up" onClick={() => browse(parent)}>
              ↑ ..
            </div>
          )}

          {!loading && !error && dirs.map((dir) => {
            const sep = currentPath.includes("\\") ? "\\" : "/";
            const fullPath = currentPath.replace(/[/\\]$/, "") + sep + dir;
            return (
              <div key={dir} className="dp-item" onClick={() => browse(fullPath)}>
                📁 {dir}
              </div>
            );
          })}

          {!loading && !error && dirs.length === 0 && !parent && (
            <div className="dp-empty">Prázdny adresár</div>
          )}
        </div>

        {showNewDir ? (
          <div className="dp-newdir">
            <input
              className="dp-newdir-input"
              autoFocus
              placeholder="Názov nového adresára"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleMkdir();
                if (e.key === "Escape") { setShowNewDir(false); setNewDirName(""); }
              }}
            />
            <button className="dp-btn" onClick={handleMkdir} disabled={creating || !newDirName.trim()}>
              {creating ? "Vytvárám…" : "Vytvoriť"}
            </button>
            <button className="dp-btn" onClick={() => { setShowNewDir(false); setNewDirName(""); }}>
              Zrušiť
            </button>
          </div>
        ) : (
          <div className="dp-footer">
            <button className="dp-btn" onClick={() => setShowNewDir(true)}>+ Nový adresár</button>
            <div style={{ flex: 1 }} />
            <button className="dp-btn" onClick={onClose}>Zrušiť</button>
            <button className="dp-btn dp-btn--primary" onClick={() => onSelect(currentPath)}>
              Vybrať
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
