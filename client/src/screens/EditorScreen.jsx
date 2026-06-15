import "./EditorScreen.css";
import pureIcon from "../assets/purepng.png";
import PackGrid from "../components/PackGrid";
import { importXlsxFile } from "../utils/xlsxImport";
import { exportToJson } from "../utils/jsonExport";
import PackPreview from "../components/PackPreview";
import LoadingOverlay from "../components/LoadingOverlay";
import { importJsonFile } from "../utils/jsonImport";
import ImportDialog from "../components/ImportDialog";
import ExportDialog from "../components/ExportDialog";
import { exportToXlsx, exportToTxt, exportToPdf, exportToCsv, exportToTbx } from "../utils/exportUtils";
import { logAudit } from "../api/auditApi";
import { useHeartbeat } from "../hooks/useHeartbeat";
import PackMetadataPanel from "../components/PackMetadataPanel";
import {
  translateWord,
  generateTranslation,
  generateTopic,
  suggestWords,
  generateColumn,
  generateColumnFull,
} from "../api/aiApi";
import ImageGenDialog from "../components/ImageGenDialog";
import SuggestionsDialog from "../components/SuggestionsDialog";
import PdfReaderDialog from "../components/PdfReaderDialog";
import WebReaderDialog from "../components/WebReaderDialog";
import SymbolsDialog from "../components/SymbolsDialog";
import SpellCheckDialog from "../components/SpellCheckDialog";
import DomainCheckDialog from "../components/DomainCheckDialog";
import CefrCheckDialog from "../components/CefrCheckDialog";
import ExampleCheckDialog from "../components/ExampleCheckDialog";
import DuplicateMeaningDialog from "../components/DuplicateMeaningDialog";
import PackCoverageDialog from "../components/PackCoverageDialog";
import TrustedSourceDialog from "../components/TrustedSourceDialog";
import BookmarkNotePopover from "../components/BookmarkNotePopover";
import RecoveryDialog from "../components/RecoveryDialog";
import { saveRecovery, loadRecovery, clearRecovery } from "../utils/recoveryStore";
import { applyAutoCorrect } from "../utils/autoCorrect";
import { useBookmarks } from "../hooks/useBookmarks";
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useT } from "../i18n";
import { API_BASE } from "../config";

const GoogleTranslateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 998.1 998.3" xmlns="http://www.w3.org/2000/svg">
    <path fill="#DBDBDB" d="M931.7 998.3c36.5 0 66.4-29.4 66.4-65.4V265.8c0-36-29.9-65.4-66.4-65.4H283.6l260.1 797.9h388z"/>
    <polygon fill="#4352B8" points="482.3,809.8 543.7,998.3 714.4,809.8"/>
    <path fill="#607988" d="M936.1 476.1V437H747.6v-63.2h-61.2V437H566.1v39.1h239.4c-12.8 45.1-41.1 87.7-68.7 120.8-48.9-57.9-49.1-76.7-49.1-76.7h-50.8s2.1 28.2 70.7 108.6c-22.3 22.8-39.2 36.3-39.2 36.3l15.6 48.8s23.6-20.3 53.1-51.6c29.6 32.1 67.8 70.7 117.2 116.7l32.1-32.1c-52.9-48-91.7-86.1-120.2-116.7 38.2-45.2 77-102.1 85.2-154.2H936v.1z"/>
    <path fill="#4285F4" d="M66.4 0C29.9 0 0 29.9 0 66.5v677c0 36.5 29.9 66.4 66.4 66.4h648.1L454.4 0h-388z"/>
    <path fill="#EEEEEE" d="M371.4 430.6c-2.5 30.3-28.4 75.2-91.1 75.2-54.3 0-98.3-44.9-98.3-100.2s44-100.2 98.3-100.2c30.9 0 51.5 13.4 63.3 24.3l41.2-39.6c-27.1-25-62.4-40.6-104.5-40.6-86.1 0-156 69.9-156 156s69.9 156 156 156c90.2 0 149.8-63.3 149.8-152.6 0-12.8-1.6-22.2-3.7-31.8h-146v53.4l91 .1z"/>
  </svg>
);

const DeeplIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.563 0c.24 0 .475.065.682.187l8.197 4.756a1.383 1.383 0 01.683 1.197v9.528c0 .495-.26.949-.683 1.196l-4.79 2.78.01-.002-.155.087-.23.133a.69.69 0 00-.3.563v.386l-.16-.683-2.572 1.493a1.35 1.35 0 01-1.366 0l-8.195-4.757A1.384 1.384 0 012 15.668V6.14c0-.482.26-.936.684-1.183l8.195-4.77c.207-.122.443-.187.684-.187zm-1.27 14.023a1.405 1.405 0 00-2.038-.073 1.43 1.43 0 00.984 2.464c.368 0 .722-.144.985-.401a1.428 1.428 0 00.396-1.384l3.674-2.137-.683-.386-3.317 1.917zM9.24 6.164c-.368 0-.72.145-.983.402a1.43 1.43 0 00-.326 1.592c.075.177.187.338.326.47a1.405 1.405 0 002.021-.055l3.745 2.173.013-.009a1.427 1.427 0 00.368 1.48 1.403 1.403 0 001.967 0 1.428 1.428 0 000-2.063 1.403 1.403 0 00-1.986.02l-3.77-2.201a1.427 1.427 0 00-.39-1.407 1.405 1.405 0 00-.985-.402z" fill="currentColor"/>
    <path clipRule="evenodd" fillRule="evenodd" d="M14.978 24v-3.959l-4.781 1.182" fill="currentColor"/>
  </svg>
);

function ContextMenuItem({ label, icon, shortcut, onClick, disabled }) {
  return (
    <button
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "transparent",
        border: "none",
        color: disabled ? "#475569" : "#e2e8f0",
        padding: "7px 10px",
        borderRadius: 6,
        cursor: disabled ? "default" : "pointer",
        fontSize: 12,
        gap: 16,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#334155"; }}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      onClick={disabled ? undefined : onClick}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span style={{ display: "flex", alignItems: "center", width: 16, flexShrink: 0 }}>{icon}</span>}
        {label}
      </span>
      {shortcut && (
        <span style={{ fontSize: 11, color: "#64748b" }}>{shortcut}</span>
      )}
    </button>
  );
}

const LANG_ARTICLES = {
  de: ["der", "die", "das", "ein", "eine"],
  fr: ["les", "le", "la", "l'", "des", "un", "une"],
  es: ["los", "las", "el", "la", "unos", "unas", "un", "una"],
  it: ["gli", "il", "lo", "le", "la", "i", "uno", "un", "una"],
};

function splitArticle(rawWord, targetLang) {
  const normalized = rawWord.replace(/[‘’‚‛]/g, "'");
  const articles = LANG_ARTICLES[targetLang] || [];
  for (const art of articles) {
    if (art.endsWith("'")) {
      if (normalized.toLowerCase().startsWith(art.toLowerCase())) {
        return { article: normalized.slice(0, art.length), word: normalized.slice(art.length) };
      }
    } else {
      const prefix = art + " ";
      if (normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
        return { article: normalized.slice(0, art.length), word: normalized.slice(prefix.length) };
      }
    }
  }
  return { article: "", word: rawWord };
}

