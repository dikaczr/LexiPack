import { useState, useRef } from "react";
import "./TrustedSourceDialog.css";

const SOURCE_META = {
  cambridge:           { name: "Cambridge Dictionary",                url: "https://dictionary.cambridge.org/dictionary/english/{word}",              icon: "📘" },
  oxford_learner:      { name: "Oxford Learner's Dictionaries",       url: "https://www.oxfordlearnersdictionaries.com/definition/english/{word}",    icon: "📗" },
  longman:             { name: "Longman Dictionary",                   url: "https://www.ldoceonline.com/dictionary/{word}",                           icon: "📙" },
  merriam_webster:     { name: "Merriam-Webster",                     url: "https://www.merriam-webster.com/dictionary/{word}",                       icon: "📕" },
  collins:             { name: "Collins Dictionary",                   url: "https://www.collinsdictionary.com/dictionary/english/{word}",             icon: "📒" },
  vocabulary_com:      { name: "Vocabulary.com",                      url: "https://www.vocabulary.com/dictionary/{word}",                            icon: "🧠" },
  wiktionary:          { name: "Wiktionary",                          url: "https://en.wiktionary.org/wiki/{word}",                                   icon: "📖" },
  britannica:          { name: "Encyclopaedia Britannica",            url: "https://www.britannica.com/search?query={word}",                          icon: "🏛️" },
  nasa:                { name: "NASA Glossary",                       url: "https://www.nasa.gov/glossary/",                                          icon: "🔭" },
  stanford_philosophy: { name: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu/search/search?query={word}",                   icon: "🏛️" },
  investopedia:        { name: "Investopedia",                        url: "https://www.investopedia.com/search#q={word}",                            icon: "💼" },
  mdn:                 { name: "MDN Web Docs",                        url: "https://developer.mozilla.org/en-US/search?q={word}",                     icon: "💻" },
  physics_classroom:   { name: "The Physics Classroom",              url: "https://www.physicsclassroom.com/search?q={word}",                         icon: "⚛️" },
  biology_online:      { name: "Biology Online",                     url: "https://www.biologyonline.com/search/{word}",                              icon: "🧬" },
  medicinenet:         { name: "MedicineNet",                        url: "https://www.medicinenet.com/script/main/art.asp?articlekey={word}",        icon: "🩺" },
  legal_dictionary:    { name: "The Free Legal Dictionary",          url: "https://legal-dictionary.thefreedictionary.com/{word}",                   icon: "⚖️" },
};

function buildUrl(key, word) {
  const meta = SOURCE_META[key];
  if (!meta) return null;
  return meta.url.replace("{word}", encodeURIComponent(word.toLowerCase()));
}

export default function TrustedSourceDialog({ initialWord, packCategory, packLevel, neighborWords, apiBase, token, onClose }) {
  const [targetWord, setTargetWord]   = useState(initialWord ?? "");
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const inputRef = useRef(null);

  const analyze = async (word = targetWord) => {
    const w = word.trim();
    if (!w) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiBase}/api/quality/trusted-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          targetWord:   w,
          neighborWords,
          packCategory,
          packLevel,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult({ ...data, word: w });
    } catch (err) {
      setError("Analýza zlyhala. Skontroluj pripojenie k serveru.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") analyze();
  };

  return (
    <div className="ts-overlay" onClick={onClose}>
      <div className="ts-dialog" onClick={(e) => e.stopPropagation()}>

        <div className="ts-header">
          <span className="ts-title">Trusted Source Assistant</span>
          <button className="ts-close" onClick={onClose}>✕</button>
        </div>

        <div className="ts-meta">
          {packCategory && <span>Kategória: <strong>{packCategory}</strong></span>}
          {packLevel    && <span>Úroveň: <strong>{packLevel}</strong></span>}
          {neighborWords.length > 0 && (
            <span className="ts-neighbors" title={neighborWords.join(", ")}>
              Kontext: <strong>{neighborWords.slice(0, 5).join(", ")}{neighborWords.length > 5 ? "…" : ""}</strong>
            </span>
          )}
        </div>

        <div className="ts-input-row">
          <input
            ref={inputRef}
            className="ts-input"
            value={targetWord}
            onChange={(e) => setTargetWord(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Cieľové slovo…"
            autoFocus
          />
          <button className="ts-btn-analyze" onClick={() => analyze()} disabled={loading || !targetWord.trim()}>
            {loading ? "Analyzujem…" : "Analyzovať"}
          </button>
        </div>

        <div className="ts-body">
          {error && <div className="ts-error">{error}</div>}

          {!result && !loading && !error && (
            <div className="ts-hint">Zadaj cieľové slovo a klikni <strong>Analyzovať</strong>. AI zohľadní kontext balíka a susediace slová.</div>
          )}

          {result && (
            <>
              <div className="ts-section-label">Sémantický kontext — „{result.word}"</div>
              <div className="ts-meaning-card">
                <div className="ts-meaning">{result.meaning}</div>
                {result.context && <div className="ts-context">{result.context}</div>}
              </div>

              <div className="ts-section-label" style={{ marginTop: "1rem" }}>
                Odporúčané zdroje ({result.sources.length})
              </div>
              <div className="ts-sources">
                {result.sources.map((s) => {
                  const meta = SOURCE_META[s.key];
                  if (!meta) return null;
                  const url = buildUrl(s.key, result.word);
                  return (
                    <div key={s.key} className="ts-source-card">
                      <div className="ts-source-top">
                        <span className="ts-source-icon">{meta.icon}</span>
                        <span className="ts-source-name">{meta.name}</span>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ts-source-link"
                          >
                            Otvoriť →
                          </a>
                        )}
                      </div>
                      {s.reason && <div className="ts-source-reason">{s.reason}</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="ts-footer">
          <button onClick={onClose}>Zatvoriť</button>
        </div>

      </div>
    </div>
  );
}
