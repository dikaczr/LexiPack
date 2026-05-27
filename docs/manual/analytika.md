# Analytika

Obrazovka **Analytika** je dostupná len pre rolu **admin** a zobrazuje štatistiky využitia systému.

## Čo zobrazuje

### Editačný čas

- **Dnes** — koľko minút bol editor aktívne používaný dnes
- **Per balík (30 dní)** — čas strávený na každom balíku za posledný mesiac
- **Aktivita per deň (14 dní)** — denný trend editačného času

Čas sa meria pomocou tzv. heartbeat pulzov — systém zaznamená aktivitu každých 30 sekúnd. Ak používateľ 3 minúty nehýbe myšou ani nestlačí klávesu, prestane sa počítať.

### AI využitie

- **AI dnes** — celkový počet AI operácií dnes + rozdelenie: Generate / Fill Column / Suggest Words
- **AI per balík (30 dní)** — koľko AI operácií bolo vykonaných na každom balíku
- **AI trend per deň (14 dní)** — denný vývoj využitia AI

## Účel

Analytika slúži na:
- Monitorovanie produktivity tímu
- Sledovanie nákladov na AI (počet operácií ≈ tokeny)
- Identifikáciu balíkov, na ktorých sa pracuje najintenzívnejšie
