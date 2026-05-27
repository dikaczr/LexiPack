# Administrácia systému

Táto sekcia je dostupná iba používateľom s rolou **admin**.

## Správa používateľov

Sekcia **Používatelia** (ikona v bočnom paneli) zobrazuje zoznam všetkých registrovaných účtov v systéme.

### Tabuľka používateľov

Pre každého používateľa vidíte:

| Stĺpec | Popis |
|---|---|
| ID | Interné ID záznamu v databáze |
| Používateľ | Prihlasovacie meno |
| E-mail | Kontaktná adresa (nepovinná) |
| Rola | Oprávnenie v systéme |
| Stav | Aktívny / Neaktívny |
| Posledné prihlásenie | Dátum a čas posledného úspešného prihlásenia |
| Vytvorený | Dátum vytvorenia účtu |
| Akcie | Tlačidlá na správu |

### Roly a oprávnenia

| Rola | Popis |
|---|---|
| **viewer** | Môže prezerať balíky, nemôže editovať |
| **editor** | Môže vytvárať a editovať balíky |
| **reviewer** | Môže recenzovať slová (OK / FLAG / komentár) |
| **admin** | Plný prístup vrátane správy používateľov a nastavení systému |

### Vytvorenie nového používateľa

Kliknite na tlačidlo **Nový používateľ** v pravom hornom rohu.

Vypĺňajte formulár:
- **Používateľské meno** — jedinečné prihlasovacie meno
- **E-mail** — ak vyplníte, systém automaticky odošle uvítací e-mail s prihlasovacími údajmi
- **Heslo** — počiatočné heslo
- **Rola** — priraďte oprávnenie

Po uložení sa zobrazí informácia, či bol uvítací e-mail odoslaný úspešne.

### Úprava existujúceho používateľa

Kliknite na **Upraviť** pri príslušnom riadku.

V editačnom formulári môžete zmeniť:
- **E-mail**
- **Heslo** — ak ponecháte prázdne, heslo sa nezmení
- **Rola**
- **Stav** (Aktívny / Neaktívny)

### Deaktivácia a reaktivácia

Tlačidlom **Deaktivovať** / **Aktivovať** v tabuľke môžete rýchlo blokovať alebo odomknúť prístup bez vymazania účtu. Deaktivovaný používateľ sa nemôže prihlásiť.

::: tip
Účty sa nevymažú — iba deaktivujú. Tým sa zachová história auditného logu.
:::

---

## Auditný log

Auditný log zaznamenáva všetky dôležité akcie vykonané v systéme. Je dostupný cez API endpoint `/api/audit` (len admin).

### Zaznamenávané udalosti

| Kategória | Udalosti |
|---|---|
| **Autentifikácia** | Prihlásenie, odhlásenie |
| **Balíky** | Vytvorenie, uloženie, zmazanie, zmena stavu, publikovanie |
| **Slová** | Recenzie (OK, FLAG, komentár) |
| **Používatelia** | Vytvorenie, úprava, deaktivácia |
| **AI** | Generovanie, návrhy slov, kontrola kvality |
| **Import / Export** | Import balíka, export balíka |

### Štruktúra záznamu

Každý záznam obsahuje: ID, používateľa, rolu, akciu, detaily (JSON), IP adresu a časovú pečiatku.

Log možno filtrovať podľa **akcie** a **používateľského mena**. Predvolene sa zobrazuje posledných 200 záznamov zoradených od najnovšieho.

---

## Nastavenia systému (admin)

Niektoré nastavenia v sekcii **Nastavenia** sú viditeľné a editovateľné len pre admina:

| Nastavenie | Popis |
|---|---|
| **Cesta na publikovanie** | Cieľový adresár, do ktorého sa kopírujú publikované balíky |
| **Cesta na archivovanie** | Cieľový adresár pre archivované balíky |
| **Kontaktný e-mail** | Adresa, na ktorú sa zasielajú systémové správy a uvítacie e-maily |

::: warning Zdieľaná databáza
Lokálne vývojové prostredie aj produkcia zdieľajú rovnaký SQL Server. Zmena ciest na publikovanie alebo archivovanie sa okamžite prejaví aj v produkcii.
:::

---

## Analytika

Sekcia **Analytika** zobrazuje štatistiky využívania systému za posledných 30 dní:

- **Čas editácie** — celkový čas aktívnej práce, rozdelený podľa balíkov a dní
- **AI volania** — počet a typy AI operácií (generovanie, návrhy, kontrola kvality)
- **Latencia AI** — priemerný čas odpovede AI (ms/token) podľa typu operácie
- **Automatické korekcie** — počet aplikovaných autokorektúr

Štatistiky sú dostupné pre všetkých prihlásených používateľov (každý vidí vlastné dáta).
