import { useState, useEffect, useRef } from "react";

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

function resizeImageFile(file, maxSize) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = url;
  });
}

function PackMetadataPanel({ metadata, setMetadata, availableTags = [] }) {
  const iconInputRef = useRef(null);

  function updateField(field, value) {
    setMetadata({ ...metadata, [field]: value });
  }

  async function handleIconFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    let dataUrl;
    if (file.type === "image/svg+xml") {
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    } else {
      dataUrl = await resizeImageFile(file, 72);
    }
    updateField("icon", dataUrl);
  }

  const iconIsImage = metadata.icon && metadata.icon.startsWith("data:");

  return (
    <div className="metadata-panel">
      <label className="metadata-field">
        <span className="metadata-label">Pack Name</span>
        <input
          placeholder="Pack Name"
          value={metadata.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
      </label>

      <label className="metadata-field">
        <span className="metadata-label">Author</span>
        <input
          placeholder="Author"
          value={metadata.author}
          onChange={(e) => updateField("author", e.target.value)}
        />
      </label>

      <label className="metadata-field">
        <span className="metadata-label">Category</span>
        <input
          placeholder="Category"
          value={metadata.category}
          onChange={(e) => updateField("category", e.target.value)}
        />
      </label>

      <label className="metadata-field">
        <span className="metadata-label">Level</span>
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
        <span className="metadata-label">Version</span>
        <input
          placeholder="Version"
          value={metadata.version}
          onChange={(e) => updateField("version", e.target.value)}
        />
      </label>

      <div className="metadata-desc-icon-wrap">
        <label className="metadata-field" style={{ flex: 1 }}>
          <span className="metadata-label">Description</span>
          <textarea
            placeholder="Description"
            value={metadata.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </label>

        <div className="metadata-field">
          <span className="metadata-label">Icon</span>
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
            <div className="metadata-icon-label">Icon</div>
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

      <div className="metadata-field" style={{ gridColumn: "2 / -1" }}>
        <span className="metadata-label">Tags</span>
        <TagInput
          value={metadata.tags}
          onChange={(newTags) => updateField("tags", newTags)}
          availableTags={availableTags}
        />
      </div>
    </div>
  );
}

export default PackMetadataPanel;
