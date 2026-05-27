import { useState } from "react";
import "./HelpDialog.css";

const SECTIONS = [
  { id: "basics",    title: "Základy" },
  { id: "newpack",   title: "Vytváranie nových balíkov" },
  { id: "editing",   title: "Úprava a vkladanie slov" },
  { id: "shortcuts", title: "Klávesové skratky" },
  { id: "importexport", title: "Import / Export" },
  { id: "ai",        title: "AI funkcie" },
  { id: "quality",   title: "Kontrola kvality" },
  { id: "bookmarks", title: "Bookmarky" },
  { id: "symbols",   title: "Symbols" },
  { id: "settings",  title: "Nastavenia aplikácie" },
];

function Section({ title, children }) {
  return (
    <div className="help-section">
      <h2 className="help-section-title">{title}</h2>
      {children}
    </div>
  );
}

function Table({ rows }) {
  return (
    <table className="help-table">
      <tbody>
        {rows.map(([a, b], i) => (
          <tr key={i}>
            <td className="help-table-key">{a}</td>
            <td className="help-table-val">{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Kbd({ children }) {
  return <kbd className="help-kbd">{children}</kbd>;
}

const CONTENT = {
  basics: (
    <Section title="Základy">
      <p>LexiPack je editor dvojjazyčných slovníkových balíkov primárne určené pre Lexico a pre študentov cudzích jazykov. Každý balík obsahuje zoznam slov s prekladmi a doplňujúcimi informáciami.</p>
      <h3>Štruktúra slova</h3>
      <p>Každé slovo má nasledujúce polia:</p>
      <Table rows={[
        ["Word",        "Slovo v cieľovom jazyku"],
        ["Article",     "Člen (napr. the, a, der, die, das)"],
        ["Phonetic",    "Fonetický prepis (IPA)"],
        ["Translation", "Preklad do rodného jazyka"],
        ["Definition",  "Definícia slova v cieľovom jazyku"],
        ["Type",        "Slovný druh (noun, verb, adjective…)"],
        ["Level",       "Jazyková úroveň (A1 – C2)"],
        ["Example EN",  "Príkladová veta v cieľovom jazyku"],
        ["Example SK",  "Príkladová veta v rodnom jazyku"],
        ["Topic",       "Tematická kategória"],
      ]} />
      <h3>Ukladanie</h3>
      <p>Balíky sú uložené na serveri v pristore dostupnom pre Lexico (JSON súbory). Zároveň sa slovný balík archivuje. Automatické zálohovanie prebieha každú časovú jednotku, ktorý si používateľ nastaví vo svojich Nastaveniach, ako ochrana pred stratou dát.</p>
    </Section>
  ),

  newpack: (
    <Section title="Vytváranie nových balíkov">
      <h3>Vytvorenie balíka</h3>
      <ol>
        <li>Prejdite na obrazovku <strong>Projekty</strong> (ľavý panel → Projekty).</li>
        <li>Kliknite na tlačidlo <strong>Nový pack</strong>.</li>
        <li>Zadajte názov balíka a potvrďte.</li>
        <li>Balík sa vytvorí a otvorí v editore.</li>
      </ol>
      <h3>Metadáta balíka</h3>
      <p>V hornej časti editora sa nachádza panel s metadátami. Tieto údaje popisujú pre systém obsah balíka. Vyplňte nasledujúce údaje:</p>
      <Table rows={[
        ["Názov",         "Názov balíka (povinné)"],
        ["Cieľový jazyk", "Jazyk, ktorý sa učíte (napr. EN)"],
        ["Rodný jazyk",   "Váš materinský jazyk (napr. SK)"],
        ["Úroveň",        "Celková úroveň balíka (A1 – C2)"],
        ["Verzia",        "Verzia balíka (napr. 1.0)"],
        ["Popis",         "Krátky popis obsahu balíka"],
        ["Témy",          "Tematické štítky pre filtrovanie"],
      ]} />
      <h3>Správa balíkov na obrazovke Projekty</h3>
      <p>Na obrazovke Management slovných balíkov môžete balíky filtrovať podľa názvu, stavu, jazyka, úrovne a témy. Tlačidlá <strong>Import balíka</strong> a <strong>Export Pack</strong> umožňujú aj hromadné operácie.</p>
    </Section>
  ),

  editing: (
    <Section title="Úprava a vkladanie slov">
      <h3>Editácia buniek</h3>
      <ul>
        <li>Na spustenie editácie Kliknite na zvolenú bunku.</li>
        <li><Kbd>Enter</Kbd> potvrdí zmenu a presunie kurzor na ďalšiu bunku vpravo (na konci riadku prejde na začiatok ďalšieho riadku).</li>
        <li><Kbd>Escape</Kbd> zruší editáciu bez uloženia zmeny.</li>
      </ul>
      <h3>Pridávanie a mazanie riadkov</h3>
      <Table rows={[
        ["Alt + Insert / tlačidlo Add Row",      "Pridá nový prázdny riadok"],
        ["Delete / tlačidlo Delete",             "Vymaže všetky označené riadky"],
      ]} />
      <h3>Výber riadkov</h3>
      <p>Riadky sa vyberajú zaškrtávacím políčkom v prvom stĺpci. Vybrané riadky sú zvýraznené príslušnou farbou podľa témy vzhľadu a sú cieľom hromadných operácií (AI, Export…).</p>
      <h3>Farebné označenie riadkov</h3>
      <Table rows={[
        ["Červená",  "Chýba aspoň jedno povinné pole"],
        ["Žltá",     "Duplicitné slovo v balíku"],
        ["Modrá",    "Riadok je označený (checkboxom)"],
        ["Zelená ⚑", "Riadok má bookmark"],
      ]} />
      <h3>Stĺpec overenia (audítor)</h3>
      <p>Riadky, ktoré sú kompletne vyplnené sa musia pred odoslaním na použitie overiť príslušným audítorom. Tieto značky môže vkladať <strong>iba používateľ s rolou Reviewer (audítor)</strong> — bežný editor ich nemôže pridávať ani meniť.</p>
      <Table rows={[
        ["✅", "Slovo schválené audítorom"],
        ["🚩", "Slovo označené ako problematické"],
        ["⬜", "Slovo ešte nebolo overené"],
        ["★", "K slovu existuje poznámka audítora (komentár)"],
      ]} />
      <h3>Rýchle vyhľadávanie</h3>
      <p>Funkcia <strong>Search</strong> v ľavom paneli filtruje riadky gridu v reálnom čase podľa ľubovoľného textu.</p>
    </Section>
  ),

  shortcuts: (
    <Section title="Klávesové skratky">
      <h3>Všeobecné</h3>
      <Table rows={[
        [<Kbd>F1</Kbd>,              "Otvoriť túto pomoc"],
        [<Kbd>F2</Kbd>,              "Zobraziť zoznam skratiek"],
        [<Kbd>Escape</Kbd>,          "Zatvoriť dialóg / zrušiť akciu"],
        [<Kbd>Ctrl + S</Kbd>,        "Exportovať balík ako JSON (uloženie)"],
      ]} />
      <h3>Úprava</h3>
      <Table rows={[
        [<Kbd>Ctrl + Z</Kbd>,        "Späť (Undo)"],
        [<Kbd>Ctrl + Y</Kbd>,        "Znova (Redo)"],
        [<Kbd>Alt + Insert</Kbd>,    "Pridať nový riadok"],
        [<Kbd>Delete</Kbd>,          "Vymazať označené riadky"],
        [<Kbd>Enter</Kbd>,           "Potvrdiť editáciu a prejsť ďalej"],
      ]} />
      <h3>AI</h3>
      <Table rows={[
        [<Kbd>Ctrl + Enter</Kbd>,         "Generovať AI pre aktuálny riadok"],
        [<Kbd>Ctrl + Shift + G</Kbd>,     "Generovať AI pre všetky označené riadky"],
      ]} />
      <h3>Navigácia</h3>
      <Table rows={[
        [<Kbd>Ctrl + B</Kbd>,        "Pridať / upraviť bookmark na aktuálnom riadku"],
      ]} />
      <h3>Reviewer</h3>
      <Table rows={[
        [<Kbd>Ctrl + A</Kbd>,        "Schváliť aktuálny riadok (OK) a prejsť na ďalší — iba rola Reviewer"],
      ]} />
    </Section>
  ),

  importexport: (
    <Section title="Import / Export">
      <h3>Import</h3>
      <p>Tlačidlo <strong>Import</strong> (alebo <strong>Import Pack</strong> na obrazovke Projekty) umožňuje načítať slová zo súboru.</p>
      <p>Podporované formáty: <strong>XLSX</strong>, <strong>JSON</strong>.</p>
      <h3>Stratégie mergovania</h3>
      <Table rows={[
        ["Replace",  "Nahradí celý obsah balíka importovanými dátami"],
        ["Append",   "Pridá importované slová na koniec balíka"],
        ["Merge",    "Doplní prázdne polia existujúcich slov, duplicity preskočí"],
        ["Skip",     "Pridá len slová, ktoré ešte v balíku nie sú"],
      ]} />
      <h3>Export</h3>
      <p>Tlačidlo <strong>Export</strong> exportuje slová do zvoleného formátu. Ak sú niektoré riadky označené (checkboxom), exportujú sa <em>iba tie</em>. Inak sa exportujú všetky.</p>
      <Table rows={[
        ["XLSX", "Excel tabuľka s hlavičkou a všetkými poľami"],
        ["CSV",  "Textový súbor s nastaveným oddeľovačom (viď Nastavenia → Export)"],
        ["TBX",  "TermBase eXchange — štandardný formát pre terminologické databázy (ISO 30042)"],
        ["TXT",  "Čitateľný textový výpis, jedno slovo na blok"],
        ["PDF",  "Formátovaná tabuľka, orientácia landscape A4"],
      ]} />
      <h3>Oddeľovač CSV</h3>
      <p>Znak oddeľovača pre CSV súbory sa nastavuje v <strong>Nastavenia → Export → Oddeľovač pre CSV súbory</strong>. Predvolená hodnota je čiarka (<code>,</code>).</p>
    </Section>
  ),

  ai: (
    <Section title="AI funkcie">
      <p>LexiPack využíva OpenAI API na automatické vypĺňanie polí. Pre AI funkcie je potrebné internetové pripojenie a platný API kľúč nakonfigurovaný na serveri.</p>
      <h3>Dostupné akcie</h3>
      <Table rows={[
        ["Generate AI",     "Vygeneruje všetky polia pre riadok, na ktorom je kurzor (Ctrl+Enter)"],
        ["Gen. Selected",   "Vygeneruje všetky polia pre všetky označené riadky (Ctrl+Shift+G)"],
        ["Fill Column",     "Doplní jeden konkrétny stĺpec pre všetky označené riadky"],
        ["Gen. Topic",      "Automaticky určí tematickú kategóriu (Topic) pre označené slová"],
        ["Suggest Words",   "Navrhne 10 súvisiacich slov na základe obsahu balíka"],
      ]} />
      <h3>Suggest Words</h3>
      <p>Po kliknutí na <strong>Suggest Words</strong> sa zobrazí dialóg s navrhovanými slovami. Zaškrtajte slová, ktoré chcete pridať, a potvrďte. Vybrané slová sa vložia ako nové riadky do balíka (bez vyplnených polí — tie je potrebné vygenerovať samostatne).</p>
      <h3>Dopĺňanie cez pravý klik</h3>
      <p>Kliknite pravým tlačidlom myši na bunku a zvoľte <strong>Fill with AI</strong> pre doplnenie hodnoty konkrétnej bunky.</p>
    </Section>
  ),

  quality: (
    <Section title="Kontrola kvality">
      <p>Nástroje na kontrolu kvality sú dostupné cez tlačidlo <strong>Kvalita ▼</strong> v paneli nástrojov editora. Kontroly je možné spustiť kedykoľvek počas práce na balíku — pomáhajú odhaliť nekonzistencie skôr, než sa balík odovzdá na overenie.</p>

      <h3>Kontrola konzistencie domén</h3>
      <p>Overuje, či hodnoty v stĺpci <strong>Topic</strong> zodpovedajú tematickému zameraniu balíka (pole <em>Category</em> v metadátach).</p>
      <p>Kontrola prebehne okamžite a nevyžaduje internetové pripojenie — vyhodnocuje sa lokálne priamo v prehliadači.</p>
      <h3>Ako kontrola funguje</h3>
      <ul>
        <li>Spočíta sa frekvencia každej témy (Topic) v balíku.</li>
        <li>Dominantná téma (najčastejšia) sa považuje za referenčnú.</li>
        <li>Slová s témou, ktorá sa vyskytuje iba raz alebo nesúvisí s kategóriou balíka, sú označené ako <em>potenciálne nekonzistentné</em>.</li>
      </ul>
      <Table rows={[
        ["Zelený riadok",   "Téma zodpovedá referenčnej / dominantnej téme balíka"],
        ["Oranžový riadok", "Téma je neobvyklá alebo sa vyskytuje iba raz — treba skontrolovať"],
      ]} />
      <p>Každý riadok výsledku obsahuje tlačidlo <strong>Prejsť</strong>, ktoré zatvorí dialóg a vyberie príslušný riadok v gride.</p>

      <h3>Konzistencia úrovní (CEFR)</h3>
      <p>Overuje, či sú všetky slová v stĺpci <strong>Word</strong> na rovnakej jazykovej úrovni, akú deklaruje balík (pole <em>Úroveň</em> v metadátach). Využíva AI — pre spustenie je potrebné internetové pripojenie a platný OpenAI kľúč na serveri.</p>
      <h3>Ako kontrola funguje</h3>
      <ul>
        <li>Slová sa posielajú AI v dávkach (30 slov naraz). Priebeh je zobrazený progress ukazovateľom.</li>
        <li>AI pre každé slovo odhadne jeho CEFR úroveň a porovná ju s úrovňou priradenou v stĺpci <em>Level</em>.</li>
        <li>Výsledok rozdelí slová do skupín: <em>príliš ľahké</em> (pod úrovňou balíka) a <em>príliš ťažké</em> (nad úrovňou balíka).</li>
      </ul>
      <Table rows={[
        ["Príliš ľahké", "AI odhaduje nižšiu úroveň — slovo je pravdepodobne pod úrovňou balíka"],
        ["Príliš ťažké", "AI odhaduje vyššiu úroveň — slovo je pravdepodobne nad úrovňou balíka"],
      ]} />
      <p>Pri každom slove je zobrazená pridelená úroveň, AI odhad, a stručná poznámka. Tlačidlo <strong>Použiť B2</strong> (alebo príslušná úroveň) zapíše AI odhad priamo do stĺpca <em>Level</em> a riadok zmizne zo zoznamu — dialóg zostáva otvorený, takže môžete opraviť všetky návrhy naraz.</p>

      <h3>Detektor duplicitných významov</h3>
      <p>Hľadá slová v balíku, ktoré majú rovnaký alebo veľmi podobný sémantický význam — teda skutočné synonymá alebo kvázi-synonymá, ktoré by mohli mätúť študenta. Využíva AI a nevyžaduje batchovanie — celý balík sa posiela v jedinom dopyte.</p>
      <h3>Ako kontrola funguje</h3>
      <ul>
        <li>AI dostane zoznam všetkých slov s prekladmi a porovná ich navzájom.</li>
        <li>Slová so zásadne prekrývajúcim sa významom sú zoskupené. Každá skupina má stručné vysvetlenie od AI (napr. <em>"Both mean 'to start something'"</em>).</li>
        <li>Za duplikát sa nepovažujú slová, ktoré sú príbuzné, ale v bežnom použití zreteľne odlišné (napr. <em>see / look / watch</em>).</li>
      </ul>
      <Table rows={[
        ["Skupina N",    "Zoskupené synonymá — AI uvádza dôvod podobnosti"],
        ["Tlačidlo Prejsť", "Naviguje na vybrané slovo v gride a zatvorí dialóg"],
      ]} />
      <p>Dialóg neupravuje dáta automaticky — rozhodnutie, ktoré slovo odstrániť alebo prepracovať, zostáva na editorovi.</p>

      <h3>Kontrola kvality príkladov (Example EN)</h3>
      <p>Hodnotí kvalitu viet v stĺpci <strong>Example EN</strong> — či veta naozaj ilustruje význam slova, alebo je príliš generická či triviálna. Využíva AI, posiela dávky po 15 vetách.</p>
      <h3>Ako kontrola funguje</h3>
      <ul>
        <li>AI ohodnotí každú vetu jednou zo troch známok: <strong>OK</strong>, <strong>Generické</strong> alebo <strong>Slabé</strong>.</li>
        <li><em>Generická</em> veta je vágna a mohla by platiť pre akékoľvek slovo (napr. <em>"This word is very important."</em>).</li>
        <li><em>Slabá</em> veta je príliš krátka, triviálna alebo nedemonštruje význam slova v reálnom kontexte.</li>
        <li>Pre každú problematickú vetu AI navrhne lepšiu alternatívu.</li>
      </ul>
      <Table rows={[
        ["OK",         "Veta dobre ilustruje slovo v prirodzenom kontexte"],
        ["Generické",  "Veta je vágna — neviaže sa konkrétne na dané slovo"],
        ["Slabé",      "Veta je príliš jednoduchá alebo nič nehovorí o význame slova"],
      ]} />
      <p>Tlačidlo <strong>Použiť</strong> nahradí aktuálnu vetu AI návrhom priamo v balíku — dialóg zostáva otvorený pre ďalšie opravy.</p>

      <h3>Trusted Source Assistant</h3>
      <p>Odporučí najvhodnejšie slovníky a referenčné zdroje pre konkrétne slovo na základe kontextu balíka — jeho kategórie, jazykovej úrovne a susediacich slov. Využíva AI, nevyžaduje batchovanie.</p>
      <h3>Ako funkcia funguje</h3>
      <ul>
        <li>AI dostane: cieľové slovo, kategóriu a úroveň balíka a zoznam ostatných slov v balíku ako kontext.</li>
        <li>Vráti <strong>sémantické zúženie</strong> — presný kontextuálny význam slova v rámci danej tematiky (napr. pre <em>orbit</em> v astronomickom balíku: <em>„pohyb objektu po eliptickej dráhe okolo nebeského telesa"</em>).</li>
        <li>Vráti zoznam <strong>odporúčaných zdrojov</strong> s odôvodnením — napr. Cambridge Dictionary pre učiacich sa, NASA Glossary pre astronomické termíny.</li>
      </ul>
      <Table rows={[
        ["Sémantický kontext", "Presný význam slova zúžený na tematiku balíka a susediace slová"],
        ["Odporúčané zdroje",  "3–5 zdrojov vybraných podľa úrovne a domény — každý otvoriteľný kliknutím"],
      ]} />
      <h3>Interaktívny režim</h3>
      <p>Dialog sa otvorí predvyplnený slovom z aktuálneho riadku v gride. Slovo je možné zmeniť v inpute a analýzu spustiť znova bez zatvárania dialógu — vhodné na rýchle porovnanie viacerých slov. Linky na zdroje sú generované bezpečne na klientovi z pevnej mapy — AI vracia len kľúče, nie URL.</p>
    </Section>
  ),

  bookmarks: (
    <Section title="Bookmarky">
      <p>Bookmarky umožňujú označiť dôležité riadky a pridať k nim poznámku. Sú uložené lokálne v prehliadači pre každý balík zvlášť.</p>
      <h3>Pridanie bookmarku</h3>
      <ul>
        <li>Stlačte <Kbd>Ctrl + B</Kbd> na riadku s kurzorom.</li>
        <li>Kliknite na tlačidlo <strong>Bookmark</strong> v paneli nástrojov nad gridom.</li>
        <li>Kliknite pravým tlačidlom myši na riadok → <strong>Pridať bookmark</strong>.</li>
      </ul>
      <p>Zobrazí sa dialóg kde môžete zadať volitelnú poznámku. Potvrďte tlačidlom <strong>Pridať</strong>.</p>
      <h3>Zobrazenie bookmarkov</h3>
      <ul>
        <li>Riadky s bookmarkom sú označené zelenou zástavkou <strong>⚑</strong> vedľa výberového checkboxu.</li>
        <li>V pravom paneli <strong>Preview</strong> sa automaticky zobrazí zoznam všetkých bookmarkov aktuálneho balíka.</li>
      </ul>
      <h3>Navigácia</h3>
      <Table rows={[
        ["Tlačidlo ◀ Prev", "Prejde na predchádzajúci bookmark"],
        ["Tlačidlo ▶ Next", "Prejde na nasledujúci bookmark"],
      ]} />
      <h3>Úprava a odstránenie</h3>
      <p>Kliknite na tlačidlo <strong>✎</strong> vedľa záznamu v zozname bookmarkov (v Preview paneli) alebo znova stlačte <Kbd>Ctrl + B</Kbd> na riadku s existujúcim bookmarkom. V dialógu môžete zmeniť poznámku alebo bookmark odstrániť tlačidlom <strong>Odstrániť</strong>.</p>
    </Section>
  ),

  settings: (
    <Section title="Nastavenia aplikácie">
      <p>Nastavenia sú dostupné cez ľavý panel → <strong>Nastavenia</strong>. Zmeny sa ukladajú automaticky.</p>
      <h3>Editor</h3>
      <Table rows={[
        ["Automatické ukladanie", "Interval automatického ukladania balíka na server (vypnuté / 1 – 15 minút). Nezávisle od toho prebieha zálohovanie do localStorage každých 300 ms."],
      ]} />
      <h3>Publikovanie</h3>
      <Table rows={[
        ["Cesta pre publikovanie", "Adresár na serveri, do ktorého sa kopírujú balíky pri publikovaní. Kliknite na 📁 pre výber adresára."],
      ]} />
      <h3>Archív</h3>
      <Table rows={[
        ["Cesta pre archív", "Adresár pre archivované (zastarané) balíky. Kliknite na 📁 pre výber adresára."],
      ]} />
      <h3>Export</h3>
      <Table rows={[
        ["Oddeľovač pre CSV", "Znak používaný ako oddeľovač stĺpcov pri exporte do CSV formátu. Predvolená hodnota je čiarka (,). Bežné možnosti: čiarka, bodkočiarka, tabulátor, zvislá čiara. Môžete zadať aj vlastný znak."],
      ]} />
      <h3>Vzhľad</h3>
      <Table rows={[
        ["Téma",   "Farebná téma celej aplikácie. Dostupné témy: Dark, Dark Blue, Solarized, Monokai, Light."],
        ["Jazyk",  "Jazyk používateľského rozhrania (Slovenčina / English)."],
      ]} />
    </Section>
  ),

  symbols: (
    <Section title="Symbols — mapa znakov">
      <p>Tlačidlo <strong>Symbols</strong> (alebo skratka v paneli nástrojov) otvorí mapu špeciálnych znakov pre vkladanie do textových polí.</p>
      <h3>Podmienka aktivácie</h3>
      <p>Tlačidlo <strong>Symbols</strong> je aktívne iba vtedy, keď je kurzor umiestnený v niektorom textovom poli (bunka gridu, pole metadát a pod.). Kliknite najprv do poľa, potom otvorte Symbols.</p>
      <h3>Kategórie znakov</h3>
      <Table rows={[
        ["IPA samohlásky",      "Medzinárodná fonetická abeceda — samohlásky"],
        ["IPA spoluhlásky",     "Medzinárodná fonetická abeceda — spoluhlásky"],
        ["IPA suprasegmentálne","Prízvuk, dĺžka, tón a ďalšie prozodické znaky"],
        ["Diakritika",          "Písmená s diakritikou z európskych jazykov"],
        ["Interpunkcia",        "Špeciálne interpunkčné znaky (úvodzovky, pomlčky…)"],
        ["Matematika",          "Matematické symboly vrátane promile (‰)"],
        ["Šípky",               "Rôzne typy šípok"],
      ]} />
      <h3>Vloženie znaku</h3>
      <p>Kliknite na požadovaný znak — vloží sa priamo na pozíciu kurzora v aktívnom textovom poli bez straty fokusu.</p>
    </Section>
  ),
};

export default function HelpDialog({ open, onClose }) {
  const [activeId, setActiveId] = useState("basics");

  if (!open) return null;

  return (
    <div className="help-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="help-dialog">

        {/* HEADER */}
        <div className="help-header">
          <span className="help-title">Pomoc — LexiPack</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="help-print" onClick={() => window.print()}>🖨 Tlačiť</button>
            <button className="help-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="help-body">
          {/* SIDEBAR */}
          <nav className="help-nav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`help-nav-item ${activeId === s.id ? "active" : ""}`}
                onClick={() => setActiveId(s.id)}
              >
                {s.title}
              </button>
            ))}
          </nav>

          {/* CONTENT */}
          <div className="help-content">
            {CONTENT[activeId]}
          </div>
        </div>

        {/* PRINT VIEW — skryté v UI, viditeľné len pri tlači */}
        <div className="help-print-all">
          <h1 className="help-print-title">LexiPack — Návod na použitie</h1>
          {SECTIONS.map((s) => (
            <div key={s.id} className="help-print-section">
              {CONTENT[s.id]}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
