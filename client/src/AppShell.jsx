import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import "./AppShell.css";
import ProjectsScreen from "./screens/ProjectsScreen";
import EditorScreen from "./screens/EditorScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LoginScreen from "./screens/LoginScreen";
import UsersScreen from "./screens/UsersScreen";
import UserMenu from "./components/UserMenu";
import NotificationBell from "./components/NotificationBell";
import { useAuth } from "./context/AuthContext";
import { useT } from "./i18n";

export default function AppShell() {
  const { user } = useAuth();
  const t = useT();
  const [activeScreen, setActiveScreen] = useState("projects");
  const [activePack, setActivePack] = useState(null);
  const [packFilter, setPackFilter]       = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [langFilter, setLangFilter]       = useState("");
  const [themeFilter, setThemeFilter]       = useState("");
  const [packCategories, setPackCategories] = useState([]);
  const [levelFilter, setLevelFilter]       = useState("");
  const [quickFilter, setQuickFilter]       = useState("");

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-title">LexiPack</div>
        <div className="app-header-right">
          <NotificationBell hasNotification={false} />
          <UserMenu />
        </div>
      </header>

      {/* BODY */}
      <div className="app-body">
        {/* LEFT SIDEBAR */}
        <Sidebar
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
        />

        {/* MAIN CONTENT */}
        <main className="app-main">
          {activeScreen === "projects" && (
            <ProjectsScreen
              setActiveScreen={setActiveScreen}
              setActivePack={setActivePack}
              filter={packFilter}
              statusFilter={statusFilter}
              langFilter={langFilter}
              themeFilter={themeFilter}
              onCategoriesLoaded={setPackCategories}
              levelFilter={levelFilter}
            />
          )}
          {activeScreen === "editor" && (
            <EditorScreen activePack={activePack} quickFilter={quickFilter} setQuickFilter={setQuickFilter} />
          )}
          {activeScreen === "settings" && <SettingsScreen />}
          {activeScreen === "users"    && <UsersScreen />}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="app-footer">
        <div>{t("footer.copy")}</div>
        <div>{t("footer.version")}</div>
      </footer>
    </div>
  );
}
