import { useState } from "react";
import "./SpellCheckDialog.css";

export default function SpellCheckDialog({ results, onClose, onApply, onNavigate }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!results) return null;

  function fieldLabel(field) {
    if (field === "word") return "Slovo";
    if (field === "translation") return "Preklad";
    if (field === "definition") return "Definícia";
    if (field.startsWith("example_")) return `Príklad ${field.replace("example_", "").toUpperCase()}`;
    return field;
  }

  return (
    <div className="scDialog-overlay" onClick={onClose}>
      <div className="scDialog" onClick={(e) => e.stopPropagation()}>
        <div className="scDialog-header">
          <span className="scDialog-title">Kontrola pravopisu (Hunspell)</span>
          <button className="scDialog-close" onClick={onClose}>✕</button>
        </div>

        {results.length === 0 ? (
          <div className="scDialog-empty">Žiadne problémy nenájdené ✓</div>
        ) : (
          <>
            <div className="scDialog-summary">
              Nájdených: <strong>{results.reduce((s, r) => s + r.misspelled.length, 0)}</strong> chýb
              v <strong>{new Set(results.map(r => r.rowId)).size}</strong> slovách
            </div>
            <div className="scDialog-list">
              {results.map((r, idx) => (
                <div key={idx} className="scDialog-item">
                  <div
                    className="scDialog-item-header"
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  >
                    <span className="scDialog-word">{r.word}</span>
                    <span className="scDialog-field">{fieldLabel(r.field)}</span>
                    <span className="scDialog-count">{r.misspelled.length}×</span>
                    <span className="scDialog-chevron">{expandedIdx === idx ? "▲" : "▼"}</span>
                  </div>

                  {expandedIdx === idx && (
                    <div className="scDialog-issues">
                      {r.misspelled.map((m, mi) => (
                        <div key={mi} className="scDialog-issue">
                          <div className="scDialog-issue-msg">
                            <strong>"{m.word}"</strong> — neznáme slovo
                          </div>
                          {m.suggestions.length > 0 && (
                            <div className="scDialog-suggestions">
                              Návrhy:{" "}
                              {m.suggestions.map((s, si) => (
                                <span
                                  key={si}
                                  className="scDialog-suggestion"
                                  style={{ cursor: onApply ? "pointer" : "default" }}
                                  onClick={() => onApply?.(r.rowId, r.field, m.word, s)}
                                  title="Klikni pre nahradenie"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        className="scDialog-goto"
                        onClick={() => { onNavigate?.(r.rowId, r.field); onClose(); }}
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
