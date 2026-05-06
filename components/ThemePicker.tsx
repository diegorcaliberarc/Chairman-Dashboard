"use client";

import { useTheme } from "next-themes";
import { useThemeAccent } from "@/lib/hooks/useThemeAccent";

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#E11D48", // Crimson
  "#06B6D4", // Cyber Cyan
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#F59E0B", // Amber
];

export function ThemePicker() {
  const { theme: mode, setTheme: setMode } = useTheme();
  const { accentColor, updateAccentColor, mounted } = useThemeAccent();

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

      {/* Preset Swatches */}
      <div className="flex items-center gap-2 border-l border-border pl-4">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => updateAccentColor(color)}
            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: accentColor === color ? "white" : "transparent",
            }}
            title={`Set accent to ${color}`}
          />
        ))}
      </div>

      {/* Infinite Color Picker */}
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full overflow-hidden border border-border hover:border-primary transition-colors ml-2" title="Custom Hex Picker">
        <input
          type="color"
          value={accentColor}
          onChange={(e) => updateAccentColor(e.target.value)}
          className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0"
        />
        <div 
          className="w-full h-full pointer-events-none" 
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}
