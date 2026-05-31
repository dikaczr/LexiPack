import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import "./FloatingTextareaEditor.css";

const FloatingTextareaEditor = forwardRef((params, ref) => {
  const startValue = params.eventKey?.length === 1
    ? params.eventKey
    : (params.value ?? "");

  const [value, setValue] = useState(startValue);
  const valueRef = useRef(startValue);
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getValue: () => valueRef.current,
  }));

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, []);

  function handleChange(e) {
    valueRef.current = e.target.value;
    setValue(e.target.value);
  }

  function commit() {
    const colId = params.column?.getColId?.();
    if (colId) params.node?.setDataValue(colId, valueRef.current);
    params.stopEditing();
  }

  function handleKeyDown(e) {
    e.stopPropagation();
    if (e.key === "Escape") { params.stopEditing(true); }
    else if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); }
    else if (e.key === "Tab") { e.preventDefault(); commit(); }
  }

  return (
    <div className="fte-popup" style={{ width: 380 }}>
      <div className="fte-handle" style={{ cursor: "default" }}>
        <span className="fte-col-name">{params.colDef?.headerName}</span>
        <span className="fte-hint">Enter — uložiť · Shift+Enter — nový riadok · Esc — zrušiť</span>
      </div>
      <textarea
        ref={textareaRef}
        className="fte-textarea"
        value={value}
        rows={5}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});

FloatingTextareaEditor.displayName = "FloatingTextareaEditor";
export default FloatingTextareaEditor;
