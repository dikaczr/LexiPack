# Kontrola vizuálnezho pokrytia tém (Pack Coverage Visualization)

Táto kontrola ukáže, **ako sú slová rozdelené medzi podtémami** a ktoré oblasti sú slabo pokryté.

## Ako to funguje

AI rozdelí všetky slová do tematických skupín (napr. pre balík *astronómia*: planéty, hviezdy, meracie prístroje, fyzikálne javy...). Každej skupine priradí úroveň pokrytia.

## Výsledky

<!-- SCREENSHOT: kvalita-pokrytie-dialog.png — dialóg Pack Coverage s farebnými stĺpcovými grafmi (High/Medium/Low) -->
 <img src="/images/kvalita-pokrytie-dialog.png" alt="Pack Coverage" style="border:1px solid #334155;border-radius:8px;" /> 

Dialóg zobrazí skupiny so stĺpcovými grafmi:

| Pokrytie | Popis |
|---|---|
| 🟢 **Vysoké** | Téma má dostatok slov (5+) |
| 🟡 **Stredné** | Téma má niekoľko slov (2–4) |
| 🔴 **Nízke** | Téma má 1 alebo žiadne slovo |

Každá skupina je rozbaliteľná — uvidíš, ktoré konkrétne slová do nej patria.

Výstup je **v slovenčine**. Obsahuje aj odporúčania ako postupovať ďalej a akú oblasť v balíku ďalej pokrývať.

## Čo robiť

1. Identifikuj podtémy s **Nízkym** pokrytím
2. Použi **Návrhy slov** (💡) na doplnenie chýbajúcich slov v danej podtéme
3. V popise návrhu môžeš AI nasmerovať na konkrétnu podtému (napr. uviesť ju v Kategórii metadát)

::: tip
Táto analýza ti pomôže vytvoriť **vyvážený** balík — bez zbytočného zdvojenia v jednej oblasti a medzier v inej.
:::

## Použitie

Pack Coverage Visualization slúži na vizuálnu a tematickú analýzu slovníkového balíka. Jeho cieľom nie je iba zobrazovať počet slov, ale pomôcť editorovi pochopiť, aké významové oblasti pack pokrýva a kde sa nachádzajú slabé alebo chýbajúce časti obsahu.

Systém analyzuje tematické zameranie jednotlivých slov a pokúša sa ich rozdeliť do významových alebo odborných skupín. Vďaka tomu môže editor rýchlo zistiť, či je pack vyvážený, alebo či sa príliš sústreďuje iba na jednu časť témy. Napríklad pri packu z astronómie môže systém identifikovať oblasti ako planéty, fyzika, vesmírne objekty, pohyb telies alebo pozorovacie nástroje.

Pack Coverage Visualization pomáha odhaliť:

• chýbajúce tematické oblasti,  
• príliš úzko zamerané sekcie,  
• nadmerné opakovanie podobných konceptov,  
• nevyváženú náročnosť alebo slovnú zásobu.

Funkcia je navrhnutá ako podpora pre autora a review proces. Nenahrádza odborné rozhodnutie editora, ale poskytuje rýchly prehľad o štruktúre a tematickom pokrytí packu. Pri rozsiahlejších odborných balíkoch môže výrazne pomôcť pri udržiavaní konzistencie a kvality obsahu.

Pack Coverage Visualization je obzvlášť užitočný pri tvorbe odborných, akademických alebo tematicky zameraných balíkov, kde je dôležité zabezpečiť, aby používateľ získal vyvážený prehľad o celej oblasti, nie iba o jej malej časti.