import { useState } from "react";
import { useT } from "../i18n";
import "./PackPreview.css";

const ACTION_COLORS = {
  FLAG:    "#f87171",
  OK:      "#4ade80",
  COMMENT: "#60a5fa",
};

function ReviewBadge({ action, label }) {
  const color = ACTION_COLORS[action] ?? "#94a3b8";
  return (
    <span style={{
      background: `${color}22`,
      color: color,
      border: `1px solid ${color}55`,
      borderRadius: 4,
      padding: "0px 6px",
      fontSize: 10,
      fontWeight: 600,
      lineHeight: "16px",
      display: "inline-block",
    }}>
      {label}
    </span>
  );
}

export default function PackPreview({ row, reviews = [], onAddReview, onDeleteReview, userRole }) {
  const t = useT();
  const [action, setAction]   = useState("OK");
  const [comment, setComment] = useState("");
  const [adding, setAdding]   = useState(false);

  const wordReviews = reviews.filter((r) => r.word_id === row?.id);

  async function handleAdd(e) {
    e.preventDefault();
    if (!comment.trim() && action === "COMMENT") return;
    setAdding(true);
    try {
      await onAddReview?.({ word_id: row.id, word: row.word, action, comment: comment.trim() || null });
      setComment("");
    } finally {
      setAdding(false);
    }
  }

  if (!row) {
    return <div className="preview-empty">{t("review.selectRow")}</div>;
  }

  const canReview = ["admin", "reviewer"].includes(userRole);

  return (
    <div className="preview-wrapper">
      <div className="learning-card">

        <div className="card-word">
          {row.article ? `${row.article} ${row.word}` : row.word}
          {wordReviews.length > 0 && (
            <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 600, color: "#4ade80", verticalAlign: "middle" }}>
              {t("review.note")}
            </span>
          )}
        </div>

        <div className="card-phonetic">{row.phonetic || ""}</div>
        <div className="card-translation">{row.translation || ""}</div>
        <div className="card-definition">{row.definition || ""}</div>

        <div className="card-example-block">
          <div className="card-example-en">{row.example_en || ""}</div>
          <div className="card-example-sk">{row.example_sk || ""}</div>
        </div>

        <div className="card-tags">
          <div className="card-tag">{row.type || "type"}</div>
          <div className="card-tag">{row.level || "level"}</div>
          <div className="card-tag">{row.topic || "topic"}</div>
        </div>

      </div>

      {/* REVIEWS SEKCIA */}
      <div className="word-reviews">
        <div className="word-reviews-title">{t("review.title")}</div>

        {/* FORMULÁR */}
        {canReview && (
          <form className="word-review-form" onSubmit={handleAdd}>
            <div className="word-review-form-row">
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="word-review-select"
              >
                <option value="OK">✅ {t("review.actions.OK")}</option>
                <option value="FLAG">🚩 {t("review.actions.FLAG")}</option>
                <option value="COMMENT">💬 {t("review.actions.COMMENT")}</option>
              </select>
            </div>
            <textarea
              className="word-review-textarea"
              placeholder={t("review.commentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
            <button
              type="submit"
              className="word-review-submit"
              disabled={adding}
            >
              {adding ? t("review.submitting") : t("review.submit")}
            </button>
          </form>
        )}

        {wordReviews.length === 0 && (
          <div className="word-reviews-empty">{t("review.empty")}</div>
        )}

        {wordReviews.map((r) => (
          <div key={r.id} className="word-review-item">
            <div className="word-review-header">
              <ReviewBadge action={r.action} label={t(`review.actions.${r.action}`) || r.action} />
              <span className="word-review-author">{r.reviewer_name}</span>
              <span className="word-review-date">
                {new Date(r.created_at).toLocaleDateString("sk")}
              </span>
              {["admin", "reviewer"].includes(userRole) && (
                <button
                  className="word-review-delete"
                  onClick={() => onDeleteReview?.(r.id)}
                  title={t("review.deleteTitle")}
                >✕</button>
              )}
            </div>
            {r.comment && <div className="word-review-comment">{r.comment}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
