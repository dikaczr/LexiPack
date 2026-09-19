import { useT } from "../i18n";

function FillColumnConfirmDialog({ confirm, showPairNote, onFillEmpty, onOverwrite, onCancel }) {
  const t = useT();
  if (!confirm) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-title">{t("fillConfirm.title")}</div>

        <div className="dialog-section">
          <div>{t("fillConfirm.message")(confirm.filled, confirm.total, confirm.label)}</div>
          {showPairNote && <div className="dialog-desc">{t("fillConfirm.pairNote")}</div>}
          <div className="dialog-desc">{t("fillConfirm.undoHint")}</div>
        </div>

        <div className="dialog-actions">
          <button onClick={onCancel}>{t("fillConfirm.cancel")}</button>
          {confirm.filled < confirm.total && (
            <button onClick={onFillEmpty}>{t("fillConfirm.fillEmpty")}</button>
          )}
          <button onClick={onOverwrite}>{t("fillConfirm.overwrite")}</button>
        </div>
      </div>
    </div>
  );
}

export default FillColumnConfirmDialog;
