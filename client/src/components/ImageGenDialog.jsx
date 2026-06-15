import { useState, useEffect } from "react";
import { useT } from "../i18n";
import { generateImage } from "../api/aiApi";
import { resizeImageDataUrl } from "../utils/resizeImage";
import "./ImageGenDialog.css";

const STYLES      = ["vector", "3d", "realistic", "stylized"];
const BACKGROUNDS = ["white", "transparent"];
const ATMOSPHERE  = ["inspiring", "intelligent", "dark", "light"];

const NEGATIVE_ITEMS = [
  { key: "nophotorealism",    neg: "photorealism, photorealistic" },
  { key: "noanime",           neg: "anime, manga" },
  { key: "nocartoonkids",     neg: "cartoon kids, children cartoon" },
  { key: "notoystyle",        neg: "toy style, plastic toy" },
  { key: "nomascotstyle",     neg: "mascot style, mascot character" },
  { key: "nocutechar",        neg: "cute characters, kawaii" },
  { key: "noposterchildren",  neg: "children poster, kids poster, educational poster for children" },
];

const STYLE_PROMPT = {
  vector:   "vector art illustration",
  "3d":     "3D rendered image",
  realistic:"photorealistic photo",
  stylized: "stylized digital art",
};

const BG_PROMPT = {
  white:       "white background",
  transparent: "transparent background",
};

function buildPrompt(description, style, background, atmosphere, extra) {
  const atmoText = atmosphere.join(", ");
  const parts = [
    `Create a ${STYLE_PROMPT[style] || style}.`,
    `Subject: "${description}".`,
    atmoText ? `Mood and atmosphere: ${atmoText}.` : "",
    BG_PROMPT[background] ? `${BG_PROMPT[background]}.` : "",
    style !== "realistic" ? "No text in the image." : "",
    extra?.trim() || "",
  ].filter(Boolean);
  return parts.join(" ");
}

function buildNegative(checks, extraNeg) {
  const items = NEGATIVE_ITEMS.filter(i => checks[i.key]).map(i => i.neg);
  if (extraNeg?.trim()) items.push(extraNeg.trim());
  return items.join(", ");
}

const DEFAULT_NEG = Object.fromEntries(NEGATIVE_ITEMS.map(i => [i.key, false]));

