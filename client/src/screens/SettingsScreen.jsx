import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { useT } from "../i18n";
import DirectoryPickerDialog from "../components/DirectoryPickerDialog";
import "./SettingsScreen.css";

const LANGUAGES = [
  { code: "sk", label: "Slovenčina" },
  { code: "en", label: "English" },
];

const THEMES = ["dark", "dark-blue", "solarized", "monokai", "light"];

const AUTOSAVE_OPTIONS = [
  { value: 0,  label: "settings.autoSave.off" },
  { value: 1,  label: "settings.autoSave.min1" },
  { value: 2,  label: "settings.autoSave.min2" },
  { value: 5,  label: "settings.autoSave.min5" },
  { value: 10, label: "settings.autoSave.min10" },
  { value: 15, label: "settings.autoSave.min15" },
];

function SettingRow({ label, description, children }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <div className="setting-label">{label}</div>
        {description && <div className="setting-desc">{description}</div>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

function SettingSection({ title, children }) {
  return (
    <div className="setting-section">
      <div className="setting-section-title">{title}</div>
      {children}
    </div>
  );
}

export default function SettingsScreen() {
  const { settings, saveSetting, loading } = useSettings();
  const t = useT();
  const [showDirPicker, setShowDirPicker]         = useState(false);
  const [showArchivePicker, setShowArchivePicker] = useState(false);

  if (loading) return <div className="settings-screen" style={{ color: "#6b8cae" }}>{t("settings.loading")}</div>;

  return (
    <>
    <div className="settings-screen">
      <div className="settings-title">{t("settings.title")}</div>

      <SettingSection title={t("settings.sectionEditor")}>
        <SettingRow
          label={t("settings.autoSave.label")}
          description={t("settings.autoSave.desc")}
        >
          <select
            className="setting-select"
            value={settings.autoSaveInterval ?? 5}
            onChange={(e) => saveSetting("autoSaveInterval", Number(e.target.value))}
          >
            {AUTOSAVE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.label)}</option>
            ))}
          </select>
        </SettingRow>
      </SettingSection>

      <SettingSection title={t("settings.sectionPublishing")}>
        <SettingRow
          label={t("settings.publishPath.label")}
          description={t("settings.publishPath.desc")}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="setting-input"
              type="text"
              value={settings.publishPath ?? ""}
              placeholder={t("settings.publishPath.placeholder")}
              onChange={(e) => saveSetting("publishPath", e.target.value)}
            />
            <button className="setting-browse-btn" onClick={() => setShowDirPicker(true)} title="Vybrať adresár">
              📁
            </button>
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection title={t("settings.sectionArchive")}>
        <SettingRow
          label={t("settings.archivePath.label")}
          description={t("settings.archivePath.desc")}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="setting-input"
              type="text"
              value={settings.archivePath ?? ""}
              placeholder={t("settings.archivePath.placeholder")}
              onChange={(e) => saveSetting("archivePath", e.target.value)}
            />
            <button className="setting-browse-btn" onClick={() => setShowArchivePicker(true)} title="Vybrať adresár">
              📁
            </button>
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection title={t("settings.sectionAppearance")}>
        <SettingRow
          label={t("settings.appTheme")}
          description={t("settings.appThemeDesc")}
        >
          <select
            className="setting-select"
            value={settings.appTheme ?? "dark"}
            onChange={(e) => saveSetting("appTheme", e.target.value)}
          >
            {THEMES.map((code) => (
              <option key={code} value={code}>{t(`settings.themes.${code}`)}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow
          label={t("settings.appLanguage")}
          description={t("settings.appLanguageDesc")}
        >
          <select
            className="setting-select"
            value={settings.appLang ?? "sk"}
            onChange={(e) => saveSetting("appLang", e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </SettingRow>
      </SettingSection>
    </div>

    {showDirPicker && (
      <DirectoryPickerDialog
        initialPath={settings.publishPath ?? ""}
        onSelect={(path) => { saveSetting("publishPath", path); setShowDirPicker(false); }}
        onClose={() => setShowDirPicker(false)}
      />
    )}

    {showArchivePicker && (
      <DirectoryPickerDialog
        initialPath={settings.archivePath ?? ""}
        onSelect={(path) => { saveSetting("archivePath", path); setShowArchivePicker(false); }}
        onClose={() => setShowArchivePicker(false)}
      />
    )}
    </>
  );
}
