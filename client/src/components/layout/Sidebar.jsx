import "./Sidebar.css";
import { useAuth } from "../../context/AuthContext";
import { useT } from "../../i18n";

const STATUSES  = ["Draft", "Complete", "In Review", "Approved", "Published", "Archived"];
const LANGUAGES = [
  { code: "en", label: "EN – English" },
  { code: "sk", label: "SK – Slovenčina" },
  { code: "de", label: "DE – Deutsch" },
  { code: "fr", label: "FR – Français" },
  { code: "es", label: "ES – Español" },
  { code: "it", label: "IT – Italiano" },
  { code: "cs", label: "CS – Čeština" },
  { code: "pl", label: "PL – Polski" },
  { code: "hu", label: "HU – Magyar" },
  { code: "uk", label: "UK – Українська" },
  { code: "ru", label: "RU – Русский" },
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function Sidebar({ activeScreen, setActiveScreen, packFilter, setPackFilter, statusFilter, setStatusFilter, langFilter, setLangFilter, themeFilter, setThemeFilter, packCategories = [], levelFilter, setLevelFilter, quickFilter, setQuickFilter }) {
  const { user } = useAuth();
  const t = useT();

  function btn(screen, label) {
    return (
      <button
        className={activeScreen === screen ? "sidebar-button active" : "sidebar-button"}
        onClick={() => setActiveScreen(screen)}
      >
        {label}
      </button>
    );
  }

  return (
    <aside className="sidebar">
      {activeScreen === "projects" && (
        <>
          <div className="sidebar-filter">
            <label className="sidebar-filter-label">{t("filters.filter")}</label>
            <input
              className="sidebar-filter-input"
              value={packFilter}
              onChange={(e) => setPackFilter(e.target.value)}
              placeholder={t("filters.placeholder")}
            />
          </div>
          <div className="sidebar-filter" style={{ marginTop: "0.1vh" }}>
            <label className="sidebar-filter-label">{t("filters.status")}</label>
            <select
              className="sidebar-filter-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("filters.all")}</option>
              {STATUSES.map(s => <option key={s} value={s}>{t(`packStatus.${s}`)}</option>)}
            </select>
          </div>
          <div className="sidebar-filter" style={{ marginTop: "0.1vh" }}>
            <label className="sidebar-filter-label">{t("filters.language")}</label>
            <select
              className="sidebar-filter-input"
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
            >
              <option value="">{t("filters.all")}</option>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="sidebar-filter" style={{ marginTop: "0.1vh" }}>
            <label className="sidebar-filter-label">{t("filters.level")}</label>
            <select
              className="sidebar-filter-input"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="">{t("filters.all")}</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              <option value="__none__">{t("filters.unspecified")}</option>
            </select>
          </div>
          <div className="sidebar-filter" style={{ marginTop: "0.1vh" }}>
            <label className="sidebar-filter-label">{t("filters.theme")}</label>
            <select
              className="sidebar-filter-input"
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
            >
              <option value="">{t("filters.all")}</option>
              {packCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </>
      )}

      {activeScreen === "editor" && (
        <div className="sidebar-filter sidebar-grid-search">
          <label className="sidebar-filter-label">Search</label>
          <input
            className="sidebar-filter-input"
            value={quickFilter ?? ""}
            onChange={(e) => setQuickFilter(e.target.value)}
            placeholder="..."
          />
          {quickFilter && (
            <button
              className="sidebar-filter-clear"
              onClick={() => setQuickFilter("")}
            >×</button>
          )}
        </div>
      )}

      <nav className="sidebar-nav">
        {btn("projects", t("nav.projects"))}
        {btn("editor",   t("nav.editor"))}
        {btn("settings", t("nav.settings"))}
        {user?.role === "admin" && btn("users", t("nav.users"))}
      </nav>
    </aside>
  );
}
