export const LANG_ARTICLES = {
  de: ["der", "die", "das", "ein", "eine"],
  fr: ["les", "le", "la", "l'", "des", "un", "une"],
  es: ["los", "las", "el", "la", "unos", "unas", "un", "una"],
  it: ["gli", "il", "lo", "le", "la", "i", "uno", "un", "una"],
};

export const LANGS_WITH_ARTICLES = new Set(Object.keys(LANG_ARTICLES));

export function splitArticle(rawWord, targetLang) {
  const normalized = rawWord.replace(/[‘’‚‛]/g, "'");
  const articles = LANG_ARTICLES[targetLang] || [];
  for (const art of articles) {
    if (art.endsWith("'")) {
      if (normalized.toLowerCase().startsWith(art.toLowerCase())) {
        return { article: normalized.slice(0, art.length), word: normalized.slice(art.length) };
      }
    } else {
      const prefix = art + " ";
      if (normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
        return { article: normalized.slice(0, art.length), word: normalized.slice(prefix.length) };
      }
    }
  }
  return { article: "", word: rawWord };
}