export default function ImageGenDialog({
  open, onClose, packName = "", packCategory = "", onApply, token,
}) {
  const t = useT();

  const [description, setDescription] = useState("");
  const [style,       setStyle]       = useState("vector");
  const [background,  setBackground]  = useState("white");
  const [atmosphere,  setAtmosphere]  = useState([]);
  const [extra,       setExtra]       = useState("");
  const [negChecks,   setNegChecks]   = useState(DEFAULT_NEG);
  const [negExtra,    setNegExtra]    = useState("");
  const [generating,  setGenerating]  = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    if (open) {
      const parts = [packName, packCategory].filter(Boolean);
      setDescription(parts.join(" — ") || "");
      setResult(null); setError(null); setProgress(0);
    }
  }, [open, packName, packCategory]);

  useEffect(() => {
    if (!generating) return;
    setProgress(0);
    const start = Date.now();
    const ESTIMATE = 15000;
    const id = setInterval(() => {
      setProgress(Math.min(90, Math.round((Date.now() - start) / ESTIMATE * 90)));
    }, 250);
    return () => clearInterval(id);
  }, [generating]);

  function toggleAtmo(val) {
    setAtmosphere(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  async function handleGenerate() {
    if (!description.trim() || generating) return;
    setGenerating(true); setResult(null); setError(null);
    try {
      const prompt       = buildPrompt(description, style, background, atmosphere, extra);
      const negative     = buildNegative(negChecks, negExtra);
      const transparent  = background === "transparent";
      const dataUrl      = await generateImage(prompt, negative, token, transparent);
      setProgress(100);
      setResult(dataUrl);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || t("imgGen.error"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleApply() {
    if (!result) return;
    const resized = await resizeImageDataUrl(result, 256);
    onApply(resized);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && !generating && onClose()}>
      <div className="img-gen-dialog">

        <div className="img-gen-header">
          <span className="img-gen-title">🖼 {t("imgGen.title")}</span>
          <button className="img-gen-close" onClick={onClose} disabled={generating}>×</button>
        </div>

        <div className="img-gen-body">
          <div className="img-gen-form">

            {/* Description */}
            <div className="img-gen-field">
              <label>{t("imgGen.descLabel")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("imgGen.descHint")}
                rows={3}
                disabled={generating}
              />
            </div>

            {/* Positive section */}
            <div className="img-gen-section-title">{t("imgGen.sectionPositive")}</div>

            {/* Style — radio checkboxes */}
            <div className="img-gen-field">
              <label>{t("imgGen.styleLabel")}</label>
              <div className="img-gen-checkboxes">
                {STYLES.map(s => (
                  <label key={s} className="img-gen-check-item">
                    <input
                      type="radio"
                      name="img-style"
                      checked={style === s}
                      onChange={() => setStyle(s)}
                      disabled={generating}
                    />
                    <span>{t(`imgGen.style_${s}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Atmosphere */}
            <div className="img-gen-field">
              <label>{t("imgGen.atmosphereLabel")}</label>
              <div className="img-gen-checkboxes">
                {ATMOSPHERE.map(a => (
                  <label key={a} className="img-gen-check-item">
                    <input
                      type="checkbox"
                      checked={atmosphere.includes(a)}
                      onChange={() => toggleAtmo(a)}
                      disabled={generating}
                    />
                    <span>{t(`imgGen.atmo_${a}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="img-gen-field">
              <label>{t("imgGen.bgLabel")}</label>
              <div className="img-gen-pills">
                {BACKGROUNDS.map(b => (
                  <button
                    key={b}
                    className={`img-gen-pill${background === b ? " active" : ""}`}
                    onClick={() => setBackground(b)}
                    disabled={generating}
                  >
                    {t(`imgGen.bg${b.charAt(0).toUpperCase() + b.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra positive */}
            <div className="img-gen-field">
              <label>{t("imgGen.extraLabel")}</label>
              <input
                type="text"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder={t("imgGen.extraHint")}
                disabled={generating}
              />
            </div>

            {/* Negative section */}
            <div className="img-gen-section-title img-gen-section-neg">{t("imgGen.sectionNegative")}</div>

            <div className="img-gen-checkboxes">
              {NEGATIVE_ITEMS.map(item => (
                <label key={item.key} className="img-gen-check-item">
                  <input
                    type="checkbox"
                    checked={negChecks[item.key]}
                    onChange={() => setNegChecks(p => ({ ...p, [item.key]: !p[item.key] }))}
                    disabled={generating}
                  />
                  <span>{t(`imgGen.neg_${item.key}`)}</span>
                </label>
              ))}
            </div>

            <div className="img-gen-field">
              <label>{t("imgGen.negExtraLabel")}</label>
              <input
                type="text"
                value={negExtra}
                onChange={(e) => setNegExtra(e.target.value)}
                placeholder={t("imgGen.negExtraHint")}
                disabled={generating}
              />
            </div>

            <button
              className="img-gen-btn-generate"
              onClick={handleGenerate}
              disabled={!description.trim() || generating}
            >
              {generating ? t("imgGen.generating") : t("imgGen.generate")}
            </button>
          </div>

          {/* Preview */}
          <div className="img-gen-preview">
            {generating && (
              <div className="img-gen-progress-wrap">
                <div className="img-gen-progress-label">{t("imgGen.generating")}</div>
                <div className="img-gen-thermometer">
                  <div className="img-gen-thermometer-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="img-gen-progress-hint">{t("imgGen.generatingHint")}</div>
              </div>
            )}

            {!generating && result && (
              <div className="img-gen-result">
                <img src={result} alt="generated" className="img-gen-img" />
                <div className="img-gen-result-btns">
                  <button className="img-gen-btn-use" onClick={handleApply}>
                    ✓ {t("imgGen.useImage")}
                  </button>
                  <button className="img-gen-btn-regen" onClick={handleGenerate}>
                    ↺ {t("imgGen.regenerate")}
                  </button>
                </div>
              </div>
            )}

            {!generating && !result && !error && (
              <div className="img-gen-placeholder">
                <span>🖼</span>
                <span>{t("imgGen.placeholder")}</span>
              </div>
            )}

            {error && (
              <div className="img-gen-error">
                ⚠ {error}
                <button className="img-gen-btn-regen" onClick={handleGenerate} style={{ marginTop: "1rem" }}>
                  ↺ {t("imgGen.regenerate")}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
