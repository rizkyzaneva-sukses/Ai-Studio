"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const applyTheme = useCallback((t: Theme) => {
    let r: "light" | "dark" = "light";
    if (t === "dark") r = "dark";
    else if (t === "system") {
      r = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    setResolved(r);
    document.documentElement.classList.toggle("dark", r === "dark");
  }, []);

  useEffect(() => {
    const saved = (localStorage.getItem("zaneva-theme") as Theme) || "system";
    setThemeState(saved);
    applyTheme(saved);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if ((localStorage.getItem("zaneva-theme") || "system") === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [applyTheme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("zaneva-theme", t);
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
