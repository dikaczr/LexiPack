# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is LexiPack

A bilingual vocabulary pack editor for language learners (English ↔ Slovak). Users create and edit vocabulary packs — each entry has ~11 fields (word, article, phonetic, translation, definition, type, level, example_en, example_sk, topic, id). An OpenAI integration auto-fills missing fields.

## Commands

### Development (run both concurrently)
```bash
# From repo root:
npm run server    # Express API on port 3001 (with nodemon hot-reload)
npm run client    # Vite React dev server on port 5173
```

### Client-only commands (from `/client`)
```bash
npm run lint      # ESLint
npm run build     # Production build
npm run preview   # Preview production build
```

There are no tests configured.

## Architecture

**Stack:** React 18 + Vite (client) / Express + Node.js (server). No database — packs are stored as JSON files in `/server/packs/`.

### Client → Server communication

The client hardcodes `http://localhost:3001/api`. CORS is restricted to `http://localhost:5173` in `server/server.js`. Both would need updating for any deployment.

### API surface (`server/server.js` + `server/routes/packsRoutes.js`)

| Endpoint | Purpose |
|---|---|
| `GET /api/packs` | List all packs (reads `/server/packs/*.json`) |
| `GET /api/packs/:fileName` | Load full pack data |
| `POST /api/generate-translation` | AI: fill all fields for a word |
| `POST /api/generate-column` | AI: fill a single field for a word |
| `POST /api/generate-topic` | AI: detect topic/category |
| `POST /api/suggest-words` | AI: suggest 10 related words |

### Client component tree

```
App.jsx → AppShell.jsx
  ├── screens/ProjectsScreen.jsx   — ag-grid list of packs; click to open
  ├── screens/EditorScreen.jsx     — main editor (most logic lives here)
  │   ├── components/PackGrid.jsx          — ag-grid with 11 columns
  │   ├── components/PackMetadataPanel.jsx — pack-level metadata
  │   ├── components/PackPreview.jsx       — right sidebar word detail
  │   ├── components/ImportDialog.jsx      — XLSX/JSON import with merge strategy
  │   └── components/SuggestionsDialog.jsx — AI word suggestions picker
  └── screens/SettingsScreen.jsx   — placeholder
```

### State management

No Redux or Context. State lives in `EditorScreen` and is passed down as props. Undo/redo is a manual history stack (`history`/`future` state arrays). Rows are auto-saved to `localStorage` every 300 ms as a recovery cache.

### AI API calls (`client/src/api/aiApi.js`)

All AI requests go through `aiApi.js`, which adds retry logic (3 attempts, 1s/2s/3s delays). Server calls OpenAI using model from `server/.env` `OPENAI_MODEL` variable.

### Data import/export (`client/src/utils/`)

- `xlsxImport.js` — parses XLSX using the `xlsx` library
- `jsonImport.js` / `jsonExport.js` — JSON round-trip

Import supports four merge strategies: `replace`, `append`, `merge` (fill empty fields), `skip` (ignore duplicates).

## Key conventions

- **ES modules** throughout — server uses `import`/`export` (`"type": "module"` in `server/package.json`)
- **No TypeScript** — plain `.jsx`/`.js`
- Keyboard shortcuts are defined in `EditorScreen.jsx` via a `keydown` listener. Notable ones: `Ctrl+Z/Y` undo/redo, `Ctrl+Enter` AI generate row, `Ctrl+S` export JSON, `Alt+Insert` add row, `Delete` delete rows, `F1` help.
- ag-grid uses `ag-theme-alpine-dark`

## Environment

Server reads `/server/.env`:
```
OPENAI_API_KEY=...
OPENAI_MODEL=...   # e.g. gpt-4o-mini
PORT=3001
SESSION_SECRET=... # currently unused
```
