const sk = {
  // ── Navigácia ─────────────────────────────────────
  nav: {
    projects: "Projekty",
    editor:   "Editor",
    settings: "Nastavenia",
    users:    "Používatelia",
  },

  // ── Filtre (sidebar) ──────────────────────────────
  filters: {
    filter:      "Filter",
    placeholder: "Hľadať balík...",
    status:      "Status",
    language:    "Jazyk",
    level:       "Úroveň",
    theme:       "Téma",
    all:         "— Všetky —",
    unspecified: "Neuvedené",
  },

  // ── Spoločné ──────────────────────────────────────
  common: {
    save:       "Uložiť",
    saving:     "Ukladám...",
    cancel:     "Zrušiť",
    back:       "← Späť",
    close:      "Zatvoriť",
    confirm:    "Potvrdiť",
    delete:     "Vymazať",
    deleting:   "Mažem...",
    edit:       "Upraviť",
    create:     "Vytvoriť",
    creating:   "Vytváram...",
    loading:    "Načítavam...",
    activate:   "Aktivovať",
    deactivate: "Deaktivovať",
    yes:        "Áno",
    no:         "Nie",
    irreversible: "Táto akcia je nevratná.",
  },

  // ── Login ──────────────────────────────────────────
  login: {
    subtitle:    "Vocabulary Editor",
    username:    "Používateľské meno",
    password:    "Heslo",
    submit:      "Prihlásiť sa",
    submitting:  "Prihlasujem...",
    forgotLink:  "Zabudol som heslo",
    forgotTitle: "Obnova hesla",
    forgotDesc:  "Zadajte vašu e-mailovú adresu. Ak k nej existuje účet, dostanete dočasné heslo.",
    forgotEmail: "E-mailová adresa",
    forgotSubmit:"Odoslať",
    forgotSending:"Odosielam...",
    forgotDone:  "Ak existuje účet s touto adresou, bol zaslaný email s dočasným heslom.",
    backToLogin: "← Späť na prihlásenie",
  },

  // ── User menu ─────────────────────────────────────
  userMenu: {
    shortcuts: "⌨ Klávesové skratky",
    help:      "? Help",
    logout:    "⏻ Odhlásiť sa",
  },

  // ── Klávesové skratky ─────────────────────────────
  shortcuts: {
    title: "Klávesové skratky",
    close: "Zatvoriť",
    groups: {
      rows:    "Editor — riadky",
      ai:      "Editor — AI",
      other:   "Editor — ostatné",
      cell:    "Bunka — kontextové menu",
    },
    labels: {
      addRow:        "Pridať riadok",
      deleteSelected:"Zmazať vybrané",
      duplicate:     "Duplikovať",
      duplicateEdit: "Duplikovať & editovať",
      moveRow:       "Posunúť riadok",
      aiGenerate:    "AI generovanie riadku",
      aiBulk:        "Hromadné AI generovanie",
      aiClear:       "Vymazať generované polia",
      undo:          "Späť (Undo)",
      redo:          "Dopredu (Redo)",
      save:          "Uložiť balík (Save)",
      search:        "Rýchle hľadanie",
      closeDialog:   "Zatvoriť dialóg",
      showShortcuts: "Zobraziť skratky",
      copyCell:      "Kopírovať bunku",
      cutCell:       "Vystrihnúť bunku",
      pasteCell:     "Vložiť do bunky",
    },
  },

  // ── Projekty ──────────────────────────────────────
  projects: {
    title:       "Projektový management",
    newProject:  "＋ New Project",
    newPack:     "＋ Nový Pack",
    saveAs:      "⎘ Save As",
    publish:     "↑ Publish Pack",
    deletePack:  "✕ Delete Pack",
    selectFirst: "Najprv vyber balík",
    meta: {
      languages: "Languages",
      words:     "Words",
      packName:  "Pack Name",
      description:"Description",
      category:  "Category",
      version:   "Version",
      author:    "Author",
      fileName:  "File Name",
      level:     "Level",
    },
    grid: {
      words:    "Words",
      packName: "Pack Name",
      progress: "Progress",
      status:   "Status",
    },
  },

  // ── Nový balík (modál) ────────────────────────────
  newPack: {
    title:        "Nový balík",
    name:         "Názov balíka *",
    icon:         "Ikona",
    fileName:     "Názov súboru na úložisku",
    description:  "Popis",
    category:     "Kategória",
    level:        "Úroveň",
    version:      "Verzia",
    targetLang:   "Cieľový jazyk",
    nativeLang:   "Materinský jazyk",
    author:       "Autor",
    tags:         "Tagy (čiarkou oddelené)",
    tagsPlaceholder: "science, academic",
    submit:       "Vytvoriť balík",
    submitting:   "Vytváram...",
  },

  // ── Save As (modál) ───────────────────────────────
  saveAs: {
    title:       "Uložiť balík ako…",
    source:      "Zdrojový balík",
    newName:     "Nový názov *",
    fileName:    "Názov súboru na úložisku",
    confirmText: (source, name) => `Naozaj chceš uložiť kópiu balíka\n„${source}"\npod novým názvom\n„${name}" ?`,
    submit:      "Uložiť",
    submitConfirm: "✓ Uložiť kópiu",
    saving:      "Ukladám...",
  },

  // ── Delete Pack (modál) ───────────────────────────
  deletePack: {
    title:       "Vymazať balík",
    confirmText: (name) => `Naozaj chceš natrvalo vymazať balík\n„${name}" ?`,
    submit:      "✕ Vymazať",
    deleting:    "Mažem...",
  },

  // ── Používatelia ──────────────────────────────────
  users: {
    title:           "Správa používateľov",
    newUser:         "+ Nový používateľ",
    loading:         "Načítavam...",
    editTitle:       (name) => `Upraviť: ${name}`,
    newTitle:        "Nový používateľ",
    username:        "Používateľské meno *",
    email:           "E-mail",
    passwordNew:     "Nové heslo (nechaj prázdne = bez zmeny)",
    passwordReq:     "Heslo *",
    role:            "Rola",
    status:          "Stav",
    active:          "Aktívny",
    inactive:        "Neaktívny",
    sendEmail:       "Zaslať registračný email",
    sendEmailNote:   "Email s prihlasovacími údajmi bude odoslaný na zadanú adresu.",
    sendEmailNoAddr: "Zadaj e-mailovú adresu pre odoslanie emailu.",
    emailSent:       "Registračný email bol odoslaný.",
    emailFailed:     "Účet bol vytvorený, ale email sa nepodarilo odoslať.",
    table: {
      id:        "#",
      username:  "Používateľ",
      email:     "E-mail",
      role:      "Rola",
      status:    "Stav",
      lastLogin: "Posledné prihlásenie",
      createdAt: "Vytvorený",
      actions:   "Akcie",
    },
  },

  // ── Nastavenia ────────────────────────────────────
  settings: {
    title:          "Nastavenia",
    sectionEditor:  "Editor",
    sectionAppearance: "Vzhľad a jazyk",
    autoSave: {
      label: "Automatické ukladanie",
      desc:  "Balík sa automaticky uloží na server v zadanom intervale.",
      off:   "Vypnuté",
      min1:  "každú 1 minútu",
      min2:  "každé 2 minúty",
      min5:  "každých 5 minút",
      min10: "každých 10 minút",
      min15: "každých 15 minút",
    },
    appLanguage:    "Jazyk aplikácie",
    appLanguageDesc:"Nastavenie sa uloží na server a platí pre všetky zariadenia.",
    appTheme:       "Téma",
    appThemeDesc:   "Zmení farebnú schému celej aplikácie.",
    loading:        "Načítavam nastavenia...",
    sectionPublishing: "Publikovanie",
    publishPath: {
      label: "Cesta pre publikovanie",
      desc:  "Adresár na serveri, do ktorého sa skopíruje balík pri publikovaní.",
      placeholder: "napr. /var/www/lexipack/published",
    },
    sectionArchive: "Archív",
    archivePath: {
      label: "Cesta pre archív",
      desc:  "Adresár na serveri, do ktorého sa presunú archivované balíky.",
      placeholder: "napr. /var/www/lexipack/archive",
    },
    themes: {
      dark:        "Dark — tmavá (štandardná)",
      "dark-blue": "Dark Blue — tmavá modrá",
      solarized:   "Solarized Dark",
      monokai:     "Monokai",
      light:       "Light — svetlá",
    },
  },

  // ── Statusy balíkov ───────────────────────────────
  packStatus: {
    Draft:      "Koncept",
    Complete:   "Kompletný",
    "In Review":"Prebieha audit",
    Approved:   "Schválený",
    Published:  "Publikovaný",
    Archived:   "Archivovaný",
  },

  // ── Footer ────────────────────────────────────────
  footer: {
    copy:    "LexiLab ©2026 Techdoc",
    version: "LexiPack v1.12",
  },
};

export default sk;
