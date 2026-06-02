import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth, requireRole } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

function getDir() {
  return path.join(__dirname, "../autocorrect");
}

function safeLocale(name) {
  return name.replace(/[^a-zA-Z0-9\-_]/g, "");
}

function parseXml(xml) {
  const langCodeMatch = xml.match(/<LanguageCode>(\d+)<\/LanguageCode>/);
  const langNameMatch = xml.match(/<LanguageName>([\w-]+)<\/LanguageName>/);
  const cdataMatch    = xml.match(/<State><!\[CDATA\[([\s\S]*?)\]\]><\/State>/);

  if (!langNameMatch || !cdataMatch)
    throw new Error("Neplatný formát .autoCorrect súboru");

  const languageCode = langCodeMatch ? parseInt(langCodeMatch[1]) : null;
  const languageName = langNameMatch[1];
  const inner        = cdataMatch[1];

  function getBool(tag) {
    const m = inner.match(new RegExp(`<${tag}>(true|false)</${tag}>`));
    return m ? m[1] === "true" : false;
  }

  const settings = {
    correctTwoInitialCaps: getBool("CorrectTwoInitialCaps"),
    correctSentenceCaps:   getBool("CorrectSentenceCaps"),
    correctCapsLock:       getBool("CorrectCapsLock"),
    replaceTextAsYouType:  getBool("ReplaceTextAsYouType"),
  };

  const entries = [];
  const re = /<Entry src="([^"]*)" trg="([^"]*)"[^/]*\/>/g;
  let m;
  while ((m = re.exec(inner)) !== null) {
    entries.push({ src: m[1], trg: m[2] });
  }

  return { languageCode, languageName, settings, entries };
}

// ── IMPORT ─────────────────────────────────────────────
router.post(
  "/import",
  requireAuth,
  requireRole("admin", "editor"),
  express.text({ limit: "10mb" }),
  (req, res) => {
    try {
      const xml = req.body;
      if (!xml || typeof xml !== "string")
        return res.status(400).json({ error: "Žiadne XML dáta" });

      const data = parseXml(xml);
      const dir  = getDir();
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${safeLocale(data.languageName)}.json`);
      fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");

      res.json({
        ok:           true,
        languageName: data.languageName,
        languageCode: data.languageCode,
        entryCount:   data.entries.length,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── ZOZNAM IMPORTOVANÝCH LOKALÍT ───────────────────────
router.get("/list", requireAuth, (req, res) => {
  try {
    const dir = getDir();
    if (!fs.existsSync(dir)) return res.json([]);
    const list = fs.readdirSync(dir)
      .filter(f => f.endsWith(".json"))
      .map(f => {
        try {
          const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
          return {
            languageName: d.languageName,
            languageCode: d.languageCode,
            entryCount:   d.entries?.length ?? 0,
          };
        } catch { return null; }
      })
      .filter(Boolean);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba pri načítaní" });
  }
});

// ── NAČÍTAJ ZÁZNAMY PRE LOKALITU ───────────────────────
router.get("/:locale", requireAuth, (req, res) => {
  try {
    const locale = safeLocale(req.params.locale);
    const dir = getDir();
    const base = locale.split("-")[0]; // "sk-SK" → "sk"

    // 1. Skús importovaný JSON
    const jsonFile = path.join(dir, `${locale}.json`);
    if (fs.existsSync(jsonFile))
      return res.json(JSON.parse(fs.readFileSync(jsonFile, "utf8")));

    // 2. Skús .autoCorrect s plným locale (sk-SK.autoCorrect)
    const acFull = path.join(dir, `${locale}.autoCorrect`);
    if (fs.existsSync(acFull))
      return res.json(parseXml(fs.readFileSync(acFull, "utf8")));

    // 3. Skús .autoCorrect so skráteným kódom (sk.autoCorrect)
    const acBase = path.join(dir, `${base}.autoCorrect`);
    if (fs.existsSync(acBase))
      return res.json(parseXml(fs.readFileSync(acBase, "utf8")));

    // 4. Skenuj všetky .autoCorrect súbory podľa LanguageName v obsahu
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".autoCorrect"));
      for (const f of files) {
        const xml = fs.readFileSync(path.join(dir, f), "utf8");
        const nameMatch = xml.match(/<LanguageName>([\w-]+)<\/LanguageName>/);
        if (nameMatch && nameMatch[1].toLowerCase() === locale.toLowerCase()) {
          return res.json(parseXml(xml));
        }
      }
    }

    // 5. Nič nenájdené — vráť prázdne dáta
    return res.json({ languageName: locale, languageCode: null, settings: {}, entries: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba pri načítaní" });
  }
});

// ── ULOŽ PÁRY PRE LOKALITU ────────────────────────────
router.put(
  "/:locale",
  requireAuth,
  requireRole("admin", "editor"),
  express.json({ limit: "2mb" }),
  (req, res) => {
    try {
      const locale  = safeLocale(req.params.locale);
      const entries = req.body?.entries;
      if (!Array.isArray(entries))
        return res.status(400).json({ error: "Chýba entries pole" });

      const dir  = getDir();
      const file = path.join(dir, `${locale}.json`);

      let data = { languageName: locale, languageCode: null, settings: {}, entries: [] };
      if (fs.existsSync(file)) {
        try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
      }

      data.entries = entries.filter(e => e.src?.trim() && e.trg?.trim())
                            .map(e => ({ src: e.src.trim(), trg: e.trg.trim() }));

      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");

      res.json({ ok: true, entryCount: data.entries.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── VYMAŽ LOKALITU ────────────────────────────────────
router.delete("/:locale", requireAuth, requireRole("admin", "editor"), (req, res) => {
  try {
    const file = path.join(getDir(), `${safeLocale(req.params.locale)}.json`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba pri mazaní" });
  }
});

export default router;
