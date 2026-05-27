# Kontrola kvality — prehľad

<!-- SCREENSHOT: kvalita-dropdown.png — otvorený dropdown menu tlačidla Kvalita so všetkými položkami -->
 <img src="/images/kvalita-dropdown.png" alt="Dropdown Kvalita" style="border:1px solid #334155;border-radius:8px;max-width:500px;" /> 

Kvalita dát patrí medzi najdôležitejšie princípy systému LexiPack. Aj technicky dobre vytvorený slovný balík môže mať nízku vzdelávaciu hodnotu, ak obsahuje nekonzistentné údaje, nepresné preklady, nekvalitné príkladové vety alebo neprehľadnú štruktúru.

Cieľom LexiPacku preto nie je iba rýchle vytváranie obsahu, ale tvorba kvalitných a dlhodobo udržateľných jazykových dát.

Tlačidlo **Kvalita** v toolbare otvára dropdown so šiestimi kontrolami kvality podporované umelou inteligenciou. Každá kontrola analyzuje iný aspekt kvality balíka.

## Prehľad kontrol

| Kontrola | Čo robí |
|---|---|
| [Konzistencia domén](./kvalita-domeny) | Overí, že všetky slová patria do kategórie balíka |
| [Konzistencia úrovní (CEFR)](./kvalita-cefr) | Porovná CEFR úroveň každého slova s úrovňou balíka |
| [Kvalita príkladov](./kvalita-priklady) | Ohodnotí príkladové vety ako ok / generic / weak |
| [Duplicitné významy](./kvalita-duplicity) | Nájde slová s rovnakým alebo veľmi podobným významom |
| [Pokrytie tém (Pack Coverage)](./kvalita-pokrytie) | Rozdelí slová podľa podtém a ukáže, ktoré oblasti sú slabo pokryté |
| [Trusted Source Assistant](./kvalita-zdroje) | Odporučí vhodné slovníky a zdroje pre konkrétne slovo |

## Ako kontroly fungujú

Kontroly posielajú obsah balíka na server, kde umelá inteligencia vykoná analýzu. Výsledky sa zobrazujú v dialógu — nikdy sa nič nezmení automaticky. Všetky opravy robíš ty.

::: warning
Kontroly spotrebúvajú AI tokeny. Pre veľké balíky (200+ slov) môže niektorá kontrola trvať 10–30 sekúnd.
:::
