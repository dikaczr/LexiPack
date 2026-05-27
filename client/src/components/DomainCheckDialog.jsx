import "./DomainCheckDialog.css";

function normalize(s) {
  return (s ?? "").trim().toLowerCase();
}

function isRelated(topic, category) {
  const t = normalize(topic);
  const c = normalize(category);
  if (!t || !c) return false;
  return t.includes(c) || c.includes(t);
}

export function runDomainCheck(rows, category) {
  // Count topics
  const topicMap = {};
  for (const row of rows) {
    const t = (row.topic ?? "").trim();
    topicMap[t] = (topicMap[t] ?? 0) + 1;
  }

  const totalRows = rows.length;
  const emptyCount = topicMap[""] ?? 0;
  delete topicMap[""];

  const topics = Object.entries(topicMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const dominantTopic = topics[0]?.name ?? "";
  const dominantCount = topics[0]?.count ?? 0;

  // Outlier: appears only once AND not related to category AND not dominant
  const outlierTopics = new Set(
    topics
      .filter((t) => t.count === 1 || (!isRelated(t.name, category) && t.name !== dominantTopic))
      .map((t) => t.name)
  );

  const flaggedRows = rows.filter(
    (r) => !r.topic?.trim() || outlierTopics.has((r.topic ?? "").trim())
  );

  return { topics, emptyCount, totalRows, dominantTopic, dominantCount, outlierTopics, flaggedRows };
}

export default function DomainCheckDialog({ rows, category, onClose, onNavigate }) {
  const { topics, emptyCount, totalRows, dominantTopic, dominantCount, outlierTopics, flaggedRows } =
    runDomainCheck(rows, category);

  const maxCount = topics[0]?.count ?? 1;

  return (
    <div className="dcDialog-overlay" onClick={onClose}>
      <div className="dcDialog" onClick={(e) => e.stopPropagation()}>

        <div className="dcDialog-header">
          <span className="dcDialog-title">Kontrola konzistencie domén</span>
          <button className="dcDialog-close" onClick={onClose}>✕</button>
        </div>

        <div className="dcDialog-meta">
          <span>Kategória balíka: <strong>{category || "—"}</strong></span>
          <span>Slov celkom: <strong>{totalRows}</strong></span>
          <span>Unikátnych tém: <strong>{topics.length}</strong></span>
          {emptyCount > 0 && (
            <span className="dcDialog-warn">Bez témy: <strong>{emptyCount}</strong></span>
          )}
        </div>

        <div className="dcDialog-body">
          {/* Topic frequency table */}
          <div className="dcDialog-section-title">Témy v balíku</div>
          <table className="dcDialog-table">
            <thead>
              <tr>
                <th>Téma</th>
                <th></th>
                <th className="dcDialog-num">Počet</th>
                <th className="dcDialog-num">%</th>
              </tr>
            </thead>
            <tbody>
              {topics.map(({ name, count }) => {
                const isOutlier = outlierTopics.has(name);
                return (
                  <tr key={name} className={isOutlier ? "dcDialog-row-outlier" : ""}>
                    <td className="dcDialog-topic-name">{name}</td>
                    <td className="dcDialog-bar-cell">
                      <div className="dcDialog-bar-wrap">
                        <div
                          className="dcDialog-bar-fill"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            background: isOutlier ? "var(--app-warning, #f59e0b)" : "var(--app-accent, #3b82f6)",
                          }}
                        />
                      </div>
                    </td>
                    <td className="dcDialog-num">{count}</td>
                    <td className="dcDialog-num">{Math.round((count / totalRows) * 100)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Flagged rows */}
          {flaggedRows.length > 0 && (
            <>
              <div className="dcDialog-section-title dcDialog-section-warn">
                Slová s potenciálne nekonzistentnou témou ({flaggedRows.length})
              </div>
              <table className="dcDialog-table">
                <thead>
                  <tr>
                    <th>Slovo</th>
                    <th>Téma</th>
                    <th>Problém</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedRows.map((row) => {
                    const topic = (row.topic ?? "").trim();
                    const reason = !topic
                      ? "Chýba téma"
                      : outlierTopics.has(topic) && topic !== dominantTopic
                        ? "Ojedinelá / nesúvisiaca téma"
                        : "Outlier";
                    return (
                      <tr key={row.id}>
                        <td className="dcDialog-topic-name">{row.word}</td>
                        <td>{topic || <em style={{ color: "var(--app-text-muted)" }}>prázdne</em>}</td>
                        <td className="dcDialog-reason">{reason}</td>
                        <td>
                          <button
                            className="dcDialog-goto"
                            onClick={() => { onNavigate(row.id, "topic"); onClose(); }}
                          >
                            →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {flaggedRows.length === 0 && emptyCount === 0 && (
            <div className="dcDialog-ok">Témy sú konzistentné ✓</div>
          )}
        </div>

        <div className="dcDialog-footer">
          <span className="dcDialog-hint">
            Dominantná téma: <strong>{dominantTopic || "—"}</strong> ({dominantCount} slov)
          </span>
          <button onClick={onClose}>Zatvoriť</button>
        </div>
      </div>
    </div>
  );
}
