function ImportDialog({
  open,
  importFormat,
  setImportFormat,
  importStrategy,
  setImportStrategy,
  onCancel,
  onImport
}) {

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-overlay">

      <div className="dialog">

        <div className="dialog-title">
          Import Data
        </div>

        <div className="dialog-section">

          <div className="dialog-label">
            Format
          </div>

          <select
            value={importFormat}
            onChange={(e) =>
              setImportFormat(e.target.value)
            }
          >
            <option value="xlsx">
              XLSX
            </option>

            <option value="json">
              JSON
            </option>
          </select>

        </div>

        <div className="dialog-section">

          <div className="dialog-label">
            Strategy
          </div>

          <label>
            <input
              type="radio"
              value="replace"
              checked={
                importStrategy === "replace"
              }
              onChange={(e) =>
                setImportStrategy(
                  e.target.value
                )
              }
            />
            Replace all
          </label>

          <label>
            <input
              type="radio"
              value="append"
              checked={
                importStrategy === "append"
              }
              onChange={(e) =>
                setImportStrategy(
                  e.target.value
                )
              }
            />
            Append all
          </label>

          <label>
            <input
              type="radio"
              value="skip"
              checked={
                importStrategy === "skip"
              }
              onChange={(e) =>
                setImportStrategy(
                  e.target.value
                )
              }
            />
            Skip duplicates
          </label>

          <label>
            <input
              type="radio"
              value="merge"
              checked={
                importStrategy === "merge"
              }
              onChange={(e) =>
                setImportStrategy(
                  e.target.value
                )
              }
            />
            Merge duplicates
          </label>

        </div>

        <div className="dialog-actions">

          <button onClick={onCancel}>
            Cancel
          </button>

          <button onClick={onImport}>
            Import
          </button>

        </div>

      </div>

    </div>
  );
}

export default ImportDialog;