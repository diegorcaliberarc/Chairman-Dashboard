"use client";

import { useTheme } from "next-themes";
import { useThemeAccent } from "@/lib/hooks/useThemeAccent";
import { X, Moon, Sun, Palette, Save, Check } from "lucide-react";
import { useState, useEffect } from "react";

export function AppearanceSettings({ onClose }: { onClose: () => void }) {
  const { theme: mode, setTheme: setMode } = useTheme();
  const { colorLeft, colorRight, setColorLeft, setColorRight, mounted } = useThemeAccent();

  // Staging state
  const [stagedMode, setStagedMode] = useState<string | undefined>(mode);
  const [stagedLeft, setStagedLeft] = useState<string>(colorLeft);
  const [stagedRight, setStagedRight] = useState<string>(colorRight);
  const [savedThemes, setSavedThemes] = useState<{name: string, left: string, right: string}[]>([]);

  useEffect(() => {
    // Load saved custom themes
    const custom = localStorage.getItem("saved-custom-themes");
    if (custom) {
      try {
        setSavedThemes(JSON.parse(custom));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Update DOM when staged colors change (Preview)
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty('--theme-grad-start', stagedLeft);
      document.documentElement.style.setProperty('--theme-grad-end', stagedRight);
    }
  }, [stagedLeft, stagedRight, mounted]);

  // Update DOM when staged mode changes (Preview)
  useEffect(() => {
    if (stagedMode && stagedMode !== mode) {
      setMode(stagedMode);
    }
  }, [stagedMode, mode, setMode]);

  const handleCancel = () => {
    // Revert DOM back to global state
    document.documentElement.style.setProperty('--theme-grad-start', colorLeft);
    document.documentElement.style.setProperty('--theme-grad-end', colorRight);
    if (mode && stagedMode !== mode) {
      setMode(mode); // Revert mode
    }
    onClose();
  };

  const handleApply = () => {
    // Save to global state and localStorage
    setColorLeft(stagedLeft);
    setColorRight(stagedRight);
    onClose();
  };

  const handleSaveCustom = () => {
    const newTheme = {
      name: `Custom ${savedThemes.length + 1}`,
      left: stagedLeft,
      right: stagedRight
    };
    const updated = [...savedThemes, newTheme];
    setSavedThemes(updated);
    localStorage.setItem("saved-custom-themes", JSON.stringify(updated));
  };

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
          <button onClick={handleCancel} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8 max-h-[70vh] overflow-y-auto">
          {/* Theme Toggle */}
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Theme</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setStagedMode("light")}
                className={`flex-1 py-3 flex flex-col items-center gap-2 rounded-lg border transition-all ${stagedMode === "light" ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-white/5" : "border-zinc-200/50 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"}`}
              >
                <Sun size={24} className="text-zinc-900 dark:text-white" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Light</span>
              </button>
              <button
                onClick={() => setStagedMode("dark")}
                className={`flex-1 py-3 flex flex-col items-center gap-2 rounded-lg border transition-all ${stagedMode === "dark" ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-white/5" : "border-zinc-200/50 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"}`}
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
                  onClick={() => { setStagedLeft(p.left); setStagedRight(p.right); }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200/50 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundImage: `linear-gradient(135deg, ${p.left}, ${p.right})` }} />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{p.name}</span>
                </button>
              ))}
              {savedThemes.map((p, i) => (
                <button
                  key={`custom-${i}`}
                  onClick={() => { setStagedLeft(p.left); setStagedRight(p.right); }}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custom Gradient</h3>
              <button 
                onClick={handleSaveCustom}
                className="text-xs font-medium text-themeAccent flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <Save size={12} /> Save Custom Theme
              </button>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20">
              {/* Left */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Left Color</span>
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/20 shadow-sm hover:scale-105 transition-transform">
                  <input type="color" value={stagedLeft} onChange={(e) => setStagedLeft(e.target.value)} className="absolute inset-[-10px] w-16 h-16 cursor-pointer opacity-0" />
                  <div className="w-full h-full pointer-events-none" style={{ backgroundColor: stagedLeft }} />
                </div>
                <span className="text-xs font-mono text-zinc-500 uppercase">{stagedLeft}</span>
              </div>
              
              <div className="text-zinc-300 dark:text-zinc-700">→</div>
              
              {/* Right */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Right Color</span>
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/20 shadow-sm hover:scale-105 transition-transform">
                  <input type="color" value={stagedRight} onChange={(e) => setStagedRight(e.target.value)} className="absolute inset-[-10px] w-16 h-16 cursor-pointer opacity-0" />
                  <div className="w-full h-full pointer-events-none" style={{ backgroundColor: stagedRight }} />
                </div>
                <span className="text-xs font-mono text-zinc-500 uppercase">{stagedRight}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 flex justify-end gap-3">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            className="px-5 py-2 text-sm font-bold text-white bg-theme-gradient rounded-lg shadow-lg shadow-themeAccent/20 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Check size={16} />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
