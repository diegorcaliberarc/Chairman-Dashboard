"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";
import {
  Check,
  Compass,
  Droplets,
  Layers,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Sun,
  Trash2,
  Wand2,
  X,
  Type,
  Binary,
  Maximize2,
} from "lucide-react";
import {
  applyGlassThemeToDocument,
  clamp,
  GLASS_PRESETS,
  GlassPresetDefinition,
  GlassThemeConfig,
  GlassWheelStop,
  GlassWheelStopId,
  hslToRgb,
  loadGlassThemeFromStorage,
  loadSavedCustomThemes,
  makeStopFromHex,
  makeStopFromHsl,
  SavedCustomGlassTheme,
  saveCustomThemesToStorage,
  structuredCloneConfig,
} from "@/lib/glassTheme";
import {
  AppFontSize,
  applyFontKitToDocument,
  FONT_KIT_PRESETS,
  FONT_SIZE_SCALES,
  FontKitConfig,
  FontPresetId,
  loadFontKitFromStorage,
  NUMBER_FONT_PRESETS,
  NumberFontPresetId,
} from "@/lib/fontTheme";

const WHEEL_SIZE = 216;
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 8;
const STOP_META: Array<{
  idx: 0 | 1 | 2;
  id: GlassWheelStopId;
  shortLabel: string;
  roleLabel: string;
}> = [
  { idx: 0, id: "primary", shortLabel: "1", roleLabel: "Primary Start" },
  { idx: 1, id: "secondary", shortLabel: "2", roleLabel: "Secondary End" },
  { idx: 2, id: "aura", shortLabel: "3", roleLabel: "Ambient Aura" },
];

function polarToCartesian(hue: number, sat: number) {
  const rad = (hue * Math.PI) / 180;
  const dist = (clamp(sat, 0, 100) / 100) * WHEEL_RADIUS;
  return {
    x: WHEEL_SIZE / 2 + Math.cos(rad) * dist,
    y: WHEEL_SIZE / 2 + Math.sin(rad) * dist,
  };
}

