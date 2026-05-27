import "./DuplicateMeaningDialog.css";

export default function DuplicateMeaningDialog({ groups, onClose, onNavigate }) {
  if (!groups) return null;

  const totalWords = groups.reduce((acc, g) => acc + g.words.length, 0);

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-dialog" onClick={(e) => e.stopPropagation()}>

        <div className="dm-header">
          <span className="dm-title">Detektor duplicitných významov</span>
          <button className="dm-close" onClick={onClose}>✕</button>
        </div>

        <div className="dm-meta">
          <span>Nájdených skupín: <strong>{groups.length}</strong></span>
          {totalWords > 0 && (
            <span className="dm-warn">Dotknutých slov: <strong>{totalWords}</strong></span>
          )}
        </div>

        <div className="dm-body">
          {groups.length === 0 ? (
            <div className="dm-ok-msg">Žiadne sémantické duplikáty nenájdené ✓</div>
          ) : (
            groups.map((group, gi) => (
              <div key={gi} className="dm-group">
                <div className="dm-group-note">
                  <span className="dm-group-index">Skupina {gi + 1}</span>
                  <span className="dm-note-text">{group.note}</span>
                </div>
                <table className="dm-table">
                  <thead>
                    <tr>
                      <th>Slovo</th>
                      <th>Preklad</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.words.map((w) => (
                      <tr key={w.id}>
                        <td className="dm-word">{w.word}</td>
                        <td className="dm-translation">{w.translation}</td>
                        <td>
                          <button
                            className="dm-goto"
                            title="Prejsť na slovo v gride"
                            onClick={() => { onNavigate(w.id); onClose(); }}
                          >
                            Prejsť
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>

        <div className="dm-footer">
          <button onClick={onClose}>Zatvoriť</button>
        </div>

      </div>
    </div>
  );
}
