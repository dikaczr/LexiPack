# LexiPack — Odborné hodnotenie kódu

> Vypracované na základe analýzy zdrojového kódu, máj 2026.
> Účel: podklad pre plánovanie verzie 2.0

---

## Celkové hodnotenie

**LexiPack je solídne naprogramovaný interný nástroj.** Na sólo projekt je kvalita kódu nadpriemerná — konzistentná štruktúra, čitateľný kód, funkčná architektúra. Nasledujúce body sú odporúčania pre profesionalizáciu, nie kritika.

---

## 1. BEZPEČNOSŤ

### ✅ Čo je dobre urobené
- **Heslá sú hashované** cez `bcryptjs` — správne
- **JWT autentifikácia** so správnym Bearer token overením
- **Parameterizované SQL queries** všade (`.input("param", sql.Type, value)`) — žiadne SQL injection riziko
- **CORS** obmedzený len na `lexico.techdoc.sk` a localhost
- **Rolový systém** (`requireRole(...)`) konzistentne použitý na chránených routách
- **Path traversal ochrana** — `isInsideDir()` funkcia v packsRoutes bráni úteku z workspace adresára

### ⚠️ Čo chýba alebo treba zlepšiť

**Rate limiting (stredná priorita)**
Na AI endpointoch nie je žiadne obmedzenie počtu volaní. Ak by niekto zavolal `/api/generate-translation` 1000x, ide to priamo na OpenAI API — čo stojí peniaze. Pre interný nástroj je riziko nízke, ale pre v2.0 odporúčam pridať `express-rate-limit`.

**Helmet.js (nízka priorita)**
Server nemá bezpečnostné HTTP hlavičky (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`...). Knižnica `helmet` ich pridá jedným riadkom:
```js
import helmet from 'helmet';
app.use(helmet());
```

**JWT — žiadna blacklist pri odhlásení**
`/api/auth/logout` len zaloguje odhlásenie, token zostáva technicky platný 30 dní. Pre interný nástroj akceptovateľné, ale v2.0 stojí za zváženie.

**`.gitignore` chýba v koreňovom adresári**
V zipe nebol `.gitignore`. Treba sa uistiť, že `.env` súbory sú v ňom zahrnuté, aby nikdy neskončili na GitHube.

---

## 2. SPOĽAHLIVOSŤ A ODOLNOSŤ PROTI VÝPADKOM

### ✅ Čo je dobre urobené
- **SQL connection pool** správne nakonfigurovaný (max 10 spojení, idle timeout)
- **AI retry logika** — `aiApi.js` skúša volanie 3x s narastajúcim oneskorením (1s/2s/3s)
- **localStorage crash recovery** — neuložené zmeny sa obnovia po páde prehliadača
- **Health endpoint** `/api/health` — PM2 alebo monitoring môže sledovať stav

### ⚠️ Čo chýba

**Chybové hlásenia pre používateľa sú nekonzistentné**
Niektoré chyby sa zobrazujú ako toast, iné len v konzole. Odporúčam centralizovať error handling na frontende — jedna funkcia `showError(msg)` volaná všade.

**Žiadny server-side logging do súboru**
Všetky chyby idú len do `console.error()`. PM2 síce zachytáva stdout/stderr, ale pri väčšom projekte chýba štruktúrovaný log (napr. `winston` alebo `pino`). Keď niečo zlyhá o 3:00 ráno, je ťažké nájsť čo a prečo.

**Žiadny monitoring / alerting**
Ak server spadne, nikto to nevie kým si to nevšimne. Pre v2.0 odporúčam aspoň jednoduchý `uptime monitor` (napr. UptimeRobot — zadarmo, posiela email ak server nereaguje).

**Backup databázy**
V dokumentácii nie je zmienka o automatickom backupe SQL Servera. Toto je kritické — ak sa poškodí disk alebo omylom zmažeš dáta, nie je záloha. Odporúčam nastaviť automatický SQL Server backup aspoň raz denne.

---

## 3. KVALITA KÓDU A REFAKTORING

### ✅ Čo je dobre urobené
- **ES modules** všade — moderný prístup
- **Konzistentná štruktúra** — routes / middleware / utils oddelené správne
- **i18n systém** — vlastný, jednoduchý, funkčný
- **CSS premenné pre témy** — správny prístup, ľahko rozšíriteľné

### ⚠️ Hlavný kandidát na refaktoring: `EditorScreen.jsx`

Tento súbor má **2835 riadkov** — to je najväčší problém v celom projekte.

Jeden súbor obsahuje: stav editora, klávesové skratky, AI volania, undo/redo, autosave, export logiku, import logiku, a rendering celej obrazovky. Toto sa nazýva "God Component" — komponent ktorý vie o všetkom.

Pre v2.0 odporúčam postupné rozdelenie do vlastných hookov:
```
useEditorState.js       — rows, selectedIndex, dirty flag
useUndoRedo.js          — history/future stack
useAutoSave.js          — localStorage + server save
useKeyboardShortcuts.js — všetky Ctrl+X skratky
useAiOperations.js      — generate, bulk generate, suggestions
```

Toto nie je nutné robiť naraz — každý hook môžeš vytiahnuť samostatne.

### Menšie veci
- `UserMenu.jsx` má 637 riadkov — obsahuje príliš veľa (profil, notifikácie, nastavenia). Dá sa rozdeliť.
- V `packsRoutes.js` sú niektoré funkcie dlhé 80-100 riadkov — dali by sa rozdeliť na menšie helper funkcie.

---

## 4. USER INTERFACE — čo je dnes štandard

Toto je oblasť kde sa projekty z "starej školy" najviditeľnejšie líšia od moderných aplikácií.

### ✅ Čo je už moderné
- **Tmavý mód ako default** — správne, väčšina nástrojov pre profesionálov má tmavý mód
- **ag-Grid pre tabuľku** — výborná voľba, profesionálny štandard pre dátové tabuľky
- **Klávesové skratky** — power-userom nesmierne pomáhajú
- **Inline editácia** priamo v tabuľke — moderný prístup
- **Témy** — príjemný bonus

### ⚠️ Čo sa dnes robí inak

**Toast notifikácie namiesto alert/confirm dialógov**
Ak ešte používaš `window.confirm()` alebo `window.alert()` kdekoľvek — to je najviditeľnejší "starý" vzor. Moderné aplikácie používajú vlastné modálne okná alebo toast notifikácie. (Pozrel som kód — máš vlastné modály, čo je správne.)

**Skeleton loading namiesto "Loading..."**
Keď sa načítava zoznam balíčkov, moderné aplikácie zobrazujú "kostru" tabuľky (sivé pruhy v tvare riadkov) namiesto textu alebo spinnera. Pôsobí to profesionálnejšie.

**Drag & drop**
Pre zmenu poradia balíčkov alebo slov — dnes očakávaný štandard. Vidím že máš Ctrl+↑/↓ na presúvanie riadkov, čo je funkčné, ale drag & drop je intuitívnejší pre nových používateľov.

**Kontextové menu (pravý klik)**
Na riadku v tabuľke — "Duplikovať", "Zmazať", "Pridať záložku" — toto je bežný vzor v moderných editoroch. Momentálne sú tieto akcie v toolbare.

**Breadcrumb navigácia**
Pri otvorenom balíčku nie je úplne jasné "kde som" v aplikácii. Jednoduchý `Projekty > astronomy.json` v hlavičke by pomohol orientácii.

**Command palette (Ctrl+K)**
Toto je moderný "super-skratka" vzor z VS Code, Linear, Notion — otvorí sa vyhľadávanie všetkých akcií. Pre power-usera veľmi príjemné. Nie je nutnosť, ale pôsobí profesionálne.

**Responzívny dizajn**
Predpokladám že LexiPack sa používa len na počítači, takže toto nie je priorita. Ale pre prípad budúcnosti — tabuľka so 11 stĺpcami na mobile nefunguje bez špeciálneho riešenia.

---

## 5. VÝKON

### ✅ Čo je dobre
- ag-Grid je virtualizovaný — zvládne tisíce riadkov bez problémov
- Vite build je optimalizovaný

### ⚠️ Potenciálne problémy pri raste

**Celý balíček sa načítava naraz**
`GET /api/packs/:fileName` vracia celý JSON súbor. Pre astronomy.json je to 35KB — zatiaľ v poriadku. Ak by balíčky rástli na tisíce slov, oplatí sa premyslieť stránkovanie alebo lazy loading.

**Undo/redo cez JSON.stringify snapshots**
Každý krok ukladá celú kópiu poľa slov. Pre 500 slov a 50 krokov histórie = 25MB v pamäti prehliadača. Zatiaľ bezproblémové, pri veľkých balíčkoch môže byť pomalé.

---

## Zhrnutie priorít pre v2.0

| Priorita | Oblasť | Akcia |
|----------|--------|-------|
| 🔴 Kritická | Backup | Nastaviť automatický backup SQL Servera |
| 🔴 Kritická | .gitignore | Overiť že .env nie je na GitHube |
| 🟡 Dôležitá | Refaktoring | Rozdeliť EditorScreen.jsx na hoky |
| 🟡 Dôležitá | Monitoring | UptimeRobot alebo podobný nástroj |
| 🟡 Dôležitá | Logging | Pridať winston/pino na server |
| 🟢 Príjemné | Bezpečnosť | Pridať helmet.js |
| 🟢 Príjemné | Bezpečnosť | Rate limiting na AI endpointoch |
| 🟢 Príjemné | UX | Skeleton loading |
| 🟢 Príjemné | UX | Kontextové menu na riadku |
| 🟢 Príjemné | UX | Breadcrumb navigácia |
