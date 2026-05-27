# Práca so slovami

## Pridanie slova

- **Alt+Insert** — pridá prázdny riadok na koniec
- Tlačidlo **+ Pridať riadok** v toolbare

## Editácia bunky

Klikni priamo na bunku — okamžite sa stane editovateľnou. Po úprave stlač **Enter** alebo klikni inam.

**Enter** v bunke presunie kurzor na ďalšiu editovateľnú bunku (v poradí: Word → Translation → Phonetic → Type → Definition → Level → Example EN → Example SK → Topic). Na konci riadku preskočí na ďalší riadok.

## Výber riadkov (checkbox)

- **Kliknutie na checkbox** — zaškrtne riadok a zároveň ho vyberie do Preview
- **Kliknutie na iné miesto riadku** — iba vyberie riadok (Preview sa aktualizuje), checkbox zostane nezmenený

Zaškrtnuté riadky môžeš hromadne zmazať, duplikovať alebo vyplniť AI.

## Farebné označenie riadkov

<!-- SCREENSHOT: grid-farby.png — detail gridu so všetkými typmi riadkov: modrý (vybraný), zelený (zaškrtnutý), červený (neúplný), oranžový (duplikát) -->
<img src="/images/grid-farby.png" alt="Farby riadkov" style="border:1px solid #334155;border-radius:8px;max-width:600px;" /> 

| Farba | Význam |
|---|---|
| Modrá / zvýraznená | Aktuálne vybraný riadok |
| Zelená | Zaškrtnutý (checkbox) riadok |
| Červená | Chýba aspoň jedno povinné pole |
| Oranžová | Duplikát — slovo sa v balíku vyskytuje viackrát |

## Stĺpec Article

Stĺpec **Article** sa zobrazuje iba pre jazyky, ktoré používajú členy: nemčina (de), francúzština (fr), španielčina (es), taliančina (it), angličtina (en). Pre slovenčinu, češtinu a ostatné sa skryje automaticky.

Keď AI navrhne slová pre nemčinu (napr. `der Hund`), aplikácia automaticky rozdelí člen do stĺpca Article a slovo do stĺpca Word.

## Pravý klik (kontextové menu)


<img src="/images/kontextove-menu.png" alt="Kontextové menu" style="border:1px solid #334155;border-radius:8px;max-width:280px;" />

Pravý klik na bunku ponúka:
- **Kopírovať / Vystrihnúť / Vložiť**
- **Vyplniť AI** — doplní toto konkrétne pole pre tento riadok pomocou AI
- **Preložiť** — otvorí DeepL preklad hodnoty bunky

## Vyhľadávanie a filtrovanie

Rýchle vyhľadávanie (**Ctrl+F**) filtruje tabuľku v reálnom čase. Každý stĺpec má aj vlastný filter (ikona v hlavičke).

## Presúvanie riadkov

- **Ctrl+↑** — presunie vybraný riadok o jedno nahor
- **Ctrl+↓** — presunie vybraný riadok o jedno nadol

## Undo / Redo

- **Ctrl+Z** — vráti poslednú akciu
- **Ctrl+Y** — opakuje vrátenú akciu

História sa uchováva počas celej relácie. Pri zatvorení editora sa vymaže.
