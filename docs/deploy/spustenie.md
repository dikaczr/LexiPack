# Spustenie (PM2)

PM2 je správca procesov pre Node.js — zabezpečí, že server beží neustále a reštartuje sa po páde alebo reštarte systému.

## Inštalácia PM2

```bash
npm install -g pm2
```

## Konfigurácia

V koreňovom adresári repozitára je súbor `ecosystem.config.cjs`:

```js
module.exports = {
  apps: [{
    name: 'lexipack-api',
    script: './server/server.js',
    cwd: './',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

## Spustenie

```bash
pm2 start ecosystem.config.cjs
```

## Základné príkazy PM2

```bash
pm2 status                    # Zoznam procesov
pm2 logs lexipack-api         # Logy v reálnom čase
pm2 restart lexipack-api      # Reštartovanie
pm2 stop lexipack-api         # Zastavenie
pm2 delete lexipack-api       # Odstránenie z PM2
```

## Automatický štart po reštarte systému

```bash
pm2 startup        # Generuje príkaz pre autostart (spusti vygenerovaný príkaz)
pm2 save           # Uloží aktuálny zoznam procesov
```

## Statické súbory klienta

Server servíruje klientský build zo `client/dist/`. Po každom buildu klienta nie je potrebný reštart PM2 — súbory sa načítajú dynamicky.

## Kontrola stavu

```bash
pm2 status
# alebo
curl http://localhost:3001/api/auth/me
```

Ak server beží správne, vráti `401 Unauthorized` (nie connection error).
