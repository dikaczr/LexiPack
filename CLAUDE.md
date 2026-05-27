# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is LexiPack

A bilingual vocabulary pack editor for language learners. Users create and edit vocabulary packs — each entry has 11 fields: `word`, `article`, `phonetic`, `translation`, `definition`, `type`, `level`, `example_en`, `example_sk`, `topic`, `id`. An OpenAI integration auto-fills missing fields. Supports multiple language pairs (target language configurable per pack).

## Commands

### Development (run both concurrently from repo root)
```bash
npm run server    # Express API on port 3001 (nodemon hot-reload)
npm run client    # Vite React dev server on port 5173
```

### Client-only (from `/client`)
```bash
npm run lint      # ESLint
npm run build     # Production build
npm run preview   # Preview production build
```

**When to restart server vs. rebuild client:**
- Changed any file in `server/` → server restarts automatically via nodemon
- Changed any file in `client/src/` → Vite HMR updates in browser; production needs `npm run build`
- Changed both → do both

There are no tests configured.

---

## Architecture

**Stack:** React 18 + Vite (client) / Express + Node.js (server) / SQL Server (mssql). ES modules (`"type": "module"`) throughout. No TypeScript — plain `.jsx`/`.js`.

### Client → Server

Client hardcodes `API_BASE` from `client/src/config.js` → `VITE_API_BASE` env var (default `http://localhost:3001`). Production: `https://lexico.techdoc.sk`. CORS in `server/server.js` allows both.

### Auth

JWT, 30-day expiry. `requireAuth` middleware verifies Bearer token, sets `req.user`. Roles: `viewer`, `editor`, `reviewer`, `admin`. `AuthContext` holds `user`, `token`, `login()`, `logout()`, `handleUnauthorized()`.

### Pack storage

Packs are JSON files in `/server/packs/`. SQL Server `Packs` table mirrors them (file_name, status, created_by). `server/packs-sync.js` keeps JSON ↔ SQL in sync.

**Pack status workflow:** `Draft → Complete → In Review → Approved → Published → Archived`
- Auto-Complete: on PUT save when all fields filled and status = Draft
- Auto-In Review / Approved: `evaluatePackStatusAfterReview()` after WordReview added

### SQL Server tables

| Table | Purpose |
|---|---|
| `Users` | id, username, email, password_hash, role, is_active |
| `AuditLog` | user action trail |
| `Packs` | file registry + status |
| `PackReviews` | reviewer actions on packs |
| `WordReviews` | FLAG / OK / COMMENT per word |
| `UserSettings` | key-value per user (appLang, appTheme, autoSaveInterval, publishPath, archivePath) |
| `Tags` | pack tag list |
| `AiTelemetry` | AI usage tracking per user/pack/action |
| `Heartbeats` | 30s active-editing pulses per user/pack |

---

## API surface

### Packs (`server/routes/packsRoutes.js` → `/api/packs`)

| Endpoint | Purpose |
|---|---|
| `GET /api/packs` | List all packs |
| `GET /api/packs/:fileName` | Load pack |
| `PUT /api/packs/:fileName` | Save pack |
| `POST /api/packs` | Create new pack |
| `DELETE /api/packs/:fileName` | Delete pack |
| `PATCH /api/packs/:fileName/status` | Change status |
| `POST /api/packs/:fileName/publish` | Publish (admin) |
| `PATCH /api/packs/:fileName/icon` | Save icon (base64 data URL, immediate) |
| `GET /api/packs/tags` | All used tags |
| `GET /api/packs/:fileName/word-reviews` | Load word reviews |
| `POST /api/packs/:fileName/word-reviews` | Add review |
| `DELETE /api/packs/:fileName/word-reviews/:id` | Delete review |

### AI (`server/routes/aiRoutes.js` → `/api`)

| Endpoint | Purpose |
|---|---|
| `POST /api/generate-translation` | Fill all fields for a word |
| `POST /api/generate-column` | Fill one field |
| `POST /api/generate-topic` | Detect topic |
| `POST /api/suggest-words` | Suggest 10 words (supports `wordType` param) |

### Quality (`server/routes/qualityRoutes.js` → `/api/quality`)

| Endpoint | Purpose |
|---|---|
| `POST /api/quality/example-check` | AI rates `example_en` sentences: ok/generic/weak (batch 15) |
| `POST /api/quality/duplicate-meaning` | AI finds semantically similar words (single request) |
| `POST /api/quality/pack-coverage` | AI groups words by sub-topic with High/Medium/Low coverage (Slovak output) |
| `POST /api/quality/trusted-sources` | AI selects from predefined source keys based on pack context |

### Other routes

