const en = {
  // ── Navigation ────────────────────────────────────
  nav: {
    projects: "Projects",
    editor:   "Editor",
    settings: "Settings",
    users:    "Users",
  },

  // ── Filters (sidebar) ─────────────────────────────
  filters: {
    filter:      "Filter",
    placeholder: "Search pack...",
    status:      "Status",
    language:    "Language",
    level:       "Level",
    theme:       "Theme",
    all:         "— All —",
    unspecified: "Unspecified",
  },

  // ── Common ────────────────────────────────────────
  common: {
    save:       "Save",
    saving:     "Saving...",
    cancel:     "Cancel",
    back:       "← Back",
    close:      "Close",
    confirm:    "Confirm",
    delete:     "Delete",
    deleting:   "Deleting...",
    edit:       "Edit",
    create:     "Create",
    creating:   "Creating...",
    loading:    "Loading...",
    activate:   "Activate",
    deactivate: "Deactivate",
    yes:        "Yes",
    no:         "No",
    irreversible: "This action is irreversible.",
  },

  // ── Login ──────────────────────────────────────────
  login: {
    subtitle:    "Vocabulary Editor",
    username:    "Username",
    password:    "Password",
    submit:      "Sign in",
    submitting:  "Signing in...",
    forgotLink:  "Forgot password",
    forgotTitle: "Password recovery",
    forgotDesc:  "Enter your email address. If an account exists, you will receive a temporary password.",
    forgotEmail: "Email address",
    forgotSubmit:"Send",
    forgotSending:"Sending...",
    forgotDone:  "If an account with this address exists, an email with a temporary password has been sent.",
    backToLogin: "← Back to login",
  },

  // ── User menu ─────────────────────────────────────
  userMenu: {
    shortcuts: "⌨ Keyboard Shortcuts",
    help:      "? Help",
    logout:    "⏻ Sign out",
  },

  // ── Keyboard shortcuts ────────────────────────────
  shortcuts: {
    title: "Keyboard Shortcuts",
    close: "Close",
    groups: {
      rows:    "Editor — rows",
      ai:      "Editor — AI",
      other:   "Editor — other",
      cell:    "Cell — context menu",
    },
    labels: {
      addRow:        "Add row",
      deleteSelected:"Delete selected",
      duplicate:     "Duplicate",
      duplicateEdit: "Duplicate & edit",
      moveRow:       "Move row",
      aiGenerate:    "AI generate row",
      aiBulk:        "Bulk AI generate",
      aiClear:       "Clear generated fields",
      undo:          "Undo",
      redo:          "Redo",
      save:          "Save pack",
      search:        "Quick search",
      closeDialog:   "Close dialog",
      showShortcuts: "Show shortcuts",
      copyCell:      "Copy cell",
      cutCell:       "Cut cell",
      pasteCell:     "Paste cell",
    },
  },

  // ── Projects ──────────────────────────────────────
  projects: {
    title:       "Project management",
    newProject:  "＋ New Project",
    newPack:     "＋ New Pack",
    saveAs:      "⎘ Save As",
    publish:     "↑ Publish Pack",
    deletePack:  "✕ Delete Pack",
    selectFirst: "Select a pack first",
    meta: {
      languages:   "Languages",
      words:       "Words",
      packName:    "Pack Name",
      description: "Description",
      category:    "Category",
      version:     "Version",
      author:      "Author",
      fileName:    "File Name",
      level:       "Level",
    },
    grid: {
      words:    "Words",
      packName: "Pack Name",
      progress: "Progress",
      status:   "Status",
    },
  },

  // ── New pack (modal) ──────────────────────────────
  newPack: {
    title:           "New pack",
    name:            "Pack name *",
    icon:            "Icon",
    fileName:        "Storage file name",
    description:     "Description",
    category:        "Category",
    level:           "Level",
    version:         "Version",
    targetLang:      "Target language",
    nativeLang:      "Native language",
    author:          "Author",
    tags:            "Tags (comma separated)",
    tagsPlaceholder: "science, academic",
    submit:          "Create pack",
    submitting:      "Creating...",
  },

  // ── Save As (modal) ───────────────────────────────
  saveAs: {
    title:         "Save pack as…",
    source:        "Source pack",
    newName:       "New name *",
    fileName:      "Storage file name",
    confirmText:   (source, name) => `Are you sure you want to save a copy of\n"${source}"\nunder the new name\n"${name}" ?`,
    submit:        "Save",
    submitConfirm: "✓ Save copy",
    saving:        "Saving...",
  },

  // ── Delete Pack (modal) ───────────────────────────
  deletePack: {
    title:       "Delete pack",
    confirmText: (name) => `Are you sure you want to permanently delete the pack\n"${name}" ?`,
    submit:      "✕ Delete",
    deleting:    "Deleting...",
  },

  // ── Users ─────────────────────────────────────────
  users: {
    title:           "User management",
    newUser:         "+ New user",
    loading:         "Loading...",
    editTitle:       (name) => `Edit: ${name}`,
    newTitle:        "New user",
    username:        "Username *",
    email:           "E-mail",
    passwordNew:     "New password (leave empty = no change)",
    passwordReq:     "Password *",
    role:            "Role",
    status:          "Status",
    active:          "Active",
    inactive:        "Inactive",
    sendEmail:       "Send registration email",
    sendEmailNote:   "An email with login credentials will be sent to the provided address.",
    sendEmailNoAddr: "Enter an email address to send the registration email.",
    emailSent:       "Registration email has been sent.",
    emailFailed:     "Account created, but the email could not be sent.",
    table: {
      id:        "#",
      username:  "User",
      email:     "E-mail",
      role:      "Role",
      status:    "Status",
      lastLogin: "Last login",
      createdAt: "Created",
      actions:   "Actions",
    },
  },

  // ── Settings ──────────────────────────────────────
  settings: {
    title:             "Settings",
    sectionEditor:     "Editor",
    sectionAppearance: "Appearance & language",
    autoSave: {
      label: "Auto-save",
      desc:  "The pack will be automatically saved to the server at the given interval.",
      off:   "Disabled",
      min1:  "every 1 minute",
      min2:  "every 2 minutes",
      min5:  "every 5 minutes",
      min10: "every 10 minutes",
      min15: "every 15 minutes",
    },
    appLanguage:       "Application language",
    appLanguageDesc:   "This setting is saved to the server and applies on all devices.",
    appTheme:          "Theme",
    appThemeDesc:      "Changes the colour scheme of the entire application.",
    loading:           "Loading settings...",
    sectionPublishing: "Publishing",
    publishPath: {
      label: "Publish path",
      desc:  "Server directory where the pack will be copied when published.",
      placeholder: "e.g. /var/www/lexipack/published",
    },
    sectionArchive: "Archive",
    archivePath: {
      label: "Archive path",
      desc:  "Server directory where archived packs will be moved.",
      placeholder: "e.g. /var/www/lexipack/archive",
    },
    themes: {
      dark:        "Dark (default)",
      "dark-blue": "Dark Blue",
      solarized:   "Solarized Dark",
      monokai:     "Monokai",
      light:       "Light",
    },
  },

  // ── Pack statuses ─────────────────────────────────
  packStatus: {
    Draft:      "Draft",
    Complete:   "Complete",
    "In Review":"In Review",
    Approved:   "Approved",
    Published:  "Published",
    Archived:   "Archived",
  },

  // ── Footer ────────────────────────────────────────
  footer: {
    copy:    "LexiLab ©2026 Techdoc",
    version: "LexiPack v1.12",
  },
};

export default en;
