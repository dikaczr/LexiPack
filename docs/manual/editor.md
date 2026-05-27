# Prehľad editora

Editor slovného balíka (vocabulary pack) predstavuje hlavnú pracovnú obrazovku systému LexiPack. Práve v tejto časti aplikácie používateľ vytvára a upravuje slovné záznamy, pracuje s AI generovaním, kontroluje kvalitu dát, vykonáva review,
a pripravuje vocabulary pack na export alebo publikovanie.

Editor je navrhnutý ako pracovné prostredie pre efektívnu správu väčšieho množstva jazykových dát.

<!-- SCREENSHOT: editor-overview.png — celé okno editora s popisom oblastí (toolbar, grid, preview, metadata, footer) -->
 <img src="/images/editor.png" alt="Prehľad editora" style="border:1px solid #334155;border-radius:8px;" /> 

## Hlavné časti editora

Obrazovka editora je rozdelená do viacerých pracovných sekcií, pričom každá má svoj konkrétny účel.

Typické rozdelenie obrazovky obsahuje:

• horný toolbar, kde sú tlačidlá akcií,  
• tabuľkový editor,  
• preview panel,  
• validačné a review nástroje,  
• stavov riadok a pomocné pracovné panely. 

Úplne hornýá časť obrazovky obsahuje helpery - slovníky, ktoré si môže editor otvoriť ak potrebuje vyhľadať určitú informáciu. Sú tu aj tlačidlá pre kontrolu kvality, import/export a tlačidlo pre uloženie práce Uložiť (Save).
Aplikácia pravidelne ukladá prácu v natavených intervaloch (pozri Nastavenia) ale dobrý zvyk je prácu vždy uložiť po každej dôležitej operácii. 

```
┌─────────────────────────────────────────────────────┐
│  Toolbar (tlačidlá helperov)                        │
├──────────────────────────────────────┴──────────────┤
│  Metadáta balíka (PackMetadataPanel)                │
├──────────────────────────────────────┬──────────────┤
│  Toolbar (tlačidlá akcií)                           │
├──────────────────────────────────────┬──────────────┤
│  Tabuľka slov (PackGrid)             │   Preview    │
│                                      │   (detail    │
│                                      │   + review)  │
├──────────────────────────────────────┴──────────────┤
│  Stavový riadok                                     │
└─────────────────────────────────────────────────────┘
```

## Informačný panel s údajmi balíka (tzv. metadáta)

Panel zobrazuje všetky informácie balíka, podľa ktorých bude neskôr balík ponúknutý a potom vybraný používateľom. Autor balíka alebo editor tu vyplní všetky polia potrebnými údajmi, vloží zaujímavý obrázok a vloží tagové značky pre vyhľadávanie v zozname Lexica. Tiež určí farebný motív, ktorý poskytne rýchlu tematickú orientáciu študujúcemu používateľovi. Je možné vkladať obrázky formátu .jpg, .png alebo svg. Najlepšie vyniknú ong obrázky s prisvitným pozadím. 

## Toolbar

<!-- SCREENSHOT: editor-toolbar.png — detail toolbaru so všetkými tlačidlami -->
 <img src="/images/editor-toolbar.png" alt="Toolbar" style="border:1px solid #334155;border-radius:8px;" /> 


Tlačidlá v toolbare zoskupené podľa funkcie:

| Skupina | Tlačidlá |
|---|---|
| Slovníky | DWDS, Duden, Larouse, leRobert, DeepL, VerbFormen, Oxford, Cambridge, Wikipedia |
| AI Helpers | Gemini, Claude, ChatGPT |


| Skupina | Tlačidlá |
|---|---|
| Editácia | Späť, Znova |
| Editácia | Pridať riadok, Duplikovať, Zmazať |
| PDF | Otvoriť PDF čítačku |
| Symboly | Vložiť špeciálny znak |
| Bookmark | Vložiť aleb zobraziť záložky, zobraziť nasledujúcu/predchádzajúcu |
| AI | Generovať (riadok), Vyplniť stĺpec, Hromadné generovanie, Téma, 💡 Návrhy slov |
| Goto Last| Automaticky vyberie posledne spracované slovo |
| Goto | Nájde slovo pre ďalšie spracovanie |

Editor je optimalizovaný pre rýchlu editáciu, hromadné úpravy, kopírovanie dát, prácu s klávesnicou, a správu väčších vocabulary packov.

## Výber riadku

Po označení konkrétneho riadku sa zobrazia detailné informácie o vybranom zázname.

**Dvojklikom** vybraný riadok sa farebne zvýrazní, zároveň je otvorený v preview paneli a pripravený na AI generovanie a review.  
Aktívny výber umožňuje používateľovi sústrediť sa na konkrétnu vocabulary položku.

## Preview panel

Po kliknutí na riadok sa v pravom paneli zobrazí detailný náhľad aktuálne vybraného slova — všetky polia prehľadne naformátované ako učebná kartička. V spodnej čsti panela nájdu revieweri možnosť pridávať recenzie (OK / FLAG / COMMENT).  
Používateľ tu môže:

