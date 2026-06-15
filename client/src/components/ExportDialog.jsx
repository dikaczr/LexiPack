import { useT } from "../i18n";

function ExportDialog({ open, format, setFormat, onCancel, onExport }) {
  const t = useT();
  if (!open) return null;

  const formats = [
    { value: "xlsx", label: "XLSX", descKey: "fmt_xlsx" },
    { value: "csv",  label: "CSV",  descKey: "fmt_csv" },
    { value: "tbx",  label: "TBX",  descKey: "fmt_tbx" },
    { value: "txt",  label: "TXT",  descKey: "fmt_txt" },
    { value: "pdf",  label: "PDF",  descKey: "fmt_pdf" },
  ];

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-title">{t("exportDialog.title")}</div>

        <div className="dialog-section">
          <div className="dialog-label">{t("exportDialog.formatLabel")}</div>
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
                — {t(`exportDialog.${f.descKey}`)}
              </span>
            </label>
          ))}
        </div>

        <div className="dialog-actions">
          <button onClick={onCancel}>{t("exportDialog.cancel")}</button>
          <button onClick={onExport}>{t("exportDialog.ok")}</button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
