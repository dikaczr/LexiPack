import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import "./PdfReaderDialog.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const OCR_THRESHOLD = 20;
const RENDER_SCALE  = 1.5;

async function renderPageToCanvas(page, scale = RENDER_SCALE) {
  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement("canvas");
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return canvas;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text, addedWords, existingSet) {
  const allTracked = [...addedWords, ...existingSet];
  if (allTracked.length === 0) return text;
  const regex = new RegExp(`(${allTracked.map(escapeRegex).join("|")})`, "gi");
  return text.split(regex).map((part, i) => {
    const lower = part.toLowerCase();
    if (addedWords.has(lower))  return <mark key={i} className="pdf-mark-added">{part}</mark>;
    if (existingSet.has(lower)) return <mark key={i} className="pdf-mark-exists">{part}</mark>;
    return part;
  });
}

// ── PageView: renders one page as image with drag-to-select overlay ──
function PageView({ imageData, pageIndex, onRegionSelect }) {
  const wrapRef  = useRef(null);
  const startRef = useRef(null);
  const dragging = useRef(false);
  const [selRect, setSelRect] = useState(null);

  function getPct(e) {
    const r = wrapRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left)  / r.width)  * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top)   / r.height) * 100)),
    };
  }

  function onMouseDown(e) {
    e.preventDefault();
    const p = getPct(e);
    startRef.current = p;
    dragging.current = true;
    setSelRect({ x: p.x, y: p.y, w: 0, h: 0 });
  }

  function onMouseMove(e) {
    if (!dragging.current) return;
    const p = getPct(e);
    setSelRect({
      x: Math.min(startRef.current.x, p.x),
      y: Math.min(startRef.current.y, p.y),
      w: Math.abs(p.x - startRef.current.x),
      h: Math.abs(p.y - startRef.current.y),
    });
  }

  function onMouseUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (!selRect || selRect.w < 1 || selRect.h < 1) { setSelRect(null); return; }

    const { canvas } = imageData;
    const sx = Math.round((selRect.x / 100) * canvas.width);
    const sy = Math.round((selRect.y / 100) * canvas.height);
    const sw = Math.max(1, Math.round((selRect.w / 100) * canvas.width));
    const sh = Math.max(1, Math.round((selRect.h / 100) * canvas.height));

    const crop = document.createElement("canvas");
    crop.width  = sw;
    crop.height = sh;
    crop.getContext("2d").drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    onRegionSelect(crop, pageIndex);
    setSelRect(null);
  }

  return (
    <div className="pdf-page-block">
      <div className="pdf-page-label">— Strana {pageIndex + 1} —</div>
      <div
        ref={wrapRef}
        className="pdf-page-img-wrap"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { dragging.current = false; setSelRect(null); }}
      >
        <img
          src={imageData.dataUrl}
          style={{ width: "100%", display: "block", userSelect: "none" }}
          draggable={false}
          alt={`Strana ${pageIndex + 1}`}
        />
        {selRect && selRect.w > 0.5 && selRect.h > 0.5 && (
          <div
            className="pdf-sel-rect"
            style={{
              left:   `${selRect.x}%`,
              top:    `${selRect.y}%`,
              width:  `${selRect.w}%`,
              height: `${selRect.h}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Main dialog ──
export default function PdfReaderDialog({ open, onClose, onAddWord, existingWords = [] }) {
  const [mode,        setMode]        = useState("text");
  const [pages,       setPages]       = useState([]);
  const [pageImages,  setPageImages]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [fileName,    setFileName]    = useState("");
  const [addedWords,  setAddedWords]  = useState(new Set());

  // text mode
  const [selectedText, setSelectedText] = useState("");

  // image mode OCR
  const [isOcring,     setIsOcring]     = useState(false);
  const [ocrResult,    setOcrResult]    = useState(null);
  const [ocrEditText,  setOcrEditText]  = useState("");

  const fileInputRef = useRef(null);
  const workerRef    = useRef(null);

  useEffect(() => {
    if (!open && workerRef.current) {
      workerRef.current.terminate().catch(() => {});
      workerRef.current = null;
    }
  }, [open]);

  const existingSet = useMemo(
    () => new Set(existingWords.map((w) => w?.trim().toLowerCase()).filter(Boolean)),
    [existingWords],
  );

  async function getWorker() {
    if (!workerRef.current) workerRef.current = await createWorker("eng+slk");
    return workerRef.current;
  }

  async function handleFile(file) {
    if (!file) return;
    setLoading(true);
    setPages([]); setPageImages([]);
    setFileName(file.name);
    setAddedWords(new Set());
    setSelectedText(""); setOcrResult(null); setOcrEditText("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages
      const pageTexts = [];
      let totalChars = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page   = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text   = content.items.filter((x) => "str" in x).map((x) => x.str).join(" ");
        pageTexts.push(text);
        totalChars += text.replace(/\s/g, "").length;
      }

      const avgChars = totalChars / pdf.numPages;

      if (avgChars < OCR_THRESHOLD) {
        // Scanned PDF — image mode
        setMode("image");
        setLoading(false);
        const images = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page   = await pdf.getPage(i);
          const canvas = await renderPageToCanvas(page, RENDER_SCALE);
          images.push({ canvas, dataUrl: canvas.toDataURL("image/jpeg", 0.92) });
          setPageImages([...images]);
        }
      } else {
        // Text PDF — existing behavior
        setMode("text");
        setPages(pageTexts);
        setLoading(false);
      }
    } catch (err) {
      console.error("PDF load error:", err);
      alert("Nepodarilo sa načítať PDF. Skontrolujte či súbor nie je chránený heslom.");
      setLoading(false);
    }
  }

  async function handleRegionSelect(cropCanvas) {
    setIsOcring(true);
    setOcrResult(null);
    try {
      const worker = await getWorker();
      const { data: { text } } = await worker.recognize(cropCanvas);
      const cleaned = text.trim();
      setOcrEditText(cleaned);
      setOcrResult({ text: cleaned });
    } catch (err) {
      console.error("OCR error:", err);
      alert("OCR zlyhalo.");
    } finally {
      setIsOcring(false);
    }
  }

  function handleAddOcrResult() {
    if (!ocrEditText.trim()) return;
    onAddWord(ocrEditText.trim());
    setAddedWords((prev) => new Set([...prev, ocrEditText.trim().toLowerCase()]));
    setOcrResult(null);
    setOcrEditText("");
  }

  // text mode handlers (unchanged)
  function handleMouseUp() {
    const sel  = window.getSelection();
    const text = sel?.toString().trim().replace(/\s+/g, " ");
    if (text && text.length > 0 && text.length <= 60) setSelectedText(text);
    else if (!text) setSelectedText("");
  }

  const handleAddSelected = useCallback(() => {
    if (!selectedText) return;
    onAddWord(selectedText);
    setAddedWords((prev) => new Set([...prev, selectedText.toLowerCase()]));
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  }, [selectedText, onAddWord]);

  function handleReset() {
    setPages([]); setPageImages([]);
    setFileName(""); setSelectedText("");
    setAddedWords(new Set());
    setOcrResult(null); setOcrEditText("");
    setMode("text");
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
            {mode === "image" && pageImages.length > 0 && (
              <span className="pdf-mode-badge">Sken · OCR</span>
            )}
          </div>
          <div className="pdf-header-right">
            {addedWords.size > 0 && (
              <span className="pdf-added-count">{addedWords.size} pridaných</span>
            )}
            {(pages.length > 0 || pageImages.length > 0) && (
              <button className="pdf-btn-secondary" onClick={handleReset}>Iný súbor</button>
            )}
            <button className="pdf-btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* TEXT MODE — selection bar */}
        {mode === "text" && selectedText && (
          <div className="pdf-selection-bar">
            <span className="pdf-selection-text">„{selectedText}"</span>
            {existingSet.has(selectedText.toLowerCase()) && (
              <span className="pdf-selection-hint exists">už v packu</span>
            )}
            {addedWords.has(selectedText.toLowerCase()) && (
              <span className="pdf-selection-hint added">pridané</span>
            )}
            <button className="pdf-btn-add" onClick={handleAddSelected}>+ Pridať do packu</button>
            <button className="pdf-btn-cancel" onClick={() => { setSelectedText(""); window.getSelection()?.removeAllRanges(); }}>Zrušiť</button>
          </div>
        )}

        {/* IMAGE MODE — OCR result bar */}
        {mode === "image" && (isOcring || ocrResult) && (
          <div className="pdf-ocr-result-bar">
            {isOcring ? (
              <span className="pdf-ocr-loading">🔍 Rozpoznávam text…</span>
            ) : (
              <>
                <textarea
                  className="pdf-ocr-textarea"
                  value={ocrEditText}
                  onChange={(e) => setOcrEditText(e.target.value)}
                  rows={2}
                  placeholder="Rozpoznaný text…"
                />
                <button className="pdf-btn-add" onClick={handleAddOcrResult}>+ Pridať do packu</button>
                <button className="pdf-btn-cancel" onClick={() => { setOcrResult(null); setOcrEditText(""); }}>Zavrieť</button>
              </>
            )}
          </div>
        )}

        {/* TEXT MODE — legend */}
        {mode === "text" && pages.length > 0 && (
          <div className="pdf-legend">
            <span className="pdf-legend-item added">■ práve pridané</span>
            <span className="pdf-legend-item exists">■ už v packu</span>
          </div>
        )}

        {/* IMAGE MODE — hint */}
        {mode === "image" && pageImages.length > 0 && !isOcring && !ocrResult && (
          <div className="pdf-image-hint">
            Ťahaním myši označte oblasť textu na rozpoznanie
          </div>
        )}

        {/* LOADING */}
        {loading && <div className="pdf-loading">Načítavam PDF…</div>}

        {/* DROP AREA */}
        {!loading && pages.length === 0 && pageImages.length === 0 && (
          <div className="pdf-drop-area" onClick={() => fileInputRef.current?.click()}>
            <div className="pdf-drop-icon">📄</div>
            <div className="pdf-drop-text">Kliknite pre výber PDF súboru</div>
            <div className="pdf-drop-hint">Textové aj skenované PDF</div>
            <input ref={fileInputRef} type="file" accept=".pdf" hidden onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* TEXT MODE — content */}
        {!loading && mode === "text" && pages.length > 0 && (
          <div className="pdf-text-area" onMouseUp={handleMouseUp}>
            {pages.map((text, i) => (
              <div key={i} className="pdf-page">
                <div className="pdf-page-label">— Strana {i + 1} —</div>
                <p className="pdf-page-text">{highlightText(text, addedWords, existingSet)}</p>
              </div>
            ))}
          </div>
        )}

        {/* IMAGE MODE — content */}
        {mode === "image" && pageImages.length > 0 && (
          <div className="pdf-image-area">
            {pageImages.map((imgData, i) => (
              <PageView
                key={i}
                pageIndex={i}
                imageData={imgData}
                onRegionSelect={handleRegionSelect}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
