import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";
import "./DirectoryPickerDialog.css";

export default function DirectoryPickerDialog({ initialPath = "", onSelect, onClose, browseBase, mkdirBase }) {
  const { token } = useAuth();
  const t         = useT();
  const base      = browseBase ?? `${API_BASE}/api/fs/browse`;
  const mkdirUrl  = mkdirBase  ?? `${API_BASE}/api/fs/mkdir`;
  const [currentPath, setCurrentPath] = useState("");
  const [dirs, setDirs]               = useState([]);
  const [parent, setParent]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [newDirName, setNewDirName]   = useState("");
  const [showNewDir, setShowNewDir]   = useState(false);
  const [creating, setCreating]       = useState(false);
  const [manualMode, setManualMode]   = useState(false);
  const [manualPath, setManualPath]   = useState(initialPath);
  const [isRootList, setIsRootList]   = useState(false);

  const browse = useCallback(async (targetPath, isRetry = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = targetPath
        ? `${base}?path=${encodeURIComponent(targetPath)}`
        : base;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      let data;
      try { data = await res.json(); } catch {
        if (!isRetry && targetPath) { setLoading(false); return browse("", true); }
        setManualMode(true);
        return;
      }
      if (!res.ok) {
        if (!isRetry && targetPath) { setLoading(false); return browse("", true); }
        setManualMode(true);
        return;
      }
      setCurrentPath(data.path);
      setDirs(data.dirs);
      setParent(data.parent);
      setIsRootList(!!data.isRootList);
    } catch (err) {
      setManualMode(true);
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
      const res = await fetch(mkdirUrl, {
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
          <span className="dp-title">{t("dirPicker.title")}</span>
          <button className="dp-close" onClick={onClose}>✕</button>
        </div>

        {manualMode ? (
          <>
            <div className="dp-manual-hint">{t("dirPicker.manualHint")}</div>
            <input
              className="dp-newdir-input"
              style={{ margin: "0 12px 8px" }}
              autoFocus
              placeholder={t("dirPicker.manualPlaceholder")}
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualPath.trim()) onSelect(manualPath.trim());
                if (e.key === "Escape") onClose();
              }}
            />
            <div className="dp-footer">
              <div style={{ flex: 1 }} />
              <button className="dp-btn" onClick={onClose}>{t("dirPicker.cancel")}</button>
              <button
                className="dp-btn dp-btn--primary"
                disabled={!manualPath.trim()}
                onClick={() => onSelect(manualPath.trim())}
              >
                {t("dirPicker.select")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="dp-path">{currentPath || "…"}</div>

            <div className="dp-list">
              {loading && <div className="dp-empty">{t("dirPicker.loading")}</div>}
              {!loading && error && <div className="dp-error">{error}</div>}

              {!loading && !error && parent && (
                <div className="dp-item dp-item--up" onClick={() => browse(parent)}>
                  ↑ ..
                </div>
              )}

              {!loading && !error && dirs.map((dir) => {
                const fullPath = isRootList
                  ? dir
                  : currentPath.replace(/[/\\]$/, "") + (currentPath.includes("\\") ? "\\" : "/") + dir;
                return (
                  <div key={dir} className="dp-item" onClick={() => browse(fullPath)}>
                    📁 {dir}
                  </div>
                );
              })}

              {!loading && !error && dirs.length === 0 && !parent && (
                <div className="dp-empty">{t("dirPicker.empty")}</div>
              )}
            </div>

            {showNewDir ? (
              <div className="dp-newdir">
                <input
                  className="dp-newdir-input"
                  autoFocus
                  placeholder={t("dirPicker.newDirPlaceholder")}
                  value={newDirName}
                  onChange={(e) => setNewDirName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleMkdir();
                    if (e.key === "Escape") { setShowNewDir(false); setNewDirName(""); }
                  }}
                />
                <button className="dp-btn" onClick={handleMkdir} disabled={creating || !newDirName.trim()}>
                  {creating ? t("dirPicker.creating") : t("dirPicker.createDir")}
                </button>
                <button className="dp-btn" onClick={() => { setShowNewDir(false); setNewDirName(""); }}>
                  {t("dirPicker.cancel")}
                </button>
              </div>
            ) : (
              <div className="dp-footer">
                <button className="dp-btn" onClick={() => setShowNewDir(true)}>{t("dirPicker.newDir")}</button>
                <div style={{ flex: 1 }} />
                <button className="dp-btn" onClick={onClose}>{t("dirPicker.cancel")}</button>
                <button className="dp-btn dp-btn--primary" onClick={() => onSelect(currentPath)}>
                  {t("dirPicker.select")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
