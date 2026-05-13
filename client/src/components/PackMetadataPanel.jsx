function PackMetadataPanel({ metadata, setMetadata }) {
  function updateField(field, value) {
    const updated = {
      ...metadata,
      [field]: value,
    };

    setMetadata(updated);
  }

  return (
    <div className="metadata-panel">
      <input
        placeholder="Pack Name"
        value={metadata.name}
        onChange={(e) => updateField("name", e.target.value)}
      />

      <input
        placeholder="Author"
        value={metadata.author}
        onChange={(e) => updateField("author", e.target.value)}
      />

      <input
        placeholder="Category"
        value={metadata.category}
        onChange={(e) => updateField("category", e.target.value)}
      />

      <input
        placeholder="Version"
        value={metadata.version}
        onChange={(e) => updateField("version", e.target.value)}
      />

      <textarea
        placeholder="Description"
        value={metadata.description}
        onChange={(e) => updateField("description", e.target.value)}
      />
    </div>
  );
}

export default PackMetadataPanel;
