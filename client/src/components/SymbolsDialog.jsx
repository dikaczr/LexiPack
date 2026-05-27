import { useState } from "react";

// curly quotes musia byt ako \uXXXX — Babel/react-babel plugin ich priamo
// v source interpretuje ako string delimitery a vyhodí syntax error
const CQ_LOW   = "\u201E";
const CQ_LEFT  = "\u201C";
const CQ_RIGHT = "\u201D";
const CATEGORIES = [
  {
    label: "IPA – Samohlasy",
    symbols: [
      { char: "ɩ", name: "close central" },
      { char: "ɪ", name: "near-close front (short i)" },
      { char: "ʊ", name: "near-close back (short u)" },
      { char: "e", name: "close-mid front" },
      { char: "ə", name: "schwa" },
      { char: "ɜ", name: "open-mid central" },
      { char: "ɔ", name: "open-mid back rounded" },
      { char: "æ", name: "near-open front" },
      { char: "ʌ", name: "open-mid back unrounded" },
      { char: "ɑ", name: "open back unrounded" },
      { char: "ɒ", name: "open back rounded" },
      { char: "iː", name: "close front long" },
      { char: "uː", name: "close back long" },
      { char: "ɜː", name: "open-mid central long" },
      { char: "ɔː", name: "open-mid back long" },
      { char: "ɑː", name: "open back long" },
    ],
  },
  {
    label: "IPA – Spoluhlasky",
    symbols: [
      { char: "θ", name: "voiceless dental fricative (th)" },
      { char: "ð", name: "voiced dental fricative (dh)" },
      { char: "ʃ", name: "voiceless postalveolar (sh)" },
      { char: "ʒ", name: "voiced postalveolar (zh)" },
      { char: "tʃ", name: "voiceless affricate (ch)" },
      { char: "dʒ", name: "voiced affricate (j)" },
      { char: "ŋ", name: "velar nasal (ng)" },
      { char: "j", name: "palatal approximant (y)" },
      { char: "w", name: "labial-velar approximant (w)" },
      { char: "ʔ", name: "glottal stop" },
      { char: "x", name: "voiceless velar fricative" },
      { char: "ʁ", name: "voiced uvular fricative" },
      { char: "ɾ", name: "alveolar tap" },
      { char: "ɬ", name: "voiceless lateral fricative" },
    ],
  },
  {
    label: "IPA – Suprasegmentalne",
    symbols: [
      { char: "ˈ", name: "primary stress" },
      { char: "ˌ", name: "secondary stress" },
      { char: "ː", name: "long" },
      { char: "ˑ", name: "half-long" },
      { char: ".", name: "syllable break" },
      { char: "|", name: "minor group" },
      { char: "‖", name: "major group" },
      { char: "↗", name: "rising tone" },
      { char: "↘", name: "falling tone" },
    ],
  },
  {
    label: "Diakritika – SK / DE / FR",
    symbols: [
      { char: "á", name: "a acute" },
      { char: "ä", name: "a umlaut" },
      { char: "č", name: "c caron" },
      { char: "ď", name: "d caron" },
      { char: "é", name: "e acute" },
      { char: "í", name: "i acute" },
      { char: "ľ", name: "l caron" },
      { char: "ĺ", name: "l acute" },
      { char: "ň", name: "n caron" },
      { char: "ó", name: "o acute" },
      { char: "ô", name: "o circumflex" },
      { char: "ö", name: "o umlaut" },
      { char: "ŕ", name: "r acute" },
      { char: "š", name: "s caron" },
      { char: "ť", name: "t caron" },
      { char: "ú", name: "u acute" },
      { char: "ü", name: "u umlaut" },
      { char: "ý", name: "y acute" },
      { char: "ž", name: "z caron" },
      { char: "ß", name: "eszett" },
      { char: "ñ", name: "n tilde" },
      { char: "ç", name: "c cedilla" },
      { char: "œ", name: "oe ligature" },
      { char: "à", name: "a grave" },
      { char: "â", name: "a circumflex" },
      { char: "ê", name: "e circumflex" },
      { char: "î", name: "i circumflex" },
      { char: "û", name: "u circumflex" },
    ],
  },
  {
    label: "Interpunkcia & Uvodzovky",
    symbols: [
      { char: CQ_LOW,   name: "dolna uvodzovka" },
      { char: CQ_LEFT,  name: "horna lava uvodzovka" },
      { char: CQ_RIGHT, name: "horna prava uvodzovka" },
      { char: "«", name: "guillemet lavy" },
      { char: "»", name: "guillemet pravy" },
      { char: "‹", name: "single guillemet lavy" },
      { char: "›", name: "single guillemet pravy" },
      { char: "–", name: "en dash" },
      { char: "—", name: "em dash" },
      { char: "…", name: "ellipsis" },
      { char: "·", name: "stredna bodka" },
      { char: "•", name: "bullet" },
      { char: "※", name: "reference mark" },
      { char: "§", name: "section sign" },
      { char: "¶", name: "pilcrow" },
      { char: "†", name: "dagger" },
    ],
  },
  {
    label: "Matematika & Veda",
    symbols: [
      { char: "±", name: "plus-minus" },
      { char: "×", name: "krat" },
      { char: "÷", name: "deleno" },
      { char: "≠", name: "nerovna sa" },
      { char: "≈", name: "priblizne rovna sa" },
      { char: "≤", name: "mensie alebo rovne" },
      { char: "≥", name: "vacsie alebo rovne" },
      { char: "∞", name: "nekonecno" },
      { char: "√", name: "odmocnina" },
      { char: "∑", name: "suma" },
      { char: "π", name: "pi" },
      { char: "°", name: "stupen" },
      { char: "µ", name: "mikro" },
      { char: "²", name: "na druhu" },
      { char: "³", name: "na tretiu" },
      { char: "½", name: "jedna polovica" },
      { char: "¼", name: "jedna stvrtina" },
      { char: "¾", name: "tri stvrtiny" },
      { char: "%", name: "percento" },
      { char: "‰", name: "promile" },
      { char: "‱", name: "permyriad (bazicky bod)" },
    ],
  },
  {
    label: "Sipky & Symboly",
    symbols: [
      { char: "→", name: "sipka vpravo" },
      { char: "←", name: "sipka vlavo" },
      { char: "↑", name: "sipka hore" },
      { char: "↓", name: "sipka dole" },
      { char: "↔", name: "sipka obe strany" },
      { char: "⇒", name: "double sipka vpravo" },
      { char: "⇔", name: "double sipka obe strany" },
      { char: "★", name: "hviezda" },
      { char: "☆", name: "prazdna hviezda" },
      { char: "✓", name: "check" },
      { char: "✗", name: "krizik" },
      { char: "◆", name: "diamant" },
      { char: "♣", name: "trefla" },
      { char: "♠", name: "pika" },
      { char: "♥", name: "srdce" },
      { char: "©", name: "copyright" },
      { char: "®", name: "registered" },
      { char: "™", name: "trademark" },
    ],
  },
];

