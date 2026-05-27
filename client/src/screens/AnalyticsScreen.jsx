import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";
import { API_BASE } from "../config";
import "./AnalyticsScreen.css";

const LATENCY_COLORS = {
  AI_GENERATE:      "#4f8ef7",
  AI_FILL_COLUMN:   "#3dba7a",
  AI_SUGGEST_WORDS: "#f7a24f",
};
const LATENCY_LABELS = {
  AI_GENERATE:      "Generate",
  AI_FILL_COLUMN:   "Fill Column",
  AI_SUGGEST_WORDS: "Suggest Words",
};
const LATENCY_ACTIONS = ["AI_GENERATE", "AI_FILL_COLUMN", "AI_SUGGEST_WORDS"];

function LatencyChart({ data }) {
  const W = 560, H = 200;
  const PAD = { top: 16, right: 20, bottom: 36, left: 55 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const days = [...new Set(data.map((d) => d.day))].sort();
  if (days.length === 0) return <p className="analytics-empty">Žiadne dáta</p>;

  const byKey = {};
  for (const row of data) byKey[`${row.action}|${row.day}`] = row.ms_per_token;

  const allVals = data.map((d) => d.ms_per_token).filter(Boolean);
  const maxVal = Math.max(...allVals, 1);

  const xOf = (i) =>
    days.length === 1
      ? PAD.left + innerW / 2
      : PAD.left + (i / (days.length - 1)) * innerW;
  const yOf = (v) => PAD.top + innerH - (v / maxVal) * innerH;

  const Y_TICKS = 4;
  const xStep = Math.ceil(days.length / 6);

  return (
    <div className="analytics-chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="analytics-svg">
        {/* Y grid + labels */}
        {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
          const v = (maxVal * i) / Y_TICKS;
          const y = yOf(v);
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke="var(--app-border, #334155)" strokeWidth="1"
              />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" className="analytics-svg-tick">
                {Math.round(v)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {days.map((day, i) => {
          if (i % xStep !== 0 && i !== days.length - 1) return null;
          return (
            <text
              key={day}
              x={xOf(i)} y={H - PAD.bottom + 16}
              textAnchor="middle" className="analytics-svg-tick"
            >
              {day.slice(5)}
            </text>
          );
        })}

        {/* Lines + dots */}
        {LATENCY_ACTIONS.map((action) => {
          const color = LATENCY_COLORS[action];
          let pathD = "";
          let inLine = false;
          days.forEach((day, i) => {
            const v = byKey[`${action}|${day}`];
            if (v == null) { inLine = false; return; }
            pathD += inLine ? ` L ${xOf(i)} ${yOf(v)}` : `M ${xOf(i)} ${yOf(v)}`;
            inLine = true;
          });
          if (!pathD) return null;
          return (
            <g key={action}>
              <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              {days.map((day, i) => {
                const v = byKey[`${action}|${day}`];
                if (v == null) return null;
                return <circle key={day} cx={xOf(i)} cy={yOf(v)} r="3" fill={color} />;
              })}
            </g>
          );
        })}
      </svg>

      <div className="analytics-legend">
        {LATENCY_ACTIONS.filter((a) => data.some((d) => d.action === a)).map((action) => (
          <span key={action} className="analytics-legend-item">
            <span className="analytics-legend-dot" style={{ background: LATENCY_COLORS[action] }} />
            {LATENCY_LABELS[action]}
          </span>
        ))}
      </div>
    </div>
  );
}

const BEAT_SECONDS = 30;

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function packLabel(fileName) {
  return fileName.replace(/\.json$/, "").replace(/_/g, " ");
}

function packDisplay(fileName, packNames) {
  if (packNames[fileName]) return packNames[fileName];
  const base = fileName.split("/").pop();
  return packNames[base] || packLabel(base || fileName);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const AI_ACTION_LABELS = {
  AI_GENERATE:     "Generate",
  AI_FILL_COLUMN:  "Fill Column",
  AI_SUGGEST_WORDS: "Suggest Words",
};

export default function AnalyticsScreen() {
  const { token } = useAuth();
  const t = useT();
  const [rows, setRows]             = useState(null);
  const [aiRows, setAiRows]         = useState(null);
  const [latencyRows, setLatency]   = useState(null);
  const [corrStats, setCorrStats]   = useState(null);
  const [error, setError]           = useState(null);
  const [packNames, setPackNames]   = useState({});

  useEffect(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    fetch(`${API_BASE}/api/heartbeat/stats?days=30`, { headers: h })
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setError("Nepodarilo sa načítať štatistiky."));

    fetch(`${API_BASE}/api/telemetry/ai?days=30`, { headers: h })
      .then((r) => r.json())
      .then(setAiRows)
      .catch(() => {});

    fetch(`${API_BASE}/api/telemetry/ai/latency?days=14`, { headers: h })
      .then((r) => r.json())
      .then(setLatency)
      .catch(() => {});

    fetch(`${API_BASE}/api/telemetry/ai-correction?days=30`, { headers: h })
      .then((r) => r.json())
      .then(setCorrStats)
      .catch(() => {});

    fetch(`${API_BASE}/api/packs`, { headers: h })
      .then((r) => r.json())
      .then((packs) => {
        const map = {};
        for (const p of packs) if (p.fileName && p.name) map[p.fileName] = p.name;
        setPackNames(map);
      })
      .catch(() => {});
  }, [token]);

  const { todaySeconds, byPack, byDay } = useMemo(() => {
    if (!rows) return { todaySeconds: 0, byPack: [], byDay: [] };

    const today = todayStr();
    let todaySeconds = 0;
    const packMap = {};
    const dayMap = {};

    for (const r of rows) {
      const secs = r.beats * BEAT_SECONDS;
      if (r.day === today) todaySeconds += secs;
      packMap[r.pack_file] = (packMap[r.pack_file] ?? 0) + secs;
      dayMap[r.day]        = (dayMap[r.day]        ?? 0) + secs;
    }

    const byPack = Object.entries(packMap)
      .map(([file, secs]) => ({ file, secs }))
      .sort((a, b) => b.secs - a.secs);

    const byDay = Object.entries(dayMap)
      .map(([day, secs]) => ({ day, secs }))
      .sort((a, b) => b.day.localeCompare(a.day))
      .slice(0, 14);

    return { todaySeconds, byPack, byDay };
  }, [rows]);

  const maxPackSecs = byPack[0]?.secs ?? 1;
  const maxDaySecs  = byDay[0]?.secs  ?? 1;

  const { aiToday, aiByType, aiByPack, aiByDay } = useMemo(() => {
    if (!aiRows) return { aiToday: 0, aiByType: [], aiByPack: [], aiByDay: [] };
    const today = todayStr();
    const typeMap = {}, packMap = {}, dayMap = {};
    let aiToday = 0;
    for (const r of aiRows) {
      if (r.day === today) aiToday += r.cnt;
      typeMap[r.action]    = (typeMap[r.action]    ?? 0) + r.cnt;
      if (r.pack_file) packMap[r.pack_file] = (packMap[r.pack_file] ?? 0) + r.cnt;
      dayMap[r.day]        = (dayMap[r.day]        ?? 0) + r.cnt;
    }
    const aiByType = Object.entries(typeMap).map(([action, cnt]) => ({ action, cnt })).sort((a, b) => b.cnt - a.cnt);
    const aiByPack = Object.entries(packMap).map(([file, cnt]) => ({ file, cnt })).sort((a, b) => b.cnt - a.cnt);
    const aiByDay  = Object.entries(dayMap).map(([day, cnt]) => ({ day, cnt })).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 14);
    return { aiToday, aiByType, aiByPack, aiByDay };
  }, [aiRows]);

  const maxAiPackCnt = aiByPack[0]?.cnt ?? 1;
  const maxAiDayCnt  = aiByDay[0]?.cnt  ?? 1;

  if (error) return <div className="analytics"><p className="analytics-empty">{error}</p></div>;

  return (
    <div className="analytics">
      <h1>{t("analyticsScreen.title")}</h1>

      {/* ── PRODUCTIVITY ANALYTICS ───────────────── */}
      <div className="analytics-group">
        <h2 className="analytics-group-title">{t("analyticsScreen.productivity")}</h2>
        <p className="analytics-subtitle">{t("analyticsScreen.subtitle")}</p>

        <div className="analytics-today">
          <div className="analytics-today-icon">⏱</div>
          <div>
            <div className="analytics-today-label">{t("analyticsScreen.today")}</div>
            <div className="analytics-today-time">
              {rows === null ? "…" : formatDuration(todaySeconds)}
            </div>
          </div>
        </div>

        {rows === null && <div className="analytics-loading">{t("analyticsScreen.loading")}</div>}

        {rows !== null && (
          <>
            <div className="analytics-section">
              <h3>{t("analyticsScreen.timeByPack")}</h3>
              {byPack.length === 0
                ? <p className="analytics-empty">{t("analyticsScreen.noData")}</p>
                : (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>{t("analyticsScreen.colPack")}</th>
                        <th className="analytics-bar-cell"></th>
                        <th className="analytics-time-cell">{t("analyticsScreen.colTime")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byPack.map(({ file, secs }) => (
                        <tr key={file}>
                          <td>{packDisplay(file, packNames)}</td>
                          <td className="analytics-bar-cell">
                            <div className="analytics-bar-wrap">
                              <div className="analytics-bar-fill" style={{ width: `${(secs / maxPackSecs) * 100}%` }} />
                            </div>
                          </td>
                          <td className="analytics-time-cell">{formatDuration(secs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>

            <div className="analytics-section">
              <h3>{t("analyticsScreen.timeByDay")}</h3>
              {byDay.length === 0
                ? <p className="analytics-empty">{t("analyticsScreen.noData")}</p>
                : (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>{t("analyticsScreen.colDate")}</th>
                        <th className="analytics-bar-cell"></th>
                        <th className="analytics-time-cell">{t("analyticsScreen.colTime")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDay.map(({ day, secs }) => (
                        <tr key={day}>
                          <td>{day}</td>
                          <td className="analytics-bar-cell">
                            <div className="analytics-bar-wrap">
                              <div className="analytics-bar-fill" style={{ width: `${(secs / maxDaySecs) * 100}%` }} />
                            </div>
                          </td>
                          <td className="analytics-time-cell">{formatDuration(secs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>

            <div className="analytics-section">
              <h3>{t("analyticsScreen.aiToday")}</h3>
              <div className="analytics-today" style={{ marginBottom: "1rem" }}>
                <div className="analytics-today-icon"><img src={`${import.meta.env.BASE_URL}artificial-intelligence.png`} alt="AI" style={{ width: 48, height: 48, objectFit: "contain" }} /></div>
                <div>
                  <div className="analytics-today-label">{t("analyticsScreen.aiTotal")}</div>
                  <div className="analytics-today-time">{aiRows === null ? "…" : aiToday}</div>
                </div>
                {aiByType.map(({ action, cnt }) => (
                  <div key={action} style={{ marginLeft: "1.5rem" }}>
                    <div className="analytics-today-label">{AI_ACTION_LABELS[action] ?? action}</div>
                    <div className="analytics-today-time" style={{ fontSize: "1.2rem" }}>{cnt}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-section">
              <h3>{t("analyticsScreen.aiByPack")}</h3>
              {aiByPack.length === 0
                ? <p className="analytics-empty">{t("analyticsScreen.noData")}</p>
                : (
                  <table className="analytics-table">
                    <thead>
                      <tr><th>{t("analyticsScreen.colPack")}</th><th className="analytics-bar-cell"></th><th className="analytics-time-cell">{t("analyticsScreen.colCount")}</th></tr>
                    </thead>
                    <tbody>
                      {aiByPack.map(({ file, cnt }) => (
                        <tr key={file}>
                          <td>{packDisplay(file, packNames)}</td>
                          <td className="analytics-bar-cell">
                            <div className="analytics-bar-wrap">
                              <div className="analytics-bar-fill" style={{ width: `${(cnt / maxAiPackCnt) * 100}%` }} />
                            </div>
                          </td>
                          <td className="analytics-time-cell">{cnt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>

            <div className="analytics-section">
              <h3>{t("analyticsScreen.aiTrend")}</h3>
              {aiByDay.length === 0
                ? <p className="analytics-empty">{t("analyticsScreen.noData")}</p>
                : (
                  <table className="analytics-table">
                    <thead>
                      <tr><th>{t("analyticsScreen.colDate")}</th><th className="analytics-bar-cell"></th><th className="analytics-time-cell">{t("analyticsScreen.colCount")}</th></tr>
                    </thead>
                    <tbody>
                      {aiByDay.map(({ day, cnt }) => (
                        <tr key={day}>
                          <td>{day}</td>
                          <td className="analytics-bar-cell">
                            <div className="analytics-bar-wrap">
                              <div className="analytics-bar-fill" style={{ width: `${(cnt / maxAiDayCnt) * 100}%` }} />
                            </div>
                          </td>
                          <td className="analytics-time-cell">{cnt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>

            <div className="analytics-section">
              <h3>{t("analyticsScreen.aiLatency")}</h3>
              {latencyRows === null
                ? <div className="analytics-loading">{t("analyticsScreen.loading")}</div>
                : <LatencyChart data={latencyRows} />
              }
            </div>
          </>
        )}
      </div>

      {/* ── QUALITY ANALYTICS ────────────────────── */}
      <div className="analytics-group">
        <h2 className="analytics-group-title">{t("analyticsScreen.quality")}</h2>

        <div className="analytics-section">
          <h3>{t("analyticsScreen.correctionRate")}</h3>
          {corrStats === null
            ? <div className="analytics-loading">{t("analyticsScreen.loading")}</div>
            : !corrStats.total
              ? <p className="analytics-empty">{t("analyticsScreen.noData")}</p>
              : (
                <>
                  <div className="analytics-today" style={{ marginBottom: "1rem" }}>
                    <div className="analytics-today-icon">✅</div>
                    <div>
                      <div className="analytics-today-label">{t("analyticsScreen.acceptanceRate")}</div>
                      <div className="analytics-today-time">{corrStats.rate ?? "—"}%</div>
                    </div>
                    <div style={{ marginLeft: "1.5rem" }}>
                      <div className="analytics-today-label">{t("analyticsScreen.accepted")}</div>
                      <div className="analytics-today-time" style={{ fontSize: "1.2rem" }}>{corrStats.accepted}</div>
                    </div>
                    <div style={{ marginLeft: "1rem" }}>
                      <div className="analytics-today-label">{t("analyticsScreen.corrected")}</div>
                      <div className="analytics-today-time" style={{ fontSize: "1.2rem" }}>{corrStats.total - corrStats.accepted}</div>
                    </div>
                  </div>

                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>{t("analyticsScreen.colAction")}</th>
                        <th className="analytics-bar-cell"></th>
                        <th className="analytics-time-cell">{t("analyticsScreen.colRate")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(corrStats.byAction ?? []).map(({ action, total, accepted, rate }) => (
                        <tr key={action}>
                          <td>{AI_ACTION_LABELS[action] ?? action}</td>
                          <td className="analytics-bar-cell">
                            <div className="analytics-bar-wrap">
                              <div className="analytics-bar-fill" style={{ width: `${rate ?? 0}%` }} />
                            </div>
                          </td>
                          <td className="analytics-time-cell">{rate ?? "—"}% <span style={{ color: "var(--app-text-muted)", fontWeight: 400, fontSize: "0.78rem" }}>({accepted}/{total})</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )
          }
        </div>
      </div>

      {/* ── PLACEHOLDER SECTIONS ─────────────────── */}
      {["economics", "bottlenecks"].map((key) => (
        <div key={key} className="analytics-group analytics-group--planned">
          <h2 className="analytics-group-title">{t(`analyticsScreen.${key}`)}</h2>
          <p className="analytics-coming-soon">{t("analyticsScreen.comingSoon")}</p>
        </div>
      ))}
    </div>
  );
}