export default function EditorScreen({ activePack, quickFilter = "", setQuickFilter, quickFilterRef, committedFilter = "", setCommittedFilter, autoCorrectLookup, autoCorrectNativeLookup, onTargetLangDetected, onNativeLangDetected }) {
  const { token, user, handleUnauthorized } = useAuth();
  const { settings } = useSettings();
  const t = useT();
  const isReadOnly = activePack?.status === "In Review" && user?.role !== "reviewer";
  useHeartbeat(activePack?.fileName ?? null, token);
  const [packData, setPackData] = useState(null);
  const [rows, setRows] = useState([]);
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

  useEffect(() => {
    autoCorrectLookupRef.current = autoCorrectLookup ?? null;
  }, [autoCorrectLookup]);

  const autoCorrectNativeLookupRef = useRef(null);
  useEffect(() => {
    autoCorrectNativeLookupRef.current = autoCorrectNativeLookup ?? null;
  }, [autoCorrectNativeLookup]);

  const [recoveryDraft, setRecoveryDraft] = useState(null);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [capsLockHint, setCapsLockHint] = useState(false);
  const capsLockHintTimer = useRef(null);

  useEffect(() => {
    function onKey(e) { setCapsLockOn(e.getModifierState("CapsLock")); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

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
  const aiSnapshotRef = useRef({});
  const contextMenuRef = useRef(null);
  const autoCorrectLookupRef = useRef(null);
  const nativeLangRef = useRef("sk");
  const selectedRowIndexRef = useRef(selectedRowIndex);
  useEffect(() => { selectedRowIndexRef.current = selectedRowIndex; }, [selectedRowIndex]);
  const handleAddReviewRef = useRef(null);

  useEffect(() => {
    if (!activePack?.fileName) return;
    const saved = localStorage.getItem(`lastEdit_${activePack.fileName}`);
    const parsed = saved ? JSON.parse(saved) : null;
    // staré záznamy mali rowIndex — ignorujeme ich, potrebujeme id
    lastEditRef.current = parsed?.id != null ? parsed : null;
  }, [activePack?.fileName]);

  const [showGoToSearch, setShowGoToSearch] = useState(false);
  const [goToQuery, setGoToQuery] = useState("");
  const goToInputRef = useRef(null);

  const handleCellEditingStopped = useCallback((e) => {
    if (e.data?.id != null && e.column) {
      const colId = e.column.getColId();
      const pos = { id: e.data.id, colId };
      lastEditRef.current = pos;
      if (activePack?.fileName) {
        localStorage.setItem(`lastEdit_${activePack.fileName}`, JSON.stringify(pos));
      }

      if (settings.autoCorrectEnabled ?? true) {
        const original = e.newValue;
        // Pre natívne polia (preklad, príklad v nat. jazyku) použi natívny lookup
        const nativeFields = new Set(["translation", `example_${nativeLangRef.current}`]);
        const lookup = nativeFields.has(colId)
          ? (autoCorrectNativeLookupRef.current ?? autoCorrectLookupRef.current)
          : autoCorrectLookupRef.current;
        const corrected = applyAutoCorrect(original, colId, {
          lookup,
          correctTwoInitialCaps: settings.correctTwoInitialCaps ?? true,
          correctCapsLock:       settings.correctCapsLock ?? true,
        });
        if (corrected !== original) {
          e.node.setDataValue(colId, corrected);
        }
      }
    }
  }, [activePack?.fileName, settings.autoCorrectEnabled, settings.correctTwoInitialCaps, settings.correctCapsLock]);

  useEffect(() => {
    function onFocusIn(e) {
      const el = e.target;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") setHasActiveInput(true);
    }
    function onFocusOut() {
      setTimeout(() => {
        const el = document.activeElement;
        if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) setHasActiveInput(false);
      }, 0);
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  function openBookmarkPopover(rowId) {
    setBookmarkPopover({ rowId: String(rowId) });
  }

  function handleBookmarkSave(note) {
    if (!bookmarkPopover) return;
    setNote(bookmarkPopover.rowId, note);
    setBookmarkPopover(null);
  }

  function handleBookmarkRemove() {
    if (!bookmarkPopover) return;
    remove(bookmarkPopover.rowId);
    setBookmarkPopover(null);
  }

  function navigateToBookmark(rowId) {
    const api = gridRef.current?.api;
    if (!api) return;
    const node = api.getRowNode(String(rowId));
    if (!node) return;
    api.ensureIndexVisible(node.rowIndex, "middle");
    api.setFocusedCell(node.rowIndex, "word");
  }

  function handleBookmarkPrev() {
    if (!orderedIds.length) return;
    const focusedRowId = gridRef.current?.api?.getFocusedCell()
      ? String(gridRef.current.api.getDisplayedRowAtIndex(gridRef.current.api.getFocusedCell().rowIndex)?.data?.id)
      : null;
    const idx = focusedRowId ? orderedIds.indexOf(focusedRowId) : -1;
    const prevId = orderedIds[idx <= 0 ? orderedIds.length - 1 : idx - 1];
    navigateToBookmark(prevId);
  }

  function handleBookmarkNext() {
    if (!orderedIds.length) return;
    const focusedRowId = gridRef.current?.api?.getFocusedCell()
      ? String(gridRef.current.api.getDisplayedRowAtIndex(gridRef.current.api.getFocusedCell().rowIndex)?.data?.id)
      : null;
    const idx = focusedRowId ? orderedIds.indexOf(focusedRowId) : -1;
    const nextId = orderedIds[(idx + 1) % orderedIds.length];
    navigateToBookmark(nextId);
  }

  function handleInsertSymbol(char) {
    const el = document.activeElement;
    if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
    document.execCommand("insertText", false, char);
  }

  const handleGoTo = useCallback(() => {
    const last = lastEditRef.current;
    if (!last) return;
    const api = gridRef.current?.api;
    if (!api) return;
    const node = api.getRowNode(String(last.id));
    if (!node) return;
    const rowIndex = node.rowIndex;
    api.ensureIndexVisible(rowIndex, "middle");
    api.setFocusedCell(rowIndex, last.colId);
    api.startEditingCell({ rowIndex, colKey: last.colId });
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
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFormat, setImportFormat] = useState("xlsx");
  const [importStrategy, setImportStrategy] = useState("replace");
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const xlsxInputRef = useRef(null);

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
    color: "",
    encoding: "utf-8",
    production: 0,
  });
  const lastSavedMetadataRef = useRef(null);

  const exTargetField = `example_${packMetadata.targetLang || "en"}`;
  const exNativeField = `example_${packMetadata.nativeLang || "sk"}`;

  useEffect(() => { nativeLangRef.current = packMetadata.nativeLang || "sk"; }, [packMetadata.nativeLang]);

  const invalidRows = rows.filter(
    (row) =>
      !row.word ||
      !row.translation ||
      !row.definition ||
      !row.type ||
      !row.level ||
      !row[exTargetField] ||
      !row[exNativeField] ||
      !row.topic,
  );
  const duplicateWords = rows.filter((row, index) => {
    const normalized = row.word?.trim().toLowerCase();
    return (
      rows.findIndex((r) => r.word?.trim().toLowerCase() === normalized) !==
      index
    );
  });

  const [availableTags, setAvailableTags] = useState([]);
  const [wordReviews, setWordReviews] = useState([]);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [showSuggestConfirm, setShowSuggestConfirm] = useState(false);
  const [suggestWordType, setSuggestWordType] = useState("mix");
  const [suggestCustomPrompt, setSuggestCustomPrompt] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [clipboardRows, setClipboardRows] = useState(() => {
    try {
      const raw = localStorage.getItem("lexipack_row_clipboard");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch { return []; }
  });

  function saveClipboardRows(rows) {
    setClipboardRows(rows);
    if (rows.length) localStorage.setItem("lexipack_row_clipboard", JSON.stringify(rows));
    else localStorage.removeItem("lexipack_row_clipboard");
  }
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
    word:        t("cols.word"),
    article:     t("cols.article"),
    phonetic:    t("cols.phonetic"),
    translation: t("cols.translation"),
    definition:  t("cols.definition"),
    type:        t("cols.type"),
    level:       t("cols.level"),
    topic:       t("cols.topic"),
    _bm_flag:    t("cols._bm_flag"),
    _checkbox:   t("cols._checkbox"),
    [exTargetField]: t("cols.exampleLang")(packMetadata.targetLang || "en"),
    [exNativeField]: t("cols.exampleLang")(packMetadata.nativeLang || "sk"),
  };
  const [suggestedWords, setSuggestedWords] = useState([]);
  const [showFillMenu, setShowFillMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [spellCheckResults, setSpellCheckResults] = useState(null);
  const [isSpellChecking, setIsSpellChecking] = useState(false);
  const [showDomainCheck, setShowDomainCheck] = useState(false);
  const [cefrCheckData, setCefrCheckData] = useState(null);
  const [isCefrChecking, setIsCefrChecking] = useState(false);
  const [cefrProgress, setCefrProgress] = useState({ current: 0, total: 0 });
  const [exampleCheckData, setExampleCheckData] = useState(null);
  const [isExampleChecking, setIsExampleChecking] = useState(false);
  const [exampleProgress, setExampleProgress] = useState({ current: 0, total: 0 });
  const [duplicateMeaningData, setDuplicateMeaningData] = useState(null);
  const [isDuplicateMeaningChecking, setIsDuplicateMeaningChecking] = useState(false);
  const [packCoverageData, setPackCoverageData] = useState(null);
  const [isPackCoverageChecking, setIsPackCoverageChecking] = useState(false);
  const [showTrustedSource, setShowTrustedSource] = useState(false);
  const [showPdfReader,  setShowPdfReader]  = useState(false);
  const [showWebReader,  setShowWebReader]  = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showSymbols, setShowSymbols] = useState(false);
  const [showImgGen, setShowImgGen] = useState(false);
  const [hasActiveInput, setHasActiveInput] = useState(false);
const [bookmarkPopover, setBookmarkPopover] = useState(null); // { rowId }


  const { bookmarks, orderedIds, toggle, setNote, remove, isBookmarked } =
    useBookmarks(activePack?.fileName);
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
      field: exTargetField,
      label: `Example ${(packMetadata.targetLang || "en").toUpperCase()}`,
    },

    {
      field: exNativeField,
      label: `Example ${(packMetadata.nativeLang || "sk").toUpperCase()}`,
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

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [showApprovedModal, setShowApprovedModal] = useState(false);
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

    // Report AI acceptance before saving
    const snapshot = aiSnapshotRef.current;
    if (Object.keys(snapshot).length > 0) {
      const rowMap = Object.fromEntries(rows.map((r) => [r.id, r]));
      const report = [];
      for (const [key, snap] of Object.entries(snapshot)) {
        const isColumnSnap = key.includes("__");
        const rowId = isColumnSnap ? key.split("__")[0] : key;
        const row = rowMap[rowId];
        if (!row) continue;
        const correctedFields = Object.entries(snap.fields)
          .filter(([f, aiVal]) => row[f] !== aiVal)
          .map(([f]) => f);
        report.push({
          action: snap.action,
          packFile: snap.packFile,
          accepted: correctedFields.length === 0,
          correctedFields: correctedFields.join(",") || null,
        });
      }
      aiSnapshotRef.current = {};
      if (report.length > 0) {
        fetch(`${API_BASE}/api/telemetry/ai-acceptance`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(report),
        }).catch(() => {});
      }
    }

    const tags = typeof packMetadata.tags === "string"
      ? packMetadata.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : packMetadata.tags || [];
    let production = packMetadata.production ?? 0;
    if (activePack?.fileName) {
      try {
        const hbRes = await fetch(`${API_BASE}/api/heartbeat/production?pack=${encodeURIComponent(activePack.fileName)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (hbRes.ok) { const hbData = await hbRes.json(); production = hbData.seconds ?? production; }
      } catch {}
    }
    const payload = { ...packMetadata, tags, encoding: "utf-8", production, words: rows.map(r => ({ ...r, source: packMetadata.name || "" })) };
    try {
      setSaveStatus(t("editor.status.saving"));
      const saveUrl = activePack.packDbId
        ? `${API_BASE}/api/packs/by-id/${activePack.packDbId}`
        : `${API_BASE}/api/packs/${activePack.fileName}`;
      const res = await fetch(saveUrl, {
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
      const statusMsg = data.autoStatus ? ` — ${t("editor.status.packStatus")(data.autoStatus)}` : "";
      setSaveStatus(`${t("editor.status.saved")}${statusMsg}`);
      setTimeout(() => setSaveStatus(""), 7000);

      const prev = lastSavedMetadataRef.current;
      if (prev) {
        const METADATA_FIELDS = ["name","description","author","category","level","version","targetLang","nativeLang","tags","color","icon"];
        const normalize = (v) => (Array.isArray(v) ? v.slice().sort().join(",") : String(v ?? ""));
        const changedFields = METADATA_FIELDS.filter((f) => normalize(packMetadata[f]) !== normalize(prev[f]));
        if (changedFields.length > 0) {
          logAudit(token, "METADATA_CHANGE", { pack: activePack?.fileName, changedFields });
        }
      }
      lastSavedMetadataRef.current = { ...packMetadata };

      if (activePack.fileName && !activePack.packDbId) {
        clearRecovery(activePack.fileName).catch(() => {});
        fetch(`${API_BASE}/api/packs/${activePack.fileName}/autosave`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus(t("editor.status.saveFailed"));
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

        const value = await generateColumn(updatedRows[rowIndex], field, packMetadata.targetLang, packMetadata.nativeLang, token, activePack?.fileName);

        const snapKey = `${updatedRows[rowIndex].id}__${field}`;
        aiSnapshotRef.current[snapKey] = {
          action: "AI_FILL_COLUMN",
          packFile: activePack?.fileName ?? null,
          fields: { [field]: value },
        };

        updatedRows[rowIndex] = {
          ...updatedRows[rowIndex],
          [field]: value,
        };
        setRows([...updatedRows]);

        setGenerationProgress({ current: i + 1, total: selectedRows.length });
      }
    } catch (err) {
      console.error(err);

      alert(t("editor.errors.columnGen"));
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

  function getRowsForClipboard(fallbackRowData) {
    const gridSelected = (gridRef.current?.api?.getSelectedRows() ?? [])
      .map(({ _sel, ...r }) => r);
    if (gridSelected.length > 1) return gridSelected;
    return fallbackRowData ? [{ ...fallbackRowData }] : [];
  }

  function handleCopyRow() {
    const toCopy = getRowsForClipboard(contextMenu.rowData);
    if (toCopy.length) saveClipboardRows(toCopy);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }

  function handleCutRow() {
    const toCut = getRowsForClipboard(contextMenu.rowData);
    if (!toCut.length) return;
    const cutIds = new Set(toCut.map((r) => r.id));
    saveClipboardRows(toCut);
    saveHistory();
    setRows((prev) => prev.filter((r) => !cutIds.has(r.id)));
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }

  function handlePasteRow() {
    if (!clipboardRows.length) return;
    const newRows = clipboardRows.map((r) => ({ ...r, id: crypto.randomUUID() }));
    saveHistory();
    setRows((prev) => {
      const idx = selectedRowIndex != null && selectedRowIndex >= 0 ? selectedRowIndex : prev.length - 1;
      const next = [...prev];
      next.splice(idx + 1, 0, ...newRows);
      return next;
    });
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }

  const handleCopyRowsKbd = useCallback(() => {
    const api = gridRef.current?.api;
    const selected = api
      ? api.getSelectedNodes().map(n => n.data).filter(Boolean).map(({ _sel, ...r }) => r)
      : [];
    const toCopy = selected.length > 0
      ? selected
      : selectedRowIndex != null ? [{ ...rows[selectedRowIndex] }] : [];
    if (!toCopy.length) return;
    setClipboardRows(toCopy);
    localStorage.setItem("lexipack_row_clipboard", JSON.stringify(toCopy));
  }, [selectedRowIndex, rows]);

  const handlePasteRowKbd = useCallback(() => {
    if (!clipboardRows.length) return;
    const newRows = clipboardRows.map((r) => ({ ...r, id: crypto.randomUUID() }));
    saveHistory();
    setRows((prev) => {
      const idx = selectedRowIndex != null && selectedRowIndex >= 0 ? selectedRowIndex : prev.length - 1;
      const next = [...prev];
      next.splice(idx + 1, 0, ...newRows);
      return next;
    });
  }, [clipboardRows, selectedRowIndex, saveHistory]);

  function handleTranslateWord(service) {
    const isWord = contextMenu.field === "word";
    const word   = contextMenu.rowData?.[contextMenu.field];
    if (!word) return;
    const from = isWord ? (packMetadata.targetLang || "en") : (packMetadata.nativeLang || "sk");
    const to   = isWord ? (packMetadata.nativeLang  || "sk") : (packMetadata.targetLang || "en");
    const q    = encodeURIComponent(word);
    if (service === "deepl") {
      window.open(`https://www.deepl.com/translator#${from}/${to}/${q}`, "lexipack-deepl");
    } else {
      window.open(`https://translate.google.com/?sl=${from}&tl=${to}&text=${q}&op=translate`, "lexipack-google");
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }

  async function handleTranslateDirect(sourceField, targetField, fromLang, toLang) {
    const { rowData } = contextMenu;
    const text = rowData?.[sourceField];
    if (!text) return;
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setIsTranslating(true);
    try {
      const result = await translateWord(text, fromLang, toLang);
      saveHistory();
      setRows((prev) =>
        prev.map((row) => row.id === rowData.id ? { ...row, [targetField]: result } : row),
      );
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || t("editor.errors.translation"));
    } finally {
      setIsTranslating(false);
    }
  }

  async function handleFillCellWithAI() {
    const { field, rowData } = contextMenu;
    setContextMenu((prev) => ({ ...prev, visible: false }));

    try {
      setIsGenerating(true);
      const result = await generateColumnFull(rowData, field, packMetadata.targetLang, packMetadata.nativeLang, token, activePack?.fileName, packMetadata.category);
      const { value, paired } = result;
      const snapFields = { [field]: value };
      if (paired) snapFields[paired.field] = paired.value;
      const snapKey = `${rowData.id}__${field}`;
      aiSnapshotRef.current[snapKey] = {
        action: "AI_FILL_COLUMN",
        packFile: activePack?.fileName ?? null,
        fields: snapFields,
      };
      saveHistory();
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowData.id) return row;
          const updates = { [field]: value };
          if (paired) updates[paired.field] = paired.value;
          return { ...row, ...updates };
        }),
      );
    } catch (err) {
      console.error(err);
      alert(t("editor.errors.aiGen"));
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
      alert(t("editor.errors.importPrep"));
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
      [exTargetField]: "",
      [exNativeField]: "",
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
    // Checkboxom označené riadky majú prednosť; inak vymažeme aktívny riadok
    if (selectedRows.length > 0) {
      saveHistory();
      setRows((prev) =>
        prev.filter((row) => !selectedRows.some((sel) => sel.id === row.id)),
      );
      setSelectedRows([]);
      setSelectedRowIndex(null);
      logAudit(token, "DELETE_ROWS", {
        pack: activePack,
        count: selectedRows.length,
        words: selectedRows.map((r) => r.word),
      });
    } else if (selectedRowIndex !== null) {
      saveHistory();
      setRows((prev) => {
        const deleted = prev[selectedRowIndex];
        logAudit(token, "DELETE_ROWS", {
          pack: activePack,
          count: 1,
          words: [deleted?.word],
        });
        return prev.filter((_, i) => i !== selectedRowIndex);
      });
      setSelectedRowIndex(null);
    }
  }, [selectedRows, selectedRowIndex, saveHistory, token, activePack]);

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

      const aiData = await generateTranslation(row, packMetadata.targetLang, packMetadata.nativeLang, token, activePack?.fileName, packMetadata.category);

      const SNAPSHOT_FIELDS = ["phonetic","translation","definition","type","level",exTargetField,exNativeField,"topic"];
      aiSnapshotRef.current[row.id] = {
        action: "AI_GENERATE",
        packFile: activePack?.fileName ?? null,
        fields: Object.fromEntries(
          SNAPSHOT_FIELDS.filter((f) => aiData[f] !== undefined).map((f) => [f, aiData[f]]),
        ),
      };

      const updatedRows = [...rows];

      updatedRows[selectedRowIndex] = {
        ...row,
        ...aiData,
      };
      saveHistory();
      setRows(updatedRows);
    } catch (err) {
      console.error(err.response?.data || err);
      alert(t("editor.errors.aiGen"));
    } finally {
      setIsGenerating(false);
    }
  }, [rows, selectedRowIndex, saveHistory, packMetadata, activePack, token]);

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
        [exTargetField]: "",
        [exNativeField]: "",
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

  async function handleCefrCheck() {
    setShowQualityMenu(false);
    if (rows.length === 0) return;

    const BATCH = 30;
    const toCheck = rows
      .filter((r) => r.word?.trim())
      .map((r) => ({ id: r.id, word: r.word, level: r.level }));
    const totalBatches = Math.ceil(toCheck.length / BATCH);

    setIsCefrChecking(true);
    setCefrProgress({ current: 0, total: totalBatches });

    const allResults = [];
    try {
      for (let i = 0; i < toCheck.length; i += BATCH) {
        const batch = toCheck.slice(i, i + BATCH);
        const res = await fetch(`${API_BASE}/api/quality/cefr-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            rows: batch,
            targetLang: packMetadata.targetLang,
            packLevel: packMetadata.level,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        allResults.push(...data.results);
        setCefrProgress({ current: Math.floor(i / BATCH) + 1, total: totalBatches });
      }
      setCefrCheckData({ results: allResults, total: toCheck.length, packLevel: packMetadata.level });
    } catch (err) {
      console.error(err);
      alert("Kontrola CEFR zlyhala.");
    } finally {
      setIsCefrChecking(false);
      setCefrProgress({ current: 0, total: 0 });
    }
  }

  async function handlePackCoverage() {
    setShowQualityMenu(false);
    if (rows.length === 0) return;
    setIsPackCoverageChecking(true);
    try {
      const res = await fetch(`${API_BASE}/api/quality/pack-coverage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          rows: rows.map((r) => ({ id: r.id, word: r.word, translation: r.translation })),
          targetLang:   packMetadata.targetLang,
          packName:     packMetadata.name,
          packCategory: packMetadata.category,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPackCoverageData(data);
    } catch (err) {
      console.error(err);
      alert("Analýza pokrytia balíka zlyhala.");
    } finally {
      setIsPackCoverageChecking(false);
    }
  }

  async function handleExampleCheck() {
    setShowQualityMenu(false);
    if (rows.length === 0) return;

    const BATCH = 15;
    const toCheck = rows.filter((r) => r[exTargetField]?.trim());
    if (toCheck.length === 0) { alert("Žiadne slová nemajú vyplnený stĺpec príkladov."); return; }

    const totalBatches = Math.ceil(toCheck.length / BATCH);
    setIsExampleChecking(true);
    setExampleProgress({ current: 0, total: totalBatches });

    const allResults = [];
    try {
      for (let i = 0; i < toCheck.length; i += BATCH) {
        const batch = toCheck.slice(i, i + BATCH);
        const res = await fetch(`${API_BASE}/api/quality/example-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ rows: batch, targetLang: packMetadata.targetLang }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        allResults.push(...data.results);
        setExampleProgress({ current: Math.floor(i / BATCH) + 1, total: totalBatches });
      }
      setExampleCheckData({ results: allResults, total: toCheck.length });
    } catch (err) {
      console.error(err);
      alert("Kontrola príkladov zlyhala.");
    } finally {
      setIsExampleChecking(false);
      setExampleProgress({ current: 0, total: 0 });
    }
  }

  async function handleDuplicateMeaningCheck() {
    setShowQualityMenu(false);
    if (rows.length < 2) return;
    setIsDuplicateMeaningChecking(true);
    try {
      const res = await fetch(`${API_BASE}/api/quality/duplicate-meaning`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          rows: rows.map((r) => ({ id: r.id, word: r.word, translation: r.translation })),
          targetLang: packMetadata.targetLang,
          nativeLang:  packMetadata.nativeLang,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDuplicateMeaningData(data.groups);
    } catch (err) {
      console.error(err);
      alert("Kontrola duplicitných významov zlyhala.");
    } finally {
      setIsDuplicateMeaningChecking(false);
    }
  }

  async function handleSpellCheck() {
    setShowQualityMenu(false);
    const checkRows = selectedRows.length > 0 ? selectedRows : rows;
    if (checkRows.length === 0) return;
    setIsSpellChecking(true);
    try {
      const res = await fetch(`${API_BASE}/api/quality/spellcheck`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ rows: checkRows, targetLang: packMetadata.targetLang, nativeLang: packMetadata.nativeLang }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const results = await res.json();
      setSpellCheckResults(results);
    } catch (err) {
      console.error(err);
      alert(`Kontrola pravopisu zlyhala: ${err.message}`);
    } finally {
      setIsSpellChecking(false);
    }
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

      const topic = await generateTopic(row.word, packMetadata.targetLang, token);

      const updatedRows = [...rows];

      updatedRows[selectedRowIndex] = {
        ...row,
        topic,
      };
      saveHistory();
      setRows(updatedRows);
    } catch (err) {
      console.error(err);

      alert(t("editor.errors.topicGen"));
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

        const aiData = await generateTranslation(selectedRow, packMetadata.targetLang, packMetadata.nativeLang, token, activePack?.fileName, packMetadata.category);
        const rowIndex = updatedRows.findIndex((r) => r.id === selectedRow.id);

        if (rowIndex !== -1) {
          const SNAPSHOT_FIELDS = ["phonetic","translation","definition","type","level",exTargetField,exNativeField,"topic"];
          aiSnapshotRef.current[selectedRow.id] = {
            action: "AI_GENERATE",
            packFile: activePack?.fileName ?? null,
            fields: Object.fromEntries(
              SNAPSHOT_FIELDS.filter((f) => aiData[f] !== undefined).map((f) => [f, aiData[f]]),
            ),
          };
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

      alert(t("editor.errors.bulkGen"));
    } finally {
      setIsGenerating(false);
      setGenerationProgress({
        current: 0,
        total: 0,
      });
    }
  }, [selectedRows, rows, saveHistory]);

  async function executeImport() {
    if (!pendingImportFile) {
      return;
    }

    try {
      let importedRows = [];

      if (importFormat === "xlsx") {
        importedRows = await importXlsxFile(pendingImportFile, packMetadata.targetLang || "en", packMetadata.nativeLang || "sk");
      }

      let importedMetadata = null;
      let importedTargetLang = packMetadata.targetLang || "en";
      if (importFormat === "json") {
        const importedData = await importJsonFile(pendingImportFile, packMetadata.targetLang, packMetadata.nativeLang);
        importedRows = importedData.rows;
        importedMetadata = importedData.metadata;
        importedTargetLang = importedData.targetLang || packMetadata.targetLang || "en";
      }

      const processedRows = processImportedRows(importedRows);

      // Migrate existing rows: example_en → example_${targetLang} for non-English packs
      const tl = importedTargetLang;
      const migratedRows = tl !== "en"
        ? processedRows.map((r) => {
            if (!r[`example_${tl}`] && r.example_en) {
              const { example_en, ...rest } = r;
              return { ...rest, [`example_${tl}`]: example_en };
            }
            return r;
          })
        : processedRows;

      saveHistory();
      setRows(migratedRows);
      // Only update metadata if the file had real metadata (name/packId/targetLang in file)
      if (importFormat === "json" && importStrategy === "replace" && importedMetadata) {
        setPackMetadata(importedMetadata);
      }
      setSelectedRows([]);
      setSelectedRowIndex(null);
      setShowImportDialog(false);
      setPendingImportFile(null);
      await logAudit(token, "IMPORT", {
        pack: packMetadata.name,
        format: importFormat,
        strategy: importStrategy,
        wordCount: processedRows.length,
        fileName: pendingImportFile.name,
      });
    } catch (err) {
      console.error(err);
      alert(t("editor.errors.import"));
    }
  }

  async function handleExport() {
    setShowExportDialog(false);
    const exportRows = selectedRows.length > 0 ? selectedRows : rows;
    try {
      if (exportFormat === "xlsx")      await exportToXlsx(exportRows, packMetadata);
      else if (exportFormat === "csv")  await exportToCsv(exportRows, packMetadata, settings.csvDelimiter ?? ",");
      else if (exportFormat === "tbx")  await exportToTbx(exportRows, packMetadata);
      else if (exportFormat === "txt")  await exportToTxt(exportRows, packMetadata);
      else if (exportFormat === "pdf")  await exportToPdf(exportRows, packMetadata);
      await logAudit(token, "EXPORT", {
        pack: packMetadata.name,
        format: exportFormat,
        wordCount: exportRows.length,
        selection: selectedRows.length > 0,
      });
    } catch (err) {
      console.error(err);
      alert(t("editor.errors.export"));
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
        wordType: suggestWordType,
        customPrompt: suggestCustomPrompt.trim() || undefined,
        targetLang: packMetadata.targetLang || "en",
      }, token, activePack?.fileName);

      setSuggestedWords(
        suggestions.map((word) => ({
          word,
          selected: true,
        })),
      );

      setShowSuggestionsDialog(true);
    } catch (err) {
      console.error(err);

      alert(t("editor.errors.suggestions"));
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
      [exTargetField]: "",
      [exNativeField]: "",
      topic: packMetadata.category || "",
    };
    saveHistory();
    setRows((prev) => [...prev, newRow]);
  }, [packMetadata, saveHistory]);

  useEffect(() => {
    fetch(`${API_BASE}/api/packs/tags`)
      .then(r => r.json())
      .then(setAvailableTags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activePack) {
      onTargetLangDetected?.(null);
      onNativeLangDetected?.(null);
      return;
    }

    const packBase = activePack.packDbId
      ? `${API_BASE}/api/packs/by-id/${activePack.packDbId}`
      : `${API_BASE}/api/packs/${activePack.fileName}`;

    fetch(packBase, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(async (data) => {
        setPackData(data);
        const serverRows = (data.words || []).map((w) => ({
          ...w,
          id: w.id || crypto.randomUUID(),
        }));
        const loadedMeta = {
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
          color: data.color || "",
          encoding: data.encoding || "utf-8",
          production: typeof data.production === "number" ? data.production : 0,
        };
        setPackMetadata(loadedMeta);
        lastSavedMetadataRef.current = loadedMeta;
        onTargetLangDetected?.(loadedMeta.targetLang ?? null);
        onNativeLangDetected?.(loadedMeta.nativeLang ?? null);

        if (activePack.fileName && !activePack.packDbId) {
          const [localDraft, serverDraftRes] = await Promise.all([
            loadRecovery(activePack.fileName).catch(() => null),
            fetch(`${API_BASE}/api/packs/${activePack.fileName}/autosave`, {
              headers: { "Authorization": `Bearer ${token}` },
            }).then((r) => r.ok ? r.json() : null).catch(() => null),
          ]);
          const best = serverDraftRes
            ? { ...serverDraftRes, source: "server" }
            : localDraft
              ? { ...localDraft, source: "local" }
              : null;
          if (best?.rows?.length) {
            setRows(serverRows);
            setRecoveryDraft(best);
            setShowRecoveryDialog(true);
            return;
          }
        }
        setRows(serverRows);
      })
      .catch((err) => {
        console.error(err);
      });

    fetch(`${packBase}/word-reviews`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setWordReviews(Array.isArray(data) ? data : []))
      .catch(() => setWordReviews([]));
  }, [activePack, token]);

  const handleAddReview = useCallback(async ({ word_id, word, action, comment }) => {
    if (!activePack?.fileName) return;
    const packBase = activePack.packDbId
      ? `${API_BASE}/api/packs/by-id/${activePack.packDbId}`
      : `${API_BASE}/api/packs/${activePack.fileName}`;
    const res = await fetch(`${packBase}/word-reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ word_id, word, action, comment }),
    });
    if (res.status === 401) { handleUnauthorized(); return; }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveStatus(t("editor.status.reviewError")(data.error || res.status));
      setTimeout(() => setSaveStatus(""), 6000);
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const newReview = await res.json();
    setWordReviews((prev) => [newReview, ...prev]);

    const api = gridRef.current?.api;
    const cur = selectedRowIndexRef.current;
    if (api && cur !== null) {
      const next = cur + 1;
      if (next < api.getDisplayedRowCount()) {
        const node = api.getDisplayedRowAtIndex(next);
        if (node) {
          api.deselectAll();
          node.setSelected(true);
          api.ensureIndexVisible(next, "middle");
          setSelectedRowIndex(next);
        }
      }
    }

    if (newReview.autoStatus === "Approved" && user?.role === "reviewer") {
      setShowApprovedModal(true);
    } else if (newReview.autoStatus) {
      setSaveStatus(t("editor.status.packStatus")(newReview.autoStatus));
      setTimeout(() => setSaveStatus(""), 7000);
    }
  }, [activePack, token, handleUnauthorized]);

  handleAddReviewRef.current = handleAddReview;

  useEffect(() => {
    if (user?.role !== "reviewer") return;
    function onKey(e) {
      if (!e.ctrlKey || e.key.toLowerCase() !== "a") return;
      e.preventDefault();
      const api = gridRef.current?.api;
      const cur = selectedRowIndexRef.current;
      if (!api || cur === null) return;
      const node = api.getDisplayedRowAtIndex(cur);
      if (!node?.data?.id || !node?.data?.word) return;
      handleAddReviewRef.current({ word_id: node.data.id, word: node.data.word, action: "OK", comment: null });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user?.role]);

  const handleReviewAgain = useCallback(async () => {
    if (!activePack) return;
    const statusUrl = activePack.packDbId
      ? `${API_BASE}/api/packs/by-id/${activePack.packDbId}/status`
      : `${API_BASE}/api/packs/${activePack.fileName}/status`;
    try {
      await fetch(statusUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "In Review" }),
      });
    } catch {}
    setShowApprovedModal(false);
  }, [activePack, token]);

  const handleDeleteReview = useCallback(async (id) => {
    if (!activePack?.fileName) return;
    const packBase = activePack.packDbId
      ? `${API_BASE}/api/packs/by-id/${activePack.packDbId}`
      : `${API_BASE}/api/packs/${activePack.fileName}`;
    const res = await fetch(`${packBase}/word-reviews/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (res.ok) {
      setWordReviews((prev) => prev.filter((r) => r.id !== id));
    }
  }, [activePack, token]);

  useEffect(() => {
    if (!(settings.autosaveEnabled ?? true)) return;
    if (!activePack?.fileName || activePack.packDbId) return;
    const t = setTimeout(() => {
      saveRecovery(activePack.fileName, rows).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [rows, activePack, settings.autosaveEnabled]);

  useEffect(() => {
    const enabled = settings.autosaveEnabled ?? true;
    const intervalMin = settings.autosaveInterval ?? 2;
    if (!enabled || !activePack?.fileName || activePack.packDbId || isReadOnly) return;
    const id = setInterval(() => {
      fetch(`${API_BASE}/api/packs/${activePack.fileName}/autosave`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ rows: rowsRef.current, savedAt: new Date().toISOString() }),
      }).catch(() => {});
    }, intervalMin * 60 * 1000);
    return () => clearInterval(id);
  }, [activePack, token, isReadOnly, settings.autosaveEnabled, settings.autosaveInterval]);

  // Počas písania — len vizuálne označí riadok, bez skákania
  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    if (!quickFilter) { api.deselectAll(); return; }
    const q = quickFilter.toLowerCase();
    let found = null;
    api.forEachNode((node) => {
      if (!found) {
        const word = (node.data?.word ?? "").toLowerCase();
        const trans = (node.data?.translation ?? "").toLowerCase();
        if (word.includes(q) || trans.includes(q)) found = node;
      }
    });
    if (found) { api.deselectAll(); found.setSelected(true); }
    else api.deselectAll();
  }, [quickFilter]);

  // Enter — skočí na riadok a presunie kurzor do bunky
  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    if (!committedFilter) {
      api.deselectAll();
      return;
    }
    const q = committedFilter.toLowerCase();
    let found = null;
    api.forEachNode((node) => {
      if (!found) {
        const word = (node.data?.word ?? "").toLowerCase();
        const trans = (node.data?.translation ?? "").toLowerCase();
        if (word.includes(q) || trans.includes(q)) found = node;
      }
    });
    if (found) {
      api.ensureIndexVisible(found.rowIndex, "middle");
      api.setFocusedCell(found.rowIndex, "word");
      api.deselectAll();
      found.setSelected(true);
      setSelectedRowIndex(found.rowIndex);
    }
  }, [committedFilter]);

  useLayoutEffect(() => {
    const el = contextMenuRef.current;
    if (!contextMenu.visible || !el) return;
    const rect = el.getBoundingClientRect();
    const pad  = 8;
    let top  = contextMenu.y;
    let left = contextMenu.x;
    if (top  + rect.height > window.innerHeight - pad) top  = Math.max(pad, window.innerHeight - rect.height - pad);
    if (left + rect.width  > window.innerWidth  - pad) left = Math.max(pad, window.innerWidth  - rect.width  - pad);
    el.style.top        = top  + "px";
    el.style.left       = left + "px";
    el.style.visibility = "visible";
  }, [contextMenu.visible, contextMenu.y, contextMenu.x]);

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

      if (isCtrl && event.key.toLowerCase() === "c") {
        const isEditing = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
        if (!isEditing) {
          event.preventDefault();
          handleCopyRowsKbd();
        }
      }

      if (isCtrl && event.key.toLowerCase() === "v") {
        const isEditing = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
        if (!isEditing) {
          event.preventDefault();
          handlePasteRowKbd();
        }
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
        setShowQualityMenu(false);
        setShowSuggestionsDialog(false);
        setShowSuggestConfirm(false);
        setShowImportDialog(false);
      }

      if (event.key === "Delete" && (selectedRows.length > 0 || selectedRowIndex !== null)) {
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


      if (event.ctrlKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        quickFilterRef.current?.focus();
      }

      if ((event.key === "PageUp" || event.key === "PageDown") &&
          document.activeElement?.closest(".ag-root-wrapper") &&
          document.activeElement !== quickFilterRef.current) {
        event.preventDefault();
        const api = gridRef.current?.api;
        if (!api) return;
        const total = api.getDisplayedRowCount();
        if (!total) return;
        const current = selectedRowIndex ?? 0;
        const viewport = document.querySelector(".ag-center-cols-viewport");
        const pageSize = viewport ? Math.max(5, Math.floor(viewport.clientHeight / 42)) : 15;
        const next = event.key === "PageUp"
          ? Math.max(0, current - pageSize)
          : Math.min(total - 1, current + pageSize);
        if (next !== current) {
          const node = api.getDisplayedRowAtIndex(next);
          if (node) {
            api.deselectAll();
            node.setSelected(true);
            api.ensureIndexVisible(next, "middle");
            api.setFocusedCell(next, "word");
            setSelectedRowIndex(next);
          }
        }
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
    handleCopyRowsKbd,
    handlePasteRowKbd,
    selectedRowIndex,
    selectedRows,
  ]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleGenerateSelected();
      }

      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        const cell = gridRef.current?.api?.getFocusedCell();
        if (cell) {
          const node = gridRef.current.api.getDisplayedRowAtIndex(cell.rowIndex);
          if (node?.data?.id) openBookmarkPopover(String(node.data.id));
        }
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        handleBulkGenerate();
      }
      if (e.key === "Escape") {
        setShowFillMenu(false);
        setShowQualityMenu(false);
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
        if (!isReadOnly) handleSave();
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

  function handleRecoveryRestore() {
    if (recoveryDraft?.rows) setRows(recoveryDraft.rows);
    setShowRecoveryDialog(false);
    setRecoveryDraft(null);
    if (activePack?.fileName && !activePack.packDbId) {
      clearRecovery(activePack.fileName).catch(() => {});
      fetch(`${API_BASE}/api/packs/${activePack.fileName}/autosave`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  function handleRecoveryDiscard() {
    setShowRecoveryDialog(false);
    setRecoveryDraft(null);
    if (activePack?.fileName && !activePack.packDbId) {
      clearRecovery(activePack.fileName).catch(() => {});
      fetch(`${API_BASE}/api/packs/${activePack.fileName}/autosave`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  return (
    <div className="app">
      {showRecoveryDialog && (
        <RecoveryDialog
          draft={recoveryDraft}
          onRestore={handleRecoveryRestore}
          onDiscard={handleRecoveryDiscard}
        />
      )}
      {showApprovedModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
          <div style={{ background:"var(--app-panel)", border:"1px solid var(--app-border-sub)", borderRadius:12, width:420, padding:"28px 28px 22px", display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--app-text2)" }}>{t("review.approvedModal.title")}</div>
            <div style={{ fontSize:13, color:"var(--app-muted)", lineHeight:1.6 }}>
              {t("review.approvedModal.desc")}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:4 }}>
              <button
                style={{ padding:"8px 16px", borderRadius:6, border:"1px solid var(--app-border-sub)", background:"transparent", color:"var(--app-text2)", cursor:"pointer", fontSize:13 }}
                onClick={handleReviewAgain}
              >
                {t("review.approvedModal.reviewAgain")}
              </button>
              <button
                style={{ padding:"8px 16px", borderRadius:6, border:"none", background:"#16a34a", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}
                onClick={() => setShowApprovedModal(false)}
              >
                {t("review.approvedModal.sendToPublish")}
              </button>
            </div>
          </div>
        </div>
      )}

      <PdfReaderDialog
        open={showPdfReader}
        onClose={() => setShowPdfReader(false)}
        onAddWord={handleAddWordFromPdf}
        existingWords={rows.map((r) => r.word).filter(Boolean)}
      />

      <WebReaderDialog
        open={showWebReader}
        onClose={() => setShowWebReader(false)}
        onAddWord={handleAddWordFromPdf}
        existingWords={rows.map((r) => r.word).filter(Boolean)}
        token={token}
      />

      <SymbolsDialog open={showSymbols} onClose={() => setShowSymbols(false)} onInsert={handleInsertSymbol} />

      <ImageGenDialog
        open={showImgGen}
        onClose={() => setShowImgGen(false)}
        packName={packMetadata.name}
        packCategory={packMetadata.category}
        token={token}
        onApply={(resizedDataUrl) => {
          setPackMetadata(prev => ({ ...prev, icon: resizedDataUrl }));
          if (token && activePack?.fileName) {
            fetch(`${API_BASE}/api/packs/${activePack.fileName}/icon`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ icon: resizedDataUrl }),
            }).catch(console.warn);
          }
        }}
      />

      {cefrCheckData && (
        <CefrCheckDialog
          results={cefrCheckData.results}
          total={cefrCheckData.total}
          packLevel={cefrCheckData.packLevel}
          onClose={() => setCefrCheckData(null)}
          onApply={(rowId, aiLevel) => {
            saveHistory();
            setRows((prev) =>
              prev.map((r) => r.id === rowId ? { ...r, level: aiLevel } : r)
            );
            setCefrCheckData((prev) => ({
              ...prev,
              results: prev.results.map((r) =>
                r.id === rowId ? { ...r, assignedLevel: aiLevel, match: true } : r
              ),
            }));
          }}
        />
      )}

      {showDomainCheck && (
        <DomainCheckDialog
          rows={rows}
          category={packMetadata.category}
          onClose={() => setShowDomainCheck(false)}
          onNavigate={(rowId, field) => {
            const api = gridRef.current?.api;
            if (!api) return;
            const node = api.getRowNode(String(rowId));
            if (!node) return;
            api.ensureIndexVisible(node.rowIndex, "middle");
            api.setFocusedCell(node.rowIndex, field);
            api.startEditingCell({ rowIndex: node.rowIndex, colKey: field });
          }}
        />
      )}

      {showTrustedSource && (() => {
        const currentRow = selectedRowIndex !== null ? rows[selectedRowIndex] : null;
        const initialWord = currentRow?.word ?? "";
        const neighborWords = rows
          .filter((r) => r.id !== currentRow?.id && r.word?.trim())
          .map((r) => r.word.trim())
          .slice(0, 20);
        return (
          <TrustedSourceDialog
            initialWord={initialWord}
            packCategory={packMetadata.category || packMetadata.name}
            packLevel={packMetadata.level}
            neighborWords={neighborWords}
            apiBase={API_BASE}
            token={token}
            onClose={() => setShowTrustedSource(false)}
          />
        );
      })()}

      {packCoverageData && (
        <PackCoverageDialog
          data={packCoverageData}
          onClose={() => setPackCoverageData(null)}
          onNavigate={(rowId) => {
            const api = gridRef.current?.api;
            if (!api) return;
            const node = api.getRowNode(String(rowId));
            if (!node) return;
            api.ensureIndexVisible(node.rowIndex, "middle");
            api.setFocusedCell(node.rowIndex, "word");
          }}
        />
      )}

      {isPackCoverageChecking && (
        <LoadingOverlay
          title="Analýza pokrytia balíka"
          subtitle="AI klasifikuje slová do tematických skupín…"
        />
      )}

      {duplicateMeaningData && (
        <DuplicateMeaningDialog
          groups={duplicateMeaningData}
          onClose={() => setDuplicateMeaningData(null)}
          onNavigate={(rowId) => {
            const api = gridRef.current?.api;
            if (!api) return;
            const node = api.getRowNode(String(rowId));
            if (!node) return;
            api.ensureIndexVisible(node.rowIndex, "middle");
            api.setFocusedCell(node.rowIndex, "word");
          }}
        />
      )}

      {isDuplicateMeaningChecking && (
        <LoadingOverlay
          title="Detektor duplicitných významov"
          subtitle="AI porovnáva sémantické významy slov…"
        />
      )}

      {exampleCheckData && (
        <ExampleCheckDialog
          results={exampleCheckData.results}
          total={exampleCheckData.total}
          targetLang={packMetadata.targetLang || "en"}
          onClose={() => setExampleCheckData(null)}
          onApply={(rowId, suggestion) => {
            saveHistory();
            setRows((prev) =>
              prev.map((r) => r.id === rowId ? { ...r, [exTargetField]: suggestion } : r)
            );
            setExampleCheckData((prev) => ({
              ...prev,
              results: prev.results.map((r) =>
                r.id === rowId ? { ...r, quality: "ok", example: suggestion, suggestion: null } : r
              ),
            }));
          }}
        />
      )}

      {isExampleChecking && (
        <LoadingOverlay
          current={exampleProgress.current}
          total={exampleProgress.total}
          title="Kontrola príkladov"
          subtitle="AI hodnotí kvalitu viet…"
        />
      )}

      {spellCheckResults !== null && (
        <SpellCheckDialog
          results={spellCheckResults}
          onClose={() => setSpellCheckResults(null)}
          onApply={(rowId, field, wrongWord, correction) => {
            saveHistory();
            setRows(prev => prev.map(r => {
              if (r.id !== rowId) return r;
              const updated = String(r[field] ?? "").replaceAll(wrongWord, correction);
              return { ...r, [field]: updated };
            }));
          }}
          onNavigate={(rowId, field) => {
            const api = gridRef.current?.api;
            if (!api) return;
            const node = api.getRowNode(String(rowId));
            if (!node) return;
            api.ensureIndexVisible(node.rowIndex, "middle");
            api.setFocusedCell(node.rowIndex, field);
            api.startEditingCell({ rowIndex: node.rowIndex, colKey: field });
          }}
        />
      )}

      <BookmarkNotePopover
        open={!!bookmarkPopover}
        rowId={bookmarkPopover?.rowId}
        existingNote={bookmarkPopover ? (bookmarks[bookmarkPopover.rowId]?.note ?? "") : ""}
        isBookmarked={bookmarkPopover ? isBookmarked(bookmarkPopover.rowId) : false}
        onSave={handleBookmarkSave}
        onRemove={handleBookmarkRemove}
        onClose={() => setBookmarkPopover(null)}
      />

      {isGenerating && (
        <LoadingOverlay
          current={generationProgress.current}
          total={generationProgress.total}
        />
      )}

      {isCefrChecking && (
        <LoadingOverlay
          title="Kontrola CEFR úrovní"
          subtitle="AI posudzuje každé slovo — chvíľku strpenia…"
          current={cefrProgress.current}
          total={cefrProgress.total}
        />
      )}

      {contextMenu.visible && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 8999 }}
            onClick={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
          />
          <div
            ref={contextMenuRef}
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              visibility: "hidden",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 10,
              padding: 6,
              zIndex: 9000,
              minWidth: 180,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              fontFamily: "Calibri, sans-serif",
              fontSize: 12,
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

            <ContextMenuItem label={t("editor.contextMenu.copy")} shortcut="Ctrl+C" onClick={handleCopyCell} />
            <ContextMenuItem label={t("editor.contextMenu.cut")} shortcut="Ctrl+X" onClick={handleCutCell} />
            <ContextMenuItem label={t("editor.contextMenu.paste")} shortcut="Ctrl+V" onClick={handlePasteCell} />

            <div style={{ borderTop: "1px solid #334155", margin: "4px 0" }} />
            <ContextMenuItem label={t("editor.contextMenu.copyRow")} icon="⎘" onClick={handleCopyRow} />
            <ContextMenuItem label={t("editor.contextMenu.cutRow")} icon="✂" onClick={handleCutRow} />
            <ContextMenuItem
              label={clipboardRows.length > 0
                ? clipboardRows.length === 1
                  ? `${t("editor.contextMenu.pasteRow")}${clipboardRows[0].word ? ` „${clipboardRows[0].word}"` : ""}`
                  : `${t("editor.contextMenu.pasteRow")} (${clipboardRows.length})`
                : t("editor.contextMenu.pasteRowNoData")}
              icon="⎗"
              onClick={handlePasteRow}
              disabled={!clipboardRows.length}
            />

            {contextMenu.isFillable && (
              <>
                <div style={{ borderTop: "1px solid #334155", margin: "4px 0" }} />
                <ContextMenuItem label={t("editor.contextMenu.fillWithAI")} icon="✨" onClick={handleFillCellWithAI} />
              </>
            )}

            {(contextMenu.field === "word" || contextMenu.field === "translation") &&
             contextMenu.rowData?.[contextMenu.field] && (() => {
              const isWord   = contextMenu.field === "word";
              const fromLang = isWord ? (packMetadata.targetLang || "en") : (packMetadata.nativeLang || "sk");
              const toLang   = isWord ? (packMetadata.nativeLang  || "sk") : (packMetadata.targetLang || "en");
              const srcField = contextMenu.field;
              const dstField = isWord ? "translation" : "word";
              return (
                <>
                  <div style={{ borderTop: "1px solid #334155", margin: "4px 0" }} />
                  <ContextMenuItem
                    label={isTranslating ? t("editor.contextMenu.translating") : t("editor.contextMenu.translateInsert")}
                    icon={<DeeplIcon />}
                    onClick={() => handleTranslateDirect(srcField, dstField, fromLang, toLang)}
                  />
                  <ContextMenuItem label={t("editor.contextMenu.deepl")}  icon={<DeeplIcon />} onClick={() => handleTranslateWord("deepl")} />
                  <ContextMenuItem label={t("editor.contextMenu.google")} icon={<GoogleTranslateIcon />} onClick={() => handleTranslateWord("google")} />
                </>
              );
            })()}

            <div style={{ borderTop: "1px solid #334155", margin: "4px 0" }} />
            <ContextMenuItem
              label={bookmarks[String(contextMenu.rowData?.id)] ? t("editor.contextMenu.bookmarkEdit") : t("editor.contextMenu.bookmarkAdd")}
              icon="⚑"
              shortcut="Ctrl+B"
              onClick={() => {
                const id = contextMenu.rowData?.id;
                setContextMenu((prev) => ({ ...prev, visible: false }));
                if (id != null) openBookmarkPopover(String(id));
              }}
            />
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

      <ExportDialog
        open={showExportDialog}
        format={exportFormat}
        setFormat={setExportFormat}
        onCancel={() => setShowExportDialog(false)}
        onExport={handleExport}
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

          const newRows = selected.map((item) => {
            const { article, word } = splitArticle(item.word, packMetadata.targetLang || "en");
            return {
            id: crypto.randomUUID(),
            word,
            article,
            phonetic: "",
            translation: "",
            definition: "",
            type: "",
            level: packMetadata.level,
            [exTargetField]: "",
            [exNativeField]: "",
            topic: packMetadata.category,
          };
          });
          saveHistory();
          setRows([...rows, ...newRows]);

          setShowSuggestionsDialog(false);
        }}
      />

      {showSuggestConfirm && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-title">{t("editor.suggestConfirm.title")}</div>
            <div className="dialog-desc">
              {t("editor.suggestConfirm.desc")(packMetadata.category || "—", packMetadata.level || "—")}
            </div>
            <div className="dialog-section">
              <div className="dialog-label">{t("editor.suggestConfirm.pack")}</div>
              <div>{packMetadata.name || "—"}</div>
            </div>
            <div className="dialog-section">
              <div className="dialog-label">{t("editor.suggestConfirm.existing")}</div>
              <div>{rows.filter((r) => r.word).length}</div>
            </div>
            <div className="dialog-section">
              <div className="dialog-label">{t("editor.suggestConfirm.wordType")}</div>
              <select
                value={suggestWordType}
                onChange={(e) => setSuggestWordType(e.target.value)}
              >
                <option value="mix">Mix (ľubovoľný)</option>
                <option value="noun">Podstatné meno (noun)</option>
                <option value="verb">Sloveso (verb)</option>
                <option value="adjective">Prídavné meno (adjective)</option>
                <option value="adverb">Príslovka (adverb)</option>
                <option value="phrase">Fráza (phrase)</option>
                <option value="idiom">Idiom (idiom)</option>
              </select>
            </div>
            <div className="dialog-section">
              <div className="dialog-label">{t("editor.suggestConfirm.customPrompt")}</div>
              <input
                className="dialog-input"
                type="text"
                value={suggestCustomPrompt}
                onChange={(e) => setSuggestCustomPrompt(e.target.value)}
                placeholder={t("editor.suggestConfirm.customPromptPlaceholder")}
                onKeyDown={(e) => { if (e.key === "Enter") handleSuggestWords(); }}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowSuggestConfirm(false)}>
                {t("common.cancel")}
              </button>
              <button onClick={handleSuggestWords}>{t("editor.suggestConfirm.generate")}</button>
            </div>
          </div>
        </div>
      )}


      {/* HEADER */}
      <header className="header">
        <div className="logo">Vocabulary Pack Editor</div>

        <div className="toolbar">
          <div className="toolbar-group">
            <div className="toolbar-links">
              <button className="btn-link" onClick={() => openOrFocus("dwds", "https://www.dwds.de")}>
                <img src="/lexipack/favicons/dwds.ico" alt="" width={18} height={18} />
                <span>DWDS</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("duden", "https://www.duden.de/")}>
                <img src="/lexipack/favicons/duden.png" alt="" width={18} height={18} />
                <span>Duden</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("larousse", "https://www.larousse.fr/dictionnaires/francais-monolingue")}>
                <img src="/lexipack/favicons/larousse.png" alt="" width={18} height={18} />
                <span>Larousse</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("lerobert", "https://dictionnaire.lerobert.com/en/definition/dire")}>
                <img src="/lexipack/favicons/lerobert.png" alt="" width={18} height={18} />
                <span>leRobert</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("deepl", "https://www.deepl.com/en/translator")}>
                <img src="/lexipack/favicons/deepl.ico" alt="" width={18} height={18} />
                <span>DeepL</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("verbformen", "https://www.verbformen.com/")}>
                <img src="/lexipack/favicons/verbformen.ico" alt="" width={18} height={18} />
                <span>VerbF.</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("oxford", "https://www.oxfordlearnersdictionaries.com/")}>
                <img src="/lexipack/favicons/oxford.ico" alt="" width={18} height={18} />
                <span>Oxford</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("cambridge", "https://dictionary.cambridge.org/")}>
                <img src="/lexipack/favicons/cambridge.ico" alt="" width={18} height={18} />
                <span>Cambr.</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("wikipedia", "https://en.wikipedia.org/wiki/Main_Page")}>
                <img src="/lexipack/favicons/wikipedia.ico" alt="" width={18} height={18} />
                <span>Wiki</span>
              </button>
            </div>
            <div className="toolbar-links toolbar-links-ai">
              <button className="btn-link" onClick={() => openOrFocus("gemini", "https://gemini.google.com/")}>
                <img src="/lexipack/favicons/gemini.png" alt="" width={18} height={18} />
                <span>Gemini</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("claude", "https://claude.ai/")}>
                <img src="/lexipack/favicons/claude.png" alt="" width={18} height={18} />
                <span>Claude</span>
              </button>
              <button className="btn-link" onClick={() => openOrFocus("chatgpt", "https://chatgpt.com/")}>
                <img src="/lexipack/favicons/chatgpt.png" alt="" width={18} height={18} />
                <span>ChatGPT</span>
              </button>
            </div>
            <div style={{ position: "relative", marginLeft: 20 }}>
              <button onClick={() => setShowQualityMenu((v) => !v)}>
                {t("editor.toolbar.quality")} ▼
              </button>
              {showQualityMenu && (
                <>
                <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowQualityMenu(false)} />
                <div className="dropdown-menu" style={{ right: 0, left: "auto", minWidth: 240, zIndex: 100 }}>
                  <button
                    className="dropdown-item"
                    onClick={handleSpellCheck}
                    disabled={isSpellChecking}
                  >
                    {isSpellChecking ? t("editor.quality.spellChecking") : t("editor.quality.spellCheck")}
                  </button>
                  <div style={{ height: 1, background: "var(--app-border, #334155)", margin: "4px 0" }} />
                  <button
                    className="dropdown-item"
                    onClick={() => { setShowQualityMenu(false); setShowDomainCheck(true); }}
                  >
                    {t("editor.quality.domainConsistency")}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={handleCefrCheck}
                    disabled={isCefrChecking}
                  >
                    {isCefrChecking ? "Kontrolujem…" : t("editor.quality.levelConsistency")}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={handleExampleCheck}
                    disabled={isExampleChecking}
                  >
                    {isExampleChecking ? "Kontrolujem príklady…" : t("editor.quality.exampleQuality")}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={handleDuplicateMeaningCheck}
                    disabled={isDuplicateMeaningChecking}
                  >
                    {isDuplicateMeaningChecking ? "Hľadám duplikáty…" : t("editor.quality.duplicateMeaning")}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={handlePackCoverage}
                    disabled={isPackCoverageChecking}
                  >
                    {isPackCoverageChecking ? "Analyzujem pokrytie…" : t("editor.quality.packCoverage")}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => { setShowQualityMenu(false); setShowTrustedSource(true); }}
                  >
                    {t("editor.quality.trustedSource")}
                  </button>
                </div>
                </>
              )}
            </div>
            <button onClick={() => xlsxInputRef.current.click()}>Import</button>
            <button onClick={() => setShowExportDialog(true)}>Export</button>
            <button className="btn-save" onClick={handleSave} disabled={isReadOnly}>
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
            apiBase={API_BASE}
            token={token}
            fileName={activePack?.fileName}
          />

          {isReadOnly && (
            <div style={{
              background: "#7c3aed22",
              border: "1px solid #7c3aed",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              color: "#c4b5fd",
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "4px 0",
            }}>
              <span>🔒</span>
              <span>{t("review.readOnly")}</span>
            </div>
          )}

          <div className="validation-summary">
            <div className="validation-left">
              <button
                className="btn-icon"
                onClick={handleUndo}
                disabled={isReadOnly || history.length === 0}
                title={history.length === 0 ? t("editor.toolbar.nothingToUndo") : t("editor.toolbar.undo")}
              >
                <span className="btn-icon-glyph">↺</span>
                <span className="btn-icon-label">{t("editor.toolbar.undo")}</span>
              </button>

              <button
                className="btn-icon"
                onClick={handleRedo}
                disabled={isReadOnly || future.length === 0}
                title={future.length === 0 ? t("editor.toolbar.nothingToRedo") : t("editor.toolbar.redo")}
              >
                <span className="btn-icon-glyph">↻</span>
                <span className="btn-icon-label">{t("editor.toolbar.redo")}</span>
              </button>

              <div className="toolbar-divider" />

              <button className="btn-icon" onClick={handleAddRow} disabled={isReadOnly} style={{ marginLeft: 10, background: "#2563eb", color: "#fff" }}>
                <span className="btn-icon-glyph">✚</span>
                <span className="btn-icon-label">{t("editor.toolbar.addRow")}</span>
              </button>
              <button className="btn-icon" onClick={handleDeleteSelected} disabled={isReadOnly || (selectedRows.length === 0 && selectedRowIndex === null)} style={{ background: "#7f1d1d", color: "#fca5a5" }}>
                <span className="btn-icon-glyph">✕</span>
                <span className="btn-icon-label">{t("editor.toolbar.deleteRow")}</span>
              </button>
              <button className="btn-icon" onClick={() => setShowPdfReader(true)} style={{ background: "#2563eb", color: "#fff" }}>
                <span className="btn-icon-glyph">
                  <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1h10l6 6v12a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z" fill="#fff" fillOpacity=".15" stroke="#93c5fd" strokeWidth="1.2"/>
                    <path d="M11 1l6 6h-5a1 1 0 01-1-1V1z" fill="#93c5fd" fillOpacity=".5"/>
                    <text x="9" y="15.5" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#f87171" fontFamily="sans-serif" letterSpacing="0.3">PDF</text>
                  </svg>
                </span>
                <span className="btn-icon-label">{t("editor.toolbar.readPdf")}</span>
              </button>
              <button className="btn-icon" onClick={() => setShowWebReader(true)} style={{ background: "#065f46", color: "#6ee7b7" }}>
                <span className="btn-icon-glyph">🌐</span>
                <span className="btn-icon-label">{t("webReader.title")}</span>
              </button>
              <button
                className="btn-icon"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowSymbols(true)}
                disabled={!hasActiveInput}
                title={hasActiveInput ? t("editor.toolbar.symbolsReady") : t("editor.toolbar.symbolsHint")}
                style={{ background: "#2563eb", color: "#fff" }}
              >
                <span className="btn-icon-glyph">Ω</span>
                <span className="btn-icon-label">{t("editor.toolbar.symbols")}</span>
              </button>
              <div className="toolbar-divider" />

              <button
                className="btn-icon"
                onClick={() => {
                  const cell = gridRef.current?.api?.getFocusedCell();
                  if (cell) {
                    const node = gridRef.current.api.getDisplayedRowAtIndex(cell.rowIndex);
                    if (node?.data?.id) openBookmarkPopover(String(node.data.id));
                  } else if (selectedRowIndex !== null) {
                    const node = gridApi?.getDisplayedRowAtIndex(selectedRowIndex);
                    if (node?.data?.id) openBookmarkPopover(String(node.data.id));
                  }
                }}
                disabled={selectedRowIndex === null}
                title="Pridať / upraviť bookmark (Ctrl+B)"
                style={{ background: "#2563eb", color: "#fff" }}
              >
                <span className="btn-icon-glyph">⚑</span>
                <span className="btn-icon-label">Bookmark</span>
              </button>
              <button
                className="btn-icon"
                onClick={handleBookmarkPrev}
                disabled={orderedIds.length === 0}
                title="Predchádzajúci bookmark"
              >
                <span className="btn-icon-glyph">◀</span>
                <span className="btn-icon-label">Prev</span>
              </button>
              <button
                className="btn-icon"
                onClick={handleBookmarkNext}
                disabled={orderedIds.length === 0}
                title="Nasledujúci bookmark"
              >
                <span className="btn-icon-glyph">▶</span>
                <span className="btn-icon-label">Next</span>
              </button>

              <div className="toolbar-divider" />

              <button className="btn-icon" onClick={handleGenerateSelected} style={{ marginLeft: 10, background: "#5e419c", color: "#fff" }}>
                <span className="btn-icon-glyph">✨</span>
                <span className="btn-icon-label">{t("editor.toolbar.generateAI")}</span>
              </button>
              <button
                className="btn-icon"
                onClick={handleBulkGenerate}
                disabled={selectedRows.length === 0}
                title={selectedRows.length === 0 ? t("editor.toolbar.selectFirst") : t("editor.toolbar.selectedCount")(selectedRows.length)}
                style={{ background: "#5e419c", color: "#fff" }}
              >
                <span className="btn-icon-glyph">⚡</span>
                <span className="btn-icon-label">{t("editor.toolbar.genSelected")}</span>
              </button>
              <div className="dropdown-wrapper">
                <button
                  className="btn-icon"
                  type="button"
                  disabled={selectedRows.length === 0}
                  onClick={() => setShowFillMenu(!showFillMenu)}
                  style={{ background: "#5e419c", color: "#fff" }}
                >
                  <span className="btn-icon-glyph">▦</span>
                  <span className="btn-icon-label">{t("editor.toolbar.fillColumn")} ▼</span>
                </button>
                {showFillMenu && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowFillMenu(false)} />
                    <div className="dropdown-menu" style={{ zIndex: 100 }}>
                      {fillableColumns.map((column) => (
                        <button
                          key={column.field}
                          type="button"
                          onClick={() => { handleGenerateColumn(column.field); setShowFillMenu(false); }}
                        >
                          {column.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                className="btn-icon"
                onClick={handleGenerateTopic}
                disabled={selectedRows.length === 0}
                title={selectedRows.length === 0 ? t("editor.toolbar.selectFirst") : t("editor.toolbar.selectedCount")(selectedRows.length)}
                style={{ background: "#5e419c", color: "#fff" }}
              >
                <span className="btn-icon-glyph">🏷</span>
                <span className="btn-icon-label">{t("editor.toolbar.genTopic")}</span>
              </button>
              <button className="btn-icon" onClick={() => setShowSuggestConfirm(true)} style={{ background: "#5e419c", color: "#fff" }}>
                <span className="btn-icon-glyph">💡</span>
                <span className="btn-icon-label">{t("editor.toolbar.suggestWords")}</span>
              </button>

              <div className="toolbar-divider" />

              <button className="btn-icon" onClick={handleGoTo} title="Go to last edited cell" style={{ marginLeft: 10 }}>
                <span className="btn-icon-glyph">⏮</span>
                <span className="btn-icon-label">Goto Last</span>
              </button>
              <button
                className="btn-icon"
                onClick={() => { setShowGoToSearch(v => !v); setTimeout(() => goToInputRef.current?.focus(), 50); }}
              >
                <span className="btn-icon-glyph">🔍</span>
                <span className="btn-icon-label">GoTo</span>
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

              <div className="toolbar-divider" />
              <button
                className="btn-icon"
                onClick={() => setShowImgGen(true)}
                title="Generovať obrázok"
              >
                <img src={pureIcon} className="btn-icon-glyph" style={{ width: "1.8rem", height: "1.8rem", objectFit: "contain" }} alt="" />
                <span className="btn-icon-label">OBR</span>
              </button>
            </div>

            <div className="validation-right">
              <div className="validation-box">{t("editor.validation.total")}: {rows.length}</div>

              <div
                className="validation-box invalid clickable"
                onClick={focusFirstInvalidRow}
              >
                {t("editor.validation.invalid")}: {invalidRows.length}
              </div>

              <div
                className="validation-box duplicate clickable"
                onClick={focusFirstDuplicateRow}
              >
                {t("editor.validation.duplicates")}: {duplicateWords.length}
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
              bookmarks={bookmarks}
              isReadOnly={isReadOnly}
              targetLang={packMetadata.targetLang || "en"}
              nativeLang={packMetadata.nativeLang || "sk"}
            />
          </div>
        </section>

        {/* RIGHT PANEL TOGGLE — zobrazí sa keď je panel skrytý */}
        {!showRightPanel && (
          <button className="preview-panel-toggle" onClick={() => setShowRightPanel(true)} title={t("review.previewPanel")}>
            ‹
          </button>
        )}

        {/* RIGHT PANEL */}
        {showRightPanel && <aside className="preview-panel">
          <div className="panel-title">
            {t("review.previewPanel")}
            <button className="panel-title-close" onClick={() => setShowRightPanel(false)} title="Zavrieť panel">✕</button>
          </div>

          <PackPreview
            row={selectedRow}
            reviews={wordReviews}
            onAddReview={handleAddReview}
            onDeleteReview={handleDeleteReview}
            userRole={user?.role}
            targetLang={packMetadata.targetLang || "en"}
            nativeLang={packMetadata.nativeLang || "sk"}
          />

          {orderedIds.length > 0 && (
            <div className="bm-preview-panel">
              <div className="bm-preview-header">
                ★ Bookmarks ({orderedIds.length})
              </div>
              <div className="bm-preview-list">
                {orderedIds.map((id) => {
                  const bm  = bookmarks[id];
                  const row = rows.find((r) => String(r.id) === id);
                  const word = row ? [row.article, row.word].filter(Boolean).join(" ") : `#${id}`;
                  return (
                    <div
                      key={id}
                      className="bm-preview-item"
                      onClick={() => navigateToBookmark(id)}
                      title={bm.note || word}
                    >
                      <span className="bm-preview-word">{word}</span>
                      <button
                        className="bm-preview-edit"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); openBookmarkPopover(id); }}
                        title="Upraviť"
                      >✎</button>
                      {bm.note && <span className="bm-preview-note">{bm.note}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>}
      </main>

      <footer className="footer">
        <div className="footer-left">
          Editor messages:
          <span className="save-status">{saveStatus}</span>
        </div>

        <div className="footer-right">
          {capsLockOn && (settings.correctCapsLock ?? true) && (
            <span className="capslock-badge" onClick={() => {
              clearTimeout(capsLockHintTimer.current);
              setCapsLockHint(true);
              capsLockHintTimer.current = setTimeout(() => setCapsLockHint(false), 3000);
            }}>
              ⇪ CapsLock
              {capsLockHint && <span className="capslock-hint">{t("editor.capsLockHint")}</span>}
            </span>
          )}
          {rows.length > 0 && (() => {
            const _articleLangs = new Set(["de", "fr", "es", "it"]);
            const _tLang = (packMetadata.targetLang || "").toLowerCase();
            const incomplete = rows.filter((r) =>
              !r.word || !r.translation || !r.phonetic || !r.definition ||
              !r.type || !r.level || !r[exTargetField] ||
              !r[exNativeField] || !r.topic ||
              (_articleLangs.has(_tLang) && r.type?.toLowerCase() === "noun" && !r.article)
            ).length;
            return (
              <span className="footer-lab">
                Počet slov / nedokončených:{" "}
                <strong>{rows.length}</strong>
                {" / "}
                <strong style={{ color: incomplete ? "var(--app-warning, #f59e0b)" : "var(--app-accent, #3b82f6)" }}>
                  {incomplete}
                </strong>
              </span>
            );
          })()}
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
