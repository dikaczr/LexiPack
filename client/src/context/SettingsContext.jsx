import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

import { API_BASE } from "../config";
const API = `${API_BASE}/api/settings`;

const DEFAULTS = {
  appLang:              "sk",
  appTheme:             "dark",
  autoSaveInterval:     5,
  autosaveEnabled:      true,
  autosaveInterval:     2,
  startupBehavior:      "prompt",
  autoCorrectEnabled:      true,
  autoCorrectLocale:       "sk-SK",
  correctTwoInitialCaps:   true,
  correctCapsLock:         true,
};

export function SettingsProvider({ children }) {
  const { user, token } = useAuth();
  const [settings, setSettings]           = useState(DEFAULTS);
  const [globalSettings, setGlobalSettings] = useState({});
  const [loading, setLoading]             = useState(false);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [settingsRes, defaultsRes, globalRes] = await Promise.all([
        fetch(API,               { headers: h }),
        fetch(`${API}/defaults`, { headers: h }),
        fetch(`${API}/global`,   { headers: h }),
      ]);
      const data     = settingsRes.ok ? await settingsRes.json() : {};
      const computed = defaultsRes.ok ? await defaultsRes.json() : {};
      const global   = globalRes.ok   ? await globalRes.json()   : {};
      setSettings({ ...DEFAULTS, ...computed, ...data });
      setGlobalSettings(global);
    } catch {
      // fallback na defaults
    } finally {
      setLoading(false);
    }
  }, [token]);

  // načítaj nastavenia po prihlásení
  useEffect(() => {
    if (user) loadSettings();
    else setSettings(DEFAULTS);
  }, [user, loadSettings]);

  // aplikuj tému na <html data-theme="...">
  useEffect(() => {
    document.documentElement.dataset.theme = settings.appTheme ?? "dark";
  }, [settings.appTheme]);

  const saveSetting = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await fetch(API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error("Settings save failed:", err);
    }
  }, [token]);

  const saveGlobalSetting = useCallback(async (key, value) => {
    setGlobalSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await fetch(`${API}/global`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error("Global settings save failed:", err);
    }
  }, [token]);

  return (
    <SettingsContext.Provider value={{ settings, saveSetting, globalSettings, saveGlobalSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
