# Konzistencia úrovní (CEFR)

Táto kontrola porovná **CEFR úroveň každého slova** s celkovou úrovňou balíka.

LexiPack používa klasifikáciu CEFR:

A1  
A2  
B1  
B2  
C1  
C2  

Tieto úrovne pomáhajú organizovať vocabulary packy, filtrovať obsah, personalizovať učenie a vytvárať progresívne learning workflow.

## Úroveň nie je iba obtiažnosť slova

Pri určovaní úrovne je potrebné brať do úvahy viac faktorov:

• samotné slovo,  
• jeho frekvencia používania,  
• abstraktnosť významu,  
• zložitosť definície,  
• aj náročnosť príkladových viet.

Napríklad:

technicky jednoduché slovo môže mať veľmi komplikovanú definíciu, alebo jednoduché slovo môže byť použité vo veľmi náročnej vete.

## Konzistentnosť príkladových viet

Veľmi častým problémom je nesúlad medzi úrovňou slova a úrovňou príkladovej vety.

Napríklad:

slovo môže byť na úrovni A2,
ale príkladová veta môže obsahovať gramatiku alebo slovnú zásobu na úrovni C1.

Takéto situácie môžu používateľa zbytočne preťažovať alebo vytvárať pocit, že nerozumie obsahu.

Reviewer by preto mal kontrolovať nielen **úroveň** samotného **slova**, ale aj **celého kontextu**.

# Konzistentnosť definícií

Definície by mali byť prispôsobené cieľovej úrovni vocabulary packu. Pre nižšie úrovne sa odporúča:

– jednoduchý jazyk,  
– krátke vety,  
– základná slovná zásoba.

Pri vyšších úrovniach môže byť definícia:

– presnejšia,  
– detailnejšia,  
– odbornejšia.

## Kontrola AI generovaných úrovní

AI dokáže pomáhať pri odhadovaní CEFR úrovne, ale výsledok nemusí byť vždy presný.

**Reviewer by mal overovať:**

• či úroveň zodpovedá reálnej obtiažnosti,  
• či pack obsahuje vyvážený obsah,  
• či nedochádza k výrazným výkyvom medzi záznamami.

AI môže niekedy podhodnotiť odborné výrazy alebo nadhodnotiť zriedkavé slová.

## Odporúčania pre tvorbu packov

Pri tvorbe vocabulary packov sa odporúča zachovať približne rovnakú jazykovú úroveň. Tiež neprepájať extrémne odlišné obtiažnosti a postupovať progresívne od jednoduchších tém k náročnejším.

Takýto prístup zlepší učenie, zvyšuje motiváciu používateľa a vytvára prirodzenejší learning flow.

## Úrovne a budúce AI systémy

Konzistentné CEFR úrovne budú v budúcnosti dôležité pre:

• personalizované učenie,  
• inteligentné odporúčanie obsahu,  
• adaptívne testovanie,  
• AI tutoring,  
• automatické generovanie learning plánov.

Presnosť úrovní preto patrí medzi dôležité faktory kvality celého vocabulary systému

## Ako to funguje

AI ohodnotí každé slovo podľa skutočnej komunikatívnej náročnosti a porovná to s úrovňou uvedenou v poli `level`. Spracováva sa po dávkach 30 slov.

## Výsledky

Dialóg zobrazí:
- **Správne zaradené slová** — úroveň zodpovedá
- **Nezodpovedajúce slová** — AI navrhuje inú úroveň (napr. slovo je C1, ale balík je B1)

Pre každé slovo uvidíš aktuálnu úroveň a navrhovanú úroveň.

## Čo robiť s výsledkami

- Klikni na riadok v dialógu — skočíš priamo na dané slovo v tabuľke
- Oprav úroveň v stĺpci **Level** priamo v grride
- Prípadne presun slovo do balíka so správnou úrovňou

::: tip
Malý nesúlad (napr. B2 slovo v B1 balíku) môže byť zámerný — ide o rozširujúce slová. AI ho len upozorní, ty rozhodneš.
:::
