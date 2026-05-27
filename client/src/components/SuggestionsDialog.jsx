import { useT } from "../i18n";

function SuggestionsDialog({ open, suggestions, setSuggestions, onCancel, onAdd }) {
  const t = useT();

  if (!open) return null;

  function toggleWord(index) {
    const updated = [...suggestions];
    updated[index].selected = !updated[index].selected;
    setSuggestions(updated);
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-title">{t("editor.suggestions.title")}</div>

        <div className="suggestions-list">
          {suggestions.map((item, index) => (
            <label key={index} className="suggestion-item">
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleWord(index)}
              />
              {item.word}
            </label>
          ))}
        </div>

        <div className="dialog-actions">
          <button onClick={onCancel}>{t("common.cancel")}</button>
          <button onClick={onAdd}>{t("editor.suggestions.addSelected")}</button>
        </div>
      </div>
    </div>
  );
}

export default SuggestionsDialog;
