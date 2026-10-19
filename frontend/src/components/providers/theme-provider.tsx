"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

const STORAGE_KEY = "foremark-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  // Helper to apply theme to documentElement
  const applyTheme = useCallback((resolved: "dark" | "light") => {
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    }
    setResolvedTheme(resolved);
  }, []);

  // Initialize theme from localStorage or default to light
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const initialTheme: Theme = stored && ["dark", "light", "system"].includes(stored) ? stored : "light";
      setThemeState(initialTheme);

      if (initialTheme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(systemPrefersDark ? "dark" : "light");
      } else {
        applyTheme(initialTheme);
      }
    } catch {
      applyTheme("light");
    } finally {
      setMounted(true);
    }
  }, [applyTheme]);

  // Listen to system changes when in system mode
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted, applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (err) {
        console.error("Failed to save theme preference:", err);
      }

      if (newTheme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(systemPrefersDark ? "dark" : "light");
      } else {
        applyTheme(newTheme);
      }
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(
    (event?: React.MouseEvent | MouseEvent) => {
      const nextTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";

      // Origin point: right upper corner (or button coordinates if clicked)
      const x =
        event && typeof event.clientX === "number"
          ? event.clientX
          : typeof window !== "undefined"
          ? window.innerWidth - 40
          : 0;
      const y =
        event && typeof event.clientY === "number"
          ? event.clientY
          : 40;

      // Distance from origin to bottom-left corner (0, innerHeight) plus safety buffer
      const targetX = 0;
      const targetY = typeof window !== "undefined" ? window.innerHeight : 1000;
      const maxDistance = Math.hypot(x - targetX, y - targetY) + 120;

      // 1. Native View Transitions API (Modern Chromium, Safari 18+)
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        typeof (document as any).startViewTransition === "function"
      ) {
        const transition = (document as any).startViewTransition(() => {
          setTheme(nextTheme);
        });

        transition.ready
          .then(() => {
            const clipPath = [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxDistance}px at ${x}px ${y}px)`,
            ];
            document.documentElement.animate(
              {
                clipPath,
              },
              {
                duration: 650,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          })
          .catch(() => {
            setTheme(nextTheme);
          });
        return;
      }

      // 2. Hardware-accelerated fallback ripple wave if View Transitions API is unsupported
      if (typeof document !== "undefined") {
        const wave = document.createElement("div");
        wave.style.position = "fixed";
        wave.style.inset = "0";
        wave.style.zIndex = "999999";
        wave.style.pointerEvents = "none";
        wave.style.backgroundColor = nextTheme === "dark" ? "#0d0f14" : "#f0f2f6";
        wave.style.clipPath = `circle(0px at ${x}px ${y}px)`;
        wave.style.transition = "clip-path 600ms cubic-bezier(0.25, 1, 0.5, 1)";
        document.body.appendChild(wave);

        requestAnimationFrame(() => {
          wave.style.clipPath = `circle(${maxDistance}px at ${x}px ${y}px)`;
        });

        setTimeout(() => {
          setTheme(nextTheme);
          setTimeout(() => {
            wave.style.opacity = "0";
            wave.style.transition = "opacity 200ms ease";
            setTimeout(() => {
              wave.remove();
            }, 200);
          }, 300);
        }, 300);
        return;
      }

      setTheme(nextTheme);
    },
    [resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
