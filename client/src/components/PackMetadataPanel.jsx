import { useState, useEffect, useRef, useCallback } from "react";
import { resizeImageFile } from "../utils/resizeImage";
import { useT } from "../i18n";

const COLOR_PRESETS = [
  // Reds / Magentas  — HKS 14 Z, 18 Z, 22 Z, 25 Z, 27 Z
  "#C8102E", "#A8003C", "#C0006A", "#8A005A", "#6B2080",
  // Blues            — HKS 33 Z, 41 Z, 44 Z, 45 Z, 50 Z
  "#3B2A82", "#003882", "#005B96", "#0082B4", "#0092A8",
  // Greens / Olives  — HKS 55 Z, 65 Z, 66 Z, 68 Z, 70 Z
  "#006E70", "#007A3D", "#4E8C1D", "#8EA000", "#A09600",
  // Ambers / Neutrals — HKS 3 Z, 7 Z, 8 Z, 92 Z, 95 Z
  "#C8A000", "#D06800", "#C84800", "#8A8880", "#4A4845",
];

function ColorPickerPopover({ value, onChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
      background: "var(--app-sidebar-bg, #1e293b)",
      border: "1px solid var(--app-border-sub, #334155)",
      borderRadius: 8, padding: 8,
      boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
      width: 152,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 8 }}>
        {COLOR_PRESETS.map(c => (
          <div
            key={c}
            onClick={() => { onChange(c); onClose(); }}
            title={c}
            style={{
              width: 22, height: 22, borderRadius: 4, background: c, cursor: "pointer",
              border: c === value ? "2px solid var(--app-accent, #3b82f6)" : "2px solid transparent",
              boxSizing: "border-box",
            }}
          />
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#rrggbb"
        style={{
          width: "100%", boxSizing: "border-box",
          background: "var(--app-input, #0f172a)",
          border: "1px solid var(--app-border-sub, #334155)",
          borderRadius: 4, padding: "4px 6px",
          color: "var(--app-text2, #e2e8f0)", fontSize: 11,
          outline: "none",
        }}
      />
    </div>
  );
}

function TagInput({ value, onChange, availableTags = [] }) {
  const tags = Array.isArray(value)
    ? value
    : (typeof value === "string" && value ? value.split(",").map(t => t.trim()).filter(Boolean) : []);

  const [inputVal, setInputVal] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filtered = availableTags.filter(
    t => !tags.includes(t) && t.toLowerCase().includes(inputVal.toLowerCase())
  );

  function addTag(tag) {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInputVal("");
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputVal.trim()) addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="tag-input-wrap">
      <div className="tag-chips" onClick={() => inputRef.current?.focus()}>
        {tags.map(tag => (
          <span key={tag} className="tag-chip">
            {tag}
            <button
              type="button"
              className="tag-chip-remove"
              onMouseDown={e => { e.preventDefault(); removeTag(tag); }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="tag-chip-input"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "tag1, tag2, ..." : ""}
        />
      </div>
      {showDropdown && filtered.length > 0 && (
        <div className="tag-dropdown">
          {filtered.map(tag => (
            <div
              key={tag}
              className="tag-dropdown-item"
              onMouseDown={e => { e.preventDefault(); addTag(tag); }}
            >
              {tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PackMetadataPanel({ metadata, setMetadata, availableTags = [], apiBase, token, fileName }) {
  const t = useT();
  const iconInputRef       = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const closeColorPicker   = useCallback(() => setShowColorPicker(false), []);

  function updateField(field, value) {
    setMetadata({ ...metadata, [field]: value });
  }

  async function handleIconFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const dataUrl = await resizeImageFile(file, 256);
    updateField("icon", dataUrl);
    if (apiBase && token && fileName) {
      fetch(`${apiBase}/api/packs/${fileName}/icon`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ icon: dataUrl }),
      }).catch((err) => console.warn("Icon PATCH failed:", err));
    }
  }

  const iconIsImage = metadata.icon && metadata.icon.startsWith("data:");

  return (
    <div className="metadata-panel">
      <label className="metadata-field">
        <span className="metadata-label">{t("meta.packName")}</span>
        <input
          placeholder={t("meta.packName")}
          value={metadata.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
      </label>

      <label className="metadata-field">
        <span className="metadata-label">{t("meta.author")}</span>
        <input
          placeholder={t("meta.author")}
          value={metadata.author}
          onChange={(e) => updateField("author", e.target.value)}
        />
      </label>

      <label className="metadata-field">
        <span className="metadata-label">{t("meta.category")}</span>
        <input
          placeholder={t("meta.category")}
          value={metadata.category}
          onChange={(e) => updateField("category", e.target.value)}
        />
      </label>

      <label className="metadata-field">
        <span className="metadata-label">{t("meta.level")}</span>
        <select
          value={metadata.level}
          onChange={(e) => updateField("level", e.target.value)}
        >
          {["A1","A2","B1","B2","C1","C2"].map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </label>

      <label className="metadata-field">
        <span className="metadata-label">{t("meta.version")}</span>
        <input
          placeholder={t("meta.version")}
          value={metadata.version}
          onChange={(e) => updateField("version", e.target.value)}
        />
      </label>

      <div className="metadata-desc-icon-wrap">
        <label className="metadata-field" style={{ flex: 1 }}>
          <span className="metadata-label">{t("meta.description")}</span>
          <textarea
            placeholder={t("meta.description")}
            value={metadata.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </label>

        <div className="metadata-field">
          <span className="metadata-label">{t("meta.icon")}</span>
          <div
            className="metadata-icon-area"
            onClick={() => iconInputRef.current?.click()}
            title="Click to upload image"
          >
            {iconIsImage
              ? <img src={metadata.icon} alt="icon" className="metadata-icon-img" />
              : <span className="metadata-icon-emoji">{metadata.icon || "📘"}</span>
            }
            <div className="metadata-icon-overlay">📷</div>
            <div className="metadata-icon-label">{t("meta.icon")}</div>
          </div>
          <input
            ref={iconInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            style={{ display: "none" }}
            onChange={handleIconFile}
          />
        </div>
      </div>

      <div className="metadata-field" style={{ gridColumn: "2 / 5" }}>
        <span className="metadata-label">{t("meta.tags")}</span>
        <TagInput
          value={metadata.tags}
          onChange={(newTags) => updateField("tags", newTags)}
          availableTags={availableTags}
        />
      </div>

      <div className="metadata-field">
        <span className="metadata-label">{t("meta.color")}</span>
        <div style={{ position: "relative" }}>
          <div
            title="Farba markera v Lexico"
            onClick={() => setShowColorPicker((v) => !v)}
            style={{
              width: "100%", height: 28, borderRadius: 4,
              border: "1px solid var(--app-border-sub, #334155)",
              background: metadata.color || "#4f8ef7",
              cursor: "pointer",
            }}
          />
          {showColorPicker && (
            <ColorPickerPopover
              value={metadata.color || "#4f8ef7"}
              onChange={(c) => updateField("color", c)}
              onClose={closeColorPicker}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PackMetadataPanel;
