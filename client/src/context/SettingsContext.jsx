import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

import { API_BASE } from "../config";
const API = `${API_BASE}/api/settings`;

const DEFAULTS = {
  appLang:          "sk",
  appTheme:         "dark",
  autoSaveInterval: 5,
};

export function SettingsProvider({ children }) {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading]   = useState(false);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULTS, ...data });
      }
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error("Settings save failed:", err);
    }
  }, [token]);

  return (
    <SettingsContext.Provider value={{ settings, saveSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
