# AI generovanie polí

LexiPack využíva OpenAI na automatické vyplnenie polí slov. AI pozná kontext balíka (jazyk, kategória, úroveň CEFR) a generuje relevantný obsah.

<!-- SCREENSHOT: ai-generovanie-progress.png — progress okno počas hromadného generovania -->
 <img src="/images/ai-generovanie-progress.png" alt="AI generovanie" style="border:1px solid #334155;border-radius:8px;max-width:480px;" /> 

## Generovanie jedného riadku

1. Napíš slovo do stĺpca **Word**
2. Stlač **Ctrl+Enter**

AI vyplní všetky prázdne polia: fonetiku, preklad, definíciu, typ, úroveň, príklady a tému.

::: tip
Ak chceš prepísať len niektoré polia, najprv ich vymaž (**Ctrl+Delete** vymaže všetky AI polia naraz) a potom znovu stlač Ctrl+Enter.
:::

## Hromadné generovanie

1. Zaškrtni riadky, ktoré chceš doplniť (alebo nič nevyber — vygenerujú sa všetky neúplné)
2. Klikni na **Hromadné generovanie** (Gen. Selected) v toolbare alebo stlač **Ctrl+Shift+G**
3. Sleduj progress v okne — generuje sa po dávkach

Hromadné generovanie preskočí polia, ktoré už sú vyplnené.

## Generovanie jedného stĺpca

Pomocou dropdownu **Vyplniť stĺpec** v toolbare môžeš vyplniť len konkrétne pole (napr. len Phonetic) pre všetky vybrané riadky.

## Generovanie témy

Tlačidlo **Gen. téma** (Gen. Theme) v toolbare doplní pole `topic` pre vybraný riadok na základe slova — bez generovania ostatných polí.

## Pravý klik → Vyplniť AI

Na ľubovoľnej bunke môžeš kliknúť pravým tlačidlom a zvoliť **Vyplniť AI** — doplní len toto jedno pole pre tento riadok.

## Poznámky

- AI generovanie vyžaduje internetové pripojenie
- Pri výpadku sa automaticky opakujú pokusy (3× s rastúcim oneskorením)
- Všetky AI operácie sú zaznamenané v audit logu a telemetrii
