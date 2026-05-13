function PackPreview({ row }) {

  if (!row) {
    return (
      <div className="preview-empty">
        Select a row to preview
      </div>
    );
  }

  return (
    <div className="preview-wrapper">

      <div className="learning-card">

        <div className="card-word">
          {row.article
            ? `${row.article} ${row.word}`
            : row.word}
        </div>

        <div className="card-phonetic">
          {row.phonetic || ""}
        </div>

        <div className="card-translation">
          {row.translation || ""}
        </div>

        <div className="card-definition">
          {row.definition || ""}
        </div>

        <div className="card-example-block">

          <div className="card-example-en">
            {row.example_en || ""}
          </div>

          <div className="card-example-sk">
            {row.example_sk || ""}
          </div>

        </div>

        <div className="card-tags">

          <div className="card-tag">
            {row.type || "type"}
          </div>

          <div className="card-tag">
            {row.level || "level"}
          </div>

          <div className="card-tag">
            {row.topic || "topic"}
          </div>

        </div>

      </div>

    </div>
  );
}

export default PackPreview;