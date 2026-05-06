"use client";

import { useTheme } from "next-themes";
import { useThemeAccent } from "@/lib/hooks/useThemeAccent";
import { X, Moon, Sun, Palette } from "lucide-react";

export function AppearanceSettings({ onClose }: { onClose: () => void }) {
  const { theme: mode, setTheme: setMode } = useTheme();
  const { colorLeft, colorRight, setColorLeft, setColorRight, mounted } = useThemeAccent();

  if (!mounted) return null;

  const presets = [
    { name: "Discord", left: "#5865F2", right: "#5865F2" },
    { name: "Chairman Gold", left: "#C9A961", right: "#E6D59A" },
    { name: "Crimson", left: "#E05A3A", right: "#E05A3A" },
    { name: "Cyberpunk", left: "#00FF9D", right: "#00B8FF" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="w-[480px] bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200/50 dark:border-white/10">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Palette size={18} />
            Appearance Settings
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8">
          {/* Theme Toggle */}
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Theme</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setMode("light")}
                className={`flex-1 py-3 flex flex-col items-center gap-2 rounded-lg border transition-all ${mode === "light" ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-white/5" : "border-zinc-200/50 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"}`}
              >
                <Sun size={24} className="text-zinc-900 dark:text-white" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Light</span>
              </button>
              <button
                onClick={() => setMode("dark")}
                className={`flex-1 py-3 flex flex-col items-center gap-2 rounded-lg border transition-all ${mode === "dark" ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-white/5" : "border-zinc-200/50 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"}`}
              >
                <Moon size={24} className="text-zinc-900 dark:text-white" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Dark</span>
              </button>
            </div>
          </div>

          {/* Presets */}
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setColorLeft(p.left); setColorRight(p.right); }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200/50 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundImage: `linear-gradient(135deg, ${p.left}, ${p.right})` }} />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dual Hex */}
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Custom Gradient</h3>
            <div className="flex items-center gap-4 p-4 rounded-lg border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20">
              {/* Left */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Left Color</span>
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/20 shadow-sm hover:scale-105 transition-transform">
                  <input type="color" value={colorLeft} onChange={(e) => setColorLeft(e.target.value)} className="absolute inset-[-10px] w-16 h-16 cursor-pointer opacity-0" />
                  <div className="w-full h-full pointer-events-none" style={{ backgroundColor: colorLeft }} />
                </div>
                <span className="text-xs font-mono text-zinc-500 uppercase">{colorLeft}</span>
              </div>
              
              <div className="text-zinc-300 dark:text-zinc-700">→</div>
              
              {/* Right */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Right Color</span>
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/20 shadow-sm hover:scale-105 transition-transform">
                  <input type="color" value={colorRight} onChange={(e) => setColorRight(e.target.value)} className="absolute inset-[-10px] w-16 h-16 cursor-pointer opacity-0" />
                  <div className="w-full h-full pointer-events-none" style={{ backgroundColor: colorRight }} />
                </div>
                <span className="text-xs font-mono text-zinc-500 uppercase">{colorRight}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
