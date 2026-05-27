# Kontrola kvality príkladov

Táto kontrola ohodnotí **príkladové vety** (`Example EN`) — či sú zmysluplné, konkrétne a didakticky hodnotné.

## Hodnotenie

Každá veta dostane jednu z troch hodnôt:

| Hodnotenie | Popis |
|---|---|
| ✅ **ok** | Veta je konkrétna, prirodzená, vhodná pre daný kontext |
| ⚠️ **generic** | Veta je príliš všeobecná — slovo v nej síce je, ale nič nehovorí o jeho reálnom použití |
| ❌ **weak** | Veta je krátka, umelá, alebo nezmyselná |

**Príklad generic:** *"The satellite is important."* — slovo je v texte, ale veta neurčuje kontextové použitie.

**Príklad weak:** *"This is a satellite."* — triviálna veta bez hodnoty.

**Príklad ok:** *"The satellite transmits weather data to stations on the ground."* — konkrétne, prirodzené použitie.

## Výsledky

<!-- SCREENSHOT: kvalita-priklady-dialog.png — dialóg s výsledkami: weak a generic vety, tlačidlo Použiť -->
 <img src="/images/kvalita-priklady-dialog.png" alt="Kontrola príkladov" style="border:1px solid #334155;border-radius:8px;" /> 

Dialóg zobrazí oddelene:
- Slabé vety (**weak**) — priorita na opravu
- Generické vety (**generic**) — odporúča sa zlepšiť

Pre každú vetu je k dispozícii tlačidlo **Použiť** — aplikuje AI návrh lepšej vety priamo do bunky.

## Čo robiť

1. Prezri si označené vety
2. Pre slabé vety klikni **Použiť** (AI navrhne lepšiu) alebo napíš vlastnú
3. Generické vety sú menej kritické — oprav podľa uváženia
