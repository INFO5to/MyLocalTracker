"use client";

import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "localtracker-theme";

function resolvePreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event("localtracker-theme-change"));
}

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  window.addEventListener("localtracker-theme-change", callback);
  mediaQuery.addEventListener("change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("localtracker-theme-change", callback);
    mediaQuery.removeEventListener("change", callback);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof document !== "undefined") {
    const activeTheme = document.documentElement.dataset.theme;

    if (activeTheme === "light" || activeTheme === "dark") {
      return activeTheme;
    }
  }

  return resolvePreferredTheme();
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="4.1" />
      <path d="M12 2.75v2.2" />
      <path d="M12 19.05v2.2" />
      <path d="m5.46 5.46 1.56 1.56" />
      <path d="m16.98 16.98 1.56 1.56" />
      <path d="M2.75 12h2.2" />
      <path d="M19.05 12h2.2" />
      <path d="m5.46 18.54 1.56-1.56" />
      <path d="m16.98 7.02 1.56-1.56" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M20.1 14.44A8.78 8.78 0 1 1 9.56 3.9 7.1 7.1 0 0 0 20.1 14.44Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => "light",
  );

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={
        theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      aria-pressed={theme === "dark"}
      title={theme === "dark" ? "Modo oscuro" : "Modo claro"}
    >
      <span className="theme-toggle__thumb" aria-hidden="true" />
      <span className="theme-toggle__option" data-active={theme === "light"}>
        <SunIcon />
      </span>
      <span className="theme-toggle__option" data-active={theme === "dark"}>
        <MoonIcon />
      </span>
    </button>
  );
}
