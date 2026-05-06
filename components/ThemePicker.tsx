"use client";

import { useTheme } from "next-themes";
import { useColorTheme, ColorTheme } from "@/lib/hooks/useColorTheme";

export function ThemePicker() {
  const { theme: mode, setTheme: setMode } = useTheme();
  const { theme: colorTheme, setColorTheme, mounted } = useColorTheme();

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-4">
      {/* Mode Toggle */}
      <button
        onClick={() => setMode(mode === "dark" ? "light" : "dark")}
        className="px-3 py-1.5 rounded-md bg-surface border border-border hover:border-primary hover:text-primary transition-colors text-sm font-medium"
        title="Toggle Dark/Light Mode"
      >
        {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
      </button>

      {/* Color Profile Selector */}
      <select
        value={colorTheme}
        onChange={(e) => setColorTheme(e.target.value as ColorTheme)}
        className="px-3 py-1.5 rounded-md bg-surface border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-sm font-medium cursor-pointer"
      >
        <option value="default">Default (Blue)</option>
        <option value="crimson">Crimson (Red)</option>
        <option value="cyber">Cyber (Cyan)</option>
      </select>
    </div>
  );
}
