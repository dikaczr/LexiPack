export async function importJsonFile(file, hintTargetLang = null, hintNativeLang = null) {
  const text = await file.text();
  const data = JSON.parse(text);

  const isPlainArray = Array.isArray(data);
  const words = isPlainArray ? data : (data.words || []);
  const nativeLang = (!isPlainArray && data.nativeLang) || hintNativeLang || "sk";

  // Detect targetLang: file metadata → hint from open pack → auto-detect → fallback
  let targetLang = (!isPlainArray && data.targetLang) || hintTargetLang || null;
  if (!targetLang && words.length > 0) {
    const keys = Object.keys(words[0]);
    const exKey = keys.find(
      (k) => k.toLowerCase().startsWith("example_") && k.toLowerCase() !== `example_${nativeLang}`
    );
    if (exKey) {
      targetLang = exKey.toLowerCase().replace("example_", "");
    } else {
      const shortKey = keys.find(
        (k) => /^[a-zA-Z]{2}$/.test(k) && k.toLowerCase() !== nativeLang
      );
      targetLang = shortKey ? shortKey.toLowerCase() : "en";
    }
  }
  targetLang = targetLang || "en";

  const exTargetField = `example_${targetLang}`;
  const exNativeField = `example_${nativeLang}`;

  const rows = words.map((row) => {
    const normalized = { id: crypto.randomUUID(), ...row };

    // Old array format: examples:[{de/DE: "...", sk/SK: "..."}]
    if (Array.isArray(row.examples) && row.examples.length > 0) {
      const ex = row.examples[0];
      if (!normalized[exTargetField])
        normalized[exTargetField] = ex[targetLang] ?? ex[targetLang.toUpperCase()] ?? ex.en ?? "";
      if (!normalized[exNativeField])
        normalized[exNativeField] = ex[nativeLang] ?? ex[nativeLang.toUpperCase()] ?? ex.sk ?? "";
      delete normalized.examples;
    }

    // Short lang-code field: "de" or "DE" → example_de
    if (!normalized[exTargetField]) {
      const targetKey = Object.keys(normalized).find(
        (k) => /^[a-zA-Z]{2}$/.test(k) && k.toLowerCase() === targetLang
      );
      if (targetKey) { normalized[exTargetField] = normalized[targetKey]; delete normalized[targetKey]; }
    }

    // Short native lang-code: "sk" or "SK" → example_sk
    if (!normalized[exNativeField]) {
      const nativeKey = Object.keys(normalized).find(
        (k) => /^[a-zA-Z]{2}$/.test(k) && k.toLowerCase() === nativeLang
      );
      if (nativeKey) { normalized[exNativeField] = normalized[nativeKey]; delete normalized[nativeKey]; }
    }

    // Flat example_* field in different case: example_DE → example_de
    if (!normalized[exTargetField]) {
      const exKey = Object.keys(normalized).find(
        (k) => k.toLowerCase() === exTargetField && k !== exTargetField
      );
      if (exKey) { normalized[exTargetField] = normalized[exKey]; delete normalized[exKey]; }
    }

    // Old LexiPack export: German text stored in example_en → remap to example_de
    if (targetLang !== "en" && !normalized[exTargetField] && normalized.example_en) {
      normalized[exTargetField] = normalized.example_en;
      delete normalized.example_en;
    }

    return normalized;
  });

  // Only include file metadata if the file actually had it (not plain array)
  const hasFileMetadata = !isPlainArray && (data.name || data.targetLang || data.packId);
  const metadata = hasFileMetadata ? {
    packId: data.packId || crypto.randomUUID(),
    name: data.name || "",
    description: data.description || "",
    targetLang,
    nativeLang,
    level: data.level || "B1",
    category: data.category || "",
    icon: data.icon || "📘",
    author: data.author || "",
    version: data.version || "1.0",
    tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""),
    color: data.color || "",
  } : null;

  return { metadata, rows, targetLang, nativeLang };
}
