export function exportToJson(rows, metadata) {
  const exportData = {
    metadata: {
      ...metadata,

      exportedAt: new Date().toISOString(),

      rowCount: rows.length,
    },

    words: rows,
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const safeName =
    metadata.name

      ?.toLowerCase()

      .normalize("NFD")

      .replace(/[\u0300-\u036f]/g, "")

      .replace(/[^a-z0-9\s-]/g, "")

      .replace(/\s+/g, "-") || "pack";

  const level = metadata.level || "B1";
  const version = metadata.version || "1.0";
  const target = metadata.targetLang?.toUpperCase() || "EN";
  const native = metadata.nativeLang?.toUpperCase() || "SK";
  const generatedFileName =
    `${safeName}` + `_${level}` + `_v${version}` + `_${target}-${native}.json`;
  const blob = new Blob([jsonString], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = generatedFileName;

  link.click();

  URL.revokeObjectURL(url);
}
