"use client";

import { useTheme } from "next-themes";
import { useThemeAccent } from "@/lib/hooks/useThemeAccent";

export function ThemePicker() {
  const { theme: mode, setTheme: setMode } = useTheme();
  const { colorLeft, colorRight, setColorLeft, setColorRight, mounted } = useThemeAccent();

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-4">
      {/* Mode Toggle */}
      <button
        onClick={() => setMode(mode === "dark" ? "light" : "dark")}
        className="px-3 py-1.5 rounded-md bg-surface border border-border hover:border-zinc-500 transition-colors text-sm font-medium"
        title="Toggle Dark/Light Mode"
      >
        {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
      </button>

      {/* Gradient Pickers */}
      <div className="flex items-center gap-3 border-l border-border pl-4">
        {/* Gradient Left */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase text-zinc-500">Left</span>
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full overflow-hidden border border-border hover:border-zinc-400 transition-colors" title="Gradient Left">
            <input
              type="color"
              value={colorLeft}
              onChange={(e) => setColorLeft(e.target.value)}
              className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0"
            />
            <div 
              className="w-full h-full pointer-events-none" 
              style={{ backgroundColor: colorLeft }}
            />
          </div>
        </div>

        {/* Gradient Right */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase text-zinc-500">Right</span>
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full overflow-hidden border border-border hover:border-zinc-400 transition-colors" title="Gradient Right">
            <input
              type="color"
              value={colorRight}
              onChange={(e) => setColorRight(e.target.value)}
              className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0"
            />
            <div 
              className="w-full h-full pointer-events-none" 
              style={{ backgroundColor: colorRight }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
