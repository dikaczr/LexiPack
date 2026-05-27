import { useState } from "react";
import "./PackCoverageDialog.css";

const COVERAGE_LABEL = { high: "Vysoké", medium: "Stredné", low: "Nízke" };
const COVERAGE_COLOR = { high: "#22c55e", medium: "#f59e0b", low: "#ef4444" };

function CoverageBar({ count, maxCount, level }) {
  const pct = maxCount > 0 ? Math.max(4, (count / maxCount) * 100) : 4;
  return (
    <div className="pc-bar-track">
      <div
        className="pc-bar-fill"
        style={{ width: `${pct}%`, background: COVERAGE_COLOR[level] ?? "#64748b" }}
      />
    </div>
  );
}

function GroupCard({ group, maxCount, onNavigate }) {
  const [open, setOpen] = useState(false);
  const color = COVERAGE_COLOR[group.coverage] ?? "#64748b";
  const label = COVERAGE_LABEL[group.coverage] ?? group.coverage;

  return (
    <div className="pc-group">
      <button className="pc-group-header" onClick={() => setOpen((v) => !v)}>
        <span className="pc-group-chevron">{open ? "▾" : "▸"}</span>
        <span className="pc-group-name">{group.name}</span>
        <CoverageBar count={group.words.length} maxCount={maxCount} level={group.coverage} />
        <span className="pc-group-count">{group.words.length} slov</span>
        <span className="pc-badge" style={{ background: color }}>{label}</span>
      </button>

      {open && (
        <div className="pc-word-list">
          {group.words.map((w) => (
            <div key={w.id} className="pc-word-row">
              <span className="pc-word">{w.word}</span>
              <span className="pc-translation">{w.translation}</span>
              {onNavigate && (
                <button
                  className="pc-goto"
                  onClick={() => onNavigate(w.id)}
                  title="Prejsť na slovo v gride"
                >
                  Prejsť
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PackCoverageDialog({ data, onClose, onNavigate }) {
  if (!data) return null;

  const { groups = [], missing = [], summary = "" } = data;
  const totalWords = groups.reduce((a, g) => a + g.words.length, 0);
  const maxCount   = Math.max(...groups.map((g) => g.words.length), 1);

  const sorted = [...groups].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.coverage] ?? 3) - (order[b.coverage] ?? 3);
  });

  const highCount   = groups.filter((g) => g.coverage === "high").length;
  const mediumCount = groups.filter((g) => g.coverage === "medium").length;
  const lowCount    = groups.filter((g) => g.coverage === "low").length;

  return (
    <div className="pc-overlay" onClick={onClose}>
      <div className="pc-dialog" onClick={(e) => e.stopPropagation()}>

        <div className="pc-header">
          <span className="pc-title">Vizualizácia pokrytia balíka</span>
          <button className="pc-close" onClick={onClose}>✕</button>
        </div>

        <div className="pc-meta">
          <span>Slov celkom: <strong>{totalWords}</strong></span>
          <span>Skupín: <strong>{groups.length}</strong></span>
          <span style={{ color: COVERAGE_COLOR.high   }}>Vysoké: <strong>{highCount}</strong></span>
          <span style={{ color: COVERAGE_COLOR.medium }}>Stredné: <strong>{mediumCount}</strong></span>
          <span style={{ color: COVERAGE_COLOR.low    }}>Nízke: <strong>{lowCount}</strong></span>
        </div>

        {summary && (
          <div className="pc-summary">{summary}</div>
        )}

        <div className="pc-body">
          <div className="pc-section-label">Tematické skupiny</div>
          <div className="pc-groups">
            {sorted.map((g, i) => (
              <GroupCard
                key={i}
                group={g}
                maxCount={maxCount}
                onNavigate={onNavigate ? (id) => { onNavigate(id); onClose(); } : null}
              />
            ))}
          </div>

          {missing.length > 0 && (
            <>
              <div className="pc-section-label pc-missing-label">Chýbajúce oblasti</div>
              <ul className="pc-missing-list">
                {missing.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="pc-footer">
          <button onClick={onClose}>Zatvoriť</button>
        </div>

      </div>
    </div>
  );
}
