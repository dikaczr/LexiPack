import "./ExampleCheckDialog.css";

const QUALITY_LABEL = { ok: "OK", generic: "Generické", weak: "Slabé" };
const QUALITY_CLASS  = { ok: "eq-badge--ok", generic: "eq-badge--generic", weak: "eq-badge--weak" };

export default function ExampleCheckDialog({ results, total, onClose, onApply }) {
  if (!results) return null;

  const weak    = results.filter((r) => r.quality === "weak");
  const generic = results.filter((r) => r.quality === "generic");
  const ok      = results.filter((r) => r.quality === "ok");

  return (
    <div className="eq-overlay" onClick={onClose}>
      <div className="eq-dialog" onClick={(e) => e.stopPropagation()}>

        <div className="eq-header">
          <span className="eq-title">Kontrola kvality príkladov (Example EN)</span>
          <button className="eq-close" onClick={onClose}>✕</button>
        </div>

        <div className="eq-meta">
          <span>Skontrolovaných: <strong>{total}</strong></span>
          <span className={weak.length    ? "eq-warn" : ""}>Slabé: <strong>{weak.length}</strong></span>
          <span className={generic.length ? "eq-warn" : ""}>Generické: <strong>{generic.length}</strong></span>
          <span>OK: <strong>{ok.length}</strong></span>
        </div>

        <div className="eq-body">
          {weak.length === 0 && generic.length === 0 && (
            <div className="eq-ok-msg">Všetky príklady sú kvalitné ✓</div>
          )}

          {weak.length > 0 && (
            <IssueTable
              title={`Slabé príklady (${weak.length})`}
              titleClass="eq-warn"
              rows={weak}
              onApply={onApply}
            />
          )}

          {generic.length > 0 && (
            <IssueTable
              title={`Generické príklady (${generic.length})`}
              titleClass="eq-generic"
              rows={generic}
              onApply={onApply}
            />
          )}
        </div>

        <div className="eq-footer">
          <button onClick={onClose}>Zatvoriť</button>
        </div>

      </div>
    </div>
  );
}

function IssueTable({ title, titleClass, rows, onApply }) {
  return (
    <>
      <div className={`eq-section-title ${titleClass}`}>{title}</div>
      <table className="eq-table">
        <thead>
          <tr>
            <th>Slovo</th>
            <th>Aktuálny príklad</th>
            <th>Hodnotenie</th>
            <th>Poznámka</th>
            <th>Návrh</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="eq-word">{r.word}</td>
              <td className="eq-example">{r.example}</td>
              <td>
                <span className={`eq-badge ${QUALITY_CLASS[r.quality] ?? ""}`}>
                  {QUALITY_LABEL[r.quality] ?? r.quality}
                </span>
              </td>
              <td className="eq-note">{r.note}</td>
              <td className="eq-suggestion">{r.suggestion ?? <span className="eq-muted">—</span>}</td>
              <td>
                {r.suggestion && (
                  <button
                    className="eq-apply"
                    title="Nahradiť príklad AI návrhom"
                    onClick={() => onApply(r.id, r.suggestion)}
                  >
                    Použiť
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
