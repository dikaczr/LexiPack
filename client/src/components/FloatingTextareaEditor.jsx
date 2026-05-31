import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import "./FloatingTextareaEditor.css";

const FLOAT_H = 120;
const FLOAT_W = 360;

// Track last mousedown position — fires before ag-grid creates the editor
let _mx = 0, _my = 0;
window.addEventListener("mousedown", e => { _mx = e.clientX; _my = e.clientY; }, { capture: true, passive: true });

const FloatingTextareaEditor = forwardRef((params, ref) => {
  const startValue = params.eventKey?.length === 1
    ? params.eventKey
    : (params.value ?? "");

  const [value, setValue] = useState(startValue);
  const textareaRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origLeft: 0, origTop: 0 });

  // Y from cursor, X from cell left edge
  const cellLeft = params.eGridCell?.getBoundingClientRect().left ?? _mx;
  const spaceBelow = window.innerHeight - _my;
  const above = spaceBelow < FLOAT_H + 14 && _my >= FLOAT_H + 14;
  const initTop  = Math.max(4, Math.min(above ? _my - FLOAT_H - 14 : _my + 14, window.innerHeight - FLOAT_H - 4));
  const initLeft = Math.max(4, Math.min(cellLeft, window.innerWidth - FLOAT_W - 4));

  const [pos, setPos] = useState({ top: initTop, left: initLeft, width: FLOAT_W });

  useImperativeHandle(ref, () => ({
    getValue: () => value,
    isCancelBeforeStart: () => false,
  }));

  // Focus textarea on mount
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, []);

  // Global drag handlers
  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos(prev => ({
        ...prev,
        top:  Math.max(0, Math.min(dragRef.current.origTop  + dy, window.innerHeight - FLOAT_H)),
        left: Math.max(0, Math.min(dragRef.current.origLeft + dx, window.innerWidth  - prev.width)),
      }));
    }
    function onUp() { dragRef.current.active = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function onDragStart(e) {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origLeft: pos.left, origTop: pos.top };
    e.preventDefault();
  }

  function handleKeyDown(e) {
    e.stopPropagation();
    if (e.key === "Escape") params.stopEditing(true);
    else if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); params.stopEditing(); }
    else if (e.key === "Tab") { e.preventDefault(); params.stopEditing(); }
  }

  const popup = (
    <div className="fte-popup" style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}>
      <div className="fte-handle" onMouseDown={onDragStart}>
        <span className="fte-grip">⠿</span>
        <span className="fte-col-name">{params.colDef?.headerName}</span>
        <span className="fte-hint">Enter — uložiť · Shift+Enter — nový riadok · Esc — zrušiť</span>
      </div>
      <textarea
        ref={textareaRef}
        className="fte-textarea"
        value={value}
        rows={3}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );

  return (
    <div className="fte-anchor">
      <span className="fte-cell-preview">{params.value}</span>
      {ReactDOM.createPortal(popup, document.body)}
    </div>
  );
});

FloatingTextareaEditor.displayName = "FloatingTextareaEditor";
export default FloatingTextareaEditor;
