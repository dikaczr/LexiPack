import * as XLSX from "xlsx";

const LABEL_TO_KEY = {
  "word":        "word",
  "article":     "article",
  "phonetic":    "phonetic",
  "translation": "translation",
  "definition":  "definition",
  "type":        "type",
  "level":       "level",
  "topic":       "topic",
  "id":          "_src_id",
};

function normalizeKey(header, targetLang, nativeLang) {
  const h = header.trim();
  const hl = h.toLowerCase();

  // Direct lowercase match (e.g. already "word", "example_de")
  if (LABEL_TO_KEY[hl]) return LABEL_TO_KEY[hl];
  if (hl.startsWith("example_")) return hl;

  // Label match: "Example DE" → example_de, "Example SK" → example_sk
  const exMatch = h.match(/^example\s+([a-z]{2})$/i);
  if (exMatch) return `example_${exMatch[1].toLowerCase()}`;

  // Capitalised labels from exportUtils: "Word" → "word", etc.
  if (LABEL_TO_KEY[hl]) return LABEL_TO_KEY[hl];

  // Fallback: return as-is (lowercased)
  return hl;
}

export async function importXlsxFile(file, targetLang = "en", nativeLang = "sk") {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  return jsonData.map((row) => {
    const normalized = { id: crypto.randomUUID() };
    for (const [header, value] of Object.entries(row)) {
      const key = normalizeKey(header, targetLang, nativeLang);
      if (key !== "_src_id") normalized[key] = value;
    }
    return normalized;
  });
}
