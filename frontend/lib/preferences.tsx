"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePreference = "system" | "light" | "dark";

export type UserPreferences = {
  theme: ThemePreference;
  reduceMotion: boolean;
};

const STORAGE_KEY = "packster-preferences";
const DEFAULT_PREFERENCES: UserPreferences = { theme: "system", reduceMotion: false };

type PreferencesContextValue = {
  preferences: UserPreferences;
  updatePreferences: (next: UserPreferences) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readPreferences(): UserPreferences {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_PREFERENCES;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PREFERENCES;

    const value = parsed as Partial<UserPreferences>;
    return {
      theme: value.theme === "light" || value.theme === "dark" ? value.theme : "system",
      reduceMotion: value.reduceMotion === true,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setPreferences(readPreferences());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark = preferences.theme === "dark"
        || (preferences.theme === "system" && media?.matches === true);
      root.classList.toggle("dark", isDark);
      root.classList.toggle("reduce-motion", preferences.reduceMotion);
    };
    applyTheme();
    media?.addEventListener("change", applyTheme);
    return () => media?.removeEventListener("change", applyTheme);
  }, [preferences]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setPreferences(readPreferences());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(() => ({
    preferences,
    updatePreferences: (next: UserPreferences) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPreferences(next);
    },
  }), [preferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider.");
  return context;
}
