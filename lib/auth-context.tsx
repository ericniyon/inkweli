"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { User } from "@/types";
import { GUEST_USER } from "@/constants";

const AUTH_STORAGE_KEY = "usethinkup_user";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as User;
    if (u?.id && u.id !== "guest" && u.name && u.email) return u;
  } catch {
    // ignore
  }
  return null;
}

function setStoredUser(u: User | null) {
  if (typeof window === "undefined") return;
  if (u == null || u.id === "guest") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
  } catch {
    // ignore
  }
}

type AuthContextValue = {
  user: User;
  setUser: (user: User) => void;
  isGuest: boolean;
  logout: () => void;
  hydrated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User>(GUEST_USER);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUserState(stored);
    setHydrated(true);
  }, []);

  // Sync with NextAuth session (e.g. after sign-in)
  useEffect(() => {
    if (!hydrated) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id && data?.email && data?.name) {
          setUserState(data);
          setStoredUser(data);
        }
      })
      .catch(() => {});
  }, [hydrated]);

  const isGuest = user.id === "guest";

  const setUser = useCallback((u: User) => {
    setUserState(u);
    setStoredUser(u);
  }, []);

  const logout = useCallback(() => {
    setUserState(GUEST_USER);
    setStoredUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isGuest, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
