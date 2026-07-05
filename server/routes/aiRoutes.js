import express from "express";
import OpenAI, { toFile } from "openai";
import { requireAuth } from "../middleware/auth.js";
import { auditLog } from "../middleware/audit.js";
import { trackAI } from "../middleware/telemetry.js";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const router = express.Router();

// Lazy init — dotenv beží v server.js pred prvým requestom
const getOpenAI = (() => {
  let client = null;
  return () => client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
})();

const LANG_NAMES = {
  en: "English", de: "German", fr: "French", sk: "Slovak",
  es: "Spanish", it: "Italian", cs: "Czech", pl: "Polish", hu: "Hungarian",
};

// ── DeepL preklad (bez auth — len utility) ───────────
router.post("/translate-word", async (req, res) => {
  try {
    const { word, fromLang, toLang } = req.body;
    if (!word) return res.status(400).json({ error: "Missing word" });

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "DEEPL_API_KEY not configured" });

    const baseUrl = apiKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
    const TARGET_MAP = { en: "EN-US", de: "DE", fr: "FR", sk: "SK", es: "ES", it: "IT", cs: "CS", pl: "PL", hu: "HU" };
    const sourceLang = (fromLang || "en").toUpperCase();
    const targetLang = TARGET_MAP[toLang] ?? (toLang || "sk").toUpperCase();

    const response = await fetch(`${baseUrl}/v2/translate`, {
      method: "POST",
      headers: { "Authorization": `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: [word], source_lang: sourceLang, target_lang: targetLang }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepL error:", response.status, errText);
      return res.status(500).json({ error: `DeepL ${response.status}: ${errText}` });
    }

    const data = await response.json();
    res.json({ translation: data.translations?.[0]?.text ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation failed" });
  }
});

// ── Topic detekcia (bez auth) ─────────────────────────
router.post("/generate-topic", async (req, res) => {
  try {
    const { word, targetLang } = req.body;
    const tName = LANG_NAMES[targetLang] || targetLang || "English";

    const requestAt = new Date();
    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: "system", content: `The input word is in ${tName}. Return ONLY one short topic word in English.\n\nExamples:\nplanet -> astronomy\nengine -> transportation\natom -> chemistry\neconomy -> finance` },
        { role: "user", content: word },
      ],
    });

    res.json({ topic: completion.choices[0].message.content.trim().toLowerCase() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Topic generation failed" });
  }
});

// ── AI Generate row (requireAuth) ────────────────────
router.post("/generate-translation", requireAuth, async (req, res) => {
  try {
    const { row, targetLang, nativeLang, packFile, packCategory } = req.body;
    if (!row?.word) return res.status(400).json({ error: "Missing word.word" });

    const tName = LANG_NAMES[targetLang] || targetLang || "English";
    const nName = LANG_NAMES[nativeLang] || nativeLang || "Slovak";
    const categoryHint = packCategory?.trim()
      ? `\n\nThis word belongs to a vocabulary pack about: "${packCategory}". Example sentences MUST reflect this domain — avoid unrelated contexts.`
      : "";

    const requestAt = new Date();
    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional lexicographer writing entries for an advanced vocabulary reference.\n\nReturn ONLY valid JSON.\n\nFields:\n- phonetic (IPA for ${tName})\n- translation (in ${nName})\n- definition (in ${tName})\n- type (part of speech in English, e.g. noun, verb)\n- level (CEFR: A1–C2)\n- example_${targetLang} (example sentence in ${tName})\n- example_${nativeLang} (example sentence in ${nName})${categoryHint}\n\nExample sentence rules:\n- Write natural sentences a native speaker would actually say or write\n- Show the word meaningfully in context — do NOT just state its definition\n- Avoid trivial patterns like "X is a Y" or "A X is used for Y"\n- Use realistic scenarios, actions, or situations\n- Both sentences must be translations of each other\n\nExample:\n{\n  "phonetic": "/ˈplænɪt/",\n  "translation": "planéta",\n  "definition": "A celestial body orbiting a star, massive enough to be rounded by its own gravity.",\n  "type": "noun",\n  "level": "B1",\n  "example_${targetLang}": "Scientists detected signs of water on the newly discovered planet, raising hopes for extraterrestrial life.",\n  "example_${nativeLang}": "Vedci objavili stopy vody na novo objavenej planéte, čo vzbudilo nádeje na mimozemský život."\n}`,
        },
        { role: "user", content: row.word },
      ],
    });

    const aiData = JSON.parse(completion.choices[0].message.content.replace(/```json|```/g, "").trim());

    await auditLog(req.user, "AI_GENERATE", { word: row.word }, req.ip);
    await trackAI(req.user, "AI_GENERATE", packFile ?? null, requestAt, completion.usage?.total_tokens ?? null);
    res.json(aiData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// ── AI Suggest words (requireAuth) ───────────────────
router.post("/suggest-words", requireAuth, async (req, res) => {
  try {
    const { existingWords, category, level, targetLang, wordType, customPrompt, packFile } = req.body;
    const langName = LANG_NAMES[targetLang] || targetLang || "English";

    const typeConstraint = (!wordType || wordType === "mix")
      ? "\n- include a balanced mix of word types: nouns, verbs, adjectives, adverbs, and phrases"
      : `\n- all suggested words must be of type: ${wordType}`;

    const customConstraint = customPrompt ? `\n- additional requirement: ${customPrompt}` : "";

    const ARTICLE_EXAMPLES = { de: "der Hund", fr: "le chat", es: "el perro", it: "il gatto" };
    const articleConstraint = ARTICLE_EXAMPLES[targetLang]
      ? `\n- for nouns, include the definite article (e.g. "${ARTICLE_EXAMPLES[targetLang]}")`
      : "";

    const requestAt = new Date();
    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a vocabulary assistant.\n\nSuggest 10 new ${langName} vocabulary words.\n\nRules:\n- avoid duplicates\n- stay in the same topic\n- keep the same difficulty level${typeConstraint}${articleConstraint}${customConstraint}\n- return ONLY valid JSON array\n\nExample:\n["satellite","gravity","meteor"]`,
        },
        { role: "user", content: `Category:\n${category}\n\nLevel:\n${level}\n\nExisting words:\n${existingWords.join(", ")}` },
      ],
    });

    const suggestions = JSON.parse(completion.choices[0].message.content.replace(/```json|```/g, "").trim());

    await auditLog(req.user, "AI_SUGGEST_WORDS", { category, level, wordCount: existingWords.length }, req.ip);
    await trackAI(req.user, "AI_SUGGEST_WORDS", packFile ?? null, requestAt, completion.usage?.total_tokens ?? null);
    res.json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Suggestion generation failed" });
  }
});

// ── AI Fill column (requireAuth) ──────────────────────
router.post("/generate-column", requireAuth, async (req, res) => {
  try {
    const { row, field, targetLang, nativeLang, packFile, packCategory } = req.body;
    const tName = LANG_NAMES[targetLang] || targetLang || "English";
    const nName = LANG_NAMES[nativeLang] || nativeLang || "Slovak";

    const exTargetField = `example_${targetLang}`;
    const exNativeField = `example_${nativeLang}`;

    const requestAt = new Date();

    // Pre example polia: vygeneruj obe vety naraz ako prekladový pár
    if (field === exTargetField || field === exNativeField) {
      const pairedField = field === exTargetField ? exNativeField : exTargetField;
      const categoryHint = packCategory?.trim()
        ? ` The vocabulary pack is about: "${packCategory}". Both sentences must reflect this topic.`
        : "";
      const completion = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a professional lexicographer.\nGenerate one natural, realistic example sentence for the ${tName} word and its exact ${nName} translation as a matching pair.${categoryHint}\nRules: show the word in a meaningful context — avoid trivial "X is a Y" patterns. Use realistic scenarios.\nReturn ONLY valid JSON:\n{\n  "${exTargetField}": "example sentence in ${tName}",\n  "${exNativeField}": "translation of that sentence in ${nName}"\n}`,
          },
          { role: "user", content: `Word (${tName}): ${row.word}\nTranslation (${nName}): ${row.translation || ""}` },
        ],
      });
      const aiData = JSON.parse(completion.choices[0].message.content.replace(/```json|```/g, "").trim());
      await auditLog(req.user, "AI_FILL_COLUMN", { word: row.word, field }, req.ip);
      await trackAI(req.user, "AI_FILL_COLUMN", packFile ?? null, requestAt, completion.usage?.total_tokens ?? null);
      return res.json({ value: aiData[field], paired: { field: pairedField, value: aiData[pairedField] } });
    }

    const fieldHints = {
      phonetic:    `IPA phonetic transcription for ${tName}`,
      translation: `translation of the word in ${nName}`,
      definition:  `definition of the word in ${tName}`,
      type:        "part of speech in English (e.g. noun, verb, adjective)",
      level:       "CEFR difficulty level (A1–C2)",
      topic:       "topic/category in one English word (e.g. astronomy, finance)",
    };

    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional dictionary assistant.\nThe vocabulary pack language is ${tName} (translations in ${nName}).\nGenerate ONLY ONE field: ${fieldHints[field] || `value for field "${field}"`}.\nReturn ONLY valid JSON.\n\nExample:\n{\n  "value": "A large object orbiting a star."\n}`,
        },
        { role: "user", content: `Field:\n${field}\n\nWord:\n${row.word}\n\nTranslation:\n${row.translation}\n\nDefinition:\n${row.definition}\n\nExample ${targetLang.toUpperCase()}:\n${row[exTargetField] || ""}\n\nExample ${nativeLang.toUpperCase()}:\n${row[exNativeField] || ""}` },
      ],
    });

    const aiData = JSON.parse(completion.choices[0].message.content.replace(/```json|```/g, "").trim());
    await auditLog(req.user, "AI_FILL_COLUMN", { word: row.word, field }, req.ip);
    await trackAI(req.user, "AI_FILL_COLUMN", packFile ?? null, requestAt, completion.usage?.total_tokens ?? null);
    res.json(aiData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Column generation failed" });
  }
});

// ── Generovanie obrázku (DALL-E 3) ──
router.post("/generate-image", requireAuth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: "prompt required" });

  const { negative, transparent, referenceImage } = req.body;
  const requestAt = new Date();
  try {
    const openai = getOpenAI();
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

    // gpt-image-1 nepodporuje negative prompt — zakomponujeme ho do promptu
    const avoidParts = [];
    if (negative?.trim()) avoidParts.push(negative.trim());
    const fullPrompt = avoidParts.length
      ? `${prompt.trim()} Avoid: ${avoidParts.join(", ")}.`
      : prompt.trim();

    let response;
    if (referenceImage?.trim()) {
      const matches = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid reference image format");
      const [, imgMime, imgB64] = matches;
      const imgBuffer = Buffer.from(imgB64, "base64");
      const imgFile = await toFile(imgBuffer, "reference.png", { type: imgMime });
      response = await openai.images.edit({
        model,
        image: imgFile,
        prompt: fullPrompt,
        size: "1024x1024",
        output_format: "png",
        ...(transparent ? { background: "transparent" } : {}),
      });
    } else {
      response = await openai.images.generate({
        model,
        prompt: fullPrompt,
        size: "1024x1024",
        output_format: "png",
        ...(transparent ? { background: "transparent" } : {}),
      });
    }

    const b64 = response.data[0].b64_json;
    const mime = "image/png";
    const buffer = Buffer.from(b64, "base64");

    // Uložiť do ~/Pictures/AI/
    try {
      const saveDir = path.join(os.homedir(), "Pictures", "AI");
      await fs.mkdir(saveDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      await fs.writeFile(path.join(saveDir, `ai_${timestamp}.png`), buffer);
    } catch (saveErr) {
      console.warn("[generate-image] save to disk failed:", saveErr.message);
    }

    await trackAI(req.user, "GENERATE_IMAGE", null, requestAt, null);
    await auditLog(req.user, "AI_GENERATE_IMAGE", { model, hasReference: !!referenceImage, transparent: !!transparent }, req.ip);
    res.json({ image: `data:${mime};base64,${b64}` });
  } catch (err) {
    console.error("generate-image failed:", err.message);
    res.status(500).json({ error: err.message || "Image generation failed" });
  }
});

export default router;
