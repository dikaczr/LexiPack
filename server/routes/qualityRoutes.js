import express from "express";
import OpenAI from "openai";
import { requireAuth } from "../middleware/auth.js";

const getOpenAI = (() => {
  let client = null;
  return () => client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
})();

const LANG_NAMES = {
  en: "English", de: "German", fr: "French", sk: "Slovak",
  es: "Spanish", it: "Italian", cs: "Czech", pl: "Polish",
};

const router = express.Router();

const LT_URL = process.env.LANGUAGETOOL_URL ?? "https://api.languagetool.org/v2/check";

const LANG_MAP = {
  en: "en-US", sk: "sk-SK", de: "de-DE", fr: "fr-FR",
  es: "es",    it: "it",    pl: "pl-PL", cs: "cs-CZ",
};

async function checkText(text, lang) {
  if (!text?.trim()) return [];
  const ltLang = LANG_MAP[lang] ?? lang;
  const params = new URLSearchParams({ text, language: ltLang });
  const res = await fetch(LT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`LanguageTool HTTP ${res.status}`);
  const data = await res.json();
  return data.matches.map((m) => ({
    message:      m.message,
    replacements: m.replacements.slice(0, 4).map((r) => r.value),
    ruleId:       m.rule.id,
    offset:       m.offset,
    length:       m.length,
  }));
}

// POST /api/quality/spellcheck
// Body: { rows: [...], targetLang: "en", nativeLang: "sk" }
// Returns: [{ rowId, word, field, issues }]
router.post("/spellcheck", requireAuth, async (req, res) => {
  const { rows, targetLang = "en", nativeLang = "sk" } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "rows required" });
  }

  const FIELDS = [
    { field: "word",        lang: targetLang },
    { field: "translation", lang: nativeLang },
    { field: "definition",  lang: targetLang },
    { field: "example_en",  lang: targetLang },
    { field: "example_sk",  lang: nativeLang },
  ];

  // Check LanguageTool availability first
  try {
    await fetch(LT_URL.replace("/check", "/languages"), {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return res.status(503).json({ error: "LanguageTool API nie je dostupné. Skontroluj internetové pripojenie servera." });
  }

  const results = [];

  // Run checks in parallel per field, sequential per row to avoid LT overload
  for (const row of rows) {
    const fieldChecks = await Promise.all(
      FIELDS.map(async ({ field, lang }) => {
        const text = row[field];
        if (!text?.trim()) return null;
        try {
          const issues = await checkText(text, lang);
          if (issues.length === 0) return null;
          return { rowId: row.id, word: row.word, field, issues };
        } catch {
          return null;
        }
      })
    );
    for (const r of fieldChecks) {
      if (r) results.push(r);
    }
  }

  res.json(results);
});

// POST /api/quality/cefr-check
// Body: { rows: [{id, word, level}], targetLang, packLevel }
// Returns: { results: [{id, word, assignedLevel, aiLevel, match, note}], batchCount }
router.post("/cefr-check", requireAuth, async (req, res) => {
  const { rows, targetLang = "en", packLevel } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "rows required" });
  }

  const langName = LANG_NAMES[targetLang] ?? targetLang;
  const openai   = getOpenAI();
  const model    = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  // Filter rows with a word value, send only id+word+level to AI
  const toCheck = rows
    .filter((r) => r.word?.trim())
    .map((r) => ({ id: r.id, word: r.word.trim(), level: (r.level ?? packLevel ?? "").trim() }));

  const BATCH = 30;
  const results = [];

  for (let i = 0; i < toCheck.length; i += BATCH) {
    const batch = toCheck.slice(i, i + BATCH);
    const prompt = `You are a CEFR language level expert for ${langName}.
For each word below, assess whether the assigned CEFR level is correct.
Return ONLY a valid JSON array — no markdown, no explanation — with this structure:
[{"id":"...","word":"...","assignedLevel":"...","aiLevel":"A1|A2|B1|B2|C1|C2","match":true|false,"note":"short reason in English, max 10 words"}]

CEFR levels: A1 (beginner), A2 (elementary), B1 (intermediate), B2 (upper-intermediate), C1 (advanced), C2 (mastery).
Pack target level: ${packLevel || "not specified"}.

Words to assess:
${JSON.stringify(batch)}`;

    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = completion.choices[0]?.message?.content ?? "[]";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      results.push(...parsed);
    } catch (err) {
      console.error("CEFR batch error:", err.message);
      // On parse/API error, mark batch as unchecked
      for (const r of batch) {
        results.push({ id: r.id, word: r.word, assignedLevel: r.level, aiLevel: null, match: null, note: "AI error" });
      }
    }
  }

  res.json({ results, total: toCheck.length });
});

