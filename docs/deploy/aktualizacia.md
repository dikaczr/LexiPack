# Aktualizácia

## Postup aktualizácie (produkcia)

### 1. Build nového klienta (lokálne)

```bash
cd client
npm run build
```

### 2. Skopírovanie súborov na server

**Klientský build:**
```
Skopíruj obsah client/dist/ na server do adresára so statickými súbormi
```

**Serverové súbory** (len zmenené):
```
Skopíruj zmenené súbory z server/ do C:\APPS\Lexipack\server\
```

### 3. Inštalácia nových závislostí (ak sa zmenil package.json)

```bash
# Na serveri v adresári server/
npm install
```

### 4. Reštart servera

```bash
pm2 restart lexipack-api
```

### 5. Overenie

```bash
pm2 status
pm2 logs lexipack-api --lines 20
```

## Čo vyžaduje reštart servera

- Zmeny v `server/` súboroch
- Zmeny v `server/.env`
- Inštalácia nových npm balíkov (server)

## Čo nevyžaduje reštart servera

- Zmeny v `client/dist/` (statické súbory)
- Pridanie/úprava JSON balíkov v `server/packs/`

## Rollback

Ak nová verzia nefunguje, obnov predchádzajúce serverové súbory a reštartuj PM2.

Odporúčame pred každou aktualizáciou zálohovať:
- Aktuálne serverové súbory
- Databázu (SQL Server backup)
- Adresár `server/packs/`

## Migrácie databázy

Pri aktualizácii, ktorá pridáva nové tabuľky alebo stĺpce, spusti:

```bash
node init-db.js
```

Skript pridá chýbajúce tabuľky/stĺpce bez dotyku existujúcich dát.
