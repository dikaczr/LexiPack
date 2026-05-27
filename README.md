LexiPack
Editor slovíčkových balíčkov pre aplikáciu Lexico.
LexiPack umožňuje tvorbu a správu jazykových balíčkov — každé slovíčko má 11 polí: word, article, phonetic, translation, definition, type, level, example_en, example_sk, topic, id. OpenAI integrácia dokáže automaticky doplniť chýbajúce polia. Aplikácia podporuje viacero jazykových párov.
Produkčná URL: https://lexico.techdoc.sk

Technológie
VrstvaStackFrontendReact 18 + Vite, ag-GridBackendExpress + Node.js (ES modules)DatabázaSQL Server (mssql)AIOpenAI API (gpt-4o-mini)DeployPM2 na Windows Server

Štruktúra projektu
LexiPack/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── screens/ # Hlavné obrazovky (Login, Projects, Editor, Settings, Users, Analytics)
│   │   ├── api/     # API volania (aiApi, auditApi...)
│   │   ├── i18n/    # Preklady (sk.js, en.js)
│   │   ├── utils/   # Pomocné funkcie (resizeImage...)
│   │   ├── themes.css
│   │   └── config.js
├── server/          # Express backend
│   ├── routes/      # packsRoutes, aiRoutes, authRoutes, qualityRoutes...
│   ├── packs/       # JSON súbory balíčkov
│   └── packs-sync.js
├── docs/            # Dodatočná dokumentácia
├── Archive/         # Archivované balíčky
├── Published/       # Publikované balíčky
├── CLAUDE.md        # Detailná technická dokumentácia (pre AI asistentov)
└── ecosystem.config.cjs  # PM2 konfigurácia

Prvé spustenie (lokálny vývoj)
Požiadavky

Node.js 18+
Prístup k SQL Serveru (zdieľaný s produkciou — pozri upozornenie nižšie!)
OpenAI API kľúč

Inštalácia
bash# 1. Klonovanie repozitára
git clone https://github.com/dikaczr/LexiPack.git
cd LexiPack

# 2. Inštalácia závislostí pre server
cd server
npm install

# 3. Vytvorenie .env súboru pre server
cp .env.example .env   # alebo vytvor ručne podľa sekcie nižšie
cd ..

# 4. Inštalácia závislostí pre klienta
cd client
npm install
cd ..
Spustenie
bash# Server (port 3001) a klient (port 5173) — každý v samostatnom termináli:
npm run server
npm run client
Aplikácia beží na: http://localhost:5173

Environment premenné
/server/.env
envOPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
PORT=3001
SESSION_SECRET=nejaky-tajny-retazec

DB_SERVER=87.197.134.16
DB_NAME=LexiPack
DB_USER=...
DB_PASSWORD=...

GMAIL_USER=...
GMAIL_APP_PASSWORD=...
/client/.env.production
envVITE_API_BASE=https://lexico.techdoc.sk

⚠️ Dôležité: Lokálny vývoj aj produkcia používajú TEN ISTÝ SQL Server. Nemením publish/archive paths lokálne!


Deploy na produkciu
bash# 1. Build frontendu
cd client
npm run build
# Skopírovať dist/ na server do C:\APPS\Lexipack\server\dist\

# 2. Skopírovať zmenené súbory servera do C:\APPS\Lexipack\server\

# 3. Ak sa zmenil package.json
npm install   # na serveri

# 4. Reštart PM2
pm2 restart lexipack-api

⚠️ Pozor: Lexico app beží na porte 3001 — LexiPack API je na porte 3002 (proxied). Nepliesť si ich!


Roly používateľov
RolaOprávneniaviewerLen čítanie balíčkoveditorTvorba a úprava balíčkovreviewerRecenzia slovíčok (FLAG / OK / COMMENT)adminVšetko + správa používateľov + publish

Workflow stavu balíčka
Draft → Complete → In Review → Approved → Published → Archived

Auto-Complete: keď sú všetky polia vyplnené a stav = Draft
Auto-In Review / Approved: po pridaní WordReview


Klávesové skratky (Editor)
SkratkaAkciaCtrl+SUložiť na serverCtrl+Z / YSpäť / DopreduCtrl+EnterAI generovanie riadkuCtrl+Shift+GHromadné AI generovanieAlt+InsertPridať riadokDeleteZmazať vybrané riadkyCtrl+BZáložka na/offCtrl+FRýchle hľadanieF1Pomocník

Témy
5 tém: dark (predvolená), dark-blue, solarized, monokai, light.
Pri úprave CSS vždy používaj CSS premenné (--app-bg, --app-accent...) — nikdy priamo hex kódy!

Prečo takáto architektúra?

SQL Server — existujúca infraštruktúra Techdoc, prístup cez VPN/IP
ag-Grid — výkon pri stovkách riadkov slovíčok, inline editácia
Bez TypeScriptu — rýchlejší vývoj sólo projektu, menej boilerplate
JSON súbory balíčkov + SQL mirror — JSON je ľahko prenositeľný formát pre Lexico app, SQL umožňuje dotazovanie a audit
Bez Redux — stav žije v EditorScreen a ide cez props, aplikácia nie je dostatočne veľká aby to odôvodnilo


Detailná technická dokumentácia
Pozri CLAUDE.md — obsahuje kompletné API tabuľky, strom komponentov, DB schému a všetky konvencie.