• skontrolovať vzhľad vocabulary karty,  
• čítať definície,  
• prezerať príkladové vety,  
• kontrolovať fonetický prepis,  
• vykonávať review operácie.

Preview panel pomáha vidieť obsah tak, ako môže byť neskôr prezentovaný v systéme Lexico.

### Poznámky reviewera ###

Reviewer môže k jednotlivým záznamom pridávať interné poznámky. Poznámky môžu obsahovať napríklad:

upozornenia na nepresný preklad,  
odporúčanie na úpravu definície,  
návrh lepšej príkladovej vety,  
alebo upozornenie na nekonzistentné tematické zaradenie.

Tieto poznámky slúžia na komunikáciu medzi editormi a reviewermi.

## AI nástroje

Editor obsahuje integrované AI funkcie určené na zrýchlenie tvorby obsahu.  
AI môže pomáhať pri:

• generovaní prekladov,  
• definícií,  
• fonetických prepisov,  
• príkladových viet,  
• fonetickej výslovnosti,  
• alebo pri určení správnej CEFR úrovne.

Táto pomoc môže byť vykonávané pre jednotlivé polia, vybraný riadok alebo hromadne pre viac záznamov.

Tlačidlo **Generovať AI** vygeneruje na označenom riadku všetky chýbajúce informácie, tak aby bol riadok kompletný.
Tlačidlo **Gen. selected** po stlačení vygeneruje komplet informácie vo vybraných a označených riadkoch.
Tlačidlo **Vyplniť stĺpec** vyplní chýbajúce informácie v označenom stĺpci.
Tlačidlo Gen. Téma 
Tlačidlo **Návrhy** vygeneruje po stlačení vždy 10 slov v cudzom jazyku s témou podľa informácií v poli Kategória a na úrovni ktorá je daná pre balík. Systém dohliad ana to aby negeneroval výrazy, ktoré už v balíku sú. 


## Validácia dát

Editor priebežne kontroluje kvalitu údajov.

Systém môže upozorňovať napríklad na:

• chýbajúce polia (zobrazenie stavu DRAFT),
• duplicity (farba riadku),
• neplatné hodnoty,
• nekonzistentné údaje,
• alebo nekompletné vocabulary záznamy.

Validácie pomáhajú udržať vysokú kvalitu vocabulary packov.

## Stavový riadok (footer)

- **Vľavo:** Správy (Saving... / Saved / Save failed) a prípadné chyby
- **Vpravo:** `Počet slov / nedokončených: X / Y` — celkový počet slov a počet riadkov s chýbajúcim poľom

### Indikátor CapsLock

Ak je pri písaní zapnutý CapsLock a máš zapnuté nastavenie **Opraviť neúmyselné zapnutie CapsLock**, v päte vpravo sa zobrazí oranžový badge **⇪ CapsLock**. Kliknutím naň získaš inštrukciu ako ho vypnúť. Text sa automaticky opraví pri odchode z bunky.

## Vloženie znakov

V niektorých zadávacích poliach sa občas vyskytne potreba vložiť špeciálny znak. Najviac je potrebné takéto zadávanie v poli **Fonetika** (Phonetic), kde sa zadávajú IPA znaky. Po stlačení tlačidla sa nám otvorí ponuka na vloženie špeciálnych znakov, rozdelená na niekoľko skupín.  
Skupiny znakov su rozdelené na:

• IPA spoluhlásky,  
• IPA samohlásky,  
• IPA suprasegmentálne znaky,  
• diakritika pre jazyky,  
• interpunkcia a uvodzovky,  
• matematické znaky šípky,  
• ostatné symboly

##  Záložky (Bookmarky)

Ak je vybraný riadok (označený modrou farbou) má autor vložiť záložku ako odkaz, že sa nk tomuto miestu musí neskôr vrátiť. Po stlačení tlačidla **Záložka** (Bookmark) môže autor vložiť svoju poznámku a zároveň sa daný riadok označí zelenou zástavkou. šípkami vedľa tlačidla Záložka sa pohybujeme po vložených záložkách a môžeme aplikovať zmeny, ktoré autor vložil už skôr.  

Počas vkladania záložiek sa automaticky otvorí okno v spodnej pravej čati obrazovky v časti Náhľad. Tu je možné záložku,ked už nebude aktuálna, vymazať. Najskôr je potrebné poznámku otvoriť klknutím na Edit (ikona ceruzky) a potom v okne **Upraviť bookmark** stlačiť tlačidlo **Odstrániť**. Alebo môže editor alebo autor balíka poznámku upraviť a uložiť stlačením **Uložiť**.


## Produktivita práce

Editor slovných balíkov je optimalizovaný pre efektívnu každodennú prácu. Systém vás bude podporovať nástrojmi ako:

klávesové skratky,
hromadné operácie,
automatické ukladanie,
undo/redo,
a rýchlu navigáciu medzi záznamami.

Cieľom editora je minimalizovať manuálnu prácu a umožniť používateľovi sústrediť sa na kvalitu jazykového obsahu.

