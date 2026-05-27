# Čo je LexiPack

LexiPack je webová aplikácia na tvorbu a správu **dvojjazyčných slovníkových balíkov** pre všetky osoby, ktoré sa učia cudzí jazyk, alebo sa potrebujú zdokonaliť v jeho používaní. Balíky slúžia ako vstupný podkladový materiál pre aplikáciu Lexico. Jeho cieľom je vytvoriť prostredie pre tvorbu kvalitného jazykového obsahu, ktorý je konzistentný, rozšíriteľný a pripravený pre moderné systémy výučby jazykov. Bežné zoznamy slovíčok často obsahujú iba samotný preklad.
LexiPack pristupuje ku každému slovu ako ku kompletnej učebnej jednotke, ktorá môže obsahovať:

• význam,<br> 
• výslovnosť,  
• gramatické informácie,  
• úroveň náročnosti,  
• kontextové vety,  
• tematické zaradenie,  
a ďalšie doplňujúce údaje.

Vďaka tomu sa vocabulary pack nestáva iba obyčajným slovníkom, ale základom pre inteligentné jazykové učenie.

## Dizajn orientovaný na učenie

Lexico nie je klasický akademický slovník. Systém je navrhnutý primárne pre potreby učenia sa cudzieho jazyka.

Cieľom nie je vytvárať extrémne rozsiahle encyklopedické definície, ale:  
• zrozumiteľné vysvetlenia,  
• praktické príklady,  
• jednoduché pochopenie významu,  
a efektívne zapamätanie slovnej zásoby.

## Pripravené pre moderné jazykové systémy

LexiPack je súčasťou širšieho ekosystému LexiLab. Vocabulary packy vytvorené v LexiPacku budú neskôr použité pre:

flashcards,  
písanie prekladov,  
učenie vo vetách,  
výučbu výslovnosti,  
spaced repetition systémy,  
alebo personalizované AI učenie.

## Štruktúra vocabulary packu

Každý vocabulary pack v systéme LexiPack je tvorený dvoma hlavnými časťami: hlavičkou balíka (metadata) a samotným zoznamom slov as ich vlastnosťami.

Takáto štruktúra umožňuje vytvárať organizované, konzistentné a jednoducho spracovateľné jazykové balíky vhodné pre moderné systémy učenia.

Hlavička obsahuje základné informácie o celom vocabulary packu.

Tieto údaje slúžia na na identifikáciu balíka, kategorizáciu, filtrovanie, vyhľadávanie, verziovanie, a neskoršie spracovanie v systéme Lexico.

Medzi typické metainformácie patria:

názov balíka,  
popis,  
cieľový jazyk,  
natívny jazyk,  
úroveň náročnosti,  
tematická oblasť,  
autor,  
verzia,  
značky (tags),  
ikona alebo emoji,  
fonetický prepis,    
slovný druh,   
úroveň CEFR,  
príkladové vety,  
tematické zaradenie,  
synonymá,  
a AI generované doplnenia.

Takto pripravené dáta je možné neskôr efektívne využívať v rôznych typoch výučby.  
Nie všetky polia musia byť povinne vyplnené. Rozsah údajov závisí od typu vocabulary packu a požadovanej kvality obsahu.


## Štruktúra balíka

Každý balík obsahuje zoznam slov. Každé slovo má tieto polia:

| Pole | Popis | Príklad |
|---|---|---|
| **Word** | Slovo v cieľovom jazyku | *satellite* |
| **Article** | Člen (len pre jazyky s členmi: de, fr, es, it, en) | *der* |
| **Phonetic** | Fonetický prepis (IPA) | */ˈsæt.ə.laɪt/* |
| **Translation** | Preklad do slovenčiny | *satelit* |
| **Definition** | Definícia v cieľovom jazyku | *An object orbiting a planet...* |
| **Type** | Slovný druh | *noun* |
| **Level** | CEFR úroveň | *B2* |
| **Example EN** | Príkladová veta v cieľovom jazyku | *The satellite orbits the Earth.* |
| **Example SK** | Príkladová veta v slovenčine | *Satelit obiehá okolo Zeme.* |
| **Topic** | Téma | *astronomy* |

## Roly používateľov

Systém používateľských rolí v LexiPack slúži na riadenie prístupu k jednotlivým funkciám aplikácie a na bezpečné rozdelenie zodpovedností medzi používateľov.

Nie každý používateľ musí mať prístup ku všetkým funkciám systému.  
Niektoré operácie môžu ovplyvniť kvalitu dát, publikovaný obsah alebo nastavenia aplikácie, a preto sú dostupné iba vybraným rolám.

Používanie rolí zároveň umožňuje:  

■ lepšiu organizáciu práce,  
■ oddelenie tvorby a kontroly obsahu,  
■ bezpečnejšiu správu vocabulary packov,  
a jednoduchšie škálovanie systému pri väčšom počte používateľov.

Používateľské roly majú v systéme niekoľko dôležitých úloh:

■ ochrana kritických funkcií,  
■ kontrola kvality obsahu,  
■ oddelenie editorov a administrátorov,   
■ riadenie publikovania packov,  
■ obmedzenie neúmyselných zmien,   
a evidencia zodpovednosti za úpravy.

Takýto model je dôležitý najmä pri tímovej spolupráci alebo pri väčších databázach vocabulary packov. Konkrétne názvy rolí sa môžu v budúcnosti meniť podľa verzie systému, ale základný princíp zostáva rovnaký.

### Editor

Editor je základná pracovná rola určená pre tvorbu obsahu.

**Môže:** vytvárať nové vocabulary packy, upravovať slová, používať AI generovanie, importovať a exportovať dáta, opravovať validácie, spravovať príkladové vety.

Editor však zvyčajne nemá prístup k: systémovým nastaveniam, správe používateľov, alebo administratívnym operáciám.

Táto rola je určená najmä pre autorov a tvorcov jazykového obsahu.

### Reviewer

Reviewer slúži na kontrolu kvality obsahu pred publikovaním.

Môže:

kontrolovať vocabulary packy,
schvaľovať alebo vracať úpravy,
validovať kvalitu AI generovaného obsahu,
kontrolovať konzistentnosť tém,
a dohliadať na jazykovú správnosť.

Táto rola pomáha oddeliť tvorbu obsahu od finálnej kontroly kvality.

### Administrator

Administrátor má plný prístup k systému.

Môže:

spravovať používateľov,
nastavovať roly,
meniť systémové konfigurácie,
spravovať AI nastavenia,
publikovať alebo odstraňovať packy,
a vykonávať údržbu systému.

Administrátorský prístup by mal byť prideľovaný iba dôveryhodným používateľom.



| Rola | Čo môže robiť |
|---|---|
| **Editor** | Vytvárať a editovať balíky, generovať AI obsah |
| **Reviewer** | Prezerať balíky, pridávať word reviews (OK / FLAG / COMMENT) |
| **Admin** | Všetko + správa používateľov, publikovanie, analytika |



## Životný cyklus balíka

```
Draft → Complete → In Review → Approved → Published → Archived
```

- **Draft** — balík sa práve vytvára, niektoré polia sú prázdne
- **Complete** — všetky polia sú vyplnené (nastavuje sa automaticky pri uložení)
- **In Review** — reviewer začal kontrolovať
- **Approved** — reviewer schválil
- **Published** — admin zverejnil do Lexico
- **Archived** — balík je archivovaný

::: tip
Prechody stavu sa väčšinou dejú automaticky — nemusíš ich meniť ručne.
:::
