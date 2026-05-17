import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import packsRoutes from "./routes/packsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import { syncPacksOnStartup } from "./packs-sync.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import wordReviewsRoutes from "./routes/wordReviewsRoutes.js";
import fsRoutes from "./routes/fsRoutes.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://lexico.techdoc.sk",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use("/api/packs", packsRoutes);
app.use("/api/packs", wordReviewsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/fs", fsRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    app: "LexiPack",
  });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await syncPacksOnStartup();
});

app.post("/api/generate-translation", async (req, res) => {
  try {
    const { row } = req.body;

    if (!row || !row.word) {
      return res.status(400).json({
        error: "Missing word.word",
      });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,

      messages: [
        {
          role: "system",
          content: `
              You are a professional dictionary assistant.

              Return ONLY valid JSON.

              Fields:
              - phonetic
              - translation
              - definition
              - type
              - level
              - example_en
              - example_sk

              Translate to Slovak.

              Example:

              {
                "phonetic": "/ˈplænɪt/",
                "translation": "planéta",
                "definition": "A large object orbiting a star.",
                "type": "noun",
                "level": "B1",
                "example_en": "Earth is a planet.",
                "example_sk": "Zem je planéta."
              }
              `,
        },
        {
          role: "user",
          content: row.word,
        },
      ],
    });

    const aiText = completion.choices[0].message.content;

    const cleanedText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const aiData = JSON.parse(cleanedText);

    res.json(aiData);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "AI generation failed",
    });
  }
});

app.post("/api/generate-topic", async (req, res) => {
  try {
    const { word } = req.body;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,

      messages: [
        {
          role: "system",
          content: `
      Return ONLY one short topic word.

      Examples:
      planet -> astronomy
      engine -> transportation
      atom -> chemistry
      economy -> finance
      `,
        },
        {
          role: "user",
          content: word,
        },
      ],
    });

    const topic = completion.choices[0].message.content.trim().toLowerCase();

    res.json({
      topic,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Topic generation failed",
    });
  }
});

app.post("/api/suggest-words", async (req, res) => {
  try {
    const { existingWords, category, level } = req.body;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,

      messages: [
        {
          role: "system",

          content: `
You are a vocabulary assistant.

Suggest 10 new English vocabulary words.

Rules:
- avoid duplicates
- stay in the same topic
- keep the same difficulty level
- return ONLY valid JSON array

Example:
[
  "satellite",
  "gravity",
  "meteor"
]
`,
        },

        {
          role: "user",

          content: `
Category:
${category}

Level:
${level}

Existing words:
${existingWords.join(", ")}
`,
        },
      ],
    });

    const aiText = completion.choices[0].message.content;

    const cleanedText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const suggestions = JSON.parse(cleanedText);

    res.json({
      suggestions,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Suggestion generation failed",
    });
  }
});

app.post("/api/generate-column", async (req, res) => {
  try {
    const { row, field } = req.body;
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",

          content: `
You are a professional dictionary assistant.
Generate ONLY ONE field.
Return ONLY valid JSON.

Example:
{
  "value": "A large object orbiting a star."
}
`,
        },

        {
          role: "user",

          content: `
Field:
${field}

Word:
${row.word}

Translation:
${row.translation}

Definition:
${row.definition}

Example EN:
${row.example_en}

Example SK:
${row.example_sk}
`,
        },
      ],
    });

    const aiText = completion.choices[0].message.content;
    const cleanedText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const aiData = JSON.parse(cleanedText);

    res.json(aiData);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Column generation failed",
    });
  }
});
