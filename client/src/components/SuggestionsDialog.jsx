function SuggestionsDialog({

  open,

  suggestions,

  setSuggestions,

  onCancel,

  onAdd

}) {

  if (!open) {
    return null;
  }

  function toggleWord(index) {

    const updated = [...suggestions];

    updated[index].selected =
      !updated[index].selected;

    setSuggestions(updated);
  }

  return (

    <div className="dialog-overlay">

      <div className="dialog">

        <h2>
          Suggested Words
        </h2>

        <div className="suggestions-list">

          {suggestions.map(
            (item, index) => (

            <label
              key={index}
              className="suggestion-item"
            >

              <input
                type="checkbox"
                checked={item.selected}
                onChange={() =>
                  toggleWord(index)
                }
              />

              {item.word}

            </label>
          ))}

        </div>

        <div className="dialog-actions">

          <button onClick={onCancel}>
            Cancel
          </button>

          <button onClick={onAdd}>
            Add Selected
          </button>

        </div>

      </div>

    </div>
  );
}

export default SuggestionsDialog;