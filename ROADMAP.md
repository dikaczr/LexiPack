# LexiPack — ROADMAP v2.0

> Vytvorené: máj 2026
> Stav: plánované funkcie pre verziu 2.0
> Poznámka: poradie v rámci kategórií nie je záväzné — bude upresnené pri štarte v2.0

---

## 1. ROZŠÍRENIE DÁTOVÉHO MODELU (Polia slovíčok)

Pridanie nových voliteľných polí ku každému slovu:

| Pole | Popis |
|------|-------|
| `synonyms` | Synonymá (zoznam) |
| `antonyms` | Antonymá (zoznam) |
| `collocations` | Kolokácie — typické slovné spojenia |
| `irregular_forms` | Nepravidelné tvary (minulý čas, množné číslo...) |
| `register` | Štýlová vrstva — formálne / hovorové / slangové |
| `notes` | Voľná poznámka editora |

**Technické dopady:**
- Migrácia existujúcich JSON balíčkov (nové polia = `null` ak chýbajú)
- Rozšírenie PackGrid o nové stĺpce (voliteľne zapínateľné)
- Rozšírenie PackPreview o zobrazenie nových polí
- AI endpointy pre auto-generovanie nových polí
- Export formáty (XLSX, TBX) — doplniť nové polia

---

## 2. PROJEKTY (Jobs / Zákazky)

**Cieľ:** Sledovanie skupín balíčkov ako jeden pracovný celok (zákazka pre konkrétneho zákazníka alebo tému).

**Funkcionalita:**
- Vytvorenie projektu: názov, zákazník, popis, deadline
- Priradenie balíčkov k projektu (jeden balíček = jeden projekt)
- Sledovanie stavu projektu — automaticky vypočítaný z balíčkov:
  - `V príprave` — niektoré balíčky sú Draft
  - `V recenzii` — balíčky sú In Review / Approved
  - `Dokončený` — všetky balíčky sú Published
- Prehľad projektu: koľko balíčkov, koľko slov, koľko hotových
- Možnosť exportu celého projektu naraz (zip všetkých balíčkov)

**Technické dopady:**
- Nová DB tabuľka `Projects` (id, name, client, description, deadline, created_by, created_at)
- Nová DB tabuľka `ProjectPacks` (project_id, pack_id)
- Nové API routes `/api/projects`
- Nová obrazovka `ProjectsDetailScreen` alebo rozšírenie `ProjectsScreen`
- Tlačidlo "Projekty" v navigácii — už existuje, treba zapojiť

---

## 3. GRAMATIKA A KONTROLA PRAVOPISU

**Problém:** SpellCheckDialog (LanguageTool integrácia) nefunguje spoľahlivo.

**Riešenie v2.0:**

**Možnosť A — Hunspell (lokálne, offline)**
- Node.js knižnica `nspell` (Hunspell v JS)
- Slovníky stiahnuté lokálne pre EN, SK, DE...
- Výhoda: funguje offline, bez externej závislosti
- Nevýhoda: len kontrola pravopisu, nie gramatiky

**Možnosť B — LanguageTool self-hosted**
- LanguageTool má Docker image — spustiť na vlastnom serveri
- Kontrola pravopisu + gramatiky + štýlu
- Výhoda: komplexná kontrola, rovnaký engine ako v MS Word doplnku
- Nevýhoda: vyžaduje ďalší server/Docker kontajner

**Možnosť C — AI gramatická kontrola (OpenAI)**
- Využiť existujúcu OpenAI integráciu
- Batch kontrola `example_en` a `example_sk` viet
- Výhoda: najjednoduchšia implementácia, hlboká kontrola
- Nevýhoda: spoplatnené, pomalšie

**Odporúčanie:** Možnosť A pre rýchle nasadenie + Možnosť C pre hlbšiu kontrolu príkladových viet.

---

## 4. AI — ROZŠÍRENIE ASISTENTA

### 4a. Nové polia (nadväzuje na bod 1)
- Auto-generovanie `synonyms`, `antonyms`, `collocations`, `irregular_forms`
- Doplnenie do existujúceho `generate-translation` endpointu alebo nový endpoint

### 4b. Kontrola obsahu balíčka
- AI skontroluje či sú slová v balíčku vhodné pre deklarovanú úroveň (CEFR)
- AI skontroluje tematickú konzistenciu balíčka
- *(Základná verzia týchto kontrol už existuje — rozšíriť a vylepšiť)*

### 4c. Rady pre zlepšenie balíčka
- AI navrhne chýbajúce témy alebo podtémy
- AI identifikuje "slabé miesta" — slová bez príkladov, bez fonetiky...
- AI odporučí ďalšie slová na doplnenie pre lepšie pokrytie témy

### 4d. Adaptívne odporúčania pre používateľa Lexico
- Na základe obsahu balíčkov AI navrhne optimálne poradie štúdia
- Návrh "learning path" — od A1 po C2 cez existujúce balíčky

---

## 5. GRAFIKA — Poloautomatické obrázky

**Cieľ:** Každé slovíčko môže mať ilustráciu. Obrázky generuje AI, človek schvaľuje alebo regeneruje.

**Workflow:**
1. Editor klikne "Generovať obrázok" pri slove (alebo hromadne pre celý balíček)
2. AI (DALL-E 3 alebo podobné) vygeneruje obrázok podľa slova + kontextu
3. Editor vidí náhľad — Schváliť / Regenerovať / Preskočiť
4. Schválený obrázok sa uloží ako base64 v JSON (ako ikona balíčka)

**Technické dopady:**
- Nové pole `image` v dátovom modeli slova
- Nový AI endpoint `/api/generate-image`
- UI: nový stĺpec / panel pre obrázky v PackPreview
- Limit veľkosti — obrázky komprimovať (max 512x512, WebP)
- Pozor na náklady — DALL-E 3 je spoplatnený, pridať telemetriu

**Štýl:** Jednotný vizuálny štýl balíčkov je hotový. Pre budúcnosť zvážiť modernizáciu.

---

## 6. UX VYLEPŠENIA (z code review)

Menšie vylepšenia ktoré posunú aplikáciu na ďalší level:

- **Skeleton loading** — pri načítaní zoznamu balíčkov namiesto spinnera
- **Kontextové menu (pravý klik)** — na riadku tabuľky: Duplikovať / Zmazať / Záložka
- **Breadcrumb navigácia** — `Projekty > astronomy.json` v hlavičke editora
- **Drag & drop** — presúvanie riadkov myšou (doplnok k Ctrl+↑/↓)
- **Command palette (Ctrl+K)** — vyhľadávanie všetkých akcií

---

## 7. TECHNICKÝ DLAH (z code review)

Veci ktoré nesúvisia s funkciami ale zlepšia udržateľnosť kódu:

- **Refaktoring EditorScreen.jsx** (2835 riadkov → rozdeliť na hoky)
  - `useEditorState.js`
  - `useUndoRedo.js`
  - `useAutoSave.js`
  - `useKeyboardShortcuts.js`
  - `useAiOperations.js`
- **Server logging** — pridať `winston` alebo `pino`
- **UptimeRobot** — monitoring dostupnosti servera (zadarmo)
- **Rate limiting** — na AI endpointoch (`express-rate-limit`)
- **Helmet.js** — bezpečnostné HTTP hlavičky

---

## Návrh poradia pre štart v2.0

```
Fáza 1 (základ):
  └── Projekty (Jobs)                   ← pridáva hodnotu zákazníkovi
  └── Rozšírenie dátového modelu        ← základ pre všetko ostatné
  └── Refaktoring EditorScreen          ← uľahčí ďalší vývoj

Fáza 2 (obsah):
  └── AI rozšírenie (nové polia)
  └── Gramatika — Hunspell
  └── AI kontrola obsahu balíčka

Fáza 3 (pokročilé):
  └── Grafika — poloautomatické obrázky
  └── AI rady a learning path
  └── UX vylepšenia
```

---

*Tento dokument sa bude aktualizovať pri štarte v2.0.*
