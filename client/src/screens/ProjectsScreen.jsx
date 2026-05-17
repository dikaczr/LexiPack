import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./ProjectsScreen.css";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useT } from "../i18n";
import { useAuth } from "../context/AuthContext";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function PublishConfirmModal({ pack, onConfirm, onClose }) {
  return (
    <div className="np-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="np-modal" style={{ width: 420 }}>
        <div className="np-header">
          <h3>Publikovať balík</h3>
          <button type="button" className="np-close" onClick={onClose}>✕</button>
        </div>
        <div className="np-body">
          <div className="sa-confirm-text">
            Nasledujúci balík bude publikovaný:<br /><br />
            <strong>{pack.name}</strong><br />
            Počet slov: <strong>{pack.words}</strong><br />
            Autor: <strong>{pack.author || "—"}</strong><br /><br />
            <span style={{ color: "#f0c040", fontSize: 12 }}>
              Po publikovaní sa status zmení na Published.
            </span>
          </div>
        </div>
        <div className="np-footer">
          <button className="projects-btn" onClick={onClose}>Zrušiť</button>
          <button className="projects-btn primary" onClick={onConfirm}>Áno, publikovať</button>
        </div>
      </div>
    </div>
  );
}

function ProgressBarCell({ value }) {
  const pct = parseInt(value) || 0;
  const color = pct >= 80 ? "#4adf8a" : pct >= 40 ? "#f0c040" : "#4a9eff";
  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 4px" }}>
      <div style={{ flex: 1, height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: color, transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}
import { API_BASE } from "../config";
const API = `${API_BASE}/api/packs`;

const LANGUAGES = [
  { code: "en", label: "EN – English" },
  { code: "sk", label: "SK – Slovenčina" },
  { code: "de", label: "DE – Deutsch" },
  { code: "fr", label: "FR – Français" },
  { code: "es", label: "ES – Español" },
  { code: "it", label: "IT – Italiano" },
  { code: "cs", label: "CS – Čeština" },
  { code: "pl", label: "PL – Polski" },
  { code: "hu", label: "HU – Magyar" },
  { code: "uk", label: "UK – Українська" },
  { code: "ru", label: "RU – Русский" },
];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildFileName(form) {
  const base = slugify(form.name || "novy-balik");
  return `${base}_${form.level}_v${form.version}_${form.targetLang.toUpperCase()}-${form.nativeLang.toUpperCase()}.json`;
}

// ── Modál nového balíka ───────────────────────────────
function NewPackModal({ onClose, onCreated }) {
  const t = useT();
  const { token } = useAuth();
  const [form, setForm] = useState({
    name: "", description: "",
    targetLang: "en", nativeLang: "sk",
    level: "B1", category: "", icon: "",
    author: "", version: "1.0", tags: "",
  });
  const [fileNameOverride, setFileNameOverride] = useState("");
  const [fileNameEdited,   setFileNameEdited]   = useState(false);
  const [error, setError]   = useState(null);
  const [saving, setSaving] = useState(false);

  const autoFileName = buildFileName(form);
  const displayFileName = fileNameEdited ? fileNameOverride : autoFileName;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field !== "name" && !fileNameEdited) return;
    if (field === "name" && fileNameEdited) return;
    setFileNameEdited(false);
  }

  function handleFileNameChange(val) {
    setFileNameOverride(val);
    setFileNameEdited(true);
  }

  const effectiveFileName = fileNameEdited ? fileNameOverride : buildFileName(form);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const packId = slugify(form.name);
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...form, packId, fileName: effectiveFileName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.fileName);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="np-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="np-modal" onSubmit={handleSubmit}>
        <div className="np-header">
          <h3>{t("newPack.title")}</h3>
          <button type="button" className="np-close" onClick={onClose}>✕</button>
        </div>

        <div className="np-body">
          {/* Názov + ikona */}
          <div className="np-row">
            <div className="np-field np-grow">
              <label>{t("newPack.name")}</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required autoFocus />
            </div>
            <div className="np-field" style={{ width: 64 }}>
              <label>{t("newPack.icon")}</label>
              <input value={form.icon} onChange={(e) => set("icon", e.target.value)} placeholder="🎓" />
            </div>
          </div>

          {/* Názov súboru */}
          <div className="np-field">
            <label>{t("newPack.fileName")}</label>
            <input
              value={effectiveFileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              className="np-filename"
            />
          </div>

          {/* Popis */}
          <div className="np-field">
            <label>{t("newPack.description")}</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          {/* Kategória + úroveň + verzia */}
          <div className="np-row">
            <div className="np-field np-grow">
              <label>{t("newPack.category")}</label>
              <input value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div className="np-field" style={{ width: 90 }}>
              <label>{t("newPack.level")}</label>
              <select value={form.level} onChange={(e) => set("level", e.target.value)}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="np-field" style={{ width: 72 }}>
              <label>{t("newPack.version")}</label>
              <input value={form.version} onChange={(e) => set("version", e.target.value)} />
            </div>
          </div>

          {/* Jazyky */}
          <div className="np-row">
            <div className="np-field np-grow">
              <label>{t("newPack.targetLang")}</label>
              <select value={form.targetLang} onChange={(e) => set("targetLang", e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="np-field np-grow">
              <label>{t("newPack.nativeLang")}</label>
              <select value={form.nativeLang} onChange={(e) => set("nativeLang", e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Autor + tagy */}
          <div className="np-field">
            <label>{t("newPack.author")}</label>
            <input value={form.author} onChange={(e) => set("author", e.target.value)} />
          </div>

          <div className="np-field">
            <label>{t("newPack.tags")}</label>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder={t("newPack.tagsPlaceholder")} />
          </div>
        </div>

        {error && <div className="np-error">{error}</div>}

        <div className="np-footer">
          <button type="button" className="projects-btn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="projects-btn primary" disabled={saving}>
            {saving ? t("newPack.submitting") : t("newPack.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Modál Save As ─────────────────────────────────────
function SaveAsModal({ sourcePack, onClose, onSaved }) {
  const t = useT();
  const { token } = useAuth();
  const [newName, setNewName]           = useState(sourcePack.name + " (kópia)");
  const [fileNameEdited, setFileNameEdited] = useState(false);
  const [fileNameOverride, setFileNameOverride] = useState("");
  const [step, setStep]   = useState("form"); // "form" | "confirm"
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function buildSaFileName(name) {
    const base = slugify(name || "kopia");
    return `${base}_${sourcePack.level || "B1"}_v${sourcePack.version || "1.0"}_${(sourcePack.targetLang || "en").toUpperCase()}-${(sourcePack.nativeLang || "sk").toUpperCase()}.json`;
  }

  const effectiveFileName = fileNameEdited ? fileNameOverride : buildSaFileName(newName);

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const srcRes = await fetch(`${API}/${sourcePack.fileName}`);
      if (!srcRes.ok) throw new Error("Nepodarilo sa načítať zdrojový balík");
      const srcData = await srcRes.json();

      const newPack = { ...srcData, name: newName, fileName: effectiveFileName };
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...newPack, packId: slugify(newName), fileName: effectiveFileName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data.fileName);
      onClose();
    } catch (err) {
      setError(err.message);
      setStep("form");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="np-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="np-modal">
        <div className="np-header">
          <h3>{t("saveAs.title")}</h3>
          <button type="button" className="np-close" onClick={onClose}>✕</button>
        </div>

        {step === "form" ? (
          <>
            <div className="np-body">
              <div className="np-field">
                <label>{t("saveAs.source")}</label>
                <input value={sourcePack.name} disabled style={{ opacity: 0.5 }} />
              </div>
              <div className="np-field">
                <label>{t("saveAs.newName")}</label>
                <input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setFileNameEdited(false); }}
                  autoFocus
                />
              </div>
              <div className="np-field">
                <label>{t("saveAs.fileName")}</label>
                <input
                  value={effectiveFileName}
                  onChange={(e) => { setFileNameOverride(e.target.value); setFileNameEdited(true); }}
                  className="np-filename"
                />
              </div>
              {error && <div className="np-error">{error}</div>}
            </div>
            <div className="np-footer">
              <button className="projects-btn" onClick={onClose}>{t("common.cancel")}</button>
              <button
                className="projects-btn primary"
                onClick={() => { if (newName.trim()) setStep("confirm"); }}
                disabled={!newName.trim()}
              >
                {t("saveAs.submit")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="np-body">
              <div className="sa-confirm-text">
                {t("saveAs.confirmText")(sourcePack.name, newName).split("\n").map((line, i) => (
                  <span key={i}>{line}{i < 3 && <br />}</span>
                ))}<br /><br />
                Súbor: <span className="np-filename" style={{ padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>{effectiveFileName}</span>
              </div>
            </div>
            <div className="np-footer">
              <button className="projects-btn" onClick={() => setStep("form")}>{t("common.back")}</button>
              <button className="projects-btn primary" onClick={doSave} disabled={saving}>
                {saving ? t("saveAs.saving") : t("saveAs.submitConfirm")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modál Delete Pack ─────────────────────────────────
function DeletePackModal({ pack, onClose, onDeleted }) {
  const t = useT();
  const { token } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState(null);

  async function doDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${pack.fileName}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="np-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="np-modal" style={{ width: 420 }}>
        <div className="np-header">
          <h3>{t("deletePack.title")}</h3>
          <button type="button" className="np-close" onClick={onClose}>✕</button>
        </div>

        <div className="np-body">
          <div className="sa-confirm-text">
            {t("deletePack.confirmText")(pack.name).split("\n").map((line, i) => (
              <span key={i}>{line}{i < 1 && <br />}</span>
            ))}<br /><br />
            Súbor: <span className="np-filename" style={{ padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>{pack.fileName}</span><br /><br />
            <span style={{ color: "#ff6b6b", fontSize: 12 }}>{t("common.irreversible")}</span>
          </div>
          {error && <div className="np-error">{error}</div>}
        </div>

        <div className="np-footer">
          <button className="projects-btn" onClick={onClose}>{t("common.cancel")}</button>
          <button className="projects-btn danger" onClick={doDelete} disabled={deleting}>
            {deleting ? t("deletePack.deleting") : t("deletePack.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

function resizeImageFile(file, maxSize = 256) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = url;
  });
}

// ── Hlavná obrazovka ──────────────────────────────────
export default function ProjectsScreen({ setActiveScreen, setActivePack, filter = "", statusFilter = "", langFilter = "", themeFilter = "", levelFilter = "", onCategoriesLoaded }) {
  const t = useT();
  const { token } = useAuth();
  const [rowData, setRowData]       = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [showNewPack, setShowNewPack]       = useState(false);
  const [showSaveAs, setShowSaveAs]         = useState(false);
  const iconInputRef = useRef(null);
  const [iconSaving, setIconSaving] = useState(false);
  const [showDeletePack, setShowDeletePack] = useState(false);
  const [publishing, setPublishing]         = useState(false);
  const [publishMsg, setPublishMsg]         = useState(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const columnDefs = useMemo(() => [
    { headerName: t("projects.grid.words"),    field: "words",    width: 110 },
    { headerName: t("projects.grid.packName"), field: "name",     flex: 1 },
    { headerName: t("projects.grid.progress"), field: "progress", width: 90 },
    { headerName: "", field: "progress", width: 120, sortable: false, cellRenderer: ProgressBarCell },
    { headerName: t("projects.grid.status"),   field: "status",   width: 160 },
  ], [t]);

  const loadPacks = useCallback(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => {
        setRowData(data);
        if (onCategoriesLoaded) {
          const unique = [...new Set(
            data.map(p => p.category).filter(c => c && c !== "-")
          )].sort();
          onCategoriesLoaded(unique);
        }
      })
      .catch(console.error);
  }, [onCategoriesLoaded]);

  useEffect(() => { loadPacks(); }, [loadPacks]);

  function handleCreated(fileName) {
    loadPacks();
  }

  async function handlePublish() {
    if (!selectedPack || selectedPack.status !== "Approved") return;
    setShowPublishConfirm(false);
    setPublishing(true);
    setPublishMsg(null);
    try {
      const res = await fetch(`${API}/${selectedPack.fileName}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const archiveNote = data.archivePath ? `  |  Archív: ${data.archivePath}` : "";
      setPublishMsg({ ok: true, text: `Publikovaný do: ${data.destPath}${archiveNote}` });
      loadPacks();
    } catch (err) {
      setPublishMsg({ ok: false, text: err.message });
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishMsg(null), 7000);
    }
  }

  async function handleIconFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !selectedPack) return;
    setIconSaving(true);
    try {
      let dataUrl;
      if (file.type === "image/svg+xml") {
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      } else {
        dataUrl = await resizeImageFile(file, 72);
      }
      const res = await fetch(`${API}/${selectedPack.fileName}/icon`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ icon: dataUrl }),
      });
      if (res.ok) {
        setSelectedPack((prev) => ({ ...prev, icon: dataUrl }));
        setRowData((prev) => prev.map((p) =>
          p.fileName === selectedPack.fileName ? { ...p, icon: dataUrl } : p
        ));
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.error("Icon save failed:", err);
        alert(`Chyba pri ukladaní ikony: ${err.error || res.status}`);
      }
    } finally {
      setIconSaving(false);
    }
  }

  return (
    <div className="projects-screen">
      {/* TITLE */}
      <div className="projects-title">{t("projects.title")}</div>

      {/* TOOLBAR */}
      <div className="projects-toolbar">
        <button className="projects-btn primary">{t("projects.newProject")}</button>
        <button className="projects-btn new-pack" style={{ marginLeft: "auto" }} onClick={() => setShowNewPack(true)}>
          {t("projects.newPack")}
        </button>
        <button
          className="projects-btn save-pack"
          onClick={() => setShowSaveAs(true)}
          disabled={!selectedPack}
          title={!selectedPack ? t("projects.selectFirst") : ""}
        >
          {t("projects.saveAs")}
        </button>
        <button
          className="projects-btn publish-pack"
          disabled={selectedPack?.status !== "Approved" || publishing}
          title={selectedPack?.status !== "Approved" ? "Pack musí byť Approved" : ""}
          onClick={() => setShowPublishConfirm(true)}
        >{publishing ? "Publikujem…" : t("projects.publish")}</button>
        <button
          className="projects-btn danger"
          onClick={() => setShowDeletePack(true)}
          disabled={!selectedPack}
          title={!selectedPack ? t("projects.selectFirst") : ""}
        >
          {t("projects.deletePack")}
        </button>
      </div>

      {/* META PANEL */}
      <div className="project-meta-wrap">
        {/* ICON */}
        <div
          className={`project-meta-icon-area${selectedPack ? " can-upload" : ""}${iconSaving ? " saving" : ""}`}
          onClick={() => selectedPack && iconInputRef.current?.click()}
          title={selectedPack ? "Kliknúť pre zmenu ikony (jpg, png, svg)" : ""}
        >
          {selectedPack?.icon?.startsWith("data:") ? (
            <img src={selectedPack.icon} alt="icon" className="meta-icon-img" />
          ) : (
            <span className="meta-icon-emoji">{selectedPack?.icon || "📦"}</span>
          )}
          {selectedPack && !iconSaving && (
            <div className="meta-icon-overlay">🖼</div>
          )}
          {iconSaving && <div className="meta-icon-overlay">…</div>}
          <div className="meta-icon-label">
            {iconSaving ? "Ukladám…" : "Obrázok"}
          </div>
          <input
            ref={iconInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.svg"
            style={{ display: "none" }}
            onChange={handleIconFile}
          />
        </div>

        <div className="project-meta-panel">
          <div className="meta-item">
            <div className="meta-label">{t("projects.meta.languages")}</div>
            <div className="meta-value">
              {selectedPack?.targetLang || "-"}{" → "}{selectedPack?.nativeLang || "-"}
            </div>
          </div>
          <div className="meta-item" style={{ gridRow: "2" }}>
            <div className="meta-label">{t("projects.meta.words")}</div>
            <div className="meta-value">{selectedPack?.words ?? "-"}</div>
          </div>
          <div className="meta-item" style={{ gridColumn: "2 / 4" }}>
            <div className="meta-label">{t("projects.meta.packName")}</div>
            <div className="meta-value meta-text">
              {!selectedPack?.icon?.startsWith("data:") && selectedPack?.icon}{" "}
              {selectedPack?.name || "-"}
            </div>
          </div>
          <div className="meta-item" style={{ gridColumn: "2 / 6", gridRow: "2" }}>
            <div className="meta-label">{t("projects.meta.description")}</div>
            <div className="meta-value meta-text">{selectedPack?.description || "-"}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">{t("projects.meta.category")}</div>
            <div className="meta-value">{selectedPack?.category || "-"}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">{t("projects.meta.version")}</div>
            <div className="meta-value">{selectedPack?.version || "-"}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">{t("projects.meta.author")}</div>
            <div className="meta-value meta-text">{selectedPack?.author || "-"}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">{t("projects.meta.fileName")}</div>
            <div className="meta-value meta-text">{selectedPack?.fileName || "-"}</div>
          </div>
          <div className="meta-item" style={{ gridColumn: "7", gridRow: "2" }}>
            <div className="meta-label">{t("projects.meta.level")}</div>
            <div className="meta-value">{selectedPack?.level || "-"}</div>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="ag-theme-alpine-dark projects-grid">
        <AgGridReact
          theme="legacy"
          headerHeight={34}
          rowHeight={26}
          rowData={rowData.filter(p => {
            const lvl = p.level && p.level !== "-" ? p.level : null;
            const levelMatch = !levelFilter ||
              (levelFilter === "__none__" ? !lvl : lvl === levelFilter);
            return (
              (!statusFilter || p.status === statusFilter) &&
              (!langFilter   || p.targetLang === langFilter) &&
              (!themeFilter  || p.category === themeFilter) &&
              levelMatch
            );
          })}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, resizable: true, cellStyle: { textAlign: "left" } }}
          quickFilterText={filter}
          rowSelection="single"
          animateRows={true}
          onSelectionChanged={(event) => {
            const rows = event.api.getSelectedRows();
            if (rows.length > 0) setSelectedPack(rows[0]);
          }}
          onRowDoubleClicked={(event) => {
            setActivePack(event.data);
            setActiveScreen("editor");
          }}
        />
      </div>

      {/* STATUS BAR */}
      <div className="projects-statusbar">
        <span className="projects-statusbar-label">Info:</span>
        {publishMsg && (
          <span
            className="projects-statusbar-msg"
            style={{ color: publishMsg.ok ? "var(--app-save-ok)" : "#f87171" }}
          >
            {publishMsg.text}
          </span>
        )}
      </div>

      {showNewPack && (
        <NewPackModal
          onClose={() => setShowNewPack(false)}
          onCreated={handleCreated}
        />
      )}

      {showDeletePack && selectedPack && (
        <DeletePackModal
          pack={selectedPack}
          onClose={() => setShowDeletePack(false)}
          onDeleted={() => { setSelectedPack(null); loadPacks(); }}
        />
      )}

      {showSaveAs && selectedPack && (
        <SaveAsModal
          sourcePack={selectedPack}
          onClose={() => setShowSaveAs(false)}
          onSaved={(fileName) => { loadPacks(); }}
        />
      )}

      {showPublishConfirm && selectedPack && (
        <PublishConfirmModal
          pack={selectedPack}
          onConfirm={handlePublish}
          onClose={() => setShowPublishConfirm(false)}
        />
      )}
    </div>
  );
}
