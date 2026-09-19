import { useState } from "react";
import { useT } from "../i18n";
import { getCommonTopics } from "../utils/commonTopics";

function TopicFillDialog({ targetLang, rowCount, onApply, onDetect, onCancel }) {
  const t = useT();
  const [topic, setTopic] = useState("");
  const topics = getCommonTopics(targetLang);
  const trimmed = topic.trim();

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-title">{t("topicFill.title")}</div>

        <div className="dialog-section">
          <div className="dialog-desc">{t("topicFill.description")(rowCount)}</div>
          <div className="dialog-label">{t("topicFill.inputLabel")}</div>
          <input
            className="dialog-input"
            autoFocus
            value={topic}
            placeholder={t("topicFill.placeholder")}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && trimmed) onApply(trimmed);
            }}
          />
        </div>

        <div className="dialog-section">
          <div className="dialog-label">{t("topicFill.commonLabel")}</div>
          <div className="topic-chips">
            {topics.map((name) => (
              <button
                key={name}
                type="button"
                className={`topic-chip${name === trimmed ? " topic-chip-active" : ""}`}
                onClick={() => setTopic(name)}
                onDoubleClick={() => onApply(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="dialog-actions">
          <button onClick={onCancel}>{t("topicFill.cancel")}</button>
          <button onClick={onDetect} title={t("topicFill.detectHint")}>{t("topicFill.detect")}</button>
          <button disabled={!trimmed} onClick={() => onApply(trimmed)}>{t("topicFill.apply")}</button>
        </div>
      </div>
    </div>
  );
}

export default TopicFillDialog;