| File | Prefix | Purpose |
|---|---|---|
| `authRoutes.js` | `/api/auth` | login, logout, /me, forgot-password, user CRUD |
| `settingsRoutes.js` | `/api/settings` | GET + PATCH UserSettings |
| `auditRoutes.js` | `/api/audit` | GET audit log (admin only) |
| `fsRoutes.js` | `/api/fs` | Directory browser (admin only) |
| `heartbeatRoutes.js` | `/api/heartbeat` | 30s active-editing pulse + stats |
| `telemetryRoutes.js` | `/api/telemetry` | AI usage stats |

---

## Client component tree

```
App.jsx → AppShell.jsx
  ├── screens/LoginScreen.jsx
  ├── screens/ProjectsScreen.jsx      — ag-grid list of packs; click to open
  ├── screens/EditorScreen.jsx        — main editor (most state lives here)
  │   ├── PackGrid.jsx                — ag-grid word table
  │   ├── PackMetadataPanel.jsx       — name, author, level, icon, tags, color, description
  │   ├── PackPreview.jsx             — right panel: word detail + reviews
  │   ├── ImportDialog.jsx            — XLSX/JSON import, 4 merge strategies
  │   ├── ExportDialog.jsx            — JSON/XLSX/TXT/PDF/CSV/TBX export
  │   ├── SuggestionsDialog.jsx       — AI word suggestions picker
  │   ├── PdfReaderDialog.jsx         — PDF text extraction + word picker
  │   ├── HelpDialog.jsx              — F1 help (all sections, hardcoded SK)
  │   ├── SymbolsDialog.jsx           — special character picker
  │   ├── SpellCheckDialog.jsx        — LanguageTool integration
  │   ├── ExampleCheckDialog.jsx      — AI example quality results
  │   ├── DuplicateMeaningDialog.jsx  — AI duplicate meaning results
  │   ├── PackCoverageDialog.jsx      — AI topic coverage visualization
  │   ├── BookmarkSidebar.jsx         — bookmark list panel
  │   └── BookmarkNotePopover.jsx     — bookmark note editor
  ├── screens/SettingsScreen.jsx      — theme, language, auto-save
  ├── screens/UsersScreen.jsx         — user management (admin)
  └── screens/AnalyticsScreen.jsx     — AI usage + editing time stats
```

---

## State management

No Redux or Context (except `AuthContext` and `SettingsContext`). State lives in `EditorScreen` and is passed as props. Undo/redo = manual history stack (`history`/`future` arrays with JSON.stringify snapshots). Rows auto-saved to `localStorage` every 300 ms as crash recovery.

---

## PackGrid (ag-grid) — important details

- Theme: `ag-theme-alpine-dark` with `theme="legacy"` prop (required for ag-grid v35)
- `rowHeight={26}`, `headerHeight={34}`
- **Custom checkbox column** (`field: "_checkbox"`) — replaces ag-grid's built-in `checkboxes: true`. Has a native `<input type="checkbox">` that calls `node.setSelected()`. Clicking it also updates `selectedRowIndex` synchronously via ref before `node.setSelected()` so `onSelectionChanged`'s `redrawRows` sees the correct row class.
- **Article column** — only shown for languages that use articles (`LANGS_WITH_ARTICLES = new Set(["en","de","fr","es","it"])`). Controlled by `targetLang` prop from `packMetadata.targetLang`. Positioned before Word column.
- `LevelCellEditor` — custom dropdown editor using `onValueChange` prop (ag-grid v31+ API) to bypass `getValue()` timing issues.
- `getRowClass` priority: `row-duplicate` → `row-selected` → `row-checked` → `row-invalid`
- Row clicking: `onRowClicked` + `onCellFocused` set `selectedRowIndex` (for preview). Checkbox click sets it via `onChange` before toggling.

---

## Key features

### AI Suggestions (`suggest-words`)
- Triggered by 💡 toolbar button
- Confirm dialog shows pack name, existing word count, and **word type dropdown** (Mix / Noun / Verb / Adjective / Adverb / Phrase / Idiom)
- `wordType` is sent to server; prompt instructs AI to use that type (Mix = balanced mix of all types)
- On add: `splitArticle(word, targetLang)` automatically separates article from word for languages that use articles (e.g. `"der Hund"` → `article:"der"`, `word:"Hund"`)

### Quality checks (toolbar button "Kvalita")

| Check | What it does |
|---|---|
| Kontrola konzistencie domén | AI verifies words fit the pack category |
| Konzistencia úrovní (CEFR) | AI re-rates words, flags wrong CEFR levels (batch 30) |
| Detektor duplicitných významov | AI finds semantically similar words (single request, all words) |
| Kontrola kvality príkladov | AI rates `example_en`: ok/generic/weak (batch 15) |
| Trusted Source Assistant | AI recommends dictionaries/sources for a word from a predefined key list |
| Pack Coverage Visualization | AI groups words by sub-topic with High/Medium/Low coverage bars |

Quality dropdown closes on outside click (click-outside via `qualityMenuRef`).

