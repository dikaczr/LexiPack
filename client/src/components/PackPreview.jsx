import { useState } from "react";
import "./PackPreview.css";

const ACTION_LABELS = {
  FLAG:    { label: "Problém", color: "#f87171" },
  OK:      { label: "OK",      color: "#4ade80" },
  COMMENT: { label: "Komentár", color: "#60a5fa" },
};

function ReviewBadge({ action }) {
  const cfg = ACTION_LABELS[action] ?? { label: action, color: "#94a3b8" };
  return (
    <span style={{
      background: `${cfg.color}22`,
      color: cfg.color,
      border: `1px solid ${cfg.color}55`,
      borderRadius: 6,
      padding: "1px 8px",
      fontSize: 11,
      fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
}

export default function PackPreview({ row, reviews = [], onAddReview, onDeleteReview, userRole }) {
  const [action, setAction]   = useState("FLAG");
  const [comment, setComment] = useState("");
  const [adding, setAdding]   = useState(false);

  const wordReviews = reviews.filter((r) => r.word_id === row?.id);

  async function handleAdd(e) {
    e.preventDefault();
    if (!comment.trim() && action === "COMMENT") return;
    setAdding(true);
    await onAddReview?.({ word_id: row.id, word: row.word, action, comment: comment.trim() || null });
    setComment("");
    setAdding(false);
  }

  if (!row) {
    return <div className="preview-empty">Select a row to preview</div>;
  }

  const canReview = ["admin", "reviewer"].includes(userRole);

  return (
    <div className="preview-wrapper">
      <div className="learning-card">

        <div className="card-word">
          {row.article ? `${row.article} ${row.word}` : row.word}
          {wordReviews.length > 0 && (
            <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 600, color: "#4ade80", verticalAlign: "middle" }}>
              Pozn.
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
        <div className="word-reviews-title">Review poznámky</div>

        {wordReviews.length === 0 && (
          <div className="word-reviews-empty">Žiadne poznámky</div>
        )}

        {wordReviews.map((r) => (
          <div key={r.id} className="word-review-item">
            <div className="word-review-header">
              <ReviewBadge action={r.action} />
              <span className="word-review-author">{r.reviewer_name}</span>
              <span className="word-review-date">
                {new Date(r.created_at).toLocaleDateString("sk")}
              </span>
              {["admin", "reviewer"].includes(userRole) && (
                <button
                  className="word-review-delete"
                  onClick={() => onDeleteReview?.(r.id)}
                  title="Odstrániť"
                >✕</button>
              )}
            </div>
            {r.comment && <div className="word-review-comment">{r.comment}</div>}
          </div>
        ))}

        {/* FORMULÁR */}
        {canReview && (
          <form className="word-review-form" onSubmit={handleAdd}>
            <div className="word-review-form-row">
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="word-review-select"
              >
                <option value="FLAG">🚩 Problém</option>
                <option value="OK">✅ OK</option>
                <option value="COMMENT">💬 Komentár</option>
              </select>
            </div>
            <textarea
              className="word-review-textarea"
              placeholder="Komentár (voliteľný)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
            <button
              type="submit"
              className="word-review-submit"
              disabled={adding}
            >
              {adding ? "Ukladám..." : "Potvrdiť"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
