import * as XLSX from "xlsx";
import en from "../i18n/en";
import sk from "../i18n/sk";
import { splitArticle } from "./splitArticle";

// Fields a source column can be mapped to. "example_target"/"example_native" are
// resolved to example_${targetLang}/example_${nativeLang} in buildImportedRows().
// Source "id" columns are intentionally NOT a valid target — imported rows always
// get a fresh id, so such columns can only ever be mapped to "ignore".
export const TARGET_FIELDS = [
  "word", "article", "phonetic", "translation", "definition", "type",
  "level", "topic", "example_target", "example_native", "contextSentences",
];

const DIRECT_FIELDS = ["word", "article", "phonetic", "translation", "definition", "type", "level", "topic"];

// Extra header aliases not covered 1:1 by the i18n `cols` dictionaries.
const EXTRA_ALIASES = {
  pos: "type",
  lvl: "level",
  category: "topic",
  theme: "topic",
};

function foldText(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Built once: folded label -> target field, sourced from both locale dictionaries
// so a header is recognized regardless of the app's *current* UI language.
function buildAliasMap() {
  const map = { ...EXTRA_ALIASES };
  for (const dict of [en, sk]) {
    for (const field of DIRECT_FIELDS) {
      const label = dict.cols?.[field];
      if (label) map[foldText(label)] = field;
    }
    const contextLabel = dict.cols?.context;
    if (contextLabel) map[foldText(contextLabel)] = "contextSentences";
  }
  return map;
}

const ALIAS_MAP = buildAliasMap();

function guessField(header) {
  const folded = foldText(header);
  if (ALIAS_MAP[folded]) return ALIAS_MAP[folded];

  // "Example DE" / "Príklad DE" -> example_target|example_native (resolved later
  // against the actual target/native lang codes by the caller via guessMapping())
  const exMatch = folded.match(/^(?:example|priklad)\s+([a-z]{2})$/);
  if (exMatch) return { exampleLang: exMatch[1] };

  return "";
}

export async function readXlsxWorkbook(file) {
  const data = await file.arrayBuffer();
  return XLSX.read(data);
}

export function parseXlsxSheet(workbook, sheetName) {
  const worksheet = workbook.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  const headers = (aoa[0] || []).map((h) => String(h ?? "").trim()).filter(Boolean);
  const rows = aoa.slice(1).map((line) =>
    Object.fromEntries(headers.map((h, i) => [h, line[i] ?? ""])),
  );
  return { headers, rows };
}

export function guessMapping(headers, targetLang = "en", nativeLang = "sk") {
  const mapping = {};
  for (const header of headers) {
    const guess = guessField(header);
    if (guess && typeof guess === "object") {
      if (guess.exampleLang === targetLang) mapping[header] = "example_target";
      else if (guess.exampleLang === nativeLang) mapping[header] = "example_native";
      else mapping[header] = "";
    } else {
      mapping[header] = guess;
    }
  }
  return mapping;
}

export function buildImportedRows({ rawRows, mapping, targetLang = "en", nativeLang = "sk", autoSplitArticle = false }) {
  const hasArticleColumn = Object.values(mapping).includes("article");

  return rawRows.map((rawRow) => {
    const row = { id: crypto.randomUUID() };

    for (const [header, field] of Object.entries(mapping)) {
      if (!field) continue;
      const value = rawRow[header];

      if (field === "contextSentences") {
        const lines = String(value ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
        row.contextSentences = lines.map((line) => ({ [targetLang]: line }));
        continue;
      }
      if (field === "example_target") {
        row[`example_${targetLang}`] = value;
        continue;
      }
      if (field === "example_native") {
        row[`example_${nativeLang}`] = value;
        continue;
      }
      row[field] = value;
    }

    if (autoSplitArticle && !hasArticleColumn && row.word) {
      const { article, word } = splitArticle(row.word, targetLang);
      row.word = word;
      if (article) row.article = article;
    }

    return row;
  });
}

export function validateImportRows(rows) {
  const totalCount = rows.length;
  const missingWordCount = rows.filter((r) => !r.word || !String(r.word).trim()).length;
  return { totalCount, missingWordCount };
}
