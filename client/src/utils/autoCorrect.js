const TEXT_FIELDS = new Set(["word", "translation", "definition", "example_en", "example_sk", "topic"]);

export function buildLookup(entries) {
  const wordMap    = new Map(); // pure word entries → O(1) lookup by token
  const specialPairs = [];      // entries with special chars → literal replace

  for (const { src, trg } of entries) {
    if (/^[a-zA-ZÀ-žÀ-ÿ0-9]+$/.test(src)) {
      wordMap.set(src.toLowerCase(), trg);
    } else {
      specialPairs.push({ src, trg });
    }
  }
  return { wordMap, specialPairs };
}

function preserveCase(original, replacement) {
  if (!original || !replacement) return replacement;
  if (original.length > 1 && original === original.toUpperCase())
    return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase())
    return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

function applyWordMap(text, wordMap) {
  if (!wordMap.size) return text;
  // Split preserving whitespace chunks
  return text.split(/(\s+)/).map(token => {
    if (/^\s+$/.test(token) || !token) return token;
    // Strip leading/trailing punctuation for lookup
    const m = token.match(/^([^a-zA-ZÀ-žÀ-ÿ]*)([a-zA-ZÀ-žÀ-ÿ]+(?:[''-][a-zA-ZÀ-žÀ-ÿ]+)*)([^a-zA-ZÀ-žÀ-ÿ]*)$/);
    if (!m) return token;
    const [, pre, word, post] = m;
    const replacement = wordMap.get(word.toLowerCase());
    if (!replacement) return token;
    return pre + preserveCase(word, replacement) + post;
  }).join("");
}

function applySpecialPairs(text, specialPairs) {
  let result = text;
  for (const { src, trg } of specialPairs) {
    if (result.includes(src)) result = result.split(src).join(trg);
  }
  return result;
}

export function applyTwoInitialCaps(text) {
  // PRoject → Project, ABout → About
  return text.replace(/\b([A-ZÁČĎÉÍĽĹŇÓÔŔŠŤÚÝŽÄÖÜ])([A-ZÁČĎÉÍĽĹŇÓÔŔŠŤÚÝŽÄÖÜ])([a-záčďéíľĺňóôŕšťúýžäöü])/g,
    (_, a, b, c) => a + b.toLowerCase() + c);
}

export function applyCapsLock(text) {
  // tEXT → Text, hELLO → Hello
  return text.replace(/\b([a-záčďéíľĺňóôŕšťúýžäöü])([A-ZÁČĎÉÍĽĹŇÓÔŔŠŤÚÝŽÄÖÜ]{2,})\b/g,
    (_, first, rest) => first.toUpperCase() + rest.toLowerCase());
}

export function applyAutoCorrect(text, field, { lookup, correctTwoInitialCaps, correctCapsLock }) {
  if (!text || typeof text !== "string") return text;
  if (!TEXT_FIELDS.has(field)) return text;

  let result = text;
  if (lookup) {
    result = applySpecialPairs(result, lookup.specialPairs);
    result = applyWordMap(result, lookup.wordMap);
  }
  if (correctTwoInitialCaps) result = applyTwoInitialCaps(result);
  if (correctCapsLock)       result = applyCapsLock(result);
  return result;
}
