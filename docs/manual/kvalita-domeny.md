# Kontrola konzistencie domén

Táto kontrola overí, že **všetky slová v balíku patria do jeho kategórie**.

### Konzistentnosť dát

Jedným z najdôležitejších faktorov kvality je **konzistentnosť**.  
Vocabulary pack by mal používať:

• jednotný štýl definícií,  
• rovnaký formát tém,  
• konzistentné úrovne,  
• podobnú dĺžku príkladových viet,  
• stabilnú terminológiu.

Napríklad:  
nepoužívať súčasne „IT“ aj „Information Technology“ ako dve rôzne témy, alebo nekombinovať krátke definície s encyklopedickými opisnými textami.

Konzistentné dáta sú jednoduchšie na správu, validáciu, AI spracovanie aj pre samotného používateľa.

## Kontrola domén počas review procesu

Reviewer by mal pri kontrole vocabulary packu overovať:

• či zvolená doména zodpovedá obsahu,  
• či pack neobsahuje nesúvisiace témy,  
• či sú názvy tém konzistentné s existujúcim systémom.

Napríklad:

Pack označený ako „biology“, by nemal obsahovať rozsiahlu IT terminológiu, alebo mix nesúvisiacich oblastí bez jasného zámeru.



## Ako to funguje

AI porovná každé slovo s kategóriou balíka (pole `category` v metadátach). Pre každé slovo rozhodne, či do danej kategórie patrí, alebo je tam nesprávne zaradené.

## Výsledky

Dialóg zobrazí zoznam slov, ktoré podľa AI do kategórie **nezapadajú**. Pre každé slovo uvidíš:
- Samotné slovo a jeho preklad
- Dôvod prečo AI považuje slovo za nezodpovedajúce

## Čo robiť s výsledkami

- Ak AI má pravdu — zvýrazni riadok, zmaž ho, alebo presuň do iného balíka
- Ak AI nemá pravdu — môžeš ignorovať (AI sa niekedy mýli pri odborných pojmoch)

## Budúce rozširovanie systému

Konzistentné domény budú v budúcnosti dôležité aj pre:

• odporúčacie systémy,  
• AI generovanie celých packov,  
• automatické tematické zoskupovanie,  
• analytiku používania,  
• personalizované jazykové učenie.

Dobre navrhnutý doménový systém preto predstavuje dôležitý základ celej architektúry vocabulary databázy.

::: tip
Táto kontrola je obzvlášť užitočná pri importoch z externých zdrojov, kde sa môžu zamiešať rôzne témy.
:::
