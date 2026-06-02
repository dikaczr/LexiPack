import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

function getColumns(metadata) {
  const tl = (metadata?.targetLang || "en").toLowerCase();
  const nl = (metadata?.nativeLang || "sk").toLowerCase();
  return [
    { key: "word",              label: "Word" },
    { key: "article",           label: "Article" },
    { key: "phonetic",          label: "Phonetic" },
    { key: "translation",       label: "Translation" },
    { key: "definition",        label: "Definition" },
    { key: "type",              label: "Type" },
    { key: "level",             label: "Level" },
    { key: `example_${tl}`,    label: `Example ${tl.toUpperCase()}` },
    { key: `example_${nl}`,    label: `Example ${nl.toUpperCase()}` },
    { key: "topic",             label: "Topic" },
  ];
}

function buildSuggestedName(metadata, ext) {
  const safe = (metadata.name || "pack")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  const level   = metadata.level   || "B1";
  const version = metadata.version || "1.0";
  const target  = (metadata.targetLang || "EN").toUpperCase();
  const native  = (metadata.nativeLang || "SK").toUpperCase();
  return `${safe}_${level}_v${version}_${target}-${native}.${ext}`;
}

async function saveBlob(blob, suggestedName, mimeType, extensions) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: suggestedName, accept: { [mimeType]: extensions } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToXlsx(rows, metadata) {
  const COLUMNS = getColumns(metadata);
  const header = COLUMNS.map((c) => c.label);
  const data = rows.map((row) => COLUMNS.map((c) => row[c.key] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws["!cols"] = COLUMNS.map((c) => ({ wch: Math.max(c.label.length, 18) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, metadata.name || "Pack");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  await saveBlob(blob, buildSuggestedName(metadata, "xlsx"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [".xlsx"]);
}

export async function exportToTxt(rows, metadata) {
  const tl = (metadata?.targetLang || "en").toLowerCase();
  const nl = (metadata?.nativeLang || "sk").toLowerCase();
  const exTarget = `example_${tl}`;
  const exNative = `example_${nl}`;

  const lines = [];
  lines.push(`Pack: ${metadata.name || ""}`);
  lines.push(`Level: ${metadata.level || ""}  Version: ${metadata.version || ""}`);
  lines.push(`${tl.toUpperCase()} → ${nl.toUpperCase()}`);
  lines.push("=".repeat(60));
  lines.push("");

  rows.forEach((row, i) => {
    const word = [row.article, row.word].filter(Boolean).join(" ");
    const phon = row.phonetic ? ` [${row.phonetic}]` : "";
    lines.push(`${i + 1}. ${word}${phon}`);
    if (row.translation) lines.push(`   ${row.translation}`);
    if (row.type || row.level)
      lines.push(`   ${[row.type, row.level].filter(Boolean).join(", ")}`);
    if (row.definition)    lines.push(`   ${row.definition}`);
    if (row[exTarget])     lines.push(`   ${tl.toUpperCase()}: ${row[exTarget]}`);
    if (row[exNative])     lines.push(`   ${nl.toUpperCase()}: ${row[exNative]}`);
    if (row.topic)         lines.push(`   Topic: ${row.topic}`);
    lines.push("");
  });

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  await saveBlob(blob, buildSuggestedName(metadata, "txt"), "text/plain", [".txt"]);
}

export async function exportToTbx(rows, metadata) {
  const srcLang = (metadata.targetLang || "en").toLowerCase();
  const trgLang = (metadata.nativeLang || "sk").toLowerCase();
  const exTarget = `example_${srcLang}`;
  const exNative = `example_${trgLang}`;
  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const entries = rows.map((row, i) => `
    <termEntry id="c${i + 1}">
      ${row.topic ? `<descrip type="subjectField">${esc(row.topic)}</descrip>` : ""}
      ${row.level ? `<descrip type="projectSubset">${esc(row.level)}</descrip>` : ""}
      <langSet xml:lang="${srcLang}">
        <tig>
          <term>${esc(row.word)}</term>
          ${row.type    ? `<termNote type="partOfSpeech">${esc(row.type)}</termNote>` : ""}
          ${row.article ? `<termNote type="grammaticalGender">${esc(row.article)}</termNote>` : ""}
          ${row.phonetic ? `<termNote type="pronunciation">${esc(row.phonetic)}</termNote>` : ""}
        </tig>
        ${row.definition    ? `<descrip type="definition">${esc(row.definition)}</descrip>` : ""}
        ${row[exTarget]     ? `<descrip type="context">${esc(row[exTarget])}</descrip>` : ""}
      </langSet>
      <langSet xml:lang="${trgLang}">
        <tig>
          <term>${esc(row.translation)}</term>
        </tig>
        ${row[exNative] ? `<descrip type="context">${esc(row[exNative])}</descrip>` : ""}
      </langSet>
    </termEntry>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE martif SYSTEM "TBXcoreStrict.dtd">
<martif type="TBX-Basic" xml:lang="${srcLang}">
  <martifHeader>
    <fileDesc>
      <titleStmt><title>${esc(metadata.name || "Vocabulary Pack")}</title></titleStmt>
      <sourceDesc><p>LexiPack v${esc(metadata.version || "1.0")}</p></sourceDesc>
    </fileDesc>
  </martifHeader>
  <text>
    <body>
${entries}
    </body>
  </text>
</martif>`;

  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  await saveBlob(blob, buildSuggestedName(metadata, "tbx"), "application/xml", [".tbx"]);
}

export async function exportToCsv(rows, metadata, delimiter = ",") {
  const COLUMNS = getColumns(metadata);
  const escape = (val) => {
    const s = String(val ?? "");
    return s.includes(delimiter) || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const header = COLUMNS.map((c) => escape(c.label)).join(delimiter);
  const body = rows.map((row) => COLUMNS.map((c) => escape(row[c.key])).join(delimiter));
  const content = [header, ...body].join("\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  await saveBlob(blob, buildSuggestedName(metadata, "csv"), "text/csv", [".csv"]);
}

export async function exportToPdf(rows, metadata) {
  const tl = (metadata?.targetLang || "en").toLowerCase();
  const exTarget = `example_${tl}`;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(metadata.name || "Vocabulary Pack", margin, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const subtitle = `Level: ${metadata.level || ""}   Version: ${metadata.version || ""}   ${tl.toUpperCase()} → ${(metadata.nativeLang || "SK").toUpperCase()}`;
  doc.text(subtitle, margin, 22);

  const cols = [
    { key: "word",        label: "Word",                   w: 30 },
    { key: "article",     label: "Art.",                   w: 12 },
    { key: "translation", label: "Translation",            w: 38 },
    { key: "type",        label: "Type",                   w: 18 },
    { key: "level",       label: "Lvl",                    w: 12 },
    { key: "definition",  label: "Definition",             w: 60 },
    { key: exTarget,      label: `Example ${tl.toUpperCase()}`, w: 55 },
    { key: "topic",       label: "Topic",                  w: 22 },
  ];

  const cellH = 7;
  let y = 28;

  const drawRow = (cells, isHeader) => {
    doc.setFontSize(isHeader ? 8 : 7.5);
    doc.setFont("helvetica", isHeader ? "bold" : "normal");
    let x = margin;
    cells.forEach((text, ci) => {
      const w = cols[ci].w;
      if (isHeader) {
        doc.setFillColor(50, 50, 80);
        doc.setTextColor(255, 255, 255);
        doc.rect(x, y, w, cellH, "F");
      } else {
        doc.setFillColor(ci % 2 === 0 ? 245 : 240, ci % 2 === 0 ? 245 : 242, ci % 2 === 0 ? 255 : 252);
        doc.setTextColor(30, 30, 30);
        doc.rect(x, y, w, cellH, "F");
      }
      doc.rect(x, y, w, cellH, "S");
      doc.text(String(text ?? "").substring(0, Math.floor(w / 1.8)), x + 1.5, y + cellH - 2);
      x += w;
    });
    y += cellH;
  };

  drawRow(cols.map((c) => c.label), true);

  rows.forEach((row) => {
    if (y + cellH > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
      drawRow(cols.map((c) => c.label), true);
    }
    drawRow(cols.map((c) => row[c.key] ?? ""), false);
  });

  const blob = new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
  await saveBlob(blob, buildSuggestedName(metadata, "pdf"), "application/pdf", [".pdf"]);
}
