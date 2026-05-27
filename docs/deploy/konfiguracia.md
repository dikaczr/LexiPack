# Konfigurácia

## Server — `/server/.env`

Skopíruj súbor `/server/.env.example` (ak existuje) na `/server/.env` a vyplň hodnoty:

```ini
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Server
PORT=3001
SESSION_SECRET=dlhy-nahodny-retazec-min-32-znakov

# SQL Server
DB_SERVER=127.0.0.1
DB_NAME=LexiPack
DB_USER=lexipack_user
DB_PASSWORD=heslo

# Gmail SMTP (voliteľné — pre resetovanie hesla)
GMAIL_USER=tvojmail@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### Popis premenných

| Premenná | Popis |
|---|---|
| `OPENAI_API_KEY` | API kľúč z platform.openai.com |
| `OPENAI_MODEL` | Model pre generovanie — odporúčame `gpt-4o-mini` |
| `PORT` | Port servera (predvolene 3001) |
| `SESSION_SECRET` | Tajný kľúč pre JWT podpisovanie — náhodný reťazec, min. 32 znakov |
| `DB_SERVER` | Adresa SQL Servera (IP alebo hostname) |
| `DB_NAME` | Názov databázy (predvolene `LexiPack`) |
| `DB_USER` | Používateľ SQL Servera |
| `DB_PASSWORD` | Heslo SQL Servera |
| `GMAIL_USER` | Gmail adresa pre odosielanie e-mailov |
| `GMAIL_APP_PASSWORD` | App Password z Google účtu (nie bežné heslo) |

## Klient — `/client/.env.production`

```ini
VITE_API_BASE=https://tvojadomena.sk
```

Toto nastaví adresu API pre produkčný build. Ak klient beží na rovnakom serveri ako API, môžeš použiť relatívnu cestu alebo preskočiť (default: `http://localhost:3001`).

## CORS

Ak klient beží na inej doméne ako server, pridaj jej adresu do zoznamu v `server/server.js`:

```js
const allowedOrigins = [
  "http://localhost:5173",
  "https://tvojadomena.sk",   // ← pridaj
];
```

## Adresáre pre publikovanie (voliteľné)

V nastaveniach aplikácie (Settings → admin) môžeš nastaviť:
- **Publish path** — adresár, kam sa kopírujú publikované JSON súbory (pre Lexico)
- **Archive path** — adresár pre ZIP archívy

::: warning
Tieto cesty musia existovať na serveri a server musí mať práva zápisu.
:::
