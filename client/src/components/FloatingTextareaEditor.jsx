import { forwardRef, useImperativeHandle, useRef } from "react";
import ReactDOM from "react-dom";
import "./FloatingTextareaEditor.css";

const POPUP_W = 400;
const POPUP_H = 140;

const FloatingTextareaEditor = forwardRef(({ value, eventKey, stopEditing, onValueChange, colDef, eGridCell }, ref) => {
  const startValue = eventKey?.length === 1 ? eventKey : (value ?? "");
  const currentValueRef = useRef(startValue);

  // Position fixed relative to the cell, flip up if near bottom
  const rect = eGridCell?.getBoundingClientRect();
  let top = rect ? rect.bottom + 2 : 200;
  let left = rect ? rect.left : 200;
  if (rect && top + POPUP_H > window.innerHeight - 8) top = rect.top - POPUP_H - 2;
  const maxLeft = window.innerWidth - POPUP_W - 8;
  if (left > maxLeft) left = maxLeft;
  if (left < 8) left = 8;

  useImperativeHandle(ref, () => ({
    getValue: () => currentValueRef.current,
    isCancelBeforeStart: () => false,
  }));

  return ReactDOM.createPortal(
    <div className="fte-popup" style={{ position: "fixed", top, left, width: POPUP_W, zIndex: 9999 }}>
      <div className="fte-handle">
        <span className="fte-col-name">{colDef?.headerName}</span>
        <span className="fte-hint">Enter — uložiť · Shift+Enter — nový riadok · Esc — zrušiť</span>
      </div>
      <textarea
        className="fte-textarea"
        defaultValue={startValue}
        rows={4}
        autoFocus
        onChange={(e) => {
          currentValueRef.current = e.target.value;
          onValueChange?.(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.stopPropagation(); stopEditing(true); }
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); stopEditing(); }
          if (e.key === "Tab") { e.preventDefault(); e.stopPropagation(); stopEditing(); }
        }}
      />
    </div>,
    document.body
  );
});

FloatingTextareaEditor.displayName = "FloatingTextareaEditor";
export default FloatingTextareaEditor;