// POST /api/quality/example-check
// Body: { rows: [{id, word, example_en}], targetLang }
// Returns: { results: [{id, word, example, quality, note, suggestion}], total }
router.post("/example-check", requireAuth, async (req, res) => {
  const { rows, targetLang = "en" } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "rows required" });
  }

  const langName = LANG_NAMES[targetLang] ?? targetLang;
  const openai   = getOpenAI();
  const model    = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const toCheck = rows
    .filter((r) => r.example_en?.trim())
    .map((r) => ({ id: r.id, word: r.word?.trim() ?? "", example: r.example_en.trim() }));

  if (toCheck.length === 0) return res.json({ results: [], total: 0 });

  const prompt = `You are an expert reviewer of ${langName} vocabulary learning materials.
Evaluate each example sentence for teaching quality.

Rating criteria:
- "ok"      — uses the word naturally in real context, clearly demonstrates its meaning
- "generic" — vague or trivially true for any word (e.g. "This word is used in English.", "It is very important.")
- "weak"    — too short, trivial sentence, or fails to show the word's meaning in context

Return ONLY a valid JSON array — no markdown, no extra text:
[{"id":"...","quality":"ok|generic|weak","note":"brief reason in English, max 10 words","suggestion":"improved sentence or null"}]

Data to evaluate (id, word, example):
${JSON.stringify(toCheck)}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw    = completion.choices[0]?.message?.content ?? "[]";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    const byId = Object.fromEntries(toCheck.map((r) => [String(r.id), r]));
    const results = parsed.map((r) => ({
      ...r,
      word:    byId[String(r.id)]?.word    ?? "",
      example: byId[String(r.id)]?.example ?? "",
    }));

    res.json({ results, total: toCheck.length });
  } catch (err) {
    console.error("Example check error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quality/duplicate-meaning
// Body: { rows: [{id, word, translation}], targetLang, nativeLang }
// Returns: { groups: [{words:[{id,word,translation}], note}] }
router.post("/duplicate-meaning", requireAuth, async (req, res) => {
  const { rows, targetLang = "en", nativeLang = "sk" } = req.body;
  if (!Array.isArray(rows) || rows.length < 2) {
    return res.json({ groups: [] });
  }

  const langName   = LANG_NAMES[targetLang]  ?? targetLang;
  const nativeName = LANG_NAMES[nativeLang]  ?? nativeLang;
  const openai     = getOpenAI();
  const model      = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const compact = rows
    .filter((r) => r.word?.trim())
    .map((r) => ({ id: String(r.id), word: r.word.trim(), translation: r.translation?.trim() ?? "" }));

  if (compact.length < 2) return res.json({ groups: [] });

  const prompt = `You are a vocabulary expert reviewing a ${langName}–${nativeName} vocabulary list for a language learner.

Find groups of words that have the same or very similar meaning — true synonyms or near-synonyms a learner might confuse.
Rules:
- Group only words whose meanings overlap significantly in everyday usage.
- Do NOT group words that are related but clearly distinct (e.g. "see" vs "look" vs "watch").
- Ignore differences in formality/register unless both words would genuinely confuse a learner.
- Each group must contain at least 2 words.
- If no duplicates exist, return [].

Return ONLY a valid JSON array — no markdown, no explanation:
[{"words":[{"id":"...","word":"...","translation":"..."}],"note":"brief reason in English, max 15 words"}]

