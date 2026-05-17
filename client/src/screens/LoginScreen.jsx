import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n";
import "./LoginScreen.css";

const API = "http://localhost:3001/api/auth";

export default function LoginScreen() {
  const { login, sessionExpired } = useAuth();
  const t = useT();

  // "login" | "forgot" | "done"
  const [view, setView]         = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail]       = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setView("done");
    } catch {
      setView("done"); // ukáž úspech aj pri chybe — neodhaľujeme stav
    } finally {
      setLoading(false);
    }
  }

  if (view === "forgot" || view === "done") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">LexiPack</div>
          <div className="login-subtitle">{t("login.forgotTitle")}</div>

          {view === "done" ? (
            <div className="login-done">{t("login.forgotDone")}</div>
          ) : (
            <form onSubmit={handleForgot} style={{ display: "contents" }}>
              <p className="login-forgot-desc">{t("login.forgotDesc")}</p>
              <div className="login-field">
                <label>{t("login.forgotEmail")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <div className="login-error">{error}</div>}
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? t("login.forgotSending") : t("login.forgotSubmit")}
              </button>
            </form>
          )}

          <button
            className="login-back"
            onClick={() => { setView("login"); setError(null); setEmail(""); }}
          >
            {t("login.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-logo">LexiPack</div>
        <div className="login-subtitle">{t("login.subtitle")}</div>

        <div className="login-field">
          <label>{t("login.username")}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </div>

        <div className="login-field">
          <label>{t("login.password")}</label>
          <div className="login-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {sessionExpired && !error && (
          <div className="login-error" style={{ background: "#78350f22", borderColor: "#f59e0b", color: "#f59e0b" }}>
            Platnosť prihlásenia vypršala. Prihláste sa znova.
          </div>
        )}
        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? t("login.submitting") : t("login.submit")}
        </button>

        <div style={{ fontSize: 13, color: "var(--app-muted)", textAlign: "center" }}>
          Zabudol som{" "}
          <button
            type="button"
            className="login-forgot-link"
            onClick={() => { setView("forgot"); setError(null); }}
          >
            heslo
          </button>
        </div>
      </form>
    </div>
  );
}
