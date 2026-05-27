# AI návrhy slov

<!-- SCREENSHOT: ai-navrhy-confirm.png — confirm dialóg pred generovaním (s dropdownom slovného druhu) -->
 <img src="/images/ai-navrhy-confirm.png" alt="Návrhy slov — potvrdenie" style="border:1px solid #334155;border-radius:8px;max-width:420px;" /> 

<!-- SCREENSHOT: ai-navrhy-vysledky.png — dialóg s výsledkami navrhnutých slov (zoznam so zaškrtávacími políčkami) -->
 <img src="/images/ai-navrhy-vysledky.png" alt="Návrhy slov — výsledky" style="border:1px solid #334155;border-radius:8px;max-width:420px;" /> 

Funkcia **Návrhy slov** (💡) navrhne 10 nových slov, ktoré logicky dopĺňajú existujúci obsah balíka.

## Postup

1. Klikni na tlačidlo **💡 Návrhy** v toolbare
2. V dialógu skontroluj:
   - **Balík** — názov aktuálneho balíka
   - **Existujúcich slov** — koľko slov už balík obsahuje
   - **Slovný druh** — aký typ slov chceš navrhnutý
3. Klikni na **Generovať**
4. Zo zoznamu vyber slová, ktoré chceš pridať (všetky sú predvolene zaškrtnuté)
5. Klikni na **Pridať vybrané**

## Slovný druh (filter)

| Voľba | Popis |
|---|---|
| **Mix (ľubovoľný)** | Vyvážená kombinácia podstatných mien, slovies, prídavných mien, prísloviek a fráz |
| **Podstatné meno (noun)** | Len podstatné mená |
| **Sloveso (verb)** | Len slovesá |
| **Prídavné meno (adjective)** | Len prídavné mená |
| **Príslovka (adverb)** | Len príslovky |
| **Fráza (phrase)** | Ustálené slovné spojenia |
| **Idiom (idiom)** | Idiómy a frazeologizmy |

## Automatické oddelenie člena

Pre jazyky s členmi (nemčina, francúzština, španielčina, taliančina, angličtina) aplikácia automaticky rozdelí navrhnuté slovo:

- `der Hund` → **Article:** `der` | **Word:** `Hund`
- `l'arbre` → **Article:** `l'` | **Word:** `arbre`
- `the satellite` → **Article:** `the` | **Word:** `satellite`

## Po pridaní slov

Pridané slová majú vyplnený len stĺpec Word (a prípadne Article). Ostatné polia môžeš doplniť pomocou AI generovania — vyber nové riadky a stlač **Ctrl+Shift+G**.
