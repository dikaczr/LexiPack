import { useState, useEffect } from "react";
import { useT } from "../i18n";
import { generateImage } from "../api/aiApi";
import { resizeImageDataUrl } from "../utils/resizeImage";
import "./ImageGenDialog.css";

const STYLES = ["flat", "illustration", "watercolor", "minimal"];
const BACKGROUNDS = ["white", "transparent"];

function buildPrompt(description, style, background, extra, t) {
  const styleMap = {
    flat:         "flat vector icon",
    illustration: "colorful illustration",
    watercolor:   "soft watercolor illustration",
    minimal:      "minimal clean icon",
  };
  const bgMap = {
    white:       "white background",
    transparent: "transparent background",
  };
  const parts = [
    `Create a ${styleMap[style] || style} as a square app icon for a vocabulary learning pack.`,
    `The icon represents: "${description}".`,
    `${bgMap[background] || "white background"}.`,
    "Clean, simple, educational look. Square composition, no text.",
  ];
  if (extra?.trim()) parts.push(extra.trim());
  return parts.join(" ");
}

export default function ImageGenDialog({
  open,
  onClose,
  packName = "",
  packCategory = "",
  onApply,
  token,
}) {
  const t = useT();

  const [description, setDescription] = useState("");
  const [style,       setStyle]       = useState("flat");
  const [background,  setBackground]  = useState("white");
  const [extra,       setExtra]       = useState("");
  const [generating,  setGenerating]  = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState(null);

  // Pre-fill description when dialog opens
  useEffect(() => {
    if (open) {
      const parts = [packName, packCategory].filter(Boolean);
      setDescription(parts.join(" — ") || "");
      setResult(null);
      setError(null);
      setProgress(0);
    }
  }, [open, packName, packCategory]);

  // Fake progress animation while generating
  useEffect(() => {
    if (!generating) return;
    setProgress(0);
    const start = Date.now();
    const ESTIMATE = 22000;
    const id = setInterval(() => {
      const p = Math.min(90, Math.round((Date.now() - start) / ESTIMATE * 90));
      setProgress(p);
    }, 250);
    return () => clearInterval(id);
  }, [generating]);

  async function handleGenerate() {
    if (!description.trim() || generating) return;
    setGenerating(true);
    setResult(null);
    setError(null);
    try {
      const prompt = buildPrompt(description, style, background, extra, t);
      const dataUrl = await generateImage(prompt, token);
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
          {/* Left: form */}
          <div className="img-gen-form">
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

            <div className="img-gen-row">
              <div className="img-gen-field">
                <label>{t("imgGen.styleLabel")}</label>
                <div className="img-gen-pills">
                  {STYLES.map(s => (
                    <button
                      key={s}
                      className={`img-gen-pill${style === s ? " active" : ""}`}
                      onClick={() => setStyle(s)}
                      disabled={generating}
                    >
                      {t(`imgGen.style${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>

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
            </div>

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

            <button
              className="img-gen-btn-generate"
              onClick={handleGenerate}
              disabled={!description.trim() || generating}
            >
              {generating ? t("imgGen.generating") : t("imgGen.generate")}
            </button>
          </div>

          {/* Right: preview / progress */}
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
                <span>Tu sa zobrazí vygenerovaný obrázok</span>
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