export function AppearanceSettings({ onClose }: { onClose: () => void }) {
  const { setTheme } = useTheme();

  const initialConfigRef = useRef<GlassThemeConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  const [stagedConfig, setStagedConfig] = useState<GlassThemeConfig>(() =>
    loadGlassThemeFromStorage()
  );
  const [activeStopIdx, setActiveStopIdx] = useState<0 | 1 | 2>(0);
  const [draggingStopIdx, setDraggingStopIdx] = useState<0 | 1 | 2 | null>(
    null
  );
  const [hexDrafts, setHexDrafts] = useState<[string, string, string]>([
    "#5B7CFA",
    "#9B5DE5",
    "#2DD4BF",
  ]);

  const [savedCustomThemes, setSavedCustomThemes] = useState<
    SavedCustomGlassTheme[]
  >([]);
  const [customNameInput, setCustomNameInput] = useState("");
  const [isSavingRemote, setIsSavingRemote] = useState(false);

  // Font Kit & Sizing Staged State
  const initialFontKitRef = useRef<FontKitConfig | null>(null);
  const [stagedFontKit, setStagedFontKit] = useState<FontKitConfig>(() =>
    loadFontKitFromStorage()
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelWrapRef = useRef<HTMLDivElement | null>(null);

  // Hydrate initial state on mount
  useEffect(() => {
    const current = loadGlassThemeFromStorage();
    initialConfigRef.current = structuredCloneConfig(current);
    setStagedConfig(structuredCloneConfig(current));
    setHexDrafts([
      current.wheelStops[0].hex,
      current.wheelStops[1].hex,
      current.wheelStops[2].hex,
    ]);
    setSavedCustomThemes(loadSavedCustomThemes());

    const currentFont = loadFontKitFromStorage();
    initialFontKitRef.current = { ...currentFont };
    setStagedFontKit({ ...currentFont });

    setMounted(true);
  }, []);

  // Sync hex input text boxes whenever wheelStops change externally
  useEffect(() => {
    setHexDrafts([
      stagedConfig.wheelStops[0].hex,
      stagedConfig.wheelStops[1].hex,
      stagedConfig.wheelStops[2].hex,
    ]);
  }, [
    stagedConfig.wheelStops[0].hex,
    stagedConfig.wheelStops[1].hex,
    stagedConfig.wheelStops[2].hex,
  ]);

  // Live real-time DOM preview as the user drags pucks or adjusts physics
  useEffect(() => {
    if (!mounted) return;
    applyGlassThemeToDocument(stagedConfig, {
      persist: false,
      dispatch: false,
    });
    setTheme(stagedConfig.colorMode);
  }, [stagedConfig, mounted, setTheme]);

  // Live real-time DOM preview for font kit and sizing
  useEffect(() => {
    if (!mounted) return;
    applyFontKitToDocument(stagedFontKit, {
      persist: false,
      dispatch: false,
    });
  }, [stagedFontKit, mounted]);

  // Draw authentic 360° Conic Hue × Radial Saturation Color Wheel on <canvas>
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = WHEEL_SIZE;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = WHEEL_RADIUS;
    const img = ctx.createImageData(size, size);
    const data = img.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const idx = (y * size + x) * 4;

        if (dist <= maxR + 1.2) {
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (angle < 0) angle += 360;
          const sat = clamp((dist / maxR) * 100, 0, 100);
          // Slight lightness lift near center for smooth pastel-to-vivid transition
          const light = 56 + (1 - sat / 100) * 38;
          const { r, g, b } = hslToRgb(angle, sat, light);

          // Anti-aliased outer edge
          const edgeAlpha =
            dist > maxR ? clamp(1 - (dist - maxR) / 1.2, 0, 1) : 1;

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = Math.round(edgeAlpha * 255);
        } else {
          data[idx + 3] = 0;
        }
      }
    }

    ctx.putImageData(img, 0, 0);
  }, [mounted]);

  const updateStopAt = useCallback(
    (stopIndex: 0 | 1 | 2, updatedStop: GlassWheelStop) => {
      setStagedConfig((prev) => {
        const nextStops: [GlassWheelStop, GlassWheelStop, GlassWheelStop] = [
          { ...prev.wheelStops[0] },
          { ...prev.wheelStops[1] },
          { ...prev.wheelStops[2] },
        ];
        nextStops[stopIndex] = updatedStop;
        return {
          ...prev,
          presetId: "custom",
          wheelStops: nextStops,
        };
      });
    },
    []
  );

  const applyWheelPointer = useCallback(
    (clientX: number, clientY: number, targetIdx: 0 | 1 | 2) => {
      const el = wheelWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;

      let hue = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (hue < 0) hue += 360;

      const scale = WHEEL_SIZE / rect.width;
      const distPx = Math.hypot(dx, dy) * scale;
      const sat = clamp((distPx / WHEEL_RADIUS) * 100, 0, 100);

      setStagedConfig((prev) => {
        const currentLight = prev.wheelStops[targetIdx].light;
        const stopId = STOP_META[targetIdx].id;
        const nextStops: [GlassWheelStop, GlassWheelStop, GlassWheelStop] = [
          { ...prev.wheelStops[0] },
          { ...prev.wheelStops[1] },
          { ...prev.wheelStops[2] },
        ];
        nextStops[targetIdx] = makeStopFromHsl(
          stopId,
          hue,
          sat,
          clamp(currentLight, 18, 86)
        );
        return {
          ...prev,
          presetId: "custom",
          wheelStops: nextStops,
        };
      });
    },
    []
  );

  const handleWheelPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = wheelWrapRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    const scale = WHEEL_SIZE / rect.width;
    const localX = (e.clientX - rect.left) * scale;
    const localY = (e.clientY - rect.top) * scale;

    // Check if user grabbed one of the 3 pucks directly
    let chosenIdx: 0 | 1 | 2 = activeStopIdx;
    let bestDist = 22;
    ([0, 1, 2] as const).forEach((idx) => {
      const stop = stagedConfig.wheelStops[idx];
      const pos = polarToCartesian(stop.hue, stop.sat);
      const d = Math.hypot(localX - pos.x, localY - pos.y);
      if (d < bestDist) {
        bestDist = d;
        chosenIdx = idx;
      }
    });

    setActiveStopIdx(chosenIdx);
    setDraggingStopIdx(chosenIdx);
    applyWheelPointer(e.clientX, e.clientY, chosenIdx);
  };

  const handleWheelPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingStopIdx === null) return;
    applyWheelPointer(e.clientX, e.clientY, draggingStopIdx);
  };

  const handleWheelPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingStopIdx !== null) {
      try {
        wheelWrapRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDraggingStopIdx(null);
    }
  };

  const handleSelectPreset = (preset: GlassPresetDefinition) => {
    setStagedConfig(structuredCloneConfig(preset.defaultConfig));
  };

  const handleSwitchMode = (target: "light" | "dark" | "spatial") => {
    if (target === "spatial") {
      const auraPreset = GLASS_PRESETS.find((p) => p.id === "aura-spatial");
      if (auraPreset) {
        setStagedConfig(structuredCloneConfig(auraPreset.defaultConfig));
      }
      return;
    }

    setStagedConfig((prev) => {
      if (prev.presetId === "custom") {
        return { ...prev, colorMode: target };
      }
      // If switching between light & dark from a built-in preset, pick matching signature Northpeak preset if needed
      if (target === "light" && prev.colorMode !== "light") {
        return structuredCloneConfig(GLASS_PRESETS[0].defaultConfig);
      }
      if (
        target === "dark" &&
        (prev.colorMode !== "dark" || prev.presetId === "aura-spatial")
      ) {
        return structuredCloneConfig(GLASS_PRESETS[1].defaultConfig);
      }
      return { ...prev, colorMode: target };
    });
  };

  const applyColorHarmony = (mode: "complementary" | "triadic" | "analogous") => {
    setStagedConfig((prev) => {
      const base = prev.wheelStops[0];
      const s2Hue =
        mode === "complementary"
          ? (base.hue + 180) % 360
          : mode === "triadic"
          ? (base.hue + 120) % 360
          : (base.hue + 38) % 360;
      const s3Hue =
        mode === "complementary"
          ? (base.hue + 215) % 360
          : mode === "triadic"
          ? (base.hue + 240) % 360
          : (base.hue + 322) % 360;

      return {
        ...prev,
        presetId: "custom",
        wheelStops: [
          { ...base },
          makeStopFromHsl("secondary", s2Hue, clamp(base.sat, 55, 95), base.light),
          makeStopFromHsl("aura", s3Hue, clamp(base.sat - 6, 50, 92), clamp(base.light + 6, 35, 78)),
        ],
      };
    });
  };

  const handleHexChange = (idx: 0 | 1 | 2, rawVal: string) => {
    setHexDrafts((prev) => {
      const next: [string, string, string] = [...prev] as [
        string,
        string,
        string
      ];
      next[idx] = rawVal;
      return next;
    });

    const cleaned = rawVal.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
      updateStopAt(idx, makeStopFromHex(STOP_META[idx].id, `#${cleaned}`));
    }
  };

  const handleSaveCustomPreset = () => {
    const label =
      customNameInput.trim() || `Custom Glass ${savedCustomThemes.length + 1}`;
    const entry: SavedCustomGlassTheme = {
      id: `custom-${Date.now()}`,
      name: label,
      config: structuredCloneConfig(stagedConfig),
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...savedCustomThemes];
    setSavedCustomThemes(next);
    saveCustomThemesToStorage(next);
    setCustomNameInput("");
  };

  const handleDeleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = savedCustomThemes.filter((t) => t.id !== id);
    setSavedCustomThemes(next);
    saveCustomThemesToStorage(next);
  };

  const handleCancel = () => {
    if (initialConfigRef.current) {
      applyGlassThemeToDocument(initialConfigRef.current, {
        persist: false,
        dispatch: false,
      });
      setTheme(initialConfigRef.current.colorMode);
    }
    if (initialFontKitRef.current) {
      applyFontKitToDocument(initialFontKitRef.current, {
        persist: false,
        dispatch: false,
      });
    }
    onClose();
  };

  const handleApply = async () => {
    setIsSavingRemote(true);
    applyGlassThemeToDocument(stagedConfig, { persist: true, dispatch: true });
    setTheme(stagedConfig.colorMode);

    applyFontKitToDocument(stagedFontKit, { persist: true, dispatch: true });

    try {
      await fetch("/api/ui-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...stagedConfig,
          fontKit: stagedFontKit,
        }),
      });
    } catch {
      // Resilient local fallback already persisted
    } finally {
      setIsSavingRemote(false);
      onClose();
    }
  };

  const puckPositions = useMemo(
    () =>
      stagedConfig.wheelStops.map((stop) =>
        polarToCartesian(stop.hue, stop.sat)
      ),
    [stagedConfig.wheelStops]
  );

  if (!mounted) return null;

  const activeStop = stagedConfig.wheelStops[activeStopIdx];
  const isSpatialActive = stagedConfig.presetId === "aura-spatial";
  const previewGradientCss = `linear-gradient(${stagedConfig.gradAngle}deg, ${stagedConfig.wheelStops[0].hex}, ${stagedConfig.wheelStops[1].hex})`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        className="w-full max-w-[780px] max-h-[90vh] rounded-2xl overflow-hidden flex flex-col border text-zinc-900 dark:text-zinc-100 shadow-2xl"
        style={{
          backgroundColor:
            stagedConfig.colorMode === "light"
              ? "rgba(250, 250, 253, 0.86)"
              : "rgba(11, 14, 24, 0.86)",
          backdropFilter: `blur(${Math.max(stagedConfig.glassBlur, 24)}px) saturate(190%)`,
          WebkitBackdropFilter: `blur(${Math.max(stagedConfig.glassBlur, 24)}px) saturate(190%)`,
          borderColor:
            stagedConfig.colorMode === "light"
              ? "rgba(255, 255, 255, 0.85)"
              : "rgba(255, 255, 255, 0.14)",
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.45), 0 32px 80px -16px rgba(0,0,0,0.55)",
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/70 dark:border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundImage: previewGradientCss }}
            >
              <Palette size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                  Liquid Glass &amp; Chromatic Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-widest bg-zinc-900/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                  LIVE DOM PREVIEW
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Northpeak frosted glass physics, VisionOS spatial sheets &amp; 360° tri-stop gradient wheel
              </p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors"
            title="Cancel and revert"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Studio Body */}
        <div className="p-6 overflow-y-auto space-y-7 flex-1">
          {/* 1. Light / Dark / Spatial Mode Switcher */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                1 · Optical Environment Mode
              </h3>
              <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                Preset:{" "}
                <strong className="text-zinc-800 dark:text-zinc-200 uppercase">
                  {stagedConfig.presetId}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSwitchMode("light")}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                  stagedConfig.colorMode === "light" && !isSpatialActive
                    ? "border-blue-500/60 bg-blue-500/10 shadow-sm"
                    : "border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100/70 dark:hover:bg-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-100 via-indigo-100 to-rose-100 border border-white flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                  <Sun size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    Light Glass
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    Airy pastel frost
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode("dark")}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                  stagedConfig.colorMode === "dark"
                    ? "border-indigo-400/60 bg-indigo-500/15 shadow-sm"
                    : "border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100/70 dark:hover:bg-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0d1326] via-[#1c1b42] to-[#2b143d] border border-white/20 flex items-center justify-center text-indigo-300 shrink-0 shadow-sm">
                  <Moon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    Nebula Dark
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    Deep obsidian glow
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode("spatial")}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                  isSpatialActive
                    ? "border-amber-600/60 bg-amber-500/15 shadow-sm"
                    : "border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100/70 dark:hover:bg-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f3e5d3] via-[#d7be9e] to-[#7c5838] border border-amber-100/80 flex items-center justify-center text-amber-950 shrink-0 shadow-sm">
                  <Layers size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    Spatial Warm
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    VisionOS oat glass
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* 2. 6 Built-In Visual Liquid Glass Presets */}
          <section>
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-2.5">
              2 · Curated Liquid Glass Presets
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GLASS_PRESETS.map((preset) => {
                const isSelected = stagedConfig.presetId === preset.id;
                const [pStop, sStop] = preset.defaultConfig.wheelStops;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`group relative rounded-xl p-2.5 border text-left transition-all overflow-hidden ${
                      isSelected
                        ? "border-blue-500 dark:border-indigo-400 ring-2 ring-blue-500/25 dark:ring-indigo-400/25 scale-[1.01]"
                        : "border-zinc-200/80 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/25"
                    }`}
                  >
                    {/* Mini Frosted Glass Swatch Preview */}
                    <div
                      className="h-16 w-full rounded-lg relative overflow-hidden p-2 flex items-center justify-between mb-2 border border-black/5 dark:border-white/10"
                      style={{ backgroundColor: preset.bgBase }}
                    >
                      {/* Mini Ambient Aura Orbs */}
                      <div
                        className="absolute -top-4 -left-3 w-16 h-16 rounded-full blur-md"
                        style={{ background: preset.aura1 }}
                      />
                      <div
                        className="absolute -bottom-4 right-2 w-16 h-16 rounded-full blur-md"
                        style={{ background: preset.aura2 }}
                      />
                      <div
                        className="absolute top-1 right-1/3 w-12 h-12 rounded-full blur-md"
                        style={{ background: preset.aura3 }}
                      />

                      {/* Mini Floating Glass Card */}
                      <div
                        className="relative z-10 w-full h-full rounded-md px-2.5 py-1.5 flex flex-col justify-between"
                        style={{
                          backgroundColor: `rgba(${preset.surfaceRgb}, ${preset.defaultConfig.glassOpacity})`,
                          backdropFilter: "blur(8px)",
                          border: `1px solid ${preset.borderRgba}`,
                          boxShadow: `inset 0 1px 0 0 ${preset.specularTopRgba}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                            style={{
                              color: preset.textPrimary,
                              backgroundColor:
                                preset.colorMode === "light"
                                  ? "rgba(0,0,0,0.06)"
                                  : "rgba(255,255,255,0.08)",
                            }}
                          >
                            {preset.badge}
                          </span>
                          <div
                            className="w-8 h-2 rounded-full"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${pStop.hex}, ${sStop.hex})`,
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-1.5 w-10 rounded-full opacity-75"
                            style={{ backgroundColor: preset.textPrimary }}
                          />
                          <div
                            className="h-1.5 w-6 rounded-full opacity-35"
                            style={{ backgroundColor: preset.textMuted }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {preset.name}
                      </div>
                      {isSelected && (
                        <Check
                          size={14}
                          className="text-blue-600 dark:text-indigo-400 shrink-0"
                        />
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {preset.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Saved User Custom Glass Presets */}
            {savedCustomThemes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                  Saved Custom Presets
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedCustomThemes.map((saved) => (
                    <div
                      key={saved.id}
                      onClick={() =>
                        setStagedConfig(structuredCloneConfig(saved.config))
                      }
                      className="cursor-pointer group flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/15 bg-white/50 dark:bg-white/5 hover:border-zinc-400 dark:hover:border-white/30 transition-all"
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-white/50 shadow-sm"
                        style={{
                          backgroundImage: `linear-gradient(${saved.config.gradAngle}deg, ${saved.config.wheelStops[0].hex}, ${saved.config.wheelStops[1].hex})`,
                        }}
                      />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {saved.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomPreset(saved.id, e)}
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete saved theme"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 3. Interactive 360° Custom Gradient Color Wheel */}
          <section className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/55 dark:bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-themeAccent" />
                  3 · Interactive 360° Chromatic Gradient Wheel
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Drag pucks 1, 2, or 3 across 360° Hue × Radial Saturation to sculpt custom glass &amp; mesh aura
                </p>
              </div>

              {/* Quick Color Harmony Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] uppercase tracking-wider text-zinc-400 mr-1 hidden sm:inline">
                  Harmony:
                </span>
                {(
                  [
                    ["analogous", "Analogous"],
                    ["triadic", "Triadic"],
                    ["complementary", "Complement"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyColorHarmony(key)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1"
                  >
                    <Wand2 size={10} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[232px_1fr] gap-6 items-center">
              {/* Circular 360° Color Wheel Disc */}
              <div className="flex flex-col items-center">
                <div
                  ref={wheelWrapRef}
                  onPointerDown={handleWheelPointerDown}
                  onPointerMove={handleWheelPointerMove}
                  onPointerUp={handleWheelPointerUp}
                  onPointerCancel={handleWheelPointerUp}
                  className="relative select-none touch-none cursor-crosshair rounded-full p-1 border border-zinc-300/80 dark:border-white/20 shadow-inner bg-zinc-950/10 dark:bg-black/40"
                  style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
                >
                  <canvas
                    ref={canvasRef}
                    width={WHEEL_SIZE}
                    height={WHEEL_SIZE}
                    className="w-full h-full rounded-full block pointer-events-none"
                  />

                  {/* Harmonic Chord Triangle Overlay */}
                  <svg
                    width={WHEEL_SIZE}
                    height={WHEEL_SIZE}
                    viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <polygon
                      points={puckPositions
                        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                        .join(" ")}
                      fill="rgba(255,255,255,0.12)"
                      stroke="rgba(255,255,255,0.75)"
                      strokeWidth="1.25"
                      strokeDasharray="3 2"
                    />
                    <line
                      x1={WHEEL_SIZE / 2}
                      y1={WHEEL_SIZE / 2}
                      x2={puckPositions[activeStopIdx].x}
                      y2={puckPositions[activeStopIdx].y}
                      stroke="rgba(255,255,255,0.65)"
                      strokeWidth="1"
                    />
                  </svg>

                  {/* 3 Draggable Stop Pucks */}
                  {STOP_META.map(({ idx, shortLabel, roleLabel }) => {
                    const stop = stagedConfig.wheelStops[idx];
                    const pos = puckPositions[idx];
                    const isActive = activeStopIdx === idx;
                    return (
                      <div
                        key={idx}
                        title={`${roleLabel}: ${stop.hex} (${stop.hue}°, ${stop.sat}%)`}
                        style={{
                          left: pos.x,
                          top: pos.y,
                          backgroundColor: stop.hex,
                          transform: `translate(-50%, -50%) scale(${
                            isActive ? 1.18 : 1
                          })`,
                        }}
                        className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black pointer-events-none transition-transform ${
                          isActive
                            ? "border-white shadow-[0_0_0_3px_rgba(0,0,0,0.45),0_4px_12px_rgba(0,0,0,0.5)] z-20"
                            : "border-white/90 shadow-[0_2px_6px_rgba(0,0,0,0.45)] z-10"
                        }`}
                      >
                        <span
                          className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] text-white"
                          style={{ fontSize: 9 }}
                        >
                          {shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 text-center">
                  H:{activeStop.hue}° · S:{activeStop.sat}% · L:{activeStop.light}%
                </div>
              </div>

              {/* Stop Controls, Lightness, Angle Dial & Hex Inputs */}
              <div className="space-y-4">
                {/* 3 Color Stop Selector Cards + Hex Inputs */}
                <div className="grid grid-cols-3 gap-2.5">
                  {STOP_META.map(({ idx, shortLabel, roleLabel }) => {
                    const stop = stagedConfig.wheelStops[idx];
                    const selected = activeStopIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveStopIdx(idx)}
                        className={`cursor-pointer rounded-xl p-2.5 border transition-all ${
                          selected
                            ? "border-zinc-900 dark:border-white bg-white/90 dark:bg-white/10 shadow-sm"
                            : "border-zinc-200/80 dark:border-white/10 bg-white/40 dark:bg-black/20 hover:border-zinc-400 dark:hover:border-white/25"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
                            {shortLabel}. {roleLabel.split(" ")[0]}
                          </span>
                          <label className="relative w-4 h-4 rounded-full overflow-hidden border border-white/60 shadow shrink-0 cursor-pointer">
                            <input
                              type="color"
                              value={stop.hex}
                              onChange={(e) =>
                                updateStopAt(
                                  idx,
                                  makeStopFromHex(
                                    STOP_META[idx].id,
                                    e.target.value
                                  )
                                )
                              }
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <span
                              className="block w-full h-full"
                              style={{ backgroundColor: stop.hex }}
                            />
                          </label>
                        </div>

                        <input
                          type="text"
                          value={hexDrafts[idx]}
                          maxLength={7}
                          onFocus={() => setActiveStopIdx(idx)}
                          onChange={(e) => handleHexChange(idx, e.target.value)}
                          className="w-full px-2 py-1 rounded-md text-xs font-mono uppercase bg-zinc-100/90 dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Active Stop Lightness / Brightness Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Stop {activeStopIdx + 1} Lightness ({STOP_META[activeStopIdx].roleLabel})
                    </span>
                    <span className="font-mono text-zinc-500 dark:text-zinc-400">
                      {activeStop.light}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={88}
                    value={activeStop.light}
                    onChange={(e) =>
                      updateStopAt(
                        activeStopIdx,
                        makeStopFromHsl(
                          STOP_META[activeStopIdx].id,
                          activeStop.hue,
                          activeStop.sat,
                          Number(e.target.value)
                        )
                      )
                    }
                    className="w-full h-2.5 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(90deg, hsl(${activeStop.hue}, ${activeStop.sat}%, 12%), hsl(${activeStop.hue}, ${activeStop.sat}%, 50%), hsl(${activeStop.hue}, ${activeStop.sat}%, 88%))`,
                    }}
                  />
                </div>

                {/* Gradient Vector Angle (0°–360°) Slider + Live Ribbon */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Compass size={13} className="text-themeAccent" />
                      Gradient Vector Angle
                    </span>
                    <span className="font-mono text-zinc-500 dark:text-zinc-400">
                      {stagedConfig.gradAngle}°
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={stagedConfig.gradAngle}
                      onChange={(e) =>
                        setStagedConfig((prev) => ({
                          ...prev,
                          gradAngle: Number(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 rounded-lg accent-blue-500 cursor-pointer"
                    />
                    <div
                      className="w-24 h-6 rounded-lg border border-white/30 shadow-inner shrink-0"
                      style={{ backgroundImage: previewGradientCss }}
                      title={`Active ${stagedConfig.gradAngle}° gradient`}
                    />
                  </div>
                </div>

                {/* Save Custom Preset Row */}
                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    placeholder="Custom preset name (optional)…"
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white/80 dark:bg-black/35 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomPreset}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-zinc-300 dark:border-white/15 bg-white/90 dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/15 text-zinc-800 dark:text-white flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Save size={13} />
                    Save Custom Preset
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Liquid Glass Physics Sliders */}
          <section className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/55 dark:bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Droplets size={13} className="text-themeAccent" />
                4 · Liquid Glass Optical Physics
              </h3>
              <button
                type="button"
                onClick={() =>
                  setStagedConfig((prev) => ({
                    ...prev,
                    glassBlur: 26,
                    glassOpacity: prev.colorMode === "light" ? 0.7 : 0.62,
                  }))
                }
                className="text-[10.5px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={11} />
                Reset Optics
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Frost Blur Intensity */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Frost Blur Intensity
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    {stagedConfig.glassBlur}px{" "}
                    {stagedConfig.glassBlur <= 14
                      ? "(Crystal)"
                      : stagedConfig.glassBlur <= 30
                      ? "(Liquid)"
                      : "(Spatial Frost)"}
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={44}
                  step={1}
                  value={stagedConfig.glassBlur}
                  onChange={(e) =>
                    setStagedConfig((prev) => ({
                      ...prev,
                      glassBlur: Number(e.target.value),
                    }))
                  }
                  className="w-full h-2 rounded-lg accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9.5px] text-zinc-400 mt-1">
                  <span>8px Crystal</span>
                  <span>24px Liquid</span>
                  <span>44px Deep Spatial</span>
                </div>
              </div>

              {/* Surface Translucency */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Surface Density / Opacity
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    {Math.round(stagedConfig.glassOpacity * 100)}%{" "}
                    {stagedConfig.glassOpacity <= 0.42
                      ? "(Ultra-Sheer)"
                      : stagedConfig.glassOpacity <= 0.74
                      ? "(Balanced)"
                      : "(Smoked Solid)"}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.25}
                  max={0.92}
                  step={0.01}
                  value={stagedConfig.glassOpacity}
                  onChange={(e) =>
                    setStagedConfig((prev) => ({
                      ...prev,
                      glassOpacity: Number(e.target.value),
                    }))
                  }
                  className="w-full h-2 rounded-lg accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9.5px] text-zinc-400 mt-1">
                  <span>25% Sheer</span>
                  <span>65% Balanced</span>
                  <span>92% Smoked</span>
                </div>
              </div>
            </div>
          </section>
          {/* 5. Typography Font Kit & Sizing Engine */}
          <section className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/55 dark:bg-white/[0.03] p-4 sm:p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Type size={13} className="text-themeAccent" />
                  5 · Typography Font Kit &amp; Sizing Engine
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Choose bespoke typefaces for letters &amp; numbers, plus global small / medium / large interface scale
                </p>
              </div>

              {/* Sizing Selector (Small, Medium, Large) */}
              <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-white/10 p-1 rounded-xl">
                {(["small", "medium", "large"] as const).map((sz) => {
                  const isCurrent = stagedFontKit.fontSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        setStagedFontKit((prev) => ({
                          ...prev,
                          fontSize: sz,
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        isCurrent
                          ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Letter Fonts (Font Kit) */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                <Type size={11} />
                <span>Letter &amp; Interface Typeface</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {FONT_KIT_PRESETS.map((font) => {
                  const isSelected = stagedFontKit.letterFontId === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() =>
                        setStagedFontKit((prev) => ({
                          ...prev,
                          letterFontId: font.id as FontPresetId,
                          letterFont: font.fontFamily,
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-blue-500/70 bg-blue-500/10 dark:bg-blue-500/20 shadow-sm"
                          : "border-zinc-200/70 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] hover:border-zinc-400 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ fontFamily: font.fontFamily }}
                        >
                          Aa Bb Cc
                        </span>
                        {isSelected && <Check size={14} className="text-blue-500 shrink-0" />}
                      </div>
                      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {font.name.split(" (")[0]}
                      </div>
                      <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {font.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number & Telemetry Fonts */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                <Binary size={11} />
                <span>Number, Currency &amp; Clock Figures</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {NUMBER_FONT_PRESETS.map((num) => {
                  const isSelected = stagedFontKit.numberFontId === num.id;
                  return (
                    <button
                      key={num.id}
                      type="button"
                      onClick={() =>
                        setStagedFontKit((prev) => ({
                          ...prev,
                          numberFontId: num.id,
                          numberFont: num.fontFamily,
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-purple-500/70 bg-purple-500/10 dark:bg-purple-500/20 shadow-sm"
                          : "border-zinc-200/70 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] hover:border-zinc-400 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-mono font-bold text-themeAccent"
                          style={{ fontFamily: num.fontFamily }}
                        >
                          $1,234.56 · 12:00
                        </span>
                        {isSelected && <Check size={14} className="text-purple-500 shrink-0" />}
                      </div>
                      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {num.name.split(" (")[0]}
                      </div>
                      <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {num.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200/70 dark:border-white/10 bg-white/40 dark:bg-black/30 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundImage: previewGradientCss }}
            />
            Syncs instantaneously across Command Cockpit &amp; all Living OS modules
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSavingRemote}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center gap-1.5 disabled:opacity-60"
              style={{ backgroundImage: previewGradientCss }}
            >
              <Check size={15} />
              {isSavingRemote ? "Saving…" : "Apply Theme"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
