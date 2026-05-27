# Systémové požiadavky

## Server

| Požiadavka | Minimálna verzia |
|---|---|
| **Node.js** | 18.x alebo novší |
| **npm** | 9.x alebo novší |
| **SQL Server** | 2012 alebo novší (vrátane Express edície) |
| **PM2** | 5.x (správca procesov) |
| **OS** | Windows Server 2012+, Linux (Ubuntu 20.04+) |

## Sieť

- Port **3001** (alebo nakonfigurovaný `PORT`) musí byť dostupný (alebo proxovaný cez IIS/nginx)
- Server musí mať prístup na internet (OpenAI API, Gmail SMTP)
- SQL Server musí byť dostupný zo servera (lokálne alebo vzdialene)

## Klientske prehliadače

Aplikácia funguje v moderných prehliadačoch:
- Chrome 90+
- Edge 90+
- Firefox 90+
- Safari 15+

## OpenAI API

Na fungovanie AI funkcií je potrebný platný **OpenAI API kľúč** s prístupom k modelu (odporúčame `gpt-4o-mini` pre cenu/výkon).

## Gmail SMTP (voliteľné)

Na odosielanie e-mailov (zabudnuté heslo, registrácia) je potrebný Gmail účet s **App Password**.
