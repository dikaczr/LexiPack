# Import a export

## Export

Klikni na tlačidlo **Export** v toolbare. Môžeš exportovať do týchto formátov:

| Formát | Použitie |
|---|---|
| **JSON** | Natívny formát LexiPack — na zálohovanie alebo import do iného balíka |
| **XLSX** | Excel tabuľka — na úpravu v externom programe |
| **TXT** | Jednoduchý textový zoznam slov |
| **PDF** | Tlačiteľná verzia |
| **CSV** | Pre ďalšie spracovanie v iných nástrojoch |
| **TBX** | Terminologický formát (TermBase eXchange) |

::: tip
**Ctrl+S** uloží balík na server. Export (stiahnutie súboru) je iná operácia — robí sa cez tlačidlo Export.
:::

## Import

Klikni na tlačidlo **Import** v toolbare. Podporované sú formáty:

- **JSON** — importuje celý balík alebo jeho časť
- **XLSX** — Excel tabuľka (musí mať stĺpce s názvami polí)

### Stratégie zlúčenia

Pri importe si vyber, ako sa nové dáta skombinujú s existujúcimi:

| Stratégia | Popis |
|---|---|
| **Nahradiť** | Existujúce riadky sa prepíšu novými |
| **Pridať** | Nové riadky sa pridajú na koniec (aj duplikáty) |
| **Zlúčiť** | Prázdne polia existujúcich riadkov sa doplnia z importu |
| **Preskočiť duplikáty** | Slová, ktoré už existujú, sa ignorujú |

## Import z PDF

Tlačidlo **Čítať PDF** otvorí čítačku PDF dokumentov:

1. Nahraj PDF súbor
2. Aplikácia extrahuje text a zvýrazní slová, ktoré už v balíku existujú
3. Vyber text/slovo, ktoré chceš pridať — klikni naň
4. Slovo sa pridá do balíka

Toto je užitočné pri tvorbe balíkov z učebníc alebo odborných textov.