export default function SymbolsDialog({ open, onClose, onInsert }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [inserted, setInserted] = useState(null);

  if (!open) return null;

  function handleInsert(char) {
    onInsert(char);
    setInserted(char);
    setTimeout(() => setInserted(null), 900);
  }

  const cat = CATEGORIES[activeCategory];

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dialog symbols-dialog">
        <div className="dialog-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Symbols</span>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: "0 4px" }}
          >
            x
          </button>
        </div>

        <div className="symbols-tabs">
          {CATEGORIES.map((c, i) => (
            <button
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              className={"symbols-tab" + (i === activeCategory ? " active" : "")}
              onClick={() => setActiveCategory(i)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="symbols-grid">
          {cat.symbols.map(({ char, name }) => (
            <button
              key={name}
              onMouseDown={(e) => e.preventDefault()}
              className={"symbol-cell" + (inserted === char ? " copied" : "")}
              title={name}
              onClick={() => handleInsert(char)}
            >
              {char}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 4 }}>
          {inserted
            ? <span style={{ color: "#4adf8a" }}>Vložené</span>
            : "Klikni na symbol — vloží sa na pozíciu kurzora"}
        </div>

        <div className="dialog-actions">
          <button onMouseDown={(e) => e.preventDefault()} onClick={onClose}>Zavriet</button>
        </div>
      </div>
    </div>
  );
}
