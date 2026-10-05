"use client";

import * as React from "react";
import { Moon, Sun, Laptop, Check, Sparkles } from "lucide-react";
import { useTheme, Theme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ThemeSettings() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const isDarkMode = resolvedTheme === "dark";

  const handleToggle = () => {
    const nextTheme: Theme = isDarkMode ? "light" : "dark";
    setTheme(nextTheme);
    toast.success(
      nextTheme === "dark"
        ? "Switched to Deep Dark Theme"
        : "Switched to Clean Light Theme"
    );
  };

  const handleSelectTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    const label =
      newTheme === "dark"
        ? "Deep Dark Theme"
        : newTheme === "light"
        ? "Clean Light Theme"
        : "System Match";
    toast.success(`Theme preference set to ${label}`);
  };

  return (
    <div className="space-y-6">
      {/* Primary Toggle Box (Matching the User's UI) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-base font-semibold text-foreground flex items-center gap-2">
            <span>Theme Mode</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-3 w-3" />
              Live Interactive
            </span>
          </label>
        </div>

        <div
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle();
            }
          }}
          className={cn(
            "p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none max-w-2xl flex items-center justify-between gap-4 shadow-sm hover:shadow-md",
            isDarkMode
              ? "border-primary/40 bg-[#121319]/80 hover:border-primary/60 hover:bg-[#14161f]"
              : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40"
          )}
        >
          <div className="space-y-1.5 pr-2">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isDarkMode
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                )}
              >
                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <p className="font-semibold text-foreground text-base">
                {isDarkMode ? "Deep Dark Theme" : "Clean Light Theme"}
              </p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {isDarkMode
                ? "The application is currently set to Deep Dark mode with signature Foremark Orange accents."
                : "The application is currently set to Clean Light mode with crisp contrast and Foremark Orange accents."}
            </p>
          </div>

          {/* Interactive Switch Toggle */}
          <div className="shrink-0 flex items-center">
            <div
              className={cn(
                "relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isDarkMode ? "bg-primary shadow-[0_0_12px_rgba(232,120,17,0.4)]" : "bg-zinc-300 dark:bg-zinc-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center",
                  isDarkMode ? "translate-x-7.5" : "translate-x-1"
                )}
              >
                {isDarkMode ? (
                  <Moon className="h-3 w-3 text-primary" />
                ) : (
                  <Sun className="h-3 w-3 text-amber-500" />
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Theme Selection Cards */}
      <div className="space-y-3 pt-2">
        <label className="text-sm font-semibold text-foreground">
          Appearance Presets
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
          {/* Card 1: Deep Dark */}
          <button
            type="button"
            onClick={() => handleSelectTheme("dark")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative group",
              theme === "dark"
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/50"
                : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
            )}
          >
            {theme === "dark" && (
              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                <Check className="h-3 w-3" />
              </div>
            )}
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-xl bg-[#0d0d0d] border border-white/20 flex items-center justify-center text-primary shadow-xs">
                <Moon className="h-4 w-4" />
              </div>
              <p className="font-semibold text-foreground text-sm">Deep Dark</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Obsidian workspace with vibrant orange accents.
              </p>
            </div>
          </button>

          {/* Card 2: Clean Light */}
          <button
            type="button"
            onClick={() => handleSelectTheme("light")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative group",
              theme === "light"
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/50"
                : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
            )}
          >
            {theme === "light" && (
              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                <Check className="h-3 w-3" />
              </div>
            )}
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-amber-500 shadow-xs">
                <Sun className="h-4 w-4" />
              </div>
              <p className="font-semibold text-foreground text-sm">Clean Light</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Crisp daytime interface with high readability.
              </p>
            </div>
          </button>

          {/* Card 3: System Sync */}
          <button
            type="button"
            onClick={() => handleSelectTheme("system")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative group",
              theme === "system"
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/50"
                : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
            )}
          >
            {theme === "system" && (
              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                <Check className="h-3 w-3" />
              </div>
            )}
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground shadow-xs">
                <Laptop className="h-4 w-4" />
              </div>
              <p className="font-semibold text-foreground text-sm">System Sync</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Automatically matches your OS daylight schedule.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
