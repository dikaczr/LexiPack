import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";

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
}) {
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Word",
        field: "word",
        editable: true,
        minWidth: 110,
      },
      {
        headerName: "Translation",
        field: "translation",
        editable: true,
        minWidth: 110,
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
        minWidth: 100,
      },
      {
        headerName: "Type",
        field: "type",
        editable: true,
        width: 100,
      },
      {
        headerName: "Definition",
        field: "definition",
        editable: true,
        minWidth: 260,
        flex: 1,
      },
      {
        headerName: "Level",
        field: "level",
        editable: true,
        width: 100,
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
        width: 140,
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    [],
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <AgGridReact
        theme={themeQuartz.withPart(colorSchemeDark)}
        rowData={rowData}
        ref={gridRef}
        onGridReady={(params) => {
          setGridApi(params.api);
        }}
        rowSelection={{
          mode: "multiRow",
          checkboxes: true,
          enableClickSelection: true,
        }}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowHeight={36}
        headerHeight={40}
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
        onRowClicked={(event) => {
          setSelectedRowIndex(event.rowIndex);
        }}
        onCellEditingStarted={() => {
          saveHistory();
        }}
        getRowStyle={(params) => {
          const row = params.data;
          const normalizedWord = row.word?.trim().toLowerCase();
          const duplicateCount = rowData.filter(
            (r) => r.word?.trim().toLowerCase() === normalizedWord,
          ).length;

          const isDuplicate = normalizedWord && duplicateCount > 1;
          const missingRequiredField =
            !row.word ||
            !row.translation ||
            !row.definition ||
            !row.type ||
            !row.level ||
            !row.example_en ||
            !row.example_sk ||
            !row.topic;

          if (isDuplicate) {
            return {
              background: "#78350f",
              color: "#fde68a",
            };
          }
          if (params.rowIndex === selectedRowIndex) {
            return {
              background: "#1d4ed8",
              color: "white",
            };
          }

          if (missingRequiredField) {
            return {
              background: "#3f1d1d",
              color: "#fecaca",
            };
          }

          return null;
        }}
        onSelectionChanged={(event) => {
          const selected = event.api.getSelectedRows();

          setSelectedRows(selected);
        }}
      />
    </div>
  );
}

export default PackGrid;
