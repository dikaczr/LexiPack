import "./CefrCheckDialog.css";

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

function levelColor(level) {
  return { A1: "#22c55e", A2: "#84cc16", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f59e0b", C2: "#ef4444" }[level] ?? "#64748b";
}

function levelDiff(assigned, ai) {
  const a = LEVEL_ORDER.indexOf(assigned);
  const b = LEVEL_ORDER.indexOf(ai);
  if (a === -1 || b === -1) return null;
  return b - a;
}

export default function CefrCheckDialog({ results, total, packLevel, onClose, onApply }) {
  if (!results) return null;

  const checked   = results.filter((r) => r.match !== null && r.aiLevel);
  const mismatches = results.filter((r) => r.match === false);
  const errors    = results.filter((r) => r.match === null);

  // Group mismatches: too easy / too hard
  const tooEasy = mismatches.filter((r) => (levelDiff(r.assignedLevel, r.aiLevel) ?? 0) < 0);
  const tooHard = mismatches.filter((r) => (levelDiff(r.assignedLevel, r.aiLevel) ?? 0) > 0);

  return (
    <div className="cefrDialog-overlay" onClick={onClose}>
      <div className="cefrDialog" onClick={(e) => e.stopPropagation()}>

        <div className="cefrDialog-header">
          <span className="cefrDialog-title">Konzistencia úrovní (CEFR)</span>
          <button className="cefrDialog-close" onClick={onClose}>✕</button>
        </div>

        <div className="cefrDialog-meta">
          <span>Úroveň balíka: <strong style={{ color: levelColor(packLevel) }}>{packLevel || "—"}</strong></span>
          <span>Skontrolovaných: <strong>{checked.length}</strong> / {total}</span>
          <span className={mismatches.length ? "cefrDialog-warn" : ""}>
            Nekonzistentných: <strong>{mismatches.length}</strong>
          </span>
          {errors.length > 0 && <span className="cefrDialog-muted">Chyba AI: {errors.length}</span>}
        </div>

        <div className="cefrDialog-body">
          {mismatches.length === 0 && errors.length === 0 && (
            <div className="cefrDialog-ok">Všetky slová sú na správnej úrovni ✓</div>
          )}

          {tooEasy.length > 0 && (
            <MismatchTable
              title={`Príliš ľahké slová — pod úrovňou ${packLevel} (${tooEasy.length})`}
              rows={tooEasy}
              onApply={onApply}
            />
          )}

          {tooHard.length > 0 && (
            <MismatchTable
              title={`Príliš ťažké slová — nad úrovňou ${packLevel} (${tooHard.length})`}
              rows={tooHard}
              onApply={onApply}
            />
          )}

          {errors.length > 0 && (
            <div className="cefrDialog-section-title cefrDialog-muted">
              AI nedokázala posúdiť: {errors.map((r) => r.word).join(", ")}
            </div>
          )}
        </div>

        <div className="cefrDialog-footer">
          <button onClick={onClose}>Zatvoriť</button>
        </div>
      </div>
    </div>
  );
}

function MismatchTable({ title, rows, onApply }) {
  return (
    <>
      <div className="cefrDialog-section-title cefrDialog-warn">{title}</div>
      <table className="cefrDialog-table">
        <thead>
          <tr>
            <th>Slovo</th>
            <th>Priradená</th>
            <th>AI odhaduje</th>
            <th>Poznámka</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="cefrDialog-word">{r.word}</td>
              <td>
                <span className="cefrDialog-badge" style={{ background: levelColor(r.assignedLevel) }}>
                  {r.assignedLevel || "—"}
                </span>
              </td>
              <td>
                <span className="cefrDialog-badge" style={{ background: levelColor(r.aiLevel) }}>
                  {r.aiLevel || "—"}
                </span>
              </td>
              <td className="cefrDialog-note">{r.note}</td>
              <td>
                <button
                  className="cefrDialog-goto"
                  title={`Nastaviť úroveň na ${r.aiLevel}`}
                  onClick={() => onApply(r.id, r.aiLevel)}
                >
                  Použiť {r.aiLevel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
