function fmt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("sk-SK", { day: "2-digit", month: "2-digit" })
    + " " + d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
}

export default function BookmarkSidebar({ open, bookmarks, orderedIds, rows, onNavigate, onEdit, onClose }) {
  if (!open) return null;

  const wordMap = Object.fromEntries((rows || []).map((r) => [String(r.id), r]));

  return (
    <aside className="bm-sidebar">
      <div className="bm-sidebar-header">
        <span>Bookmarky ({orderedIds.length})</span>
        <button className="bm-sidebar-close" onClick={onClose}>✕</button>
      </div>

      {orderedIds.length === 0 ? (
        <div className="bm-sidebar-empty">
          Žiadne bookmarky.<br />
          Klikni na ☆ v gride alebo stlač Ctrl+B.
        </div>
      ) : (
        <ul className="bm-sidebar-list">
          {orderedIds.map((id) => {
            const bm   = bookmarks[id];
            const row  = wordMap[id];
            const word = row ? [row.article, row.word].filter(Boolean).join(" ") : `#${id}`;
            return (
              <li key={id} className="bm-sidebar-item" onClick={() => onNavigate(id)}>
                <div className="bm-sidebar-item-top">
                  <span className="bm-sidebar-word">{word}</span>
                  <button
                    className="bm-sidebar-edit"
                    title="Upraviť poznámku"
                    onClick={(e) => { e.stopPropagation(); onEdit(id); }}
                  >✎</button>
                </div>
                {bm.note && <div className="bm-sidebar-note">{bm.note}</div>}
                <div className="bm-sidebar-date">{fmt(bm.createdAt)}</div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