Vocabulary list:
${JSON.stringify(compact)}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw    = completion.choices[0]?.message?.content ?? "[]";
    const groups = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({ groups: Array.isArray(groups) ? groups : [] });
  } catch (err) {
    console.error("Duplicate meaning error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quality/pack-coverage
// Body: { rows: [{id, word, translation}], targetLang, packName, packCategory }
// Returns: { groups: [{name, coverage, words:[{id,word,translation}]}], missing: [], summary }
router.post("/pack-coverage", requireAuth, async (req, res) => {
  const { rows, targetLang = "en", packName = "", packCategory = "" } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "rows required" });
  }

  const langName = LANG_NAMES[targetLang] ?? targetLang;
  const openai   = getOpenAI();
  const model    = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const compact = rows
    .filter((r) => r.word?.trim())
    .map((r) => ({ id: String(r.id), word: r.word.trim(), translation: r.translation?.trim() ?? "" }));

  if (compact.length === 0) return res.json({ groups: [], missing: [], summary: "" });

  const theme = packCategory || packName || "general";

  const prompt = `You are a vocabulary curriculum expert. Analyze this ${langName} vocabulary pack about "${theme}".

Cluster the words into meaningful semantic sub-topics relevant to the pack's theme.
Then assess each group's coverage as:
- "high"   — well represented, likely enough words for learners
- "medium" — partially covered, more words would help
- "low"    — barely covered, significantly underrepresented

Also list 2–4 important sub-topics that are MISSING from the pack entirely.
Finally write one overall summary sentence about the pack's coverage.

IMPORTANT: Write all group names, missing topic names, and the summary in Slovak language.

Return ONLY a valid JSON object — no markdown:
{
  "groups": [{"name":"...","coverage":"high|medium|low","words":[{"id":"...","word":"...","translation":"..."}]}],
  "missing": ["téma 1", "téma 2"],
  "summary": "..."
}

Vocabulary list:
${JSON.stringify(compact)}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw  = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({
      groups:  Array.isArray(data.groups)  ? data.groups  : [],
      missing: Array.isArray(data.missing) ? data.missing : [],
      summary: typeof data.summary === "string" ? data.summary : "",
    });
  } catch (err) {
    console.error("Pack coverage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quality/trusted-sources
// Body: { targetWord, neighborWords, packCategory, packLevel, targetLang }
// Returns: { meaning, context, sources:[{key, reason, type}] }
router.post("/trusted-sources", requireAuth, async (req, res) => {
  const { targetWord, neighborWords = [], packCategory = "", packLevel = "", targetLang = "en" } = req.body;
  if (!targetWord?.trim()) return res.status(400).json({ error: "targetWord required" });

  const langName = LANG_NAMES[targetLang] ?? targetLang;
  const openai   = getOpenAI();
  const model    = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const availableSources = [
    { key: "cambridge",           type: "General learner",    desc: "Cambridge Dictionary — clear definitions with audio, good for B1+" },
    { key: "oxford_learner",      type: "General learner",    desc: "Oxford Learner's Dictionaries — designed for language learners A1–C1" },
    { key: "longman",             type: "General learner",    desc: "Longman Dictionary of Contemporary English — extensive usage examples" },
    { key: "merriam_webster",     type: "General reference",  desc: "Merriam-Webster — comprehensive American English definitions" },
    { key: "collins",             type: "General reference",  desc: "Collins Dictionary — British English, broad coverage" },
    { key: "vocabulary_com",      type: "Learning tool",      desc: "Vocabulary.com — adaptive learning with meaning explanations" },
    { key: "wiktionary",          type: "Open reference",     desc: "Wiktionary — free, multilingual, etymology included" },
    { key: "britannica",          type: "Encyclopedia",       desc: "Encyclopaedia Britannica — academic, reliable factual content" },
    { key: "nasa",                type: "Domain: Astronomy",  desc: "NASA Glossary — authoritative space and astronomy terms" },
    { key: "stanford_philosophy", type: "Domain: Philosophy", desc: "Stanford Encyclopedia of Philosophy — rigorous philosophical concepts" },
    { key: "investopedia",        type: "Domain: Finance",    desc: "Investopedia — finance, economics and business terminology" },
    { key: "mdn",                 type: "Domain: IT",         desc: "MDN Web Docs — web technology and programming terms" },
    { key: "physics_classroom",   type: "Domain: Physics",    desc: "The Physics Classroom — physics concepts explained for learners" },
    { key: "biology_online",      type: "Domain: Biology",    desc: "Biology Online — biological and life science terminology" },
    { key: "medicinenet",         type: "Domain: Medicine",   desc: "MedicineNet — medical and health terminology" },
    { key: "legal_dictionary",    type: "Domain: Law",        desc: "The Free Legal Dictionary — legal terms and definitions" },
  ];

  const prompt = `You are a vocabulary expert helping a ${langName} language pack editor.

Pack context:
- Category: ${packCategory || "general"}
- CEFR Level: ${packLevel || "unspecified"}
- Language: ${langName}
- Target word: "${targetWord}"
- Neighbor words in pack: ${neighborWords.length ? neighborWords.join(", ") : "(none)"}

Task:
1. Determine the precise semantic meaning of "${targetWord}" in the context of the neighbor words and pack category. Write it as one clear sentence (in Slovak).
2. Write one sentence of broader context — what semantic field/concept cluster does this word belong to in this pack (in Slovak).
3. Select 3–5 best sources from the list below that a translator/editor should use for this word at this level and domain.

Available sources (use only these keys):
${availableSources.map((s) => `- ${s.key}: ${s.desc}`).join("\n")}

Return ONLY a valid JSON object — no markdown:
{
  "meaning": "...",
  "context": "...",
  "sources": [{"key":"...","reason":"brief reason in Slovak, max 12 words"}]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw  = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({
      meaning: data.meaning ?? "",
      context: data.context ?? "",
      sources: Array.isArray(data.sources) ? data.sources : [],
    });
  } catch (err) {
    console.error("Trusted sources error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
