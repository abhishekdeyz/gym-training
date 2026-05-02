import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("gp_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setGym(data.gym);
    } catch {
      localStorage.removeItem("gp_token");
      setUser(null);
      setGym(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("gp_token", data.token);
    setUser(data.user);
    setGym(data.gym);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("gp_token", data.token);
    setUser(data.user);
    setGym(data.gym);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("gp_token");
    setUser(null);
    setGym(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, gym, setGym, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
