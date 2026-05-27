# Metadáta balíka

<!-- SCREENSHOT: metadata-panel.png — panel metadát v spodnej časti editora so všetkými poliami -->
<img src="/images/metadata.png" alt="Panel metadát" style="border:1px solid #334155;border-radius:8px;" /> 

Metadáta sa nachádzajú v hornej časti editora. Ovplyvňujú to, ako AI generuje obsah, a ako sa balík zobrazuje v Lexico.
Metadáta predstavujú základné opisné informácie o vocabulary packu v systéme LexiPack.

Ich úlohou nie je samotný obsah slovnej zásoby, ale organizácia, identifikácia a správa celého balíka.  
Bez metadát by bolo, pri väčšom množstve vocabulary balíkov, veľmi náročné orientovať sa v obsahu, vyhľadávať balíky, filtrovať ich podľa kategórií alebo riadiť workflow publikovania a review procesu.


## Polia metadát

| Pole | Popis |
|---|---|
| **Názov balíka** | Zobrazovaný názov v Lexico |
| **Autor** | Meno tvorcu |
| **Kategória** | Téma balíka (napr. `astronomy`, `finance`) — AI podľa nej navrhuje slová |
| **Úroveň** | CEFR úroveň celého balíka (A1–C2) |
| **Verzia** | Verzia balíka (napr. `1.0`) |
| **Popis** | Krátky popis pre Lexico |
| **Ikona** | Obrázok alebo emoji — klikni na oblasť pre nahratie súboru (PNG/JPG/SVG) |
| **Tagy** | Kľúčové slová pre filtrovanie — písz a stlač Enter alebo čiarku |
| **Farba** | Farebný marker balíka v Lexico |

Samozrejme týchto údajov je v balíku oveľa viac a slúžia na hladkú prácu celého systému. 

## Cieľový a natívny jazyk

V metadátach (uložených v JSON súbore) sú aj polia `targetLang` a `nativeLang`, ktoré určujú jazykový pár. Tieto polia sa nastavujú pri vytvorení balíka a ovplyvňujú:
- Ktoré stĺpce sú viditeľné (napr. Article pre de/fr/es/it/en)
- Jazyk, v ktorom AI generuje definície a príklady


## Budúce rozširovanie systému

Dobre navrhnuté metadáta umožňujú systém neskôr rozširovať bez zásadných zmien architektúry.  
V budúcnosti môžu slúžiť napríklad pre:

– odporúčacie systémy,  
– personalizované učenie,  
– analytiku používania,  
– AI generovanie packov,  
– alebo automatickú kategorizáciu obsahu.

## Metadáta a AI

Metadáta zohrávajú dôležitú úlohu aj pri AI generovaní. AI pomocou nich:

– lepšie odhaduje význam slov,  
– generuje vhodnejšie príkladové vety,  
– prispôsobuje štýl definícií,  
– udržiava tematickú konzistentnosť balíka.

Napríklad slovo:

“cell”

môže mať úplne iný význam v packu:

biology  
electronics  
prison vocabulary  

Práve metadáta pomáhajú AI správne pochopiť **kontext**.

Metadáta preto nie sú iba „doplnkové údaje“, ale dôležitý základ celej organizácie systému.

::: tip
Ikona balíka sa automaticky uloží na server aj pri nahraní — nemusíš čakať na ručné uloženie celého balíka.
:::
