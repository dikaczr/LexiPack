import { useState } from "react";
import { useT } from "../i18n";
import { TARGET_FIELDS } from "../utils/xlsxImport";

const STRATEGIES = ["replace", "append", "skip", "merge"];

function ImportDialog({
  open,
  importFormat,
  setImportFormat,
  importStrategy,
  setImportStrategy,
  sheetNames = [],
  selectedSheet,
  onSheetChange,
  headers = [],
  mapping = {},
  setMapping,
  previewRows = [],
  validation = { totalCount: 0, missingWordCount: 0 },
  autoSplitArticle,
  setAutoSplitArticle,
  showAutoSplitArticle,
  targetLang = "en",
  nativeLang = "sk",
  onCancel,
  onImport,
}) {
  const t = useT();
  // Lazy initializer only — the parent remounts this component (via a `key` tied
  // to the import session) each time a new file is picked, so this runs fresh
  // per session instead of needing an effect to resync on `open`/`sheetNames`.
  const [step, setStep] = useState(() => (sheetNames.length > 1 ? "sheet" : "mapping"));

  if (!open) return null;

  function fieldLabel(field) {
    if (field === "example_target") return t("cols.exampleLang")(targetLang);
    if (field === "example_native") return t("cols.exampleLang")(nativeLang);
    if (field === "contextSentences") return t("cols.context");
    return t(`cols.${field}`);
  }

  function fieldRowKey(field) {
    if (field === "example_target") return `example_${targetLang}`;
    if (field === "example_native") return `example_${nativeLang}`;
    return field;
  }

  function renderStrategyPicker() {
    return (
      <div className="dialog-section">
        <div className="dialog-label">{t("importDialog.strategyLabel")}</div>
        {STRATEGIES.map((s) => (
          <label key={s}>
            <input
              type="radio"
              value={s}
              checked={importStrategy === s}
              onChange={(e) => setImportStrategy(e.target.value)}
            />
            {t(`importDialog.strategy_${s}`)}
          </label>
        ))}
      </div>
    );
  }

  if (importFormat === "xlsx" && step === "sheet") {
    return (
      <div className="dialog-overlay">
        <div className="dialog">
          <div className="dialog-title">{t("importDialog.title")}</div>

          <div className="dialog-section">
            <div className="dialog-label">{t("importDialog.sheetLabel")}</div>
            <select value={selectedSheet} onChange={(e) => onSheetChange(e.target.value)}>
              {sheetNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="dialog-actions">
            <button onClick={onCancel}>{t("importDialog.cancel")}</button>
            <button onClick={() => setStep("mapping")}>{t("importDialog.next")}</button>
          </div>
        </div>
      </div>
    );
  }

  if (importFormat === "xlsx") {
    // Include fields the user explicitly mapped, plus any field that ended up
    // populated on the built preview rows (e.g. "article" filled in by
    // auto-split even though no source column was mapped to it).
    const mappedFields = TARGET_FIELDS.filter((f) => {
      if (Object.values(mapping).includes(f)) return true;
      const key = fieldRowKey(f);
      return previewRows.some((row) => {
        const value = row[key];
        return Array.isArray(value) ? value.length > 0 : !!value;
      });
    });
    const importDisabled = validation.missingWordCount === validation.totalCount;

    return (
      <div className="dialog-overlay">
        <div className="dialog" style={{ width: 680 }}>
          <div className="dialog-title">{t("importDialog.title")}</div>

          <div className="dialog-section">
            <div className="dialog-label">{t("importDialog.mappingTitle")}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.4rem 0.8rem" }}>{t("importDialog.mappingSourceHeader")}</th>
                  <th style={{ textAlign: "left", padding: "0.4rem 0.8rem" }}>{t("importDialog.mappingTargetHeader")}</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((header) => (
                  <tr key={header}>
                    <td style={{ padding: "0.4rem 0.8rem" }}>{header}</td>
                    <td style={{ padding: "0.4rem 0.8rem" }}>
                      <select
                        value={mapping[header] || ""}
                        onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                      >
                        <option value="">{t("importDialog.mappingIgnore")}</option>
                        {TARGET_FIELDS.map((field) => (
                          <option key={field} value={field}>{fieldLabel(field)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mappedFields.length > 0 && (
            <div className="dialog-section">
              <div className="dialog-label">{t("importDialog.previewTitle")}</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.2rem" }}>
                  <thead>
                    <tr>
                      {mappedFields.map((f) => (
                        <th key={f} style={{ textAlign: "left", padding: "0.4rem 0.8rem" }}>{fieldLabel(f)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {mappedFields.map((f) => {
                          const value = row[fieldRowKey(f)];
                          const display = f === "contextSentences"
                            ? (Array.isArray(value) ? value.map((cs) => cs?.[targetLang] ?? "").join(" / ") : "")
                            : value;
                          return <td key={f} style={{ padding: "0.4rem 0.8rem" }}>{display}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ color: "var(--app-muted)", fontSize: "1.2rem" }}>
                {t("importDialog.validationSummary")(validation.totalCount, validation.missingWordCount)}
              </div>
            </div>
          )}

          {showAutoSplitArticle && (
            <div className="dialog-section">
              <label>
                <input
                  type="checkbox"
                  checked={autoSplitArticle}
                  onChange={(e) => setAutoSplitArticle(e.target.checked)}
                />
                {t("importDialog.autoSplitArticleLabel")}
              </label>
            </div>
          )}

          {renderStrategyPicker()}

          <div className="dialog-actions">
            {sheetNames.length > 1 && (
              <button onClick={() => setStep("sheet")}>{t("importDialog.back")}</button>
            )}
            <button onClick={onCancel}>{t("importDialog.cancel")}</button>
            <button onClick={onImport} disabled={importDisabled}>{t("importDialog.ok")}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-title">{t("importDialog.title")}</div>

        <div className="dialog-section">
          <div className="dialog-label">{t("importDialog.formatLabel")}</div>
          <select value={importFormat} onChange={(e) => setImportFormat(e.target.value)}>
            <option value="xlsx">{t("importDialog.fmt_xlsx")}</option>
            <option value="json">{t("importDialog.fmt_json")}</option>
          </select>
        </div>

        {renderStrategyPicker()}

        <div className="dialog-actions">
          <button onClick={onCancel}>{t("importDialog.cancel")}</button>
          <button onClick={onImport}>{t("importDialog.ok")}</button>
        </div>
      </div>
    </div>
  );
}

export default ImportDialog;
