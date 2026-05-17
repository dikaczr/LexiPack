import "./EditorScreen.css";
import PackGrid from "../components/PackGrid";
import { importXlsxFile } from "../utils/xlsxImport";
import { exportToJson } from "../utils/jsonExport";
import PackPreview from "../components/PackPreview";
import LoadingOverlay from "../components/LoadingOverlay";
import { importJsonFile } from "../utils/jsonImport";
import ImportDialog from "../components/ImportDialog";
import PackMetadataPanel from "../components/PackMetadataPanel";
import {
  generateTranslation,
  generateTopic,
  suggestWords,
  generateColumn,
} from "../api/aiApi";
import SuggestionsDialog from "../components/SuggestionsDialog";
import PdfReaderDialog from "../components/PdfReaderDialog";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { API_BASE } from "../config";

function ContextMenuItem({ label, icon, shortcut, onClick }) {
  return (
    <button
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "transparent",
        border: "none",
        color: "#e2e8f0",
        padding: "7px 10px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 14,
        gap: 16,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      onClick={onClick}
    >
      <span>{icon ? `${icon} ${label}` : label}</span>
      {shortcut && (
        <span style={{ fontSize: 11, color: "#64748b" }}>{shortcut}</span>
      )}
    </button>
  );
}

export default function EditorScreen({ activePack, quickFilter = "", setQuickFilter }) {
  const { token, user, handleUnauthorized } = useAuth();
  const { settings } = useSettings();
  const [packData, setPackData] = useState(null);
  const [rows, setRows] = useState([]);

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
  });
  const gridRef = useRef(null);
  const [gridApi, setGridApi] = useState(null);
  const extWindows = useRef({});
  const lastEditRef = useRef(null);
  const [showGoToSearch, setShowGoToSearch] = useState(false);
  const [goToQuery, setGoToQuery] = useState("");
  const goToInputRef = useRef(null);

  const handleCellEditingStopped = useCallback((e) => {
    if (e.rowIndex != null && e.column) {
      lastEditRef.current = { rowIndex: e.rowIndex, colId: e.column.getColId() };
    }
  }, []);

  const handleGoTo = useCallback(() => {
    const last = lastEditRef.current;
    if (!last) return;
    gridRef.current?.api.ensureIndexVisible(last.rowIndex, "middle");
    gridRef.current?.api.setFocusedCell(last.rowIndex, last.colId);
  }, []);

  const handleGoToSearch = useCallback((query) => {
    const q = (query ?? goToQuery).trim().toLowerCase();
    if (!q) return;
    const api = gridRef.current?.api;
    if (!api) return;
    let found = null;
    api.forEachNodeAfterFilterAndSort((node) => {
      if (found) return;
      const word = node.data?.word?.toLowerCase() ?? "";
      const translation = node.data?.translation?.toLowerCase() ?? "";
      if (word.includes(q) || translation.includes(q)) found = node;
    });
    if (found) {
      api.ensureIndexVisible(found.rowIndex, "middle");
      api.setFocusedCell(found.rowIndex, "word");
      api.startEditingCell({ rowIndex: found.rowIndex, colKey: "word" });
      setTimeout(() => {
        const input = document.querySelector(".ag-cell-editor input, .ag-cell-editor textarea");
        if (input) { input.focus(); input.select(); }
      }, 50);
      setShowGoToSearch(false);
      setGoToQuery("");
    }
  }, [goToQuery]);

  const openOrFocus = (key, url) => {
    const win = extWindows.current[key];
    if (win && !win.closed) {
      win.focus();
    } else {
      extWindows.current[key] = window.open(url, "_blank");
    }
  };
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

  const [availableTags, setAvailableTags] = useState([]);
  const [wordReviews, setWordReviews] = useState([]);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [showSuggestConfirm, setShowSuggestConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    field: null,
    fieldLabel: null,
    rowData: null,
    isFillable: false,
  });

  const columnLabels = {
    word: "Word",
    article: "Article",
    phonetic: "Phonetic",
    translation: "Translation",
    definition: "Definition",
    type: "Type",
    level: "Level",
    example_en: "Example EN",
    example_sk: "Example SK",
    topic: "Topic",
  };
  const [suggestedWords, setSuggestedWords] = useState([]);
  const [showFillMenu, setShowFillMenu] = useState(false);
  const [showPdfReader, setShowPdfReader] = useState(false);
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

  const selectedIds = new Set(selectedRows.map((r) => r.id));
  const availableColumns = fillableColumns.filter((column) =>
    rows.some((row) => selectedIds.has(row.id) && !row[column.field]),
  );

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const quickFilterRef = useRef(null);
  const [filteredCount, setFilteredCount] = useState(rows.length);

  /*    */

  const saveHistory = useCallback(() => {
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(rows))]);
    setFuture([]);
  }, [rows]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((prev) => [JSON.parse(JSON.stringify(rows)), ...prev]);
    setRows(previous);
    setHistory((prev) => prev.slice(0, -1));
  }, [history, rows]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(rows))]);
    setRows(next);
    setFuture((prev) => prev.slice(1));
  }, [future, rows]);

  const handleSave = useCallback(async () => {
    if (!activePack?.fileName) return;
    const tags = typeof packMetadata.tags === "string"
      ? packMetadata.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : packMetadata.tags || [];
    const payload = { ...packMetadata, tags, words: rows };
    try {
      setSaveStatus("Saving...");
      const res = await fetch(`${API_BASE}/api/packs/${activePack.fileName}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data = await res.json();
      const statusMsg = data.autoStatus ? ` — Pack: ${data.autoStatus}` : "";
      setSaveStatus(`Saved${statusMsg}`);
      setTimeout(() => setSaveStatus(""), 7000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("Save failed");
      setTimeout(() => setSaveStatus(""), 7000);
    }
  }, [activePack, packMetadata, rows, token]);

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
      saveHistory();
      setIsGenerating(true);
      setGenerationProgress({ current: 0, total: selectedRows.length });

      const updatedRows = [...rows];

      for (let i = 0; i < selectedRows.length; i++) {
        const selectedRow = selectedRows[i];
        const rowIndex = updatedRows.findIndex((r) => r.id === selectedRow.id);

        if (rowIndex === -1) {
          setGenerationProgress({ current: i + 1, total: selectedRows.length });
          continue;
        }

        if (updatedRows[rowIndex][field]) {
          setGenerationProgress({ current: i + 1, total: selectedRows.length });
          continue;
        }

        const value = await generateColumn(updatedRows[rowIndex], field);

        updatedRows[rowIndex] = {
          ...updatedRows[rowIndex],
          [field]: value,
        };
        setRows([...updatedRows]);

        setGenerationProgress({ current: i + 1, total: selectedRows.length });
      }
    } catch (err) {
      console.error(err);

      alert("Column generation failed.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  }

  function handleCellContextMenu({ x, y, field, rowData }) {
    const isFillable = fillableColumns.some((c) => c.field === field);
    const fieldLabel = columnLabels[field] || field;
    setContextMenu({ visible: true, x, y, field, fieldLabel, rowData, isFillable });
  }

  async function handleCopyCell() {
    const value = contextMenu.rowData?.[contextMenu.field] ?? "";
    await navigator.clipboard.writeText(String(value));
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }

  async function handleCutCell() {
    const { field, rowData } = contextMenu;
    const value = rowData?.[field] ?? "";
    await navigator.clipboard.writeText(String(value));
    saveHistory();
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowData.id ? { ...row, [field]: "" } : row,
      ),
    );
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }

  async function handlePasteCell() {
    const { field, rowData } = contextMenu;
    const value = await navigator.clipboard.readText();
    saveHistory();
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowData.id ? { ...row, [field]: value } : row,
      ),
    );
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }

  async function handleFillCellWithAI() {
    const { field, rowData } = contextMenu;
    setContextMenu((prev) => ({ ...prev, visible: false }));

    try {
      setIsGenerating(true);
      const value = await generateColumn(rowData, field);
      saveHistory();
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowData.id ? { ...row, [field]: value } : row,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("AI generation failed.");
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

  const handleAddRow = useCallback(() => {
    gridRef.current?.api.stopEditing();

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
    setRows((prev) => [...prev, newRow]);

    setTimeout(() => {
      const rowNode = gridRef.current?.api.getRowNode(newRow.id);
      if (!rowNode) return;
      const rowIndex = rowNode.rowIndex;
      setSelectedRowIndex(rowIndex);
      gridRef.current.api.ensureIndexVisible(rowIndex, "middle");
      requestAnimationFrame(() => {
        gridRef.current.api.startEditingCell({
          rowIndex: rowIndex,
          colKey: "word",
        });
        setTimeout(() => {
          const input = document.querySelector(".ag-cell-inline-editing input");
          input?.select();
        }, 20);
      });
    }, 150);
  }, [saveHistory]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedRows.length) {
      return;
    }

    saveHistory();

    setRows((prev) =>
      prev.filter((row) => !selectedRows.some((sel) => sel.id === row.id)),
    );
  }, [selectedRows, saveHistory]);

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
  }, [selectedRows, saveHistory]);

  const handleDuplicateAndEdit = useCallback(() => {
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
  }, [selectedRows, rows, saveHistory]);

  const handleGenerateSelected = useCallback(async () => {
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
  }, [rows, selectedRowIndex, saveHistory]);

  const handleClearSelectedRows = useCallback(() => {
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
  }, [selectedRows, rows, saveHistory]);

  const moveSelectedRowUp = useCallback(() => {
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
  }, [selectedRowIndex, rows, saveHistory]);

  const moveSelectedRowDown = useCallback(() => {
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
  }, [selectedRowIndex, rows, saveHistory]);

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

  const handleBulkGenerate = useCallback(async () => {
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
  }, [selectedRows, rows, saveHistory]);

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
    setShowSuggestConfirm(false);

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

  const handleAddWordFromPdf = useCallback((word) => {
    const newRow = {
      id: crypto.randomUUID(),
      word: word.trim(),
      article: "",
      phonetic: "",
      translation: "",
      definition: "",
      type: "",
      level: packMetadata.level || "",
      example_en: "",
      example_sk: "",
      topic: packMetadata.category || "",
    };
    saveHistory();
    setRows((prev) => [...prev, newRow]);
  }, [packMetadata, saveHistory]);

  useEffect(() => {
    fetch(`${API_BASE}/api/tags`)
      .then(r => r.json())
      .then(setAvailableTags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activePack) return;

    fetch(`${API_BASE}/api/packs/${activePack.fileName}`)
      .then((res) => res.json())
      .then((data) => {
        setPackData(data);
        setRows(
          (data.words || []).map((w) => ({
            ...w,
            id: w.id || crypto.randomUUID(),
          })),
        );
        setPackMetadata({
          packId: data.packId || crypto.randomUUID(),
          name: data.name || "",
          description: data.description || "",
          targetLang: data.targetLang || "en",
          nativeLang: data.nativeLang || "sk",
          level: data.level || "B1",
          category: data.category || "",
          icon: data.icon || "📘",
          author: data.author || "",
          version: data.version || "1.0",
          tags: data.tags || "",
        });
      })
      .catch((err) => {
        console.error(err);
      });

    fetch(`${API_BASE}/api/packs/${activePack.fileName}/word-reviews`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setWordReviews(Array.isArray(data) ? data : []))
      .catch(() => setWordReviews([]));
  }, [activePack, token]);

  const handleAddReview = useCallback(async ({ word_id, word, action, comment }) => {
    if (!activePack?.fileName) return;
    const res = await fetch(`${API_BASE}/api/packs/${activePack.fileName}/word-reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ word_id, word, action, comment }),
    });
    if (res.ok) {
      const newReview = await res.json();
      setWordReviews((prev) => [newReview, ...prev]);
      if (newReview.autoStatus) {
        setSaveStatus(`Pack: ${newReview.autoStatus}`);
        setTimeout(() => setSaveStatus(""), 7000);
      }
    }
  }, [activePack, token]);

  const handleDeleteReview = useCallback(async (id) => {
    if (!activePack?.fileName) return;
    const res = await fetch(`${API_BASE}/api/packs/${activePack.fileName}/word-reviews/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (res.ok) {
      setWordReviews((prev) => prev.filter((r) => r.id !== id));
    }
  }, [activePack, token]);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem("lexipack_rows", JSON.stringify(rows));
    }, 300);
    return () => clearTimeout(t);
  }, [rows]);

  useEffect(() => {
    gridRef.current?.api?.setGridOption("quickFilterText", quickFilter ?? "");
    setTimeout(() => {
      setFilteredCount(gridRef.current?.api?.getDisplayedRowCount() ?? rows.length);
    }, 0);
  }, [quickFilter]);

  // ── AUTO-SAVE na server ───────────────────────────────
  useEffect(() => {
    const interval = Number(settings.autoSaveInterval ?? 5);
    if (!interval || !activePack?.fileName) return;

    const id = setInterval(() => {
      handleSave();
    }, interval * 60 * 1000);

    return () => clearInterval(id);
  }, [settings.autoSaveInterval, activePack, handleSave]);

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

      if (event.key === "Escape") {
        if (document.activeElement === quickFilterRef.current) {
          quickFilterRef.current.blur();
          gridRef.current?.api.setFocusedCell(selectedRowIndex ?? 0, "word");

          return;
        }

        setShowFillMenu(false);
        setShowSuggestionsDialog(false);
        setShowSuggestConfirm(false);
        setShowImportDialog(false);
        setShowShortcutsHelp(false);
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

      if (event.key === "F1") {
        event.preventDefault();
        setShowShortcutsHelp(true);
      }

      if (event.ctrlKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        quickFilterRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleDeleteSelected,
    handleUndo,
    handleRedo,
    handleClearSelectedRows,
    handleDuplicateAndEdit,
    moveSelectedRowUp,
    moveSelectedRowDown,
    selectedRowIndex,
    selectedRows,
  ]);

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
        setShowShortcutsHelp(false);
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
        handleSave();
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
    handleBulkGenerate,
    handleAddRow,
    handleSave,
    rows,
    packMetadata,
  ]);

  return (
    <div className="app">
      <PdfReaderDialog
        open={showPdfReader}
        onClose={() => setShowPdfReader(false)}
        onAddWord={handleAddWordFromPdf}
        existingWords={rows.map((r) => r.word).filter(Boolean)}
      />

      {isGenerating && (
        <LoadingOverlay
          current={generationProgress.current}
          total={generationProgress.total}
        />
      )}

      {contextMenu.visible && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 8999 }}
            onClick={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
          />
          <div
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 10,
              padding: 6,
              zIndex: 9000,
              minWidth: 180,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                padding: "4px 10px 6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {contextMenu.fieldLabel}
            </div>

            <ContextMenuItem label="Copy" shortcut="Ctrl+C" onClick={handleCopyCell} />
            <ContextMenuItem label="Cut" shortcut="Ctrl+X" onClick={handleCutCell} />
            <ContextMenuItem label="Paste" shortcut="Ctrl+V" onClick={handlePasteCell} />

            {contextMenu.isFillable && (
              <>
                <div style={{ borderTop: "1px solid #334155", margin: "4px 0" }} />
                <ContextMenuItem label="Fill with AI" icon="✨" onClick={handleFillCellWithAI} />
              </>
            )}
          </div>
        </>
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

      {showSuggestConfirm && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-title">Suggest Words</div>
            <div style={{ color: "#94a3b8", fontSize: 14 }}>
              AI vygeneruje <strong style={{ color: "#e2e8f0" }}>10 nových slov</strong> pre kategóriu{" "}
              <strong style={{ color: "#60a5fa" }}>
                {packMetadata.category || "—"}
              </strong>{" "}
              na úrovni{" "}
              <strong style={{ color: "#60a5fa" }}>
                {packMetadata.level || "—"}
              </strong>.
            </div>
            <div className="dialog-section">
              <div className="dialog-label">Pack</div>
              <div>{packMetadata.name || "—"}</div>
            </div>
            <div className="dialog-section">
              <div className="dialog-label">Existing words</div>
              <div>{rows.filter((r) => r.word).length}</div>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowSuggestConfirm(false)}>
                Cancel
              </button>
              <button onClick={handleSuggestWords}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {showShortcutsHelp && (
        <div className="shortcuts-overlay">
          <div className="shortcuts-modal">
            <div className="shortcuts-title">Keyboard Shortcuts</div>

            <div className="shortcuts-list">
              <div>
                <b>Ctrl + Z</b> — Undo
              </div>
              <div>
                <b>Ctrl + Y</b> — Redo
              </div>

              <div>
                <b>Ctrl + D</b> — Duplicate
              </div>

              <div>
                <b>Ctrl + Shift + D</b> — Duplicate & Edit
              </div>

              <div>
                <b>Ctrl + Enter</b> — Generate AI
              </div>

              <div>
                <b>Ctrl + Shift + G</b> — Bulk Generate
              </div>

              <div>
                <b>Alt + Insert</b> — Add Row
              </div>

              <div>
                <b>Ctrl + ↑</b> — Move Row Up
              </div>

              <div>
                <b>Ctrl + ↓</b> — Move Row Down
              </div>

              <div>
                <b>Ctrl + Delete</b> — Clear Generated Fields
              </div>

              <div>
                <b>Delete</b> — Delete Selected
              </div>

              <div>
                <b>Esc</b> — Close Dialogs
              </div>

              <div>
                <b>F1</b> — Show Shortcuts
              </div>

              <div>
                <b>Ctrl + F</b> — Quick Search
              </div>
            </div>

            <button onClick={() => setShowShortcutsHelp(false)}>Close</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="header">
        <div className="logo">Vocabulary Pack Editor</div>

        <div className="toolbar">
          <div className="toolbar-group">
            <div className="toolbar-links toolbar-links-ai">
              <button className="btn-link" onClick={() => openOrFocus("gemini", "https://gemini.google.com/")}>
                <img src="https://www.google.com/s2/favicons?domain=gemini.google.com&sz=32" alt="" width={18} height={18} />
                <span>Gemini</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("claude", "https://claude.ai/")}>
                <img src="https://www.google.com/s2/favicons?domain=claude.ai&sz=32" alt="" width={18} height={18} />
                <span>Claude</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("chatgpt", "https://chatgpt.com/")}>
                <img src="https://www.google.com/s2/favicons?domain=chatgpt.com&sz=32" alt="" width={18} height={18} />
                <span>ChatGPT</span>
              </button>
            </div>
            <div className="toolbar-links">
              <button className="btn-link" onClick={() => openOrFocus("deepl", "https://www.deepl.com/en/translator")}>
                <img src="https://www.deepl.com/favicon.ico" alt="" width={18} height={18} />
                <span>DeepL</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("verbformen", "https://www.verbformen.com/")}>
                <img src="https://www.verbformen.com/favicon.ico" alt="" width={18} height={18} />
                <span>VerbF.</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("oxford", "https://www.oxfordlearnersdictionaries.com/")}>
                <img src="https://www.oxfordlearnersdictionaries.com/favicon.ico" alt="" width={18} height={18} />
                <span>Oxford</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("cambridge", "https://dictionary.cambridge.org/")}>
                <img src="https://dictionary.cambridge.org/favicon.ico" alt="" width={18} height={18} />
                <span>Cambr.</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("wikipedia", "https://en.wikipedia.org/wiki/Main_Page")}>
                <img src="https://en.wikipedia.org/static/favicon/wikipedia.ico" alt="" width={18} height={18} />
                <span>Wiki</span>
              </button>
            </div>
            <button onClick={() => xlsxInputRef.current.click()} style={{ marginLeft: 20 }}>Import</button>
            <button className="btn-save" onClick={handleSave}>
              Save
            </button>
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        {/* LEFT PANEL */}
        <section className="grid-panel">
          <PackMetadataPanel
            metadata={packMetadata}
            setMetadata={setPackMetadata}
            availableTags={availableTags}
          />

          <div className="validation-summary">
            <div className="validation-left">
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

              <button onClick={handleAddRow} style={{ marginLeft: 32, background: "#2563eb", color: "#fff" }}>Add Row</button>
              <button onClick={handleDeleteSelected} style={{ background: "#2563eb", color: "#fff" }}>Delete Selected</button>
              <button onClick={() => setShowPdfReader(true)} style={{ background: "#2563eb", color: "#fff" }}>Read PDF</button>

              <button onClick={handleGenerateSelected} style={{ marginLeft: 32, background: "#5e419c", color: "#fff" }}>Generate AI</button>
              <button
                onClick={handleBulkGenerate}
                disabled={selectedRows.length === 0}
                title={selectedRows.length === 0 ? "Select rows first" : `${selectedRows.length} selected row(s)`}
                style={{ background: "#5e419c", color: "#fff" }}
              >
                Generate Selected
              </button>
              <div className="dropdown-wrapper">
                <button
                  type="button"
                  disabled={selectedRows.length === 0}
                  onClick={() => setShowFillMenu(!showFillMenu)}
                  style={{ background: "#5e419c", color: "#fff" }}
                >
                  Fill Column ▼
                </button>
                {showFillMenu && (
                  <div className="dropdown-menu">
                    {availableColumns.map((column) => (
                      <button
                        key={column.field}
                        type="button"
                        onClick={() => { handleGenerateColumn(column.field); setShowFillMenu(false); }}
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
                title={selectedRows.length === 0 ? "Select rows first" : `${selectedRows.length} selected row(s)`}
                style={{ background: "#5e419c", color: "#fff" }}
              >
                Generate Topic
              </button>
              <button onClick={() => setShowSuggestConfirm(true)} style={{ background: "#5e419c", color: "#fff" }}>
                Suggest Words
              </button>
              <button onClick={handleGoTo} title="Go to last edited cell" style={{ marginLeft: 15 }}>
                Goto Last
              </button>
              <button
                onClick={() => { setShowGoToSearch(v => !v); setTimeout(() => goToInputRef.current?.focus(), 50); }}
                style={{ marginLeft: 8 }}
              >
                GoTo
              </button>
              {showGoToSearch && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                  <input
                    ref={goToInputRef}
                    value={goToQuery}
                    onChange={e => setGoToQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleGoToSearch();
                      if (e.key === "Escape") { setShowGoToSearch(false); setGoToQuery(""); }
                    }}
                    placeholder="word / translation..."
                    style={{ fontSize: 12, padding: "3px 8px", borderRadius: 5, border: "1px solid var(--app-border-sub)", background: "var(--app-input)", color: "var(--app-text)", width: 160, outline: "none" }}
                  />
                  <button onClick={() => handleGoToSearch()} style={{ padding: "3px 8px", fontSize: 12 }}>→</button>
                </div>
              )}
            </div>

            <div className="validation-right">
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
              setFilteredCount={setFilteredCount}
              onCellContextMenu={handleCellContextMenu}
              onCellEditingStopped={handleCellEditingStopped}
              wordReviews={wordReviews}
            />
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="preview-panel">
          <div className="panel-title">Preview</div>

          <PackPreview
            row={selectedRow}
            reviews={wordReviews}
            onAddReview={handleAddReview}
            onDeleteReview={handleDeleteReview}
            userRole={user?.role}
          />
        </aside>
      </main>

      <footer className="footer">
        <div className="footer-left">
          Editor messages:
          <span className="save-status">{saveStatus}</span>
        </div>

        <div className="footer-right">
          <span className="footer-lab"></span>
          <span className="footer-version"></span>
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
