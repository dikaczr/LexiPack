# Inštalácia

## 1. Stiahnutie kódu

```bash
git clone <repo-url> lexipack
cd lexipack
```

Alebo rozbaľ ZIP archív do cieľového adresára.

## 2. Inštalácia závislostí servera

```bash
cd server
npm install
```

## 3. Build klienta

```bash
cd client
npm install
npm run build
```

Tým vznikne adresár `client/dist/` so statickými súbormi.

## 4. Konfigurácia

Skopíruj a uprav `.env` súbor — pozri [Konfigurácia](./konfiguracia).

## 5. Inicializácia databázy

```bash
cd server
node init-db.js
```

Tým sa vytvoria všetky potrebné tabuľky v SQL Serveri. Ak tabuľky už existujú, príkaz ich nezmení.

## 6. Spustenie

```bash
# Testovací štart (bez PM2):
node server.js

# Produkčný štart cez PM2:
pm2 start ecosystem.config.cjs
```

Aplikácia beží na `http://localhost:3001` (alebo nakonfigurovanom porte).

## 7. Prvý admin účet

Po spustení vytvor prvého administrátora priamo v databáze, alebo cez API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@firma.sk","password":"HesloAdmin123","role":"admin"}'
```

::: warning
Po vytvorení prvého admina odporúčame endpoint registrácie zablokovať alebo obmedziť.
:::
