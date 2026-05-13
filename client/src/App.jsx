import "./App.css";
import PackGrid from "./components/PackGrid";
import { importXlsxFile } from "./utils/xlsxImport";
import { exportToJson } from "./utils/jsonExport";
import PackPreview from "./components/PackPreview";
import LoadingOverlay from "./components/LoadingOverlay";
import { importJsonFile } from "./utils/jsonImport";
import ImportDialog from "./components/ImportDialog";
import PackMetadataPanel from "./components/PackMetadataPanel";
import {
  generateTranslation,
  generateTopic,
  suggestWords,
  generateColumn,
} from "./api/aiApi";
import SuggestionsDialog from "./components/SuggestionsDialog";
import React, { useState, useEffect, useCallback, useRef } from "react";

function App() {
  const [rows, setRows] = useState(() => {
    const savedRows = localStorage.getItem("lexipack_rows");

    if (savedRows) {
      return JSON.parse(savedRows);
    }

    return [
      {
        id: crypto.randomUUID(),
        word: "planet",
        article: "",
        phonetic: "/ˈplænɪt/",
        translation: "planéta",
        definition: "A large object orbiting a star.",
        type: "noun",
        level: "B1",
        example_en: "Earth is a planet.",
        example_sk: "Zem je planéta.",
        topic: "astronomy",
      },
    ];
  });

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
  });
  const gridRef = useRef(null);
  const [gridApi, setGridApi] = useState(null);
  const invalidRows = rows.filter(
    (row) =>
      !row.word ||
      !row.translation ||
      !row.definition ||
      !row.type ||
      !row.level ||
      !row.example_en ||
      !row.example_sk ||
      !row.topic,
  );
  const duplicateWords = rows.filter((row, index) => {
    const normalized = row.word?.trim().toLowerCase();
    return (
      rows.findIndex((r) => r.word?.trim().toLowerCase() === normalized) !==
      index
    );
  });
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFormat, setImportFormat] = useState("xlsx");
  const [importStrategy, setImportStrategy] = useState("replace");
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const xlsxInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const [packMetadata, setPackMetadata] = useState({
    packId: crypto.randomUUID(),
    name: "",
    description: "",
    targetLang: "en",
    nativeLang: "sk",
    level: "B1",
    category: "",
    icon: "📘",
    author: "",
    version: "1.0",
    tags: "",
  });

  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [suggestedWords, setSuggestedWords] = useState([]);
  const [showFillMenu, setShowFillMenu] = useState(false);
  const fillableColumns = [
    {
      field: "translation",
      label: "Translation",
    },

    {
      field: "definition",
      label: "Definition",
    },

    {
      field: "example_en",
      label: "Example EN",
    },

    {
      field: "example_sk",
      label: "Example SK",
    },

    {
      field: "phonetic",
      label: "Phonetic",
    },

    {
      field: "type",
      label: "Type",
    },

    {
      field: "level",
      label: "Level",
    },
  ];

  const availableColumns = fillableColumns.filter((column) =>
    selectedRows.some((row) => !row[column.field]),
  );

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  /*    */

  function saveHistory() {
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(rows))]);

    setFuture([]);
  }

  function handleUndo() {
    if (history.length === 0) {
      return;
    }

    const previous = history[history.length - 1];

    setFuture((prev) => [JSON.parse(JSON.stringify(rows)), ...prev]);

    setRows(previous);

    setHistory((prev) => prev.slice(0, -1));
  }

  function handleRedo() {
    if (future.length === 0) {
      return;
    }

    const next = future[0];

    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(rows))]);
    setRows(next);
    setFuture((prev) => prev.slice(1));
  }

  function focusFirstInvalidRow() {
    if (invalidRows.length === 0) {
      return;
    }

    const firstInvalid = invalidRows[0];
    const rowIndex = rows.findIndex((row) => row.id === firstInvalid.id);

    if (rowIndex === -1) {
      return;
    }

    gridApi?.ensureIndexVisible(rowIndex, "middle");
    setSelectedRowIndex(rowIndex);
  }

  function focusFirstDuplicateRow() {
    if (duplicateWords.length === 0) {
      return;
    }

    const firstDuplicate = duplicateWords[0];
    const rowIndex = rows.findIndex((row) => row.id === firstDuplicate.id);

    if (rowIndex === -1) {
      return;
    }

    gridRef.current.api.ensureIndexVisible(rowIndex, "middle");
    setSelectedRowIndex(rowIndex);
  }

  function mergeRows(existingRow, importedRow) {
    const merged = {
      ...existingRow,
    };

    Object.keys(importedRow).forEach((key) => {
      const existingValue = existingRow[key];
      const importedValue = importedRow[key];
      const isEmpty =
        existingValue === "" ||
        existingValue === null ||
        existingValue === undefined;

      if (isEmpty && importedValue) {
        merged[key] = importedValue;
      }
    });

    return merged;
  }

  function processImportedRows(importedRows) {
    if (importStrategy === "replace") {
      return importedRows;
    }

    if (importStrategy === "append") {
      return [...rows, ...importedRows];
    }

    const updatedRows = [...rows];

    importedRows.forEach((importedRow) => {
      const existingIndex = updatedRows.findIndex(
        (row) =>
          row.word?.trim().toLowerCase() ===
          importedRow.word?.trim().toLowerCase(),
      );

      const exists = existingIndex !== -1;

      if (importStrategy === "skip" && exists) {
        return;
      }

      if (importStrategy === "merge" && exists) {
        updatedRows[existingIndex] = mergeRows(
          updatedRows[existingIndex],
          importedRow,
        );

        return;
      }
      updatedRows.push(importedRow);
    });

    return updatedRows;
  }

  async function handleGenerateColumn(field) {
    if (selectedRows.length === 0) {
      return;
    }

    try {
      setIsGenerating(true);
      const updatedRows = [...rows];
      for (const selectedRow of selectedRows) {
        if (selectedRow[field]) {
          continue;
        }

        const value = await generateColumn(selectedRow, field);
        const rowIndex = updatedRows.findIndex((r) => r.id === selectedRow.id);

        if (rowIndex !== -1) {
          updatedRows[rowIndex] = {
            ...updatedRows[rowIndex],
            [field]: value,
          };
          saveHistory();
          setRows([...updatedRows]);
        }
      }
    } catch (err) {
      console.error(err);

      alert("Column generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const extension = file.name.split(".").pop().toLowerCase();

      if (extension === "json") {
        setImportFormat("json");
      } else {
        setImportFormat("xlsx");
      }
      setPendingImportFile(file);
      setShowImportDialog(true);
      event.target.value = "";
    } catch (err) {
      console.error(err);
      alert("Import preparation failed.");
    }
  }

  const selectedRow = selectedRowIndex !== null ? rows[selectedRowIndex] : null;

  function handleAddRow() {
    const newRow = {
      id: crypto.randomUUID(),
      word: "",
      article: "",
      phonetic: "",
      translation: "",
      definition: "",
      type: "",
      level: "",
      example_en: "",
      example_sk: "",
      topic: "",
    };

    saveHistory();
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    const newIndex = updatedRows.length - 1;
    setSelectedRowIndex(newIndex);
    setTimeout(() => {
      gridRef.current?.api.ensureIndexVisible(newIndex, "middle");
      requestAnimationFrame(() => {
        gridRef.current?.api.startEditingCell({
          rowIndex: newIndex,
          colKey: "word",
        });

        setTimeout(() => {
          const input = document.querySelector(".ag-cell-inline-editing input");
          input?.select();
        }, 20);
      });
    }, 150);
  }

  const handleDeleteSelected = useCallback(() => {
    if (!selectedRows.length) {
      return;
    }

    saveHistory();

    setRows((prev) =>
      prev.filter((row) => !selectedRows.some((sel) => sel.id === row.id)),
    );
  }, [selectedRows, rows]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedRows || selectedRows.length === 0) {
      return;
    }

    saveHistory();

    const duplicatedRows = selectedRows.map((row) => ({
      ...row,
      id: crypto.randomUUID(),
    }));

    setRows((prev) => [...prev, ...duplicatedRows]);
  }, [selectedRows, rows]);

  function handleDuplicateAndEdit() {
    if (!selectedRows.length) {
      return;
    }
    saveHistory();

    const duplicatedRows = selectedRows.map((row) => ({
      ...row,
      id: crypto.randomUUID(),
    }));

    const updatedRows = [...rows, ...duplicatedRows];
    setRows(updatedRows);
    const newIndex = updatedRows.length - 1;
    setSelectedRowIndex(newIndex);
    setTimeout(() => {
      gridRef.current?.api.ensureIndexVisible(newIndex, "middle");
      requestAnimationFrame(() => {
        gridRef.current?.api.startEditingCell({
          rowIndex: newIndex,
          colKey: "word",
        });
      });
    }, 150);
  }

  const handleGenerateSelected = async () => {
    const row = rows[selectedRowIndex];

    if (!row.word) {
      return;
    }

    try {
      setIsGenerating(true);

      const aiData = await generateTranslation(row);

      const updatedRows = [...rows];

      updatedRows[selectedRowIndex] = {
        ...row,
        ...aiData,
      };
      saveHistory();
      setRows(updatedRows);
    } catch (err) {
      console.error(err.response?.data || err);
      alert("AI generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  function handleClearSelectedRows() {
    if (selectedRows.length === 0) {
      return;
    }

    saveHistory();

    const updatedRows = rows.map((row) => {
      const isSelected = selectedRows.some((sel) => sel.id === row.id);

      if (!isSelected) {
        return row;
      }

      return {
        ...row,

        translation: "",
        definition: "",
        phonetic: "",
        type: "",
        level: "",
        example_en: "",
        example_sk: "",
      };
    });

    setRows(updatedRows);
  }

  function moveSelectedRowUp() {
    if (selectedRowIndex === null) {
      return;
    }

    if (selectedRowIndex === 0) {
      return;
    }

    saveHistory();
    const updatedRows = [...rows];

    [updatedRows[selectedRowIndex - 1], updatedRows[selectedRowIndex]] = [
      updatedRows[selectedRowIndex],
      updatedRows[selectedRowIndex - 1],
    ];

    setRows(updatedRows);
    setSelectedRowIndex(selectedRowIndex - 1);
    setTimeout(() => {
      gridRef.current?.api.ensureIndexVisible(selectedRowIndex - 1, "middle");
    }, 50);
  }

  function moveSelectedRowDown() {
    if (selectedRowIndex === null) {
      return;
    }

    if (selectedRowIndex >= rows.length - 1) {
      return;
    }

    saveHistory();
    const updatedRows = [...rows];
    [updatedRows[selectedRowIndex + 1], updatedRows[selectedRowIndex]] = [
      updatedRows[selectedRowIndex],
      updatedRows[selectedRowIndex + 1],
    ];

    setRows(updatedRows);
    setSelectedRowIndex(selectedRowIndex + 1);
    setTimeout(() => {
      gridRef.current?.api.ensureIndexVisible(selectedRowIndex + 1, "middle");
    }, 50);
  }

  async function handleGenerateTopic() {
    if (selectedRowIndex === null) {
      return;
    }

    const row = rows[selectedRowIndex];

    if (!row.word) {
      return;
    }

    try {
      setIsGenerating(true);

      const topic = await generateTopic(row.word);

      const updatedRows = [...rows];

      updatedRows[selectedRowIndex] = {
        ...row,
        topic,
      };
      saveHistory();
      setRows(updatedRows);
    } catch (err) {
      console.error(err);

      alert("Topic generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleBulkGenerate() {
    if (selectedRows.length === 0) {
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationProgress({
        current: 0,
        total: selectedRows.length,
      });

      const updatedRows = [...rows];

      for (let i = 0; i < selectedRows.length; i++) {
        const selectedRow = selectedRows[i];
        if (!selectedRow.word) {
          continue;
        }

        const aiData = await generateTranslation(selectedRow);
        const rowIndex = updatedRows.findIndex((r) => r.id === selectedRow.id);

        if (rowIndex !== -1) {
          updatedRows[rowIndex] = {
            ...updatedRows[rowIndex],
            ...aiData,
          };
          saveHistory();
          setRows([...updatedRows]);
        }
        setGenerationProgress({
          current: i + 1,
          total: selectedRows.length,
        });
      }
    } catch (err) {
      console.error(err);

      alert("Bulk generation failed.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress({
        current: 0,
        total: 0,
      });
    }
  }

  async function handleJsonImport(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setPendingImportFile(file);
    setImportFormat("json");
    setShowImportDialog(true);
    event.target.value = "";
  }

  async function executeImport() {
    if (!pendingImportFile) {
      return;
    }

    try {
      let importedRows = [];

      if (importFormat === "xlsx") {
        importedRows = await importXlsxFile(pendingImportFile);
      }

      if (importFormat === "json") {
        const importedData = await importJsonFile(pendingImportFile);
        importedRows = importedData.rows;
        setPackMetadata(importedData.metadata);
      }

      const processedRows = processImportedRows(importedRows);
      saveHistory();
      setRows(processedRows);
      setSelectedRows([]);
      setSelectedRowIndex(null);
      setShowImportDialog(false);
      setPendingImportFile(null);
    } catch (err) {
      console.error(err);
      alert("Import failed.");
    }
  }

  async function handleSuggestWords() {
    try {
      setIsGenerating(true);

      const existingWords = rows.map((row) => row.word).filter(Boolean);
      const suggestions = await suggestWords({
        existingWords,

        category: packMetadata.category,
        level: packMetadata.level,
      });

      setSuggestedWords(
        suggestions.map((word) => ({
          word,
          selected: true,
        })),
      );

      setShowSuggestionsDialog(true);
    } catch (err) {
      console.error(err);

      alert("Suggestion generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    localStorage.setItem("lexipack_rows", JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    function handleKeyDown(event) {
      const isCtrl = event.ctrlKey || event.metaKey;

      if (isCtrl && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleUndo();
      }

      if (isCtrl && event.key.toLowerCase() === "y") {
        event.preventDefault();
        handleRedo();
      }

      if (event.ctrlKey && event.key === "Delete") {
        event.preventDefault();

        handleClearSelectedRows();
      }

      if (event.key === "Delete" && selectedRows.length > 0) {
        const activeElement = document.activeElement;

        const isEditing =
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA";

        if (isEditing) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        handleDeleteSelected();
      }

      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        event.stopPropagation();
        handleDuplicateAndEdit();
      }

      if (event.ctrlKey && event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        moveSelectedRowUp();
      }

      if (event.ctrlKey && event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        moveSelectedRowDown();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDeleteSelected, selectedRows]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleGenerateSelected();
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        handleBulkGenerate();
      }
      if (e.key === "Escape") {
        setShowFillMenu(false);
        setShowSuggestionsDialog(false);
        setShowImportDialog(false);
      }
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicateSelected();
      }
      if (e.altKey && e.key === "Insert") {
        e.preventDefault();
        e.stopPropagation();
        handleAddRow();
      }

      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportToJson(rows, packMetadata);
      }

      if (e.key === "Delete") {
        e.preventDefault();
        handleDeleteSelected();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleDeleteSelected,
    handleDuplicateSelected,
    handleGenerateSelected,
    rows,
    packMetadata,
  ]);

  return (
    <div className="app">
      {isGenerating && (
        <LoadingOverlay
          current={generationProgress.current}
          total={generationProgress.total}
        />
      )}

      <ImportDialog
        open={showImportDialog}
        importFormat={importFormat}
        setImportFormat={setImportFormat}
        importStrategy={importStrategy}
        setImportStrategy={setImportStrategy}
        onCancel={() => {
          setShowImportDialog(false);
        }}
        onImport={executeImport}
      />

      <SuggestionsDialog
        open={showSuggestionsDialog}
        suggestions={suggestedWords}
        setSuggestions={setSuggestedWords}
        onCancel={() => {
          setShowSuggestionsDialog(false);
        }}
        onAdd={() => {
          const selected = suggestedWords.filter((item) => item.selected);

          const newRows = selected.map((item) => ({
            id: crypto.randomUUID(),
            word: item.word,
            article: "",
            phonetic: "",
            translation: "",
            definition: "",
            type: "",
            level: packMetadata.level,
            example_en: "",
            example_sk: "",
            topic: packMetadata.category,
          }));
          saveHistory();
          setRows([...rows, ...newRows]);

          setShowSuggestionsDialog(false);
        }}
      />

      {/* HEADER */}
      <header className="header">
        <div className="logo">LexiPack</div>

        <div className="toolbar">
          <div className="toolbar-group">
            <button onClick={() => xlsxInputRef.current.click()}>Import</button>
            <button onClick={handleAddRow}>Add Row</button>
            <button onClick={handleDeleteSelected}>Delete Selected</button>
            <button onClick={() => exportToJson(rows, packMetadata)}>
              Export JSON
            </button>
          </div>

          <div className="toolbar-group ai-group">
            <button onClick={handleGenerateSelected}>Generate AI</button>
            <button
              onClick={handleBulkGenerate}
              disabled={selectedRows.length === 0}
              title={
                selectedRows.length === 0
                  ? "Select rows first"
                  : `${selectedRows.length} selected row(s)`
              }
            >
              Generate Selected
            </button>
            <div className="dropdown-wrapper">
              <button
                type="button"
                disabled={selectedRows.length === 0}
                onClick={() => setShowFillMenu(!showFillMenu)}
              >
                Fill Column ▼
              </button>

              {showFillMenu && (
                <div className="dropdown-menu">
                  {availableColumns.map((column) => (
                    <button
                      key={column.field}
                      type="button"
                      onClick={() => {
                        handleGenerateColumn(column.field);

                        setShowFillMenu(false);
                      }}
                    >
                      {column.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleGenerateTopic}
              disabled={selectedRows.length === 0}
              title={
                selectedRows.length === 0
                  ? "Select rows first"
                  : `${selectedRows.length} selected row(s)`
              }
            >
              Generate Topic
            </button>
            <button
              onClick={handleSuggestWords}
              disabled={selectedRows.length === 0}
              title={
                selectedRows.length === 0
                  ? "Select rows first"
                  : `${selectedRows.length} selected row(s)`
              }
            >
              Suggest Words
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        {/* LEFT PANEL */}
        <section className="grid-panel">
          <div className="panel-title">Vocabulary Pack Editor</div>

          <PackMetadataPanel
            metadata={packMetadata}
            setMetadata={setPackMetadata}
          />

          <div className="validation-summary">
            <div className="validation-left">
              <div className="validation-box">Total: {rows.length}</div>

              <div
                className="validation-box invalid clickable"
                onClick={focusFirstInvalidRow}
              >
                Invalid: {invalidRows.length}
              </div>

              <div
                className="validation-box duplicate clickable"
                onClick={focusFirstDuplicateRow}
              >
                Duplicates: {duplicateWords.length}
              </div>
            </div>

            <div className="validation-right">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                title={history.length === 0 ? "Nothing to undo" : "Undo"}
              >
                Undo
              </button>

              <button
                onClick={handleRedo}
                disabled={future.length === 0}
                title={future.length === 0 ? "Nothing to redo" : "Redo"}
              >
                Redo
              </button>
            </div>
          </div>

          <div
            style={{
              padding: 2,
              flex: 1,
              minHeight: 0,
            }}
          >
            <PackGrid
              rowData={rows}
              setRows={setRows}
              selectedRowIndex={selectedRowIndex}
              setSelectedRowIndex={setSelectedRowIndex}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              setGridApi={setGridApi}
              gridRef={gridRef}
              saveHistory={saveHistory}
              singleClickEdit={true}
            />
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="preview-panel">
          <div className="panel-title">Preview</div>

          <PackPreview row={selectedRow} />
        </aside>
      </main>

      <footer className="footer">
        <div className="footer-left">LexiPack ©2026 Techdoc</div>

        <div className="footer-right">
          <span className="footer-lab">LexiLab Dictionary</span>

          <span className="footer-version">v1.00</span>
        </div>
      </footer>

      <input
        ref={xlsxInputRef}
        type="file"
        accept=".xlsx,.xls,.json"
        onChange={handleImport}
        hidden
      />
    </div>
  );
}

export default App;
