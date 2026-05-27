import { useState } from "react";
import "./SpellCheckDialog.css";

const FIELD_LABELS = {
  word:        "Word",
  translation: "Translation",
  definition:  "Definition",
  example_en:  "Example EN",
  example_sk:  "Example SK",
};

export default function SpellCheckDialog({ results, onClose, onNavigate }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!results) return null;

  return (
    <div className="scDialog-overlay" onClick={onClose}>
      <div className="scDialog" onClick={(e) => e.stopPropagation()}>
        <div className="scDialog-header">
          <span className="scDialog-title">Kontrola pravopisu</span>
          <button className="scDialog-close" onClick={onClose}>✕</button>
        </div>

        {results.length === 0 ? (
          <div className="scDialog-empty">Žiadne problémy nenájdené ✓</div>
        ) : (
          <>
            <div className="scDialog-summary">
              Nájdených: <strong>{results.length}</strong> problémov v {new Set(results.map((r) => r.rowId)).size} slovách
            </div>
            <div className="scDialog-list">
              {results.map((r, idx) => (
                <div key={idx} className="scDialog-item">
                  <div
                    className="scDialog-item-header"
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  >
                    <span className="scDialog-word">{r.word}</span>
                    <span className="scDialog-field">{FIELD_LABELS[r.field] ?? r.field}</span>
                    <span className="scDialog-count">{r.issues.length}×</span>
                    <span className="scDialog-chevron">{expandedIdx === idx ? "▲" : "▼"}</span>
                  </div>

                  {expandedIdx === idx && (
                    <div className="scDialog-issues">
                      {r.issues.map((issue, iIdx) => (
                        <div key={iIdx} className="scDialog-issue">
                          <div className="scDialog-issue-msg">{issue.message}</div>
                          {issue.replacements.length > 0 && (
                            <div className="scDialog-suggestions">
                              Návrhy: {issue.replacements.map((s, si) => (
                                <span key={si} className="scDialog-suggestion">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        className="scDialog-goto"
                        onClick={() => { onNavigate(r.rowId, r.field); onClose(); }}
                      >
                        → Prejsť na bunku
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="scDialog-footer">
          <button onClick={onClose}>Zatvoriť</button>
        </div>
      </div>
    </div>
  );
}
