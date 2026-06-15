import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createWorker } from "tesseract.js";
import "./PdfReaderDialog.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

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

function matchPhrase(tokens, startIdx, phraseWords) {
  let wordIdx = 0, j = startIdx;
  while (j < tokens.length && wordIdx < phraseWords.length) {
    const clean = tokens[j].replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, "").trim();
    if (clean) {
      if (clean.toLowerCase() !== phraseWords[wordIdx]) return null;
      wordIdx++;
    }
    j++;
  }
  return wordIdx === phraseWords.length ? j - 1 : null;
}

function WordPicker({ text, addedWords, existingSet, onWordClick }) {
  const tokens = text.split(/(\s+|[,;:.!?„""\(\)\[\]{}<>\/\\|@#$%^&*+=~`]+)/);

  const addedPhrases = useMemo(
    () => [...addedWords].filter((w) => w.includes(" ")).map((w) => ({ raw: w, words: w.split(/\s+/) })),
    [addedWords],
  );

  const result = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    const clean = token.replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, "").trim();

    if (clean && addedPhrases.length > 0) {
      let matched = false;
      for (const { words } of addedPhrases) {
        const endIdx = matchPhrase(tokens, i, words);
        if (endIdx !== null) {
          result.push(<mark key={i} className="pdf-mark-added" title="pridané">{tokens.slice(i, endIdx + 1).join("")}</mark>);
          i = endIdx + 1;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    if (!clean || /^\s+$/.test(token)) {
      result.push(<span key={i}>{token}</span>);
    } else {
      const lower = clean.toLowerCase();
      const isAdded    = addedWords.has(lower);
      const isExisting = existingSet.has(lower);
      result.push(
        <mark
          key={i}
          className={isAdded ? "pdf-mark-added" : isExisting ? "pdf-mark-exists" : "pdf-word"}
          onClick={() => !isAdded && onWordClick(clean)}
          title={isAdded ? "pridané" : isExisting ? "už v packu" : "klikni pre pridanie"}
        >{token}</mark>,
      );
    }
    i++;
  }
  return <>{result}</>;
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

  const [selPopup,    setSelPopup]    = useState(null); // { phrase, x, y }

  const fileInputRef  = useRef(null);
  const workerRef     = useRef(null);
  const textAreaRef   = useRef(null);

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
  const handleWordClick = useCallback((word) => {
    onAddWord(word);
    setAddedWords(prev => new Set([...prev, word.toLowerCase()]));
  }, [onAddWord]);

  useEffect(() => {
    if (!selPopup) return;
    function onDown(e) { if (!e.target.closest(".pdf-sel-popup")) setSelPopup(null); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selPopup]);

  function handleTextMouseUp(e) {
    if (e.target.closest(".pdf-sel-popup")) return;
    const sel = window.getSelection();
    const phrase = sel?.toString().trim();
    if (!phrase || phrase.length < 2) { setSelPopup(null); return; }
    const range = sel.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    const dialogRect = textAreaRef.current?.closest(".pdf-dialog")?.getBoundingClientRect();
    if (!dialogRect) return;
    setSelPopup({ phrase, x: rect.left + rect.width / 2 - dialogRect.left, y: rect.top - dialogRect.top - 8 });
  }

  function handleAddPhrase() {
    if (!selPopup?.phrase) return;
    const phrase = selPopup.phrase.replace(/\s+/g, " ").trim();
    onAddWord(phrase);
    setAddedWords((prev) => new Set([...prev, phrase.toLowerCase()]));
    window.getSelection()?.removeAllRanges();
    setSelPopup(null);
  }

  function handleReset() {
    setPages([]); setPageImages([]);
    setFileName(""); setSelectedText("");
    setAddedWords(new Set());
    setOcrResult(null); setOcrEditText("");
    setSelPopup(null);
    setMode("text");
    window.getSelection()?.removeAllRanges();
  }

  if (!open) return null;

  return (
    <div className="pdf-overlay">
      <div className="pdf-dialog">

        {selPopup && (
          <div className="pdf-sel-popup" style={{ left: selPopup.x, top: selPopup.y }}>
            <span className="pdf-sel-phrase">„{selPopup.phrase}"</span>
            <button className="pdf-sel-btn" onClick={handleAddPhrase}>+ Pridať frázu</button>
            <button className="pdf-sel-dismiss" onClick={() => setSelPopup(null)}>✕</button>
          </div>
        )}

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
            <span className="pdf-legend-item" style={{ color: "var(--app-muted, #94a3b8)" }}>— klikni na slovo</span>
            <span className="pdf-legend-item" style={{ marginLeft: "auto", color: "var(--app-muted, #94a3b8)" }}>— označ text myšou pre frázu</span>
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
          <div className="pdf-text-area" ref={textAreaRef} onMouseUp={handleTextMouseUp}>
            {pages.map((text, i) => (
              <div key={i} className="pdf-page">
                <div className="pdf-page-label">— Strana {i + 1} —</div>
                <p className="pdf-page-text">
                  <WordPicker text={text} addedWords={addedWords} existingSet={existingSet} onWordClick={handleWordClick} />
                </p>
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
