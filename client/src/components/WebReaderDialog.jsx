import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useT } from "../i18n";
import { API_BASE } from "../config";
import "./WebReaderDialog.css";

// Skúsi nájsť frazu začínajúcu na tokens[startIdx].
// Vráti posledný index (vrátane) ak sa zhoduje, inak null.
function matchPhrase(tokens, startIdx, phraseWords) {
  let wordIdx = 0;
  let j = startIdx;
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

function WordPicker({ text, addedWords, existingSet, onWordClick, labels }) {
  const tokens = text.split(/(\s+|[,;:.!?„""\(\)\[\]{}<>\/\\|@#$%^&*+=~`]+)/);

  // Iba viacslovné frázy (single words sa kontrolujú cez Set.has())
  const addedPhrases = useMemo(
    () => [...addedWords]
      .filter((w) => w.includes(" "))
      .map((w) => ({ raw: w, words: w.split(/\s+/) })),
    [addedWords],
  );

  const result = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    const clean = token.replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, "").trim();

    // Ak sme na slovnom tokene, skús najprv viacslovné frázy
    if (clean && addedPhrases.length > 0) {
      let matched = false;
      for (const { raw, words } of addedPhrases) {
        const endIdx = matchPhrase(tokens, i, words);
        if (endIdx !== null) {
          const slice = tokens.slice(i, endIdx + 1).join("");
          result.push(
            <mark key={i} className="wr-mark-added" title={labels.added}>{slice}</mark>,
          );
          i = endIdx + 1;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    // Single token
    if (!clean || /^\s+$/.test(token)) {
      result.push(<span key={i}>{token}</span>);
    } else {
      const lower = clean.toLowerCase();
      const isAdded    = addedWords.has(lower);
      const isExisting = existingSet.has(lower);
      result.push(
        <mark
          key={i}
          className={isAdded ? "wr-mark-added" : isExisting ? "wr-mark-exists" : "wr-word"}
          onClick={() => !isAdded && onWordClick(clean)}
          title={isAdded ? labels.added : isExisting ? labels.exists : labels.click}
        >{token}</mark>,
      );
    }
    i++;
  }
  return <>{result}</>;
}

export default function WebReaderDialog({ open, onClose, onAddWord, existingWords = [], token }) {
  const t = useT();
  const [url,        setUrl]        = useState("");
  const [text,       setText]       = useState("");
  const [pageTitle,  setPageTitle]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [addedWords, setAddedWords] = useState(new Set());
  const [selPopup,   setSelPopup]   = useState(null); // { x, y, phrase }

  const inputRef  = useRef(null);
  const textRef   = useRef(null);

  const existingSet = useMemo(
    () => new Set(existingWords.map((w) => w?.trim().toLowerCase()).filter(Boolean)),
    [existingWords],
  );

  // Zatvori popup pri kliknutí mimo neho
  useEffect(() => {
    if (!selPopup) return;
    function onDown(e) {
      if (!e.target.closest(".wr-sel-popup")) setSelPopup(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selPopup]);

  function handleTextMouseUp(e) {
    // Ignoruj klik na popup samotný
    if (e.target.closest(".wr-sel-popup")) return;

    const sel = window.getSelection();
    const phrase = sel?.toString().trim();

    // Menej ako 2 znaky = nie je výber (iba klik na slovo)
    if (!phrase || phrase.length < 2) { setSelPopup(null); return; }

    const range = sel.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    const dialogRect = textRef.current?.closest(".wr-dialog")?.getBoundingClientRect();
    if (!dialogRect) return;

    setSelPopup({
      phrase,
      // Pozícia relatívne k dialogu
      x: rect.left + rect.width / 2 - dialogRect.left,
      y: rect.top - dialogRect.top - 8,
    });
  }

  function handleAddPhrase() {
    if (!selPopup?.phrase) return;
    const phrase = selPopup.phrase.replace(/\s+/g, " ").trim();
    onAddWord(phrase);
    setAddedWords((prev) => new Set([...prev, phrase.toLowerCase()]));
    window.getSelection()?.removeAllRanges();
    setSelPopup(null);
  }

  async function handleLoad() {
    const trimmed = url.trim();
    if (!trimmed) { setError(t("webReader.errorEmpty")); return; }
    const fullUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    setLoading(true); setError(null); setText(""); setPageTitle("");
    setAddedWords(new Set()); setSelPopup(null);
    try {
      const res = await fetch(`${API_BASE}/api/fs/fetch-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: fullUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("webReader.errorFetch")); return; }
      setText(data.text || "");
      setPageTitle(data.title || "");
      if (!data.text?.trim()) setError(t("webReader.emptyText"));
    } catch (err) {
      setError(err.message || t("webReader.errorFetch"));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleLoad();
  }

  function handleReset() {
    setUrl(""); setText(""); setPageTitle(""); setError(null);
    setAddedWords(new Set()); setSelPopup(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const handleWordClick = useCallback((word) => {
    onAddWord(word);
    setAddedWords((prev) => new Set([...prev, word.toLowerCase()]));
  }, [onAddWord]);

  if (!open) return null;

  const hasText = !!text && !loading && !error;

  return (
    <div className="wr-overlay">
      <div className="wr-dialog" ref={textRef}>

        {/* SELECTION POPUP */}
        {selPopup && (
          <div
            className="wr-sel-popup"
            style={{ left: selPopup.x, top: selPopup.y }}
          >
            <span className="wr-sel-phrase">„{selPopup.phrase}"</span>
            <button className="wr-sel-btn" onClick={handleAddPhrase}>{t("webReader.addPhrase")}</button>
            <button className="wr-sel-dismiss" onClick={() => setSelPopup(null)}>✕</button>
          </div>
        )}

        {/* HEADER */}
        <div className="wr-header">
          <div className="wr-header-left">
            <span className="wr-title">🌐 {t("webReader.title")}</span>
            {pageTitle && <span className="wr-page-title">{pageTitle}</span>}
          </div>
          <div className="wr-header-right">
            {addedWords.size > 0 && (
              <span className="wr-added-count">{t("webReader.added")(addedWords.size)}</span>
            )}
            {hasText && (
              <button className="wr-btn-secondary" onClick={handleReset}>{t("webReader.reset")}</button>
            )}
            <button className="wr-btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* URL BAR */}
        <div className="wr-url-bar">
          <input
            ref={inputRef}
            className="wr-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("webReader.urlPlaceholder")}
            disabled={loading}
            autoFocus
          />
          <button className="wr-btn-load" onClick={handleLoad} disabled={loading || !url.trim()}>
            {loading ? "…" : t("webReader.load")}
          </button>
        </div>

        {/* LEGEND */}
        {hasText && (
          <div className="wr-legend">
            <span className="wr-legend-item added">{t("webReader.legendAdded")}</span>
            <span className="wr-legend-item exists">{t("webReader.legendExists")}</span>
            <span className="wr-legend-item">{t("webReader.legendHint")}</span>
            <span className="wr-legend-item" style={{ marginLeft: "auto" }}>{t("webReader.legendMulti")}</span>
          </div>
        )}

        {/* CONTENT */}
        {loading && <div className="wr-loading">{t("webReader.loading")}</div>}
        {!loading && error && <div className="wr-error">⚠ {error}</div>}

        {!loading && !error && !text && (
          <div className="wr-idle">
            <div className="wr-idle-icon">🌐</div>
            <div className="wr-idle-text">{t("webReader.title")}</div>
            <div className="wr-idle-hint">{t("webReader.hint")}</div>
          </div>
        )}

        {hasText && (
          <div className="wr-text-area" onMouseUp={handleTextMouseUp}>
            <WordPicker
              text={text}
              addedWords={addedWords}
              existingSet={existingSet}
              onWordClick={handleWordClick}
              labels={{ added: t("webReader.titleAdded"), exists: t("webReader.titleExists"), click: t("webReader.titleClick") }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
