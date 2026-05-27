# Detektor duplicitných významov

Táto kontrola nájde slová, ktoré majú **rovnaký alebo veľmi podobný sémantický význam** — aj keď sú to rôzne slová.

Systém LexiPack obsahuje mechanizmy na detekciu duplicitného alebo veľmi podobného významu medzi slovnými záznamami. Cieľom tejto kontroly nie je iba odhaliť identické slová, ale aj situácie, keď rôzne záznamy reprezentujú rovnaký význam, existujú zbytočne duplicované vocabulary položky, alebo sa ten istý obsah opakovane vytvára pod rôznymi názvami.

Takéto duplicity môžu časom výrazne znižovať kvalitu a konzistentnosť vocabulary databázy.

**Rozdiel medzi duplicitným slovom a duplicitným významom**

Nie každá duplicita znamená identické slovo. Systém rozlišuje duplicitné slovo a duplicitný význam.  
Napríklad:

car  
automobile  

môžu predstavovať veľmi podobný význam, aj keď nejde o identický text.  
Rovnako:

big  
large  

môžu mať v určitom kontexte veľmi podobnú významovú funkciu.

## Kontext je dôležitý

Textová zhoda duplikátov (červená farba v tabuľke) zachytí len slová, ktoré sú identické. Táto kontrola ide hlbšie — odhalí napríklad:

- *orbit* a *revolve* (obe znamenajú pohyb telesa okolo iného)
- *spacecraft* a *spaceship* (synonymá)
- *astronaut* a *cosmonaut* (odlišné slová, takmer rovnaký význam) 

Preto systém pri detekcii duplicít zohľadňuje:

• doménu,  
• definície,  
• príkladové vety,  
• preklady,  
• tematické zaradenie.

## Ako funguje detekcia

Všetky slová sa pošlú naraz do AI, ktorá ich porovnáva navzájom a zoskupí sémanticky príbuzné skupiny. Duplicate Meaning Detector potom analyzuje:

• podobnosť definícií,  
• podobnosť prekladov,  
• synonymické vzťahy,  
• tematickú blízkosť,  
• podobnosť príkladových viet.

Systém následne upozorní používateľa, že určitý význam môže už v databáze **existovať**, alebo že nový záznam je **veľmi podobný** existujúcemu obsahu.

## Úloha reviewera

Reviewer by mal pri kontrole rozhodnúť **či ide o skutočnú duplicitu**, **synonymum**, **odlišný význam** alebo **samostatný učebný koncept**.
Niektoré podobné slová môžu mať stále zmysel ako samostatné záznamy, ak:

• sa používajú v inom kontexte,  
• majú inú frekvenciu používania,  
• sú určené pre inú jazykovú úroveň.

## Odporúčania pre editorov

Pri vytváraní nových záznamov sa odporúča:

1. najprv vyhľadať podobné slová,  
2. kontrolovať existujúce definície,  
3. vyhýbať sa zbytočnému duplikovaniu významov.

Konzistentná vocabulary databáza je potom prehľadnejšia, jednoduchšia na správu a efektívnejšia pre učenie.


## Výsledky

Dialóg zobrazí skupiny podobných slov. Pre každú skupinu vidíš:
- Slová, ktoré si sú príliš podobné
- Tlačidlo **Prejsť** — skočí na dané slovo v tabuľke

## Čo robiť

- Ak sú slová skutočne príliš podobné → zmaž jedno alebo obe, nahraď odlišnejším slovom
- Ak je rozdiel zámerný (napr. chceš učiť oba výrazy) → môžeš ignorovať

::: tip
Táto kontrola analyzuje celý balík naraz — pre väčšie balíky (100+ slov) to môže trvať 10–20 sekúnd.
:::
