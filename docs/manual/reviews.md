# Recenzie slov (Audit)

Spodná časť Preview panela v LexiPack je určená pre kontrolu kvality a review workflow. Revieweri môžu hodnotiť každé slovo v balíku a vložiť svoje poznámky a hodnotenia. Toto je hlavný nástroj kontroly kvality pre rolu **reviewer**. Táto sekcia poskytuje reviewerovi alebo editorovi rýchly prístup k nástrojom potrebným na:

• kontrolu obsahu,  
• validáciu kvality,  
• schvaľovanie záznamov,  
• označovanie problémov,  
a sledovanie stavu jednotlivých slovných položiek.

Review nástroje sú navrhnuté tak, aby bolo možné vykonávať kontrolu obsahu priamo počas prehliadania detailu záznamu bez potreby prepínania medzi viacerými obrazovkami.

Review sekcia pomáha zabezpečiť konzistentnú kvalitu vocabulary packov, jazykovú správnosť, jednotný štýl definícií, správnosť príkladových viet, a kontrolu AI generovaného obsahu.

Review workflow je obzvlášť dôležitý pri väčších vocabulary packoch tiež pri tímovej spolupráci, alebo pri automaticky generovanom obsahu.

### Typické review funkcie ###

V spodnej časti Preview panela môže reviewer nájsť rôzne nástroje podľa konfigurácie systému a prístupových práv.

**Stav kontroly záznamu**

Typické stavy:

• New  
• Reviewed  
• Approved  
• Needs Revision  
• Rejected  

Tieto stavy pomáhajú sledovať, ktoré záznamy ešte neboli skontrolované, boli schválené, alebo vyžadujú ďalšie úpravy.

**Poznámky reviewera**

Reviewer môže k jednotlivým záznamom pridávať interné poznámky. Poznámky môžu obsahovať napríklad:

• upozornenia na nepresný preklad,  
• odporúčanie na úpravu definície,  
• návrh lepšej príkladovej vety,  
• alebo upozornenie na nekonzistentné tematické zaradenie.

Tieto poznámky slúžia na komunikáciu medzi editormi a reviewermi.

**Kontrola AI obsahu**

Pri AI generovaných údajoch môže reviewer jednoducho overovať kvalitu definícií, prirodzenosť príkladových viet, správnosť CEFR úrovne, presnosť prekladu, a tematické zaradenie.

AI generovaný obsah by mal byť vždy finálne skontrolovaný človekom.

**Označenie problémových záznamov**

Review nástroje môžu umožňovať označenie problematických položiek. Takéto označenie môže slúžiť napríklad pre neskoršiu opravu, dodatočnú jazykovú kontrolu, alebo opätovné AI generovanie.

**Schválenie záznamu**

Po úspešnej kontrole môže reviewer záznam schváliť.

Schválené záznamy:

• môžu byť pripravené na publikovanie,  
• export,  
• alebo ďalšie použitie v systéme Lexico  
• Review workflow 

Typický review proces môže vyzerať nasledovne:

Editor vytvorí alebo importuje záznamy.  
AI doplní chýbajúce údaje.  
Reviewer skontroluje kvalitu obsahu.  
Problematické záznamy označí alebo vráti na opravu.  
Schválené položky sa pripravia na publikovanie.

Takýto workflow pomáha udržať vysokú kvalitu vocabulary packov aj pri rozsiahlejších databázach slovnej zásoby.

<!-- SCREENSHOT: reviews-preview.png — preview panel s word review tlačidlami (OK / FLAG / COMMENT) -->
 <img src="/images/reviews-preview.png" alt="Word Reviews" style="border:1px solid #334155;border-radius:8px;max-width:680px;" /> 

## Ako pridať recenziu

1. Klikni na riadok v tabuľke — v pravom paneli (Preview) sa zobrazí detail slova
2. V spodnej časti Preview uvidíš tlačidlá:
   - ✅ **OK** — slovo je správne, schvaľujem
   - 🚩 **FLAG** — slovo má problém, treba pozrieť
   - 💬 **COMMENT** — pridaj textovú poznámku

3. Kliknutím na jedno z tlačidiel pridáš recenziu

## Stav recenzií v tabuľke

V tabuľke sú tri stĺpce recenzií:

| Ikona | Stĺpec | Popis |
|---|---|---|
| ✅ / 🚩 / ⬜ | Stav | Posledná recenzia pre dané slovo |
| ★ | Poznámka | Slovo má aspoň jednu komentárovú recenziu |

## Automatická zmena stavu balíka

Systém sleduje celkový stav recenzií a automaticky mení stav balíka:

- Keď reviewer pridá prvú recenziu → balík prechádza na **In Review**
- Keď sú všetky slová označené OK → balík môže prejsť na **Approved**

## Vymazanie recenzie

V Preview paneli uvidíš históriu recenzií. Každú recenziu môžeš zmazať kliknutím na × vedľa nej.

::: tip
Ako reviewer nemusíš otvárať editor — môžeš prezerať balíky v **režime len na čítanie** a pridávať recenzie bez rizika náhodnej zmeny obsahu.
:::
