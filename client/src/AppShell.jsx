import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./components/layout/Sidebar";
import HelpDialog from "./components/HelpDialog";
import "./AppShell.css";
import ProjectsScreen from "./screens/ProjectsScreen";
import EditorScreen from "./screens/EditorScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LoginScreen from "./screens/LoginScreen";
import UsersScreen from "./screens/UsersScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import UserMenu from "./components/UserMenu";
import NotificationBell from "./components/NotificationBell";
import { useAuth } from "./context/AuthContext";
import { useSettings } from "./context/SettingsContext";
import { useT } from "./i18n";
import { buildLookup } from "./utils/autoCorrect";
import { API_BASE } from "./config";

const LANG_TO_LOCALE = {
  sk: ["sk-SK"],
  cs: ["cs-CZ"],
  de: ["de-DE"],
  fr: ["fr-FR"],
  es: ["es-ES"],
  it: ["it-IT"],
  pl: ["pl-PL"],
  hu: ["hu-HU"],
  en: ["en-US", "en-GB"],
};

const LAST_PACK_KEY = "lexipack_last_pack";

export default function AppShell() {
  const { user, token } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const [autoCorrectLookup, setAutoCorrectLookup] = useState(null);
  const [autoCorrectNativeLookup, setAutoCorrectNativeLookup] = useState(null);
  const [packTargetLang, setPackTargetLang] = useState(null);
  const [packNativeLang, setPackNativeLang] = useState(null);
  const [acNotice, setAcNotice] = useState("");
  const acNoticeTimer = useRef(null);
  const t = useT();
  const [activeScreen, setActiveScreen] = useState("projects");
  const [activePack, setActivePack] = useState(null);
  const [startupPrompt, setStartupPrompt] = useState(null);
  const startupHandledRef = useRef(false);

  function handleSetActivePack(pack) {
    setActivePack(pack);
    if (pack?.fileName) {
      localStorage.setItem(LAST_PACK_KEY, JSON.stringify({
        fileName: pack.fileName,
        packDbId: pack.packDbId ?? null,
        name:     pack.name || pack.fileName,
        status:   pack.status ?? null,
      }));
    }
  }

  useEffect(() => {
    if (!user || settingsLoading || startupHandledRef.current) return;
    startupHandledRef.current = true;
    const behavior = settings.startupBehavior ?? "prompt";
    if (behavior === "never") return;
    try {
      const raw = localStorage.getItem(LAST_PACK_KEY);
      if (!raw) return;
      const lastPack = JSON.parse(raw);
      if (!lastPack?.fileName) return;
      if (behavior === "auto") {
        handleSetActivePack(lastPack);
        setActiveScreen("editor");
      } else {
        setStartupPrompt(lastPack);
      }
    } catch {}
  }, [user, settingsLoading, settings.startupBehavior]);

  useEffect(() => {
    if (!token || settingsLoading || !(settings.autoCorrectEnabled ?? true)) {
      setAutoCorrectLookup(null);
      return;
    }

    function fetchLocale(locale) {
      return fetch(`${API_BASE}/api/autocorrect/${locale}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : null).catch(() => null);
    }

    function showNotice(msg) {
      clearTimeout(acNoticeTimer.current);
      setAcNotice(msg);
      acNoticeTimer.current = setTimeout(() => setAcNotice(""), 5000);
    }

    async function loadLookup(lang) {
      if (!lang) return null;
      const locales = LANG_TO_LOCALE[lang] ?? [];
      for (const locale of locales) {
        const data = await fetchLocale(locale);
        if (data?.entries?.length) return buildLookup(data.entries);
      }
      return null;
    }

    async function load() {
      // Target language autocorrect
      let targetLookup = await loadLookup(packTargetLang);
      if (!targetLookup && packTargetLang) {
        showNotice(t("editor.autoCorrectLangNotFound")(packTargetLang));
      }
      if (!targetLookup) {
        const fallback = settings.autoCorrectLocale ?? "sk-SK";
        const data = await fetchLocale(fallback);
        targetLookup = data?.entries?.length ? buildLookup(data.entries) : null;
      }
      setAutoCorrectLookup(targetLookup);

      // Native language autocorrect (zvyčajne SK)
      const nativeLookup = await loadLookup(packNativeLang);
      setAutoCorrectNativeLookup(nativeLookup);
    }

    load();
  }, [token, settingsLoading, settings.autoCorrectEnabled, settings.autoCorrectLocale, packTargetLang, packNativeLang]);

  const [packFilter, setPackFilter]       = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [langFilter, setLangFilter]       = useState("");
  const [themeFilter, setThemeFilter]       = useState("");
  const [packCategories, setPackCategories] = useState([]);
  const [levelFilter, setLevelFilter]       = useState("");
  const [quickFilter, setQuickFilter]       = useState("");
  const [committedFilter, setCommittedFilter] = useState("");
  const quickFilterRef                      = useRef(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Systémové notifikácie (server down/up, lokálne udalosti)
  const [sysNotifications, setSysNotifications] = useState([]);
  // Interné notifikácie zo servera (medzi usermi)
  const [internalNotifs, setInternalNotifs] = useState([]);
  const serverDownRef = useRef(false);
  const [serverToast, setServerToast] = useState(null); // "down" | "up" | null
  const [notifToast, setNotifToast] = useState(null);
  const lastNotifIdRef = useRef(0);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (serverDownRef.current) {
          serverDownRef.current = false;
          const time = new Date().toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
          setSysNotifications(prev => [{ title: "Server obnovený", icon: "✅", time }, ...prev].slice(0, 20));
          setServerToast("up");
          setTimeout(() => setServerToast(null), 3600);
        }
      } catch {
        if (!serverDownRef.current) {
          serverDownRef.current = true;
          const time = new Date().toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
          setSysNotifications(prev => [{ title: "Server nedostupný!", icon: "🔴", time }, ...prev].slice(0, 20));
        }
        setServerToast("down");
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Polling interných notifikácií zo servera
  const fetchNotifs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { notifications } = await res.json();
      const maxId = notifications.reduce((m, n) => Math.max(m, n.id), 0);
      if (lastNotifIdRef.current > 0 && maxId > lastNotifIdRef.current) {
        const newest = notifications.find(n => n.id === maxId);
        const from = newest?.from_name || newest?.from_username || "Niekto";
        setNotifToast(`📩 Nová správa od ${from}`);
        setTimeout(() => setNotifToast(null), 4000);
      }
      lastNotifIdRef.current = maxId;
      setInternalNotifs(notifications);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const addNotification = useCallback((title, icon = "📦") => {
    const time = new Date().toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
    setSysNotifications(prev => [{ title, icon, time }, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "F1") { e.preventDefault(); setShowHelp(true); }
      if (e.key === "F2") { e.preventDefault(); setShowShortcuts(true); }
      if (e.key === "Escape") { setShowHelp(false); setShowShortcuts(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-title">LexiPack</div>
        <div className="app-header-right">
          <NotificationBell
            token={token}
            userRole={user?.role}
            sysNotifications={sysNotifications}
            internalNotifs={internalNotifs}
            onClearSys={() => setSysNotifications([])}
            onMarkRead={(id) => {
              fetch(`${API_BASE}/api/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
              });
              setInternalNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            }}
            onMarkAllRead={() => {
              fetch(`${API_BASE}/api/notifications/read-all`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
              });
              setInternalNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
            }}
            onDeleteInternal={(id) => {
              fetch(`${API_BASE}/api/notifications/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              setInternalNotifs(prev => prev.filter(n => n.id !== id));
            }}
            onNewNotifSent={fetchNotifs}
          />
          <UserMenu onNavigate={setActiveScreen} />
        </div>
      </header>

      {/* BODY */}
      <div className="app-body">
        {/* LEFT SIDEBAR */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          packFilter={packFilter}
          setPackFilter={setPackFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          langFilter={langFilter}
          setLangFilter={setLangFilter}
          themeFilter={themeFilter}
          setThemeFilter={setThemeFilter}
          packCategories={packCategories}
          levelFilter={levelFilter}
          setLevelFilter={setLevelFilter}
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          quickFilterRef={quickFilterRef}
          onSearchEnter={(val) => setCommittedFilter(val !== undefined ? val : quickFilter)}
        />

        {/* MAIN CONTENT */}
        <main className={`app-main${activeScreen === "editor" ? "" : " app-main--scroll"}`}
              style={activeScreen === "editor" ? { padding: "10px" } : {}}>
          {activeScreen === "projects" && (
            <>
            {startupPrompt && (
              <div className="startup-banner">
                <span>{t("settings.startup.banner")(startupPrompt.name)}</span>
                <button className="startup-banner-btn startup-banner-open" onClick={() => {
                  handleSetActivePack(startupPrompt);
                  setActiveScreen("editor");
                  setStartupPrompt(null);
                }}>
                  {t("settings.startup.open")}
                </button>
                <button className="startup-banner-btn startup-banner-dismiss" onClick={() => setStartupPrompt(null)}>
                  {t("settings.startup.dismiss")}
                </button>
              </div>
            )}
            <ProjectsScreen
              setActiveScreen={setActiveScreen}
              setActivePack={handleSetActivePack}
              filter={packFilter}
              statusFilter={statusFilter}
              langFilter={langFilter}
              themeFilter={themeFilter}
              onCategoriesLoaded={setPackCategories}
              levelFilter={levelFilter}
              onNotification={addNotification}
            />
            </>
          )}
          {activeScreen === "editor" && (
            <EditorScreen activePack={activePack} quickFilter={quickFilter} setQuickFilter={setQuickFilter} quickFilterRef={quickFilterRef} committedFilter={committedFilter} setCommittedFilter={setCommittedFilter} autoCorrectLookup={autoCorrectLookup} autoCorrectNativeLookup={autoCorrectNativeLookup} onTargetLangDetected={setPackTargetLang} onNativeLangDetected={setPackNativeLang} />
          )}
          {activeScreen === "analytics" && <AnalyticsScreen />}
          {activeScreen === "settings" && <SettingsScreen />}
          {activeScreen === "users"    && <UsersScreen />}
        </main>
      </div>

      {serverToast === "down" && (
        <div className="server-toast server-toast--down">
          🔴 Server nedostupný — zmeny sa neuložia
        </div>
      )}
      {serverToast === "up" && (
        <div className="server-toast server-toast--up">
          ✅ Server obnovený
        </div>
      )}
      {notifToast && (
        <div className="server-toast server-toast--notif">
          {notifToast}
        </div>
      )}

      {acNotice && (
        <div className="ac-notice">
          ⚠ {acNotice}
        </div>
      )}

      <HelpDialog open={showHelp} onClose={() => setShowHelp(false)} targetLang={packTargetLang || "en"} nativeLang={packNativeLang || "sk"} />

      {showShortcuts && (
        <div className="shortcuts-overlay">
          <div className="shortcuts-modal">
            <div className="shortcuts-title">{t("shortcuts.title")}</div>

            <div className="shortcuts-group-title">{t("shortcuts.groups.global")}</div>
            <div className="shortcuts-list">
              <div><b>F1</b>: {t("shortcuts.labels.help")}</div>
              <div><b>F2</b>: {t("shortcuts.labels.showShortcuts")}</div>
              <div><b>Esc</b>: {t("shortcuts.labels.closeDialog")}</div>
            </div>

            <div className="shortcuts-group-title">{t("shortcuts.groups.projects")}</div>
            <div className="shortcuts-list">
              <div><b>Ctrl + N</b>: {t("shortcuts.labels.newPack")}</div>
            </div>

            <div className="shortcuts-group-title">{t("shortcuts.groups.editor")}</div>
            <div className="shortcuts-list">
              <div><b>Ctrl + Z</b>: {t("shortcuts.labels.undo")}</div>
              <div><b>Ctrl + Y</b>: {t("shortcuts.labels.redo")}</div>
              <div><b>Ctrl + D</b>: {t("shortcuts.labels.duplicate")}</div>
              <div><b>Ctrl + Shift + D</b>: {t("shortcuts.labels.duplicateEdit")}</div>
              <div><b>Alt + Insert</b>: {t("shortcuts.labels.addRow")}</div>
              <div><b>Ctrl + ↑</b>: {t("shortcuts.labels.moveRowUp")}</div>
              <div><b>Ctrl + ↓</b>: {t("shortcuts.labels.moveRowDown")}</div>
              <div><b>Delete</b>: {t("shortcuts.labels.deleteSelected")}</div>
              <div><b>Ctrl + Delete</b>: {t("shortcuts.labels.aiClear")}</div>
              <div><b>Ctrl + Enter</b>: {t("shortcuts.labels.aiGenerate")}</div>
              <div><b>Ctrl + Shift + G</b>: {t("shortcuts.labels.aiBulk")}</div>
              <div><b>Ctrl + F</b>: {t("shortcuts.labels.search")}</div>
            </div>

            <div className="shortcuts-group-title">{t("shortcuts.groups.reviewer")}</div>
            <div className="shortcuts-list">
              <div><b>Ctrl + A</b>: {t("shortcuts.labels.approveRow")}</div>
            </div>

            <button onClick={() => setShowShortcuts(false)}>{t("shortcuts.close")}</button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="app-footer">
        <div>{t("footer.copy")}</div>
        <div>{t("footer.version")}</div>
      </footer>
    </div>
  );
}
