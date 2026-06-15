import { useMemo, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useT } from "../i18n";
import { useRem } from "../hooks/useRem";
import { AgGridReact } from "ag-grid-react";
import FloatingTextareaEditor from "./FloatingTextareaEditor";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./PackGrid.css";

ModuleRegistry.registerModules([AllCommunityModule]);


const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LANGS_WITH_ARTICLES = new Set(["de", "fr", "es", "it"]);
const LANGS_REQUIRE_ARTICLE = new Set(["de", "fr", "es", "it"]);

const WORD_TYPES = ["", "noun", "verb", "adjective", "adverb", "phrase", "idiom", "pronoun", "preposition", "conjunction", "interjection", "numeral"];

const ARTICLES = {
  de: ["", "der", "die", "das", "ein", "eine", "—"],
  fr: ["", "le", "la", "les", "l'", "un", "une", "des", "—"],
  es: ["", "el", "la", "los", "las", "un", "una", "unos", "unas", "—"],
  it: ["", "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "—"],
};

const SelectAllHeader = ({ api }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
    <input
      type="checkbox"
      className="grid-checkbox"
      style={{ margin: 0, cursor: "pointer" }}
      onChange={(e) => e.target.checked ? api.selectAll() : api.deselectAll()}
    />
  </div>
);

const LevelCellEditor = forwardRef(({ value, onValueChange, stopEditing }, ref) => {
  const currentValue = useRef(value);

  useImperativeHandle(ref, () => ({
    getValue: () => currentValue.current,
  }));

  const handleChange = (e) => {
    const newVal = e.target.value;
    currentValue.current = newVal;
    if (onValueChange) onValueChange(newVal);
    stopEditing();
  };

  return (
    <select
      autoFocus
      defaultValue={value}
      onChange={handleChange}
      onBlur={() => stopEditing()}
      style={{
        width: "100%",
        height: "100%",
        background: "var(--app-card-bg, #1e293b)",
        color: "var(--app-text, #f1f5f9)",
        border: "none",
        outline: "none",
        fontSize: 13,
        padding: "0 4px",
        cursor: "pointer",
      }}
    >
      {CEFR_LEVELS.map((l) => (
        <option key={l} value={l}>{l}</option>
      ))}
    </select>
  );
});

const ArticleCellEditor = forwardRef(({ value, onValueChange, stopEditing, colDef }, ref) => {
  const lang = colDef?.cellEditorParams?.lang ?? "de";
  const options = ARTICLES[lang] ?? ARTICLES.de;
  const currentValue = useRef(value ?? "");

  useImperativeHandle(ref, () => ({
    getValue: () => currentValue.current,
  }));

  const handleChange = (e) => {
    const newVal = e.target.value === "—" ? "" : e.target.value;
    currentValue.current = newVal;
    if (onValueChange) onValueChange(newVal);
    stopEditing();
  };

  return (
    <select
      autoFocus
      defaultValue={value || ""}
      onChange={handleChange}
      onBlur={() => stopEditing()}
      style={{
        width: "100%",
        height: "100%",
        background: "var(--app-card-bg, #1e293b)",
        color: "var(--app-text, #f1f5f9)",
        border: "none",
        outline: "none",
        fontSize: 13,
        padding: "0 4px",
        cursor: "pointer",
      }}
    >
      {options.map((a) => (
        <option key={a} value={a === "—" ? "" : a}>{a || "–"}</option>
      ))}
    </select>
  );
});

const TypeCellEditor = forwardRef(({ value, onValueChange, stopEditing }, ref) => {
  const currentValue = useRef(value ?? "");

  useImperativeHandle(ref, () => ({
    getValue: () => currentValue.current,
  }));

  const handleChange = (e) => {
    currentValue.current = e.target.value;
    if (onValueChange) onValueChange(e.target.value);
    stopEditing();
  };

  return (
    <select
      autoFocus
      defaultValue={value || ""}
      onChange={handleChange}
      onBlur={() => stopEditing()}
      style={{
        width: "100%",
        height: "100%",
        background: "var(--app-card-bg, #1e293b)",
        color: "var(--app-text, #f1f5f9)",
        border: "none",
        outline: "none",
        fontSize: 13,
        padding: "0 4px",
        cursor: "pointer",
      }}
    >
      {WORD_TYPES.map((t) => (
        <option key={t} value={t}>{t || "–"}</option>
      ))}
    </select>
  );
});

function PackGrid({
  rowData,
  setRows,
  selectedRowIndex,
  setSelectedRowIndex,
  setSelectedRows,
  gridRef,
  setGridApi,
  saveHistory,
  setFilteredCount,
  onCellContextMenu,
  onCellEditingStopped,
  wordReviews = [],
  bookmarks = {},
  isReadOnly = false,
  targetLang = "en",
  nativeLang = "sk",
}) {
  const t   = useT();
  const rem = useRem();
  const selectedIdsRef     = useRef(new Set());
  const prevSelectedIdsRef = useRef(new Set());
  const prevRowIndexRef    = useRef(null);
  const selectedRowIndexRef = useRef(selectedRowIndex);
  const wordReviewsRef = useRef(wordReviews);
  const bookmarksRef   = useRef(bookmarks);

  useEffect(() => {
    wordReviewsRef.current = wordReviews;
    const api = gridRef.current?.api;
    if (!api) return;
    api.refreshCells({ columns: ["_approved", "_comment_star"], force: true });
  }, [wordReviews]);
  useEffect(() => { bookmarksRef.current = bookmarks; gridRef.current?.api?.refreshCells({ columns: ["_bm_flag"], force: true }); }, [bookmarks]);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const nodes = [];
    if (prevRowIndexRef.current !== null) {
      const n = api.getDisplayedRowAtIndex(prevRowIndexRef.current);
      if (n) nodes.push(n);
    }
    if (selectedRowIndex !== null) {
      const n = api.getDisplayedRowAtIndex(selectedRowIndex);
      if (n) nodes.push(n);
    }
    selectedRowIndexRef.current = selectedRowIndex;
    prevRowIndexRef.current = selectedRowIndex;
    if (nodes.length) api.redrawRows({ rowNodes: nodes });
  }, [selectedRowIndex]);

  const r = (px) => Math.round(px / 10 * rem);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "",
        field: "_checkbox",
        width: r(34),
        minWidth: r(34),
        maxWidth: r(34),
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellStyle: { padding: 0 },
        headerComponent: SelectAllHeader,
        cellRenderer: (params) => (
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopImmediatePropagation();
              selectedRowIndexRef.current = params.node.rowIndex;
              setSelectedRowIndex(params.node.rowIndex);
              params.node.setSelected(!params.node.isSelected());
            }}
          >
            <input
              type="checkbox"
              checked={params.node.isSelected() || false}
              readOnly
              className="grid-checkbox"
              style={{ margin: 0, pointerEvents: "none" }}
            />
          </div>
        ),
      },
      {
        headerName: "",
        field: "_bm_flag",
        width: r(20),
        minWidth: r(20),
        maxWidth: r(20),
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellStyle: { padding: 0, textAlign: "center" },
        cellRenderer: (params) => {
          const isBookmarked = !!bookmarksRef.current[String(params.data?.id)];
          return isBookmarked
            ? <span title="Bookmark" style={{ color: "#22c55e", fontSize: "1.4rem", lineHeight: `${r(26)}px` }}>⚑</span>
            : null;
        },
      },
      {
        headerName: "",
        field: "_approved",
        width: r(34),
        minWidth: r(34),
        maxWidth: r(34),
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellStyle: { textAlign: "center", padding: 0 },
        cellRenderer: (params) => {
          const id = params.data?.id;
          const reviews = wordReviewsRef.current.filter((r) => r.word_id === id);
          const latest  = reviews.reduce((a, b) => !a || new Date(b.created_at) > new Date(a.created_at) ? b : a, null);
          if (latest?.action === "OK")   return <span title="Schválené">✅</span>;
          if (latest?.action === "FLAG") return <span title="Problém">🚩</span>;
          return <span title="Neoverené" style={{ opacity: 0.3, fontSize: "1.3rem" }}>⬜</span>;
        },
      },
      {
        headerName: "",
        field: "_comment_star",
        width: r(20),
        minWidth: r(20),
        maxWidth: r(20),
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellStyle: { padding: 0, textAlign: "center" },
        cellRenderer: (params) => {
          const hasComment = wordReviewsRef.current.some(
            (r) => r.word_id === params.data?.id && r.action === "COMMENT"
          );
          return hasComment ? <span title="Poznámka" style={{ color: "#60a5fa", fontSize: "1.2rem" }}>★</span> : null;
        },
      },
      ...(LANGS_WITH_ARTICLES.has(targetLang) ? [{
        headerName: t("cols.article"),
        field: "article",
        editable: !isReadOnly,
        width: r(70),
        filter: false,
        sortable: false,
        cellEditor: ArticleCellEditor,
        cellEditorParams: { lang: targetLang },
      }] : []),
      {
        headerName: t("cols.word"),
        field: "word",
        editable: !isReadOnly,
        minWidth: r(90),
        cellStyle: { textAlign: "left" },
      },
      {
        headerName: t("cols.translation"),
        field: "translation",
        editable: !isReadOnly,
        minWidth: r(90),
        cellStyle: { textAlign: "left" },
      },
      {
        headerName: t("cols.phonetic"),
        field: "phonetic",
        editable: !isReadOnly,
        minWidth: r(102),
        cellStyle: { textAlign: "left" },
      },
      {
        headerName: t("cols.type"),
        field: "type",
        editable: !isReadOnly,
        width: r(100),
        cellEditor: TypeCellEditor,
      },
      {
        headerName: t("cols.definition"),
        field: "definition",
        editable: !isReadOnly,
        minWidth: r(240),
        flex: 1,
        cellStyle: { textAlign: "left" },
        cellEditor: "agLargeTextCellEditor",
        cellEditorPopup: true,
        cellEditorPopupPosition: "over",
        cellEditorParams: { maxLength: 5000, rows: 5, cols: 60 },
      },
      {
        headerName: t("cols.level"),
        field: "level",
        editable: !isReadOnly,
        width: r(90),
        cellEditor: LevelCellEditor,
      },
      {
        headerName: (() => { const f = t("cols.exampleLang"); return typeof f === "function" ? f(targetLang) : `Príklad ${targetLang.toUpperCase()}`; })(),
        field: `example_${targetLang}`,
        editable: !isReadOnly,
        minWidth: r(240),
        cellEditor: "agLargeTextCellEditor",
        cellEditorPopup: true,
        cellEditorPopupPosition: "over",
        cellEditorParams: { maxLength: 5000, rows: 5, cols: 60 },
      },
      {
        headerName: (() => { const f = t("cols.exampleLang"); return typeof f === "function" ? f(nativeLang) : `Príklad ${nativeLang.toUpperCase()}`; })(),
        field: `example_${nativeLang}`,
        editable: !isReadOnly,
        minWidth: r(240),
        cellEditor: "agLargeTextCellEditor",
        cellEditorPopup: true,
        cellEditorPopupPosition: "over",
        cellEditorParams: { maxLength: 5000, rows: 5, cols: 60 },
      },
      {
        headerName: t("cols.topic"),
        field: "topic",
        editable: !isReadOnly,
        width: r(120),
      },
    ],
    [rem, isReadOnly, targetLang, nativeLang, t],
  );

  const duplicateWordsSet = useMemo(() => {
    const counts = {};
    for (const r of rowData) {
      const w = r.word?.trim().toLowerCase();
      if (w) counts[w] = (counts[w] || 0) + 1;
    }
    return new Set(Object.keys(counts).filter((w) => counts[w] > 1));
  }, [rowData]);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      cellStyle: { textAlign: "center" },
    }),
    [],
  );

  return (
    <div
      className="ag-theme-alpine-dark pack-grid"
      style={{ "--ag-font-size": `${r(11)}px` }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <AgGridReact
        theme="legacy"
        rowData={rowData}
        ref={gridRef}
        getRowId={(params) => params.data.id}
        onGridReady={(params) => {
          setGridApi(params.api);
        }}
        rowSelection={{ mode: "multiRow", enableClickSelection: false, checkboxes: false, headerCheckbox: false }}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowHeight={r(26)}
        headerHeight={r(34)}
        singleClickEdit={true}
        stopEditingWhenCellsLoseFocus={false}
        onCellKeyDown={(event) => {
          if (event.event.key !== "Enter") return;
          event.event.preventDefault();

          const editableColumns = event.api
            .getAllDisplayedColumns()
            .filter((col) => col.getColDef().editable);

          const currentColumnIndex = editableColumns.findIndex(
            (col) => col.getColId() === event.column.getColId(),
          );

          if (currentColumnIndex === -1) return;

          const isLastColumn = currentColumnIndex === editableColumns.length - 1;
          let nextRowIndex = event.node.rowIndex;
          let nextColumnIndex = currentColumnIndex + 1;

          if (isLastColumn) {
            nextRowIndex += 1;
            nextColumnIndex = 0;
          }

          if (nextRowIndex >= rowData.length) return;

          const nextColumnId = editableColumns[nextColumnIndex].getColId();
          event.api.setFocusedCell(nextRowIndex, nextColumnId);
          event.api.startEditingCell({ rowIndex: nextRowIndex, colKey: nextColumnId });
        }}
        onCellContextMenu={(event) => {
          event.event.preventDefault();
          onCellContextMenu?.({
            x: event.event.clientX,
            y: event.event.clientY,
            field: event.colDef.field,
            rowData: event.data,
          });
        }}
        onRowClicked={(event) => {
          setSelectedRowIndex(event.rowIndex);
        }}
        onCellFocused={(event) => {
          if (event.rowIndex === null || event.rowIndex === undefined) return;
          setSelectedRowIndex(event.rowIndex);
        }}
        onCellEditingStarted={() => {
          saveHistory();
        }}
        onCellEditingStopped={onCellEditingStopped}
        onCellValueChanged={(event) => {
          const { _sel, ...data } = event.data;
          setRows((prev) =>
            prev.map((row) => (row.id === data.id ? { ...data } : row)),
          );
        }}
        getRowClass={useCallback((params) => {
          const row = params.data;
          const normalizedWord = row.word?.trim().toLowerCase();
          const isDuplicate = normalizedWord && duplicateWordsSet.has(normalizedWord);
          const isChecked = selectedIdsRef.current.has(row.id);
          const missingRequiredField =
            !row.word || !row.translation || !row.phonetic || !row.definition ||
            !row.type || !row.level || !row[`example_${targetLang}`] ||
            !row[`example_${nativeLang}`] || !row.topic ||
            (LANGS_REQUIRE_ARTICLE.has(targetLang) && row.type?.toLowerCase() === "noun" && !row.article);

          if (isDuplicate)                                     return "row-duplicate";
          if (params.rowIndex === selectedRowIndexRef.current) return "row-selected";
          if (isChecked)                                       return "row-checked";
          if (missingRequiredField)                            return "row-invalid";
          return null;
        }, [rowData, duplicateWordsSet])}
        onFilterChanged={(event) => {
          setFilteredCount(event.api.getDisplayedRowCount());
        }}
        onSelectionChanged={(event) => {
          const selected = event.api.getSelectedRows();
          const newIds = new Set(selected.map((r) => r.id));
          const changedNodes = [];
          event.api.forEachNode((node) => {
            const was = prevSelectedIdsRef.current.has(node.data?.id);
            const now = newIds.has(node.data?.id);
            if (was !== now) changedNodes.push(node);
          });
          prevSelectedIdsRef.current = newIds;
          selectedIdsRef.current = newIds;
          if (changedNodes.length) event.api.redrawRows({ rowNodes: changedNodes });
          setSelectedRows(selected.map(({ _sel, ...r }) => r));
        }}
      />
    </div>
  );
}

export default PackGrid;