### Bookmarks
- Per-pack, stored in `localStorage` under `bookmarks_<packId>`
- `⚑` icon shown in `_bm_flag` grid column for bookmarked rows
- `★ Bookmarks` panel in right sidebar (below PackPreview)
- `Ctrl+B` — toggle bookmark on current row

### Word reviews (PackPreview)
- Reviewer/admin can FLAG, OK, or COMMENT each word
- Stored in SQL `WordReviews`, loaded via `GET /api/packs/:fileName/word-reviews`
- Grid shows status icons: ✅ OK, 🚩 FLAG, ★ comment

### Image / Icon handling
- Icons are base64 data URLs embedded in pack JSON (not separate files)
- Shared utility: `client/src/utils/resizeImage.js` — multi-step halving resize with `imageSmoothingQuality: "high"` to avoid aliasing. Max 256px. SVG returned as-is.
- On upload in Editor: immediately PATCHes server (`PATCH /api/packs/:fileName/icon`) + embedded in JSON on next save

### Footer info (EditorScreen)
- Left: status messages (Saving / Saved / Save failed)
- Right: `Počet slov / nedokončených: X / Y` — total rows and rows with any required field missing

### Export formats
`ExportDialog` supports: JSON, XLSX, TXT, PDF, CSV, TBX

### PDF import
`PdfReaderDialog` extracts text, highlights existing words, lets user add words by selecting text.

---

## Theme system

5 themes in `client/src/themes.css`: `dark` (default), `dark-blue`, `solarized`, `monokai`, `light`. Applied via `document.documentElement.dataset.theme`. **Always use `var(--app-*)` CSS variables — never hardcode hex colors.**

Key variables: `--app-bg`, `--app-chrome`, `--app-panel`, `--app-input`, `--app-border`, `--app-border-sub`, `--app-text`, `--app-text2`, `--app-muted`, `--app-accent`, `--app-danger`, `--app-warning`, `--app-grid-row`, `--app-grid-hdr`, `--app-card-bg`.

---

## i18n

Custom hook `useT()` from `client/src/i18n/index.js`. Dictionaries: `sk.js` + `en.js`. Language set via `settings.appLang` (default `sk`). Dynamic texts are functions: `t("key")(arg1, arg2)`.

**Rule:** Every new UI string must be added to both `sk.js` and `en.js`. Exception: `HelpDialog` — content is hardcoded in Slovak by design (too long for i18n).

---

## Key conventions

- **Keyboard shortcuts** defined in `EditorScreen.jsx` via `keydown` listener:

| Shortcut | Action |
|---|---|
| `Ctrl+Z / Ctrl+Y` | Undo / Redo |
| `Ctrl+S` | Save to server |
| `Ctrl+Enter` | AI generate row |
| `Ctrl+Shift+G` | Bulk AI generate |
| `Alt+Insert` | Add row |
| `Delete` | Delete selected rows |
| `Ctrl+D` | Duplicate row |
| `Ctrl+Shift+D` | Duplicate & Edit |
| `Ctrl+↑/↓` | Move row up/down |
| `Ctrl+B` | Toggle bookmark |
| `Ctrl+F` | Focus quick search |
| `F1` | Help dialog |
| `F2` | Next bookmark |
| `Ctrl+Delete` | Clear AI-generated fields |

- **AI API calls** go through `client/src/api/aiApi.js` — adds retry logic (3 attempts, 1s/2s/3s delays)
- **Audit logging**: server-side via `auditLog()`, client-side via `logAudit()` from `auditApi.js`
- **AI telemetry**: `trackAI()` called after every AI endpoint in `aiRoutes.js`
- **Heartbeat**: `useHeartbeat()` hook in EditorScreen — 30s interval, idle threshold 3 min

---

## Environment

### Server (`/server/.env`)
```
OPENAI_API_KEY=...
OPENAI_MODEL=...         # e.g. gpt-4o-mini
PORT=3001
SESSION_SECRET=...
DB_SERVER=...
DB_NAME=LexiPack
DB_USER=...
DB_PASSWORD=...
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
```

### Client (`/client/.env.production`)
```
VITE_API_BASE=https://lexico.techdoc.sk
```

---

## Deployment

Production runs on Windows Server, files at `C:\APPS\Lexipack\server\`. PM2 manages the process as `lexipack-api` on port 3002 (proxied). **Lexico app runs on port 3001 — unrelated, do not touch.**

**Deploy steps:**
1. Client: `npm run build` → copy `dist/` to server
2. Server files: copy changed files to `C:\APPS\Lexipack\server\` → `pm2 restart lexipack-api`
3. If `package.json` changed: run `npm install` before restart

**IMPORTANT — shared database:** Local dev and production use the SAME SQL Server instance (`DB_SERVER=87.197.134.16`). `UserSettings` (including `publishPath`, `archivePath`) are shared. Do not change publish/archive paths locally.
