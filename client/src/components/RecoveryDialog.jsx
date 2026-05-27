import "./RecoveryDialog.css";
import { useT } from "../i18n";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sk-SK", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RecoveryDialog({ draft, onRestore, onDiscard }) {
  const t = useT();
  if (!draft) return null;

  const r = t("editor.recovery");
  const sourceLabel = draft.source === "server" ? r.sourceServer : r.sourceLocal;

  return (
    <div className="rec-overlay">
      <div className="rec-dialog">
        <div className="rec-icon">⚠</div>
        <h2 className="rec-title">{r.title}</h2>
        <p className="rec-info">
          {r.source}: <strong>{sourceLabel}</strong><br />
          {r.savedAt}: <strong>{formatDate(draft.savedAt)}</strong><br />
          {r.wordCount}: <strong>{draft.rows?.length ?? 0}</strong>
        </p>
        <p className="rec-question">{r.question}</p>
        <div className="rec-actions">
          <button className="rec-btn rec-btn-restore" onClick={onRestore}>
            {r.restore}
          </button>
          <button className="rec-btn rec-btn-discard" onClick={onDiscard}>
            {r.discard}
          </button>
        </div>
      </div>
    </div>
  );
}
