# Automatické korekcie

Funkcia automatických korekcií opravuje bežné preklepy pri písaní — rovnako ako autocorrect v textových editoroch. Korekcia sa vykoná vždy pri odchode z editovanej bunky.

---

## Zapnutie a výber jazyka

V nastaveniach (sekcia **Editor → Automatické korekcie**):

1. Zaškrtni **Zapnúť automatické korekcie**
2. V rozbaľovacom menu vyber jazyk slovníka

Rozbaľovacie menu zobrazuje ✓ pri jazykoch, pre ktoré je importovaný slovník.

---

## Typy korekcií

### Importované páry (src → trg)

Slovník obsahuje konkrétne páry „chybný tvar → správny tvar". Napríklad `abbout → about`.

Korekcia sa aplikuje na tieto polia: `word`, `translation`, `definition`, `example_en`, `example_sk`, `topic`.

### Opraviť dve začiatočné písmená

Opraví slová, kde boli omylom stlačené dve veľké písmená na začiatku:

```
PRíklad → Príklad
ABout   → About
```

### Opraviť neúmyselné zapnutie CapsLock

Opraví text napísaný s náhodne zapnutým CapsLock:

```
tEXT  → Text
hELLO → Hello
```

---

## Indikátor CapsLock

Keď je CapsLock zapnutý, v päte editora (vpravo) sa zobrazí oranžový badge **⇪ CapsLock**.

Kliknutím na badge zobrazíš upozornenie: *„Stlač kláves CapsLock pre vypnutie."*

---

## Import slovníka (.autoCorrect)

Slovník korekcií sa importuje zo súboru `.autoCorrect` — štandardný formát SDL Trados Studio.

**Postup:**
1. Otvor **Nastavenia → Editor → Automatické korekcie**
2. Posuň sa do sekcie **Páry korekcie**
3. Klikni na **📥 Importovať .autoCorrect**
4. Vyber súbor `.autoCorrect` z disku

Po importe sa tabuľka párov automaticky aktualizuje. Pre každý jazyk existuje samostatný slovník — import novej verzie toho istého jazyka pôvodný slovník prepíše.

::: tip
Súbory `.autoCorrect` nájdeš v inštalácii SDL Trados Studio v priečinku `%AppData%\SDL\SDL Trados Studio\...\AutoCorrect\`.
:::

---

## Správa párov v tabuľke

Po importe (alebo manuálnom pridaní) môžeš páry prezerať a upravovať priamo v nastaveniach:

| Akcia | Popis |
|---|---|
| **Editácia** | Klikni na ľubovoľnú bunku — pole sa stane editovateľným |
| **Pridať riadok** | Tlačidlo **+ Pridať riadok** pridá prázdny riadok na koniec |
| **Zmazať riadok** | Tlačidlo **×** na pravej strane riadka |
| **Hľadať** | Filter vpravo hore filtruje tabuľku podľa textu v `src` alebo `trg` |
| **Uložiť** | Tlačidlo **Uložiť** uloží všetky zmeny (aktívne len keď sú neuložené zmeny) |

::: info
Riadky s prázdnym `src` alebo `trg` sa pri uložení automaticky vynechajú.
:::

---

## Automatické načítanie podľa jazyka balíka

Keď otvoríš balík, aplikácia automaticky skontroluje jazyk balíka (`targetLang`) a pokúsi sa načítať zodpovedajúci slovník korekcií:

| Jazyk balíka | Hľadaný slovník |
|---|---|
| `sk` | sk-SK |
| `en` | en-US, potom en-GB |
| `de` | de-DE |
| `fr` | fr-FR |
| `es` | es-ES |
| `it` | it-IT |
| `cs` | cs-CZ |
| `pl` | pl-PL |
| `hu` | hu-HU |

Ak pre daný jazyk nie je importovaný slovník, zobrazí sa upozornenie v strede obrazovky a použije sa slovník nastavený globálne v Nastaveniach.
