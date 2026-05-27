# Nastavenia

Nastavenia sú dostupné cez navigačné menu vľavo (ikona ozubeného kolieska).

---

## Pracovný priestor

### Po štarte

Určuje, čo sa stane pri spustení aplikácie, ak existuje naposledy editovaný balík:

| Možnosť | Popis |
|---|---|
| **Automaticky otvoriť** | Balík sa otvorí bez otázky |
| **Spýtať sa** | Zobrazí sa lišta s možnosťou otvoriť alebo odmietnuť *(predvolené)* |
| **Neotvárať** | Posledný balík sa ignoruje |

---

## Editor

### Automatické korekcie

Automaticky opravuje preklepy pri písaní v bunkách tabuľky. Detailný popis pozri v sekcii **[Automatické korekcie](/manual/autocorrect)**.

| Nastavenie | Popis |
|---|---|
| **Zapnúť** | Hlavný prepínač — zapnutie/vypnutie všetkých korekcií |
| **Jazyk** | Vyberie slovník korekcií (zoznam zobrazuje ✓ pri importovaných jazykoch) |
| **Opraviť dve začiatočné písmená** | PRíklad → Príklad |
| **Opraviť neúmyselné zapnutie CapsLock** | tEXT → Text |

### Automatické ukladanie

Nastaví interval automatického ukladania balíka na server:

| Hodnota | Popis |
|---|---|
| **Vypnuté** | Automatické ukladanie vypnuté — ukladaj ručne (Ctrl+S) |
| **1, 2, 5, 10, 15 minút** | Balík sa uloží automaticky v danom intervale |

::: tip
Odporúčame nastaviť automatické ukladanie na **2 alebo 5 minút** — predídeš strate práce pri výpadku pripojenia.
:::

---

## Automatické zálohovanie (Recovery)

Zálohovanie priebežne ukladá rozpracovanú verziu balíka pre prípad pádu prehliadača alebo výpadku napájania.

| Nastavenie | Popis |
|---|---|
| **Použiť automatické zálohovanie** | Zapne/vypne zálohovanie |
| **Zálohovanie každých** | Interval ukladania zálohy na server (1 / 2 / 5 / 10 minút) |

**Kde sa záloha ukladá:**
- **Lokálne** — v IndexedDB prehliadača (okamžite, každých 300 ms počas editácie)
- **Serverovo** — ako `.tmp` súbor vedľa originálneho balíka (v nastavenom intervale)

**Čo sa stane pri otvorení balíka:**
Ak aplikácia nájde neuloženú zálohu (lokálnu alebo serverovú), zobrazí sa dialóg s možnosťou:
- **Obnoviť** — načíta zálohu namiesto poslednej uloženej verzie
- **Zahodiť** — záloha sa vymaže, načíta sa originálna verzia

::: info
Záloha sa automaticky vymaže po úspešnom uložení balíka (Ctrl+S alebo automatické ukladanie).
:::

---

## Publikovanie a archivácia

Cesty pre publikovanie a archiváciu balíkov sú zdieľané pre všetkých používateľov — zmena sa prejaví okamžite na serveri.

### Cesta na publikovanie

Zadaná cesta slúži ako **základ**. Tlačidlo **Publikovať** k nej automaticky pridá podadresáre podľa jazyka balíka:

```
<cesta na publikovanie>\all\<jazyk>
```

**Príklady:**

| Nastavená cesta | Jazyk balíka | Výsledná cesta |
|---|---|---|
| `C:\APPS\Lexico\public\packs` | Angličtina (EN) | `C:\APPS\Lexico\public\packs\all\EN` |
| `C:\APPS\Lexico\public\packs` | Nemčina (DE) | `C:\APPS\Lexico\public\packs\all\DE` |

Adresár sa vytvorí automaticky, ak neexistuje.

::: warning
Tieto nastavenia meň len po dohode s administrátorom. Nastavenie je zdieľané — zmena sa prejaví okamžite aj v produkcii.
:::

---

## Vzhľad a jazyk

### Jazyk aplikácie

Prepnutie medzi **slovenčinou** a **angličtinou**. Zmena sa prejaví okamžite.

### Téma

| Téma | Popis |
|---|---|
| **Dark** | Tmavá (predvolená) |
| **Dark Blue** | Tmavá s modrým nádychom |
| **Solarized** | Klasická Solarized schéma |
| **Monokai** | Inšpirovaná editorom kódu |
| **Light** | Svetlá |
