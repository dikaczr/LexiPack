# Databáza

LexiPack používa **Microsoft SQL Server** (vrátane Express edície).

## Inicializácia

```bash
cd server
node init-db.js
```

Skript vytvorí všetky tabuľky, ak neexistujú. Bezpečné spustiť opakovane — existujúce tabuľky a dáta nezmení.

## Tabuľky

| Tabuľka | Popis |
|---|---|
| `Users` | Používateľské účty (username, email, role, heslo) |
| `AuditLog` | Záznam všetkých dôležitých akcií |
| `Packs` | Register JSON súborov balíkov + stav |
| `PackReviews` | Reviewerské akcie na celých balíkoch |
| `WordReviews` | Recenzie jednotlivých slov (OK / FLAG / COMMENT) |
| `UserSettings` | Nastavenia per-používateľ (téma, jazyk, cesty) |
| `Tags` | Zoznam tagov |
| `AiTelemetry` | Štatistiky využitia AI per používateľ/balík |
| `Heartbeats` | Pulzy aktívneho editačného času |

## Zálohovanie

Dáta sú v dvoch miestach:

1. **SQL Server databáza** — Users, AuditLog, Reviews, Settings, Telemetry, Heartbeats
2. **JSON súbory** — `/server/packs/*.json` — samotný obsah balíkov

Pre úplnú zálohu potrebuješ oboje:
- SQL Server backup (napr. cez SSMS alebo `sqlcmd`)
- Zálohu adresára `server/packs/`

::: tip
Odporúčame denné zálohovanie databázy a balíkov. JSON súbory môžeš verzionovať aj cez Git.
:::

## Zdieľaná databáza

Ak viacero inštalácií (napr. lokálny dev a produkcia) zdieľa tú istú SQL Server databázu, `UserSettings` (vrátane ciest pre publikovanie) sú zdieľané. Nastavenia zmeň len na produkcii.
