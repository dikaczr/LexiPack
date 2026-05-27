import { useState, useEffect, useRef } from "react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";
import { API_BASE } from "../config";
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

const RECOVERY_INTERVAL_OPTIONS = [1, 2, 5, 10];

const AUTOCORRECT_LOCALES = [
  { code: "sk-SK", lcid: 1051, flag: "🇸🇰", label: "Slovenčina" },
  { code: "cs-CZ", lcid: 1029, flag: "🇨🇿", label: "Čeština" },
  { code: "en-US", lcid: 1033, flag: "🇺🇸", label: "English (US)" },
  { code: "en-GB", lcid: 2057, flag: "🇬🇧", label: "English (UK)" },
  { code: "de-DE", lcid: 1031, flag: "🇩🇪", label: "Deutsch" },
  { code: "fr-FR", lcid: 1036, flag: "🇫🇷", label: "Français" },
  { code: "es-ES", lcid: 3082, flag: "🇪🇸", label: "Español" },
  { code: "it-IT", lcid: 1040, flag: "🇮🇹", label: "Italiano" },
  { code: "pl-PL", lcid: 1045, flag: "🇵🇱", label: "Polski" },
  { code: "hu-HU", lcid: 1038, flag: "🇭🇺", label: "Magyar" },
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
  const { settings, saveSetting, globalSettings, saveGlobalSetting, loading } = useSettings();
  const { user, token } = useAuth();
  const t = useT();

  const wsBase = settings.workspaceBase ?? "";
  const wsDisplay = wsBase && (settings.workspace ?? "").startsWith(wsBase)
    ? (settings.workspace ?? "").slice(wsBase.length).replace(/^[/\\]+/, "")
    : (settings.workspace ?? "");

  function pathBasename(p) {
    if (!p) return "";
    return p.replace(/[/\\]+$/, "").split(/[/\\]/).pop() || p;
  }
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [showDirPicker, setShowDirPicker]             = useState(false);
  const [showArchivePicker, setShowArchivePicker]     = useState(false);

  const [importedLocales, setImportedLocales] = useState([]);
  const [importStatus, setImportStatus]       = useState("");
  const acFileRef = useRef(null);

  const [acPairs, setAcPairs]           = useState([]);
  const [acPairsLoading, setAcPairsLoading] = useState(false);
  const [acPairsDirty, setAcPairsDirty] = useState(false);
  const [acPairsSaving, setAcPairsSaving] = useState(false);
  const [acSaveStatus, setAcSaveStatus] = useState("");
  const [acFilter, setAcFilter]         = useState("");
  const acKeyRef = useRef(0);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/autocorrect/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setImportedLocales)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const locale = settings.autoCorrectLocale ?? "sk-SK";
    setAcPairsLoading(true);
    setAcPairsDirty(false);
    setAcFilter("");
    fetch(`${API_BASE}/api/autocorrect/${locale}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const entries = data?.entries ?? [];
        acKeyRef.current = entries.length;
        setAcPairs(entries.map((e, i) => ({ ...e, _k: i })));
        setAcPairsLoading(false);
      })
      .catch(() => { setAcPairs([]); setAcPairsLoading(false); });
  }, [token, settings.autoCorrectLocale]);

  function updatePair(k, field, value) {
    setAcPairs(prev => prev.map(p => p._k === k ? { ...p, [field]: value } : p));
    setAcPairsDirty(true);
  }

  function deletePair(k) {
    setAcPairs(prev => prev.filter(p => p._k !== k));
    setAcPairsDirty(true);
  }

  function addPair() {
    acKeyRef.current += 1;
    setAcPairs(prev => [...prev, { src: "", trg: "", _k: acKeyRef.current + 100000 }]);
    setAcPairsDirty(true);
  }

  async function savePairs() {
    setAcPairsSaving(true);
    const locale = settings.autoCorrectLocale ?? "sk-SK";
    const entries = acPairs.filter(p => p.src?.trim() && p.trg?.trim()).map(({ src, trg }) => ({ src, trg }));
    try {
      const res = await fetch(`${API_BASE}/api/autocorrect/${locale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAcPairsDirty(false);
      setAcSaveStatus(t("settings.autoCorrect.saved")(data.entryCount));
      setImportedLocales(prev => {
        const exists = prev.some(l => l.languageName === locale);
        if (exists) return prev.map(l => l.languageName === locale ? { ...l, entryCount: data.entryCount } : l);
        return [...prev, { languageName: locale, languageCode: null, entryCount: data.entryCount }];
      });
    } catch {
      setAcSaveStatus(t("settings.autoCorrect.saveError"));
    }
    setAcPairsSaving(false);
    setTimeout(() => setAcSaveStatus(""), 4000);
  }

  async function handleAutoCorrectImport(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportStatus(t("settings.autoCorrect.importing"));
    try {
      const xml = await file.text();
      const res = await fetch(`${API_BASE}/api/autocorrect/import`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Authorization: `Bearer ${token}`,
        },
        body: xml,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportedLocales(prev => {
        const filtered = prev.filter(l => l.languageName !== data.languageName);
        return [...filtered, { languageName: data.languageName, languageCode: data.languageCode, entryCount: data.entryCount }];
      });
      setImportStatus(t("settings.autoCorrect.imported")(data.entryCount));
      saveSetting("autoCorrectLocale", data.languageName);
      // Reload pairs for table if the imported locale matches current selection
      if ((settings.autoCorrectLocale ?? "sk-SK") === data.languageName) {
        fetch(`${API_BASE}/api/autocorrect/${data.languageName}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(d => {
            const entries = d?.entries ?? [];
            acKeyRef.current = entries.length;
            setAcPairs(entries.map((e, i) => ({ ...e, _k: i })));
            setAcPairsDirty(false);
          })
          .catch(() => {});
      }
    } catch (err) {
      setImportStatus(t("settings.autoCorrect.importError"));
    }
    setTimeout(() => setImportStatus(""), 5000);
  }

if (loading) return <div className="settings-screen" style={{ color: "#6b8cae" }}>{t("settings.loading")}</div>;

  return (
    <>
    <div className="settings-scroll-wrap">
    <div className="settings-screen">
      <div className="settings-title">{t("settings.title")}</div>

      <SettingSection title={t("settings.sectionWorkspace")}>
        <SettingRow
          label={t("settings.startup.label")}
          description={t("settings.startup.desc")}
        >
          <div className="setting-radio-group">
            {["auto", "prompt", "never"].map((val) => (
              <label key={val} className="setting-radio-label">
                <input
                  type="radio"
                  name="startupBehavior"
                  value={val}
                  checked={(settings.startupBehavior ?? "prompt") === val}
                  onChange={() => saveSetting("startupBehavior", val)}
                />
                {t(`settings.startup.${val}`)}
              </label>
            ))}
          </div>
        </SettingRow>
        <SettingRow
          label={t("settings.workspace.label")}
          description={t("settings.workspace.desc")}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="setting-input"
              type="text"
              value={wsDisplay}
              placeholder="moj-priecinok"
              readOnly
              style={{ cursor: "default" }}
            />
            <button className="setting-browse-btn" onClick={() => setShowWorkspacePicker(true)} title="Vybrať adresár">
              📁
            </button>
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection title={t("settings.sectionEditor")}>
        <SettingRow
          label={t("settings.autoCorrect.label")}
          description={t("settings.autoCorrect.desc")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={settings.autoCorrectEnabled ?? true}
              onChange={(e) => saveSetting("autoCorrectEnabled", e.target.checked)}
            />
            <select
              className="setting-select"
              value={settings.autoCorrectLocale ?? "sk-SK"}
              disabled={!(settings.autoCorrectEnabled ?? true)}
              onChange={(e) => saveSetting("autoCorrectLocale", e.target.value)}
            >
              {AUTOCORRECT_LOCALES.map((l) => {
                const hasData = importedLocales.some(il => il.languageName === l.code);
                return (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}{hasData ? " ✓" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </SettingRow>
        <SettingRow
          label={t("settings.autoCorrect.twoInitialCaps")}
          description={t("settings.autoCorrect.twoInitialCapsDesc")}
        >
          <input
            type="checkbox"
            className="setting-checkbox"
            checked={settings.correctTwoInitialCaps ?? true}
            disabled={!(settings.autoCorrectEnabled ?? true)}
            onChange={(e) => saveSetting("correctTwoInitialCaps", e.target.checked)}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.autoCorrect.capsLock")}
          description={t("settings.autoCorrect.capsLockDesc")}
        >
          <input
            type="checkbox"
            className="setting-checkbox"
            checked={settings.correctCapsLock ?? true}
            disabled={!(settings.autoCorrectEnabled ?? true)}
            onChange={(e) => saveSetting("correctCapsLock", e.target.checked)}
          />
        </SettingRow>
        <div className="ac-pairs-block">
          <div className="ac-pairs-header">
            <div>
              <div className="setting-label">{t("settings.autoCorrect.pairsTitle")}</div>
              <div className="setting-desc">{t("settings.autoCorrect.pairsDesc")}</div>
            </div>
            <div className="ac-pairs-header-right">
              <input
                className="ac-filter-input"
                type="text"
                placeholder={t("settings.autoCorrect.filterPlaceholder")}
                value={acFilter}
                onChange={e => setAcFilter(e.target.value)}
              />
              <span className="ac-count">
                {acPairs.filter(p => p.src || p.trg).length} {t("settings.autoCorrect.pairsCount")}
              </span>
            </div>
          </div>

          <div className="ac-table-wrap">
            {acPairsLoading ? (
              <div className="ac-empty">{t("settings.autoCorrect.pairsLoading")}</div>
            ) : acPairs.length === 0 ? (
              <div className="ac-empty">{t("settings.autoCorrect.pairsEmpty")}</div>
            ) : (
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>{t("settings.autoCorrect.pairsSrc")}</th>
                    <th className="ac-arrow-col"></th>
                    <th>{t("settings.autoCorrect.pairsTrg")}</th>
                    <th className="ac-del-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {acPairs
                    .filter(p => !acFilter || p.src.includes(acFilter) || p.trg.includes(acFilter))
                    .map(p => (
                      <tr key={p._k}>
                        <td>
                          <input
                            className="ac-cell-input"
                            value={p.src}
                            onChange={e => updatePair(p._k, "src", e.target.value)}
                          />
                        </td>
                        <td className="ac-arrow-col">→</td>
                        <td>
                          <input
                            className="ac-cell-input"
                            value={p.trg}
                            onChange={e => updatePair(p._k, "trg", e.target.value)}
                          />
                        </td>
                        <td className="ac-del-col">
                          <button className="ac-del-btn" onClick={() => deletePair(p._k)} title="Vymazať">×</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="ac-pairs-actions">
            <button className="setting-browse-btn" onClick={addPair}>
              + {t("settings.autoCorrect.pairsAdd")}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {acSaveStatus && <span style={{ fontSize: 12, color: "var(--app-accent)" }}>{acSaveStatus}</span>}
              <button
                className="setting-browse-btn ac-save-btn"
                onClick={savePairs}
                disabled={!acPairsDirty || acPairsSaving}
              >
                {acPairsSaving ? t("settings.autoCorrect.pairsSaving") : t("settings.autoCorrect.pairsSave")}
              </button>
            </div>
          </div>

          <div className="ac-import-row">
            <button
              className="setting-browse-btn"
              disabled={!(settings.autoCorrectEnabled ?? true)}
              onClick={() => acFileRef.current?.click()}
            >
            {t("settings.autoCorrect.importBtn")}
            </button>
            <input
              ref={acFileRef}
              type="file"
              accept=".autoCorrect"
              style={{ display: "none" }}
              onChange={handleAutoCorrectImport}
            />
            {importStatus && (
              <span style={{ fontSize: 12, color: "var(--app-accent)" }}>{importStatus}</span>
            )}
            {importedLocales.length > 0 && (
              <div className="ac-imported-list">
                {importedLocales.map(l => {
                  const meta = AUTOCORRECT_LOCALES.find(x => x.code === l.languageName);
                  return (
                    <span key={l.languageName} className="ac-imported-tag">
                      {meta?.flag ?? "🌐"} {l.languageName} ({l.entryCount})
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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

      <SettingSection title={t("settings.recovery.sectionTitle")}>
        <SettingRow
          label={t("settings.recovery.enableLabel")}
          description={t("settings.recovery.enableDesc")}
        >
          <input
            type="checkbox"
            className="setting-checkbox"
            checked={settings.autosaveEnabled ?? true}
            onChange={(e) => saveSetting("autosaveEnabled", e.target.checked)}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.recovery.intervalLabel")}
          description={t("settings.recovery.intervalDesc")}
        >
          <select
            className="setting-select"
            value={settings.autosaveInterval ?? 2}
            disabled={!(settings.autosaveEnabled ?? true)}
            onChange={(e) => saveSetting("autosaveInterval", Number(e.target.value))}
          >
            {RECOVERY_INTERVAL_OPTIONS.map((min) => (
              <option key={min} value={min}>{t(`settings.recovery.min${min}`)}</option>
            ))}
          </select>
        </SettingRow>
      </SettingSection>

      {user?.role === "admin" && (
        <SettingSection title={t("settings.sectionPublishing")}>
          <div className="settings-server-note">⚠ {t("settings.serverPathNote")}</div>
          <SettingRow
            label={t("settings.publishPath.label")}
            description={t("settings.publishPath.desc")}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="setting-input"
                type="text"
                value={pathBasename(settings.publishPath)}
                placeholder={t("settings.publishPath.placeholder")}
                readOnly
                style={{ cursor: "default" }}
              />
              <button className="setting-browse-btn" onClick={() => setShowDirPicker(true)} title="Vybrať adresár">
                📁
              </button>
            </div>
          </SettingRow>
        </SettingSection>
      )}

      {user?.role === "admin" && (
        <SettingSection title={t("settings.sectionArchive")}>
          <SettingRow
            label={t("settings.archivePath.label")}
            description={t("settings.archivePath.desc")}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="setting-input"
                type="text"
                value={pathBasename(settings.archivePath)}
                placeholder={t("settings.archivePath.placeholder")}
                readOnly
                style={{ cursor: "default" }}
              />
              <button className="setting-browse-btn" onClick={() => setShowArchivePicker(true)} title="Vybrať adresár">
                📁
              </button>
            </div>
          </SettingRow>
        </SettingSection>
      )}

      <SettingSection title={t("settings.sectionExport")}>
        <SettingRow
          label={t("settings.csvDelimiter.label")}
          description={t("settings.csvDelimiter.desc")}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              className="setting-select"
              style={{ minWidth: 140 }}
              value={["," , ";", "\t", "|"].includes(settings.csvDelimiter ?? ",") ? (settings.csvDelimiter ?? ",") : "__custom__"}
              onChange={(e) => {
                if (e.target.value !== "__custom__") saveSetting("csvDelimiter", e.target.value);
              }}
            >
              <option value=",">{t("settings.csvDelimiter.comma")}</option>
              <option value=";">{t("settings.csvDelimiter.semicolon")}</option>
              <option value={"\t"}>{t("settings.csvDelimiter.tab")}</option>
              <option value="|">{t("settings.csvDelimiter.pipe")}</option>
              <option value="__custom__">{t("settings.csvDelimiter.custom")}</option>
            </select>
            <input
              className="setting-input"
              style={{ minWidth: 0, width: 52, textAlign: "center" }}
              maxLength={3}
              value={settings.csvDelimiter ?? ","}
              placeholder=","
              onChange={(e) => saveSetting("csvDelimiter", e.target.value)}
            />
          </div>
        </SettingRow>
      </SettingSection>

      {user?.role === "admin" && (
        <SettingSection title={t("settings.sectionAdmin")}>
          <SettingRow
            label={t("settings.contactEmail.label")}
            description={t("settings.contactEmail.desc")}
          >
            <input
              className="setting-input"
              type="email"
              value={globalSettings.contactEmail ?? ""}
              placeholder="lexico@techdoc.sk"
              onChange={(e) => saveGlobalSetting("contactEmail", e.target.value)}
            />
          </SettingRow>
        </SettingSection>
      )}

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
    </div>

    {showWorkspacePicker && (
      <DirectoryPickerDialog
        initialPath={settings.workspace ?? ""}
        browseBase={`${API_BASE}/api/fs/browse-workspace`}
        mkdirBase={`${API_BASE}/api/fs/mkdir-workspace`}
        onSelect={(path) => { saveSetting("workspace", path); setShowWorkspacePicker(false); }}
        onClose={() => setShowWorkspacePicker(false)}
      />
    )}

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
