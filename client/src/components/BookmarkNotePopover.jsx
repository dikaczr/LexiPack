import { useState, useEffect, useRef } from "react";

/**
 * Malý popover pre zadanie/úpravu poznámky bookmarku.
 * Pozicovaný fixne v strede – jednoduchý, nesleduje bunku.
 */
export default function BookmarkNotePopover({ open, rowId, existingNote = "", isBookmarked, onSave, onRemove, onClose }) {
  const [note, setNote] = useState(existingNote);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setNote(existingNote);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, existingNote]);

  if (!open) return null;

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(note); }
    if (e.key === "Escape") onClose();
  }

  return (
    <div
      className="bm-popover-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bm-popover">
        <div className="bm-popover-title">
          {isBookmarked ? "Upraviť bookmark" : "Pridať bookmark"}
        </div>

        <textarea
          ref={inputRef}
          className="bm-popover-textarea"
          placeholder="Poznámka (voliteľná)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />

        <div className="bm-popover-actions">
          {isBookmarked && (
            <button className="bm-btn-remove" onClick={onRemove}>
              Odstrániť
            </button>
          )}
          <button className="bm-btn-cancel" onClick={onClose}>Zrušiť</button>
          <button className="bm-btn-save" onClick={() => onSave(note)}>
            {isBookmarked ? "Uložiť" : "Pridať"}
          </button>
        </div>
      </div>
    </div>
  );
}
