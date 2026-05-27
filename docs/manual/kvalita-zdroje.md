# Trusted Source Assistant

Táto funkcia odporučí **konkrétne slovníky a zdroje**, kde môžeš overiť alebo doplniť informácie o danom slove. Tento nástroj nenahrádza autora packu. Slúži ak odborný asistent, pomáhajúci editorovi rýchlejšie sa orientovať v dôveryhodných zdrojoch a tým efektívnejšie vytvárať kvalitný obsah.

## Postup

1. Otvor **Kvalita → Trusted Source Assistant**
2. V dialógu je predvyplnené aktuálne vybraté slovo (môžeš ho zmeniť)
3. Klikni na **Analyzovať**
4. AI vyberie zo zoznamu preddefinovaných zdrojov tie najvhodnejšie pre daný kontext

## Odporúčané zdroje

AI pomôže pri výbere z týchto kategórií zdrojov podľa témy a jazyka balíka:

| Kategória | Príklady zdrojov |
|---|---|
| Všeobecné slovníky | Cambridge Dictionary, Oxford Learner's Dictionary |
| Odborné zdroje | NASA (astronomia), Stanford Encyclopedia (filozofia), Investopedia (finančníctvo), MDN (IT) |
| Jazykové nástroje | Merriam-Webster, Etymonline |
| Encyklopédie | Wikipedia, Britannica |

## Výsledky

<!-- SCREENSHOT: kvalita-zdroje-dialog.png — dialóg Trusted Source s výsledkami a klikateľnými odkazmi -->
 <img src="/images/kvalita-zdroje-dialog.png" alt="Trusted Source" style="border:1px solid #334155;border-radius:8px;" /> 

Pre každý odporúčaný zdroj uvidíš:
- Názov a popis zdroja
- Priamy odkaz na stránku so slovom (kliknuteľný)

Kliknutím na odkaz sa otvorí nová karta prehliadača priamo na stránke daného slova.

::: info
Systém negeneruje URL adresy — používa len preddefinované šablóny. Tým sa eliminuje riziko neplatných alebo vymyslených odkazov.
:::

## Oblasť použitia

Trusted Source Asistant slúži ako inteligentná podpora pri tvorbe tematických slovníkových balíkov. Jeho cieľom nie je automaticky rozhodovať za autora, ale zrýchliť a sprehľadniť odborný výskum a overovanie významu slov - contextual narrowing. Systém dokáže na základe aktuálneho kontextu packu  (téma, úroveň, okolié slová) odporučiť najvhodnejšie dôveryhodné zdroje pre daný výraz.

Pri práci so slovom môže editor okamžite otvoriť relevantné výkladové slovníky, prekladové nástroje alebo odborné zdrojebez nutnosti manuálneho vyhľadávania. Trusted Source Asistant tak pomáha udržiavať terminologickú konzistenciu, správnu jazykovú úroveň a vyššiu kvalitu výsledného packu.

Systém si drží tematický kontext packu. Rovnaké slovo môže mať v rôznych oblastiach odlišný význam, preto sa odporúčané zdroje a významové interpretácie prispôsobujú téme či aktuálnej kategórii packu (technológia semantic lookup orchestration). Napríklad slovo „charge“ bude mať iný význam vo fyzike než v obchodnej angličtine.