import { createContext, useContext, useState, useCallback, useRef } from "react";

const AuthContext = createContext(null);

import { API_BASE } from "../config";
const API = `${API_BASE}/api/auth`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("lp_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("lp_token") || null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const expiredRef = useRef(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem("lp_token");
    localStorage.removeItem("lp_user");
    setToken(null);
    setUser(null);
  }, []);

  // Volaj toto pri každom fetch ktorý dostane 401
  const handleUnauthorized = useCallback(() => {
    if (expiredRef.current) return; // zabrán duplikátom
    expiredRef.current = true;
    clearSession();
    setSessionExpired(true);
  }, [clearSession]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    localStorage.setItem("lp_token", data.token);
    localStorage.setItem("lp_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setSessionExpired(false);
    expiredRef.current = false;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
    clearSession();
  }, [token, clearSession]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, sessionExpired, handleUnauthorized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
