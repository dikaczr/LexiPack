import { useState, useRef, useCallback, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "./PdfReaderDialog.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text, addedWords, existingSet) {
  const allTracked = [...addedWords, ...existingSet];
  if (allTracked.length === 0) return text;

  const pattern = allTracked.map(escapeRegex).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    if (addedWords.has(lower)) {
      return <mark key={i} className="pdf-mark-added">{part}</mark>;
    }
    if (existingSet.has(lower)) {
      return <mark key={i} className="pdf-mark-exists">{part}</mark>;
    }
    return part;
  });
}

export default function PdfReaderDialog({ open, onClose, onAddWord, existingWords = [] }) {
  const [pages, setPages]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [fileName, setFileName]         = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [addedWords, setAddedWords]     = useState(new Set());
  const fileInputRef = useRef(null);

  const existingSet = useMemo(
    () => new Set(existingWords.map((w) => w?.trim().toLowerCase()).filter(Boolean)),
    [existingWords],
  );

  async function handleFile(file) {
    if (!file) return;
    setLoading(true);
    setPages([]);
    setFileName(file.name);
    setAddedWords(new Set());
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageTexts = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .filter((item) => "str" in item)
          .map((item) => item.str)
          .join(" ");
        pageTexts.push(text);
      }
      setPages(pageTexts);
    } catch (err) {
      console.error("PDF load error:", err);
      alert("Nepodarilo sa načítať PDF. Skontrolujte či súbor nie je chránený heslom.");
    } finally {
      setLoading(false);
    }
  }

  function handleMouseUp() {
    const sel = window.getSelection();
    const text = sel?.toString().trim().replace(/\s+/g, " ");
    if (text && text.length > 0 && text.length <= 60) {
      setSelectedText(text);
    } else if (!text) {
      setSelectedText("");
    }
  }

  const handleAddSelected = useCallback(() => {
    if (!selectedText) return;
    onAddWord(selectedText);
    setAddedWords((prev) => new Set([...prev, selectedText.toLowerCase()]));
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  }, [selectedText, onAddWord]);

  function handleReset() {
    setPages([]);
    setFileName("");
    setSelectedText("");
    setAddedWords(new Set());
    window.getSelection()?.removeAllRanges();
  }

  if (!open) return null;

  return (
    <div className="pdf-overlay">
      <div className="pdf-dialog">

        {/* HEADER */}
        <div className="pdf-header">
          <div className="pdf-header-left">
            <span className="pdf-title">Read PDF</span>
            {fileName && <span className="pdf-filename">{fileName}</span>}
          </div>
          <div className="pdf-header-right">
            {addedWords.size > 0 && (
              <span className="pdf-added-count">{addedWords.size} pridaných</span>
            )}
            {pages.length > 0 && (
              <button className="pdf-btn-secondary" onClick={handleReset}>
                Iný súbor
              </button>
            )}
            <button className="pdf-btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* SELECTION BAR */}
        {selectedText && (
          <div className="pdf-selection-bar">
            <span className="pdf-selection-text">„{selectedText}"</span>
            {existingSet.has(selectedText.toLowerCase()) && (
              <span className="pdf-selection-hint exists">už v packu</span>
            )}
            {addedWords.has(selectedText.toLowerCase()) && (
              <span className="pdf-selection-hint added">pridané</span>
            )}
            <button className="pdf-btn-add" onClick={handleAddSelected}>
              + Pridať do packu
            </button>
            <button
              className="pdf-btn-cancel"
              onClick={() => { setSelectedText(""); window.getSelection()?.removeAllRanges(); }}
            >
              Zrušiť
            </button>
          </div>
        )}

        {/* LEGENDA */}
        {pages.length > 0 && (
          <div className="pdf-legend">
            <span className="pdf-legend-item added">■ práve pridané</span>
            <span className="pdf-legend-item exists">■ už v packu</span>
          </div>
        )}

        {/* BODY */}
        {loading && (
          <div className="pdf-loading">Načítavam PDF...</div>
        )}

        {!loading && pages.length === 0 && (
          <div className="pdf-drop-area" onClick={() => fileInputRef.current?.click()}>
            <div className="pdf-drop-icon">📄</div>
            <div className="pdf-drop-text">Kliknite pre výber PDF súboru</div>
            <div className="pdf-drop-hint">Podporované sú textové PDF (nie scany)</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        )}

        {!loading && pages.length > 0 && (
          <div className="pdf-text-area" onMouseUp={handleMouseUp}>
            {pages.map((text, i) => (
              <div key={i} className="pdf-page">
                <div className="pdf-page-label">— Strana {i + 1} —</div>
                <p className="pdf-page-text">
                  {highlightText(text, addedWords, existingSet)}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
