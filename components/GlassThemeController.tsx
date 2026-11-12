"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  applyGlassThemeToDocument,
  DEFAULT_GLASS_THEME,
  GLASS_THEME_EVENT,
  GLASS_THEME_STORAGE_KEY,
  GlassThemeConfig,
  loadGlassThemeFromStorage,
  normalizeGlassThemeConfig,
} from "@/lib/glassTheme";
import {
  applyFontKitToDocument,
  DEFAULT_FONT_KIT,
  FONT_KIT_EVENT,
  FONT_KIT_STORAGE_KEY,
  FontKitConfig,
  loadFontKitFromStorage,
} from "@/lib/fontTheme";

export function GlassThemeController() {
  const { setTheme } = useTheme();
  const [activePreset, setActivePreset] = useState<string>(
    DEFAULT_GLASS_THEME.presetId
  );
  const userChangedSinceMountRef = useRef(false);
  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;

  useEffect(() => {
    const hasLocalSaved =
      typeof window !== "undefined" &&
      Boolean(localStorage.getItem(GLASS_THEME_STORAGE_KEY));

    const initial = loadGlassThemeFromStorage();
    applyGlassThemeToDocument(initial, { persist: !hasLocalSaved, dispatch: false });
    setActivePreset(initial.presetId);
    setThemeRef.current(initial.colorMode);

    // Hydrate Font Kit & Sizing
    const hasFontSaved =
      typeof window !== "undefined" &&
      Boolean(localStorage.getItem(FONT_KIT_STORAGE_KEY));
    const initialFont = loadFontKitFromStorage();
    applyFontKitToDocument(initialFont, { persist: !hasFontSaved, dispatch: false });

    const onFontEvent = (e: Event) => {
      const fontEvt = e as CustomEvent<FontKitConfig>;
      if (fontEvt.detail) {
        applyFontKitToDocument(fontEvt.detail, { persist: false, dispatch: false });
      }
    };
    window.addEventListener(FONT_KIT_EVENT, onFontEvent);

    const onThemeEvent = (e: Event) => {
      userChangedSinceMountRef.current = true;
      const customEvt = e as CustomEvent<GlassThemeConfig>;
      if (customEvt.detail) {
        setActivePreset(customEvt.detail.presetId);
        setThemeRef.current(customEvt.detail.colorMode);
      }
    };

    window.addEventListener(GLASS_THEME_EVENT, onThemeEvent);

    let cancelled = false;
    fetch("/api/ui-preferences", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || userChangedSinceMountRef.current) return;
        if (data?.persisted && data?.theme) {
          const remoteCfg = normalizeGlassThemeConfig(data.theme);
          applyGlassThemeToDocument(remoteCfg, {
            persist: true,
            dispatch: false,
          });
          setActivePreset(remoteCfg.presetId);
          setThemeRef.current(remoteCfg.colorMode);
        }
      })
      .catch(() => {
        // Resilient offline fallback: localStorage config stays active
      });

    return () => {
      cancelled = true;
      window.removeEventListener(GLASS_THEME_EVENT, onThemeEvent);
      window.removeEventListener(FONT_KIT_EVENT, onFontEvent);
    };
  }, []);

  const isSpatial = activePreset === "aura-spatial";

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
      style={{
        backgroundColor: "var(--glass-bg-base)",
        transition: "background-color 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Spatial Architectural Studio Depth cues for VisionOS Aura Warm Preset */}
      {isSpatial && (
        <div className="absolute inset-0 opacity-90">
          {/* Warm architectural walnut & sunlit plaster spatial depth planes */}
          <div
            className="absolute -top-12 left-[14%] w-[24vw] h-[55vh] rounded-3xl blur-[54px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(68, 44, 25, 0.58) 0%, rgba(112, 78, 48, 0.28) 100%)",
            }}
          />
          <div
            className="absolute -top-8 right-[12%] w-[26vw] h-[58vh] rounded-3xl blur-[58px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(64, 42, 24, 0.55) 0%, rgba(120, 86, 56, 0.24) 100%)",
            }}
          />
          <div
            className="absolute top-[8%] left-[38%] w-[30vw] h-[72vh] rounded-full blur-[72px]"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 247, 235, 0.78) 0%, rgba(235, 216, 192, 0.2) 70%, transparent 100%)",
            }}
          />
          <div
            className="absolute bottom-[-8%] left-[18%] right-[14%] h-[34vh] rounded-full blur-[64px]"
            style={{
              background:
                "linear-gradient(90deg, rgba(94, 65, 40, 0.42) 0%, rgba(186, 145, 102, 0.48) 52%, rgba(78, 54, 34, 0.44) 100%)",
            }}
          />
        </div>
      )}

      {/* Primary Top-Left Liquid Mesh Orb */}
      <div
        className="absolute -top-[16%] -left-[10%] w-[62vw] h-[62vh] rounded-full blur-[110px] glass-aura-drift-slow"
        style={{
          background:
            "radial-gradient(circle, var(--glass-aura-1) 0%, transparent 70%)",
          transition: "background 0.35s ease",
        }}
      />

      {/* Secondary Right / Upper-Center Liquid Mesh Orb */}
      <div
        className="absolute top-[6%] -right-[12%] w-[58vw] h-[64vh] rounded-full blur-[120px] glass-aura-drift-reverse"
        style={{
          background:
            "radial-gradient(circle, var(--glass-aura-2) 0%, transparent 70%)",
          transition: "background 0.35s ease",
        }}
      />

      {/* Tertiary Bottom Ambient Underglow Orb */}
      <div
        className="absolute -bottom-[18%] left-[20%] w-[64vw] h-[58vh] rounded-full blur-[125px] glass-aura-drift-slow"
        style={{
          background:
            "radial-gradient(circle, var(--glass-aura-3) 0%, transparent 72%)",
          transition: "background 0.35s ease",
        }}
      />

      {/* Quaternary Center-Left Accent Bloom */}
      <div
        className="absolute top-[36%] left-[32%] w-[44vw] h-[44vh] rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, var(--glass-aura-4, var(--glass-aura-2)) 0%, transparent 72%)",
          transition: "background 0.35s ease",
        }}
      />

      {/* Subtle Optical Glass Diffusion Veil */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 85% at 50% 45%, transparent 35%, rgba(0, 0, 0, 0.06) 100%)",
        }}
      />
    </div>
  );
}

export default GlassThemeController;
