import { useState, useEffect } from "react";
import { useT } from "../i18n";
import { API_BASE } from "../config";
import axios from "axios";
import "./ImportFromServerDialog.css";

export default function ImportFromServerDialog({ open, onClose, token, onImported }) {
  const t = useT();
  const [langs,    setLangs]    = useState([]);
  const [selLang,  setSelLang]  = useState(null);
  const [files,    setFiles]    = useState([]);
  const [selFile,  setSelFile]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [importing, setImporting] = useState(false);
  const [error,    setError]    = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  // Načítaj jazykové adresáre pri otvorení
  useEffect(() => {
    if (!open) return;
    setSelLang(null); setSelFile(null); setFiles([]); setError(null);
    setLoading(true);
    axios.get(`${API_BASE}/api/fs/list-published`, { headers })
      .then(r => { setLangs(r.data.langs || []); })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [open]);

  // Načítaj súbory pri výbere jazyka
  useEffect(() => {
    if (!selLang) return;
    setSelFile(null); setFiles([]); setError(null);
    setLoading(true);
    axios.get(`${API_BASE}/api/fs/list-published?lang=${selLang}`, { headers })
      .then(r => setFiles(r.data.files || []))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [selLang]);

  async function handleImport() {
    if (!selLang || !selFile) return;
    setImporting(true); setError(null);
    try {
      // 1. Načítaj obsah súboru zo servera
      const r = await axios.get(
        `${API_BASE}/api/fs/read-published?lang=${encodeURIComponent(selLang)}&fileName=${encodeURIComponent(selFile)}`,
        { headers }
      );
      const { fileName, data } = r.data;

      // 2. Vytvor pack (metadata)
      const res = await axios.post(
        `${API_BASE}/api/packs`,
        { ...data, fileName },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
      const createdFileName = res.data.fileName || fileName;

      // 3. Ulož plný obsah vrátane slov cez PUT
      await axios.put(
        `${API_BASE}/api/packs/${encodeURIComponent(createdFileName)}`,
        { ...data, fileName: createdFileName },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );

      onImported?.(createdFileName);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="import-server-dialog">

        <div className="import-server-header">
          <span className="import-server-title">Import z publikovaných balíkov</span>
          <button className="import-server-close" onClick={onClose}>❯</button>
        </div>

        <div className="import-server-body">
          {/* Jazykové záložky */}
          {error && <div className="import-server-error">⚠ {error}</div>}

          <div className="import-server-langs">
            {loading && !selLang && <span className="import-server-hint">Načítavam...</span>}
            {langs.map(lang => (
              <button
                key={lang}
                className={`import-server-lang-btn${selLang === lang ? " active" : ""}`}
                onClick={() => setSelLang(lang)}
              >
                {lang}
              </button>
            ))}
            {!loading && langs.length === 0 && (
              <span className="import-server-hint">Žiadne jazykové adresáre</span>
            )}
          </div>

          {/* Zoznam súborov */}
          <div className="import-server-files">
            {loading && selLang && <div className="import-server-hint">Načítavam súbory...</div>}
            {!loading && selLang && files.length === 0 && (
              <div className="import-server-hint">Žiadne JSON súbory v {selLang}</div>
            )}
            {files.length > 0 && (
              <div className="import-server-file-header">
                <span>Názov súboru</span>
                <span>Veľkosť</span>
                <span>Dátum</span>
              </div>
            )}
            {files.map(f => (
              <div
                key={f.name}
                className={`import-server-file${selFile === f.name ? " selected" : ""}`}
                onClick={() => setSelFile(f.name)}
              >
                <span className="import-server-file-name">{f.name}</span>
                <span className="import-server-file-size">{(f.size / 1024).toFixed(1)} kB</span>
                <span className="import-server-file-date">{new Date(f.mtime).toLocaleDateString("sk-SK")}</span>
              </div>
            ))}
          </div>

          {error && <div className="import-server-error">⚠ {error}</div>}
        </div>

        <div className="import-server-footer">
          <button
            className="import-server-btn-import"
            onClick={handleImport}
            disabled={!selFile || importing}
          >
            {importing ? "Importujem..." : "⬇ Importovať"}
          </button>
          <button className="import-server-btn-cancel" onClick={onClose} disabled={importing}>
            Zrušiť
          </button>
        </div>

      </div>
    </div>
  );
}
