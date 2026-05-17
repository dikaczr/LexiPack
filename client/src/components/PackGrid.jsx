import { useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

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
  wordReviews = [],
}) {
  const selectedIdsRef = useRef(new Set());

  useEffect(() => {
    gridRef.current?.api?.redrawRows();
  }, [selectedRowIndex]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "",
        field: "_approved",
        width: 44,
        minWidth: 44,
        maxWidth: 44,
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellStyle: { textAlign: "center", padding: 0 },
        cellRenderer: (params) => {
          const id = params.data?.id;
          const reviews = wordReviews.filter((r) => r.word_id === id);
          const hasOk   = reviews.some((r) => r.action === "OK");
          const hasFlag = reviews.some((r) => r.action === "FLAG");
          if (hasOk)   return <span title="Schválené">✅</span>;
          if (hasFlag) return <span title="Problém">🚩</span>;
          return <span title="Neoverené" style={{ opacity: 0.3, fontSize: 13 }}>⬜</span>;
        },
      },
      {
        headerName: "Word",
        field: "word",
        editable: true,
        minWidth: 90,
        cellStyle: { textAlign: "left" },
      },
      {
        headerName: "Translation",
        field: "translation",
        editable: true,
        minWidth: 90,
        cellStyle: { textAlign: "left" },
      },
      {
        headerName: "Article",
        field: "article",
        editable: true,
        width: 90,
      },
      {
        headerName: "Phonetic",
        field: "phonetic",
        editable: true,
        minWidth: 102,
        cellStyle: { textAlign: "left" },
      },
      {
        headerName: "Type",
        field: "type",
        editable: true,
        width: 90,
      },
      {
        headerName: "Definition",
        field: "definition",
        editable: true,
        minWidth: 240,
        flex: 1,
        cellStyle: { textAlign: "left" },
      },
      {
        headerName: "Level",
        field: "level",
        editable: true,
        width: 90,
      },
      {
        headerName: "Example EN",
        field: "example_en",
        editable: true,
        minWidth: 240,
      },
      {
        headerName: "Example SK",
        field: "example_sk",
        editable: true,
        minWidth: 240,
      },
      {
        headerName: "Topic",
        field: "topic",
        editable: true,
        width: 120,
      },
    ],
    [wordReviews],
  );

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
        rowSelection={{
          mode: "multiRow",
          checkboxes: true,
          enableClickSelection: false,
        }}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowHeight={26}
        headerHeight={34}
        singleClickEdit={true}
        onCellKeyDown={(event) => {
          if (event.event.key !== "Enter") {
            return;
          }

          event.event.preventDefault();

          const editableColumns = event.api
            .getAllDisplayedColumns()
            .filter((col) => col.getColDef().editable);

          const currentColumnIndex = editableColumns.findIndex(
            (col) => col.getColId() === event.column.getColId(),
          );

          if (currentColumnIndex === -1) {
            return;
          }

          const isLastColumn =
            currentColumnIndex === editableColumns.length - 1;

          let nextRowIndex = event.node.rowIndex;
          let nextColumnIndex = currentColumnIndex + 1;

          if (isLastColumn) {
            nextRowIndex += 1;
            nextColumnIndex = 0;
          }

          if (nextRowIndex >= rowData.length) {
            return;
          }

          const nextColumnId = editableColumns[nextColumnIndex].getColId();

          event.api.setFocusedCell(nextRowIndex, nextColumnId);
          event.api.startEditingCell({
            rowIndex: nextRowIndex,
            colKey: nextColumnId,
          });
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
        onCellEditingStarted={() => {
          saveHistory();
        }}
        onCellValueChanged={(event) => {
          const { _sel, ...data } = event.data;
          setRows((prev) =>
            prev.map((row) => (row.id === data.id ? { ...data } : row)),
          );
        }}
        getRowClass={(params) => {
          const row = params.data;
          const normalizedWord = row.word?.trim().toLowerCase();
          const duplicateCount = rowData.filter(
            (r) => r.word?.trim().toLowerCase() === normalizedWord,
          ).length;
          const isDuplicate = normalizedWord && duplicateCount > 1;
          const isChecked = selectedIdsRef.current.has(row.id);
          const missingRequiredField =
            !row.word || !row.translation || !row.definition ||
            !row.type || !row.level || !row.example_en ||
            !row.example_sk || !row.topic;

          if (isDuplicate)                       return "row-duplicate";
          if (params.rowIndex === selectedRowIndex) return "row-selected";
          if (isChecked)                         return "row-checked";
          if (missingRequiredField)              return "row-invalid";
          return null;
        }}
        onFilterChanged={(event) => {
          setFilteredCount(event.api.getDisplayedRowCount());
        }}
        onSelectionChanged={(event) => {
          const selected = event.api.getSelectedRows();
          selectedIdsRef.current = new Set(selected.map((r) => r.id));
          event.api.redrawRows();
          setSelectedRows(selected.map(({ _sel, ...r }) => r));
        }}
      />
    </div>
  );
}

export default PackGrid;
