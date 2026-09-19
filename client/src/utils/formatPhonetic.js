// Phonetics are stored between slashes, e.g. /ˈplænɪt/. Values that already start
// with a slash-delimited transcription (including "/a/ (ES), /b/ (LA)" variants) are kept as they are.
export function formatPhonetic(value) {
  const text = String(value ?? "").trim();
  if (/^\/[^/]+\//.test(text)) return text;
  const inner = text.replace(/^[/[]+|[/\]]+$/g, "").trim();
  return inner ? `/${inner}/` : "";
}

export function needsPhoneticSlashes(value) {
  const text = String(value ?? "").trim();
  return text !== "" && formatPhonetic(text) !== text;
}
