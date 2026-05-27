function ExportDialog({ open, format, setFormat, onCancel, onExport }) {
  if (!open) return null;

  const formats = [
    { value: "xlsx", label: "XLSX", desc: "Excel tabuľka" },
    { value: "csv",  label: "CSV",  desc: "Oddeľovaný textový súbor" },
    { value: "tbx",  label: "TBX",  desc: "TermBase eXchange (ISO 30042)" },
    { value: "txt",  label: "TXT",  desc: "Čitateľný textový súbor" },
    { value: "pdf",  label: "PDF",  desc: "Formátovaný dokument" },
  ];

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-title">Export</div>

        <div className="dialog-section">
          <div className="dialog-label">Výstupný formát</div>
          {formats.map((f) => (
            <label key={f.value}>
              <input
                type="radio"
                value={f.value}
                checked={format === f.value}
                onChange={(e) => setFormat(e.target.value)}
              />
              {f.label}
              <span style={{ color: "var(--text-muted, #999)", marginLeft: 6, fontSize: "0.85em" }}>
                — {f.desc}
              </span>
            </label>
          ))}
        </div>

        <div className="dialog-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onExport}>OK</button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
