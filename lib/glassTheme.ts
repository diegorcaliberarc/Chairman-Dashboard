export type GlassPresetId =
  | "eco-glass"
  | "northpeak-light"
  | "northpeak-dark"
  | "aura-spatial"
  | "obsidian-gold"
  | "cyber-emerald"
  | "crimson-velvet"
  | "custom";

export type GlassColorMode = "light" | "dark";

export type GlassWheelStopId = "primary" | "secondary" | "aura";

export interface GlassWheelStop {
  id: GlassWheelStopId;
  hue: number; // 0..360
  sat: number; // 0..100
  light: number; // 0..100
  hex: string; // #RRGGBB
}

export interface GlassThemeConfig {
  presetId: GlassPresetId;
  colorMode: GlassColorMode;
  wheelStops: [GlassWheelStop, GlassWheelStop, GlassWheelStop];
  gradAngle: number; // 0..360
  glassBlur: number; // 8..44 (px)
  glassOpacity: number; // 0.25..0.92
}

export interface SavedCustomGlassTheme {
  id: string;
  name: string;
  config: GlassThemeConfig;
  createdAt: string;
}

export interface GlassPresetDefinition {
  id: Exclude<GlassPresetId, "custom">;
  name: string;
  subtitle: string;
  badge: string;
  colorMode: GlassColorMode;
  isSpatial?: boolean;
  bgBase: string;
  surfaceRgb: string;
  surfaceElevatedRgb: string;
  borderRgba: string;
  specularTopRgba: string;
  specularSideRgba: string;
  shadowCss: string;
  textPrimary: string;
  textMuted: string;
  aura1: string;
  aura2: string;
  aura3: string;
  aura4: string;
  defaultConfig: GlassThemeConfig;
}

export const GLASS_THEME_STORAGE_KEY = "chairman-glass-theme-v1";
export const SAVED_CUSTOM_GLASS_THEMES_KEY = "chairman-saved-glass-themes-v1";
export const GLASS_THEME_EVENT = "chairmanGlassThemeChanged";

// ─── Pure Color Conversion Utilities (HSL <-> Hex <-> RGB) ───────────────────

export function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, val));
}

export function normalizeHex(input: string, fallback = "#3B82F6"): string {
  if (!input || typeof input !== "string") return fallback;
  const trimmed = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = normalizeHex(hex).slice(1);
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function hexToRgbTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hue < 60) {
    r1 = c;
    g1 = x;
  } else if (hue < 120) {
    r1 = x;
    g1 = c;
  } else if (hue < 180) {
    g1 = c;
    b1 = x;
  } else if (hue < 240) {
    g1 = x;
    b1 = c;
  } else if (hue < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = 60 * (((g - b) / d) % 6);
        break;
      case g:
        h = 60 * ((b - r) / d + 2);
        break;
      case b:
        h = 60 * ((r - g) / d + 4);
        break;
    }
  }

  if (h < 0) h += 360;

  return {
    h: Math.round(h) % 360,
    s: Math.round(clamp(s * 100, 0, 100)),
    l: Math.round(clamp(l * 100, 0, 100)),
  };
}

export function makeStopFromHex(
  id: GlassWheelStopId,
  hex: string
): GlassWheelStop {
  const clean = normalizeHex(hex);
  const { h, s, l } = hexToHsl(clean);
  return { id, hue: h, sat: s, light: l, hex: clean };
}

export function makeStopFromHsl(
  id: GlassWheelStopId,
  hue: number,
  sat: number,
  light: number
): GlassWheelStop {
  const h = ((Math.round(hue) % 360) + 360) % 360;
  const s = Math.round(clamp(sat, 0, 100));
  const l = Math.round(clamp(light, 5, 95));
  return {
    id,
    hue: h,
    sat: s,
    light: l,
    hex: hslToHex(h, s, l),
  };
}

// ─── 6 Rich Built-In Liquid Glass Presets ─────────────────────────────────────

export const GLASS_PRESETS: GlassPresetDefinition[] = [
  {
    id: "eco-glass",
    name: "Eco Ambient Glass (Zia)",
    subtitle: "Warm out-of-focus architectural depth with smoky frosted glass, specular highlights & serene spacing",
    badge: "ECO HOME GLASS",
    colorMode: "dark",
    isSpatial: true,
    bgBase: "#090B10",
    surfaceRgb: "14, 18, 28",
    surfaceElevatedRgb: "22, 28, 42",
    borderRgba: "rgba(255, 255, 255, 0.12)",
    specularTopRgba: "rgba(255, 255, 255, 0.36)",
    specularSideRgba: "rgba(255, 255, 255, 0.14)",
    shadowCss:
      "0 24px 60px -16px rgba(0, 0, 0, 0.78), 0 4px 18px -4px rgba(245, 158, 11, 0.08)",
    textPrimary: "#F8FAFC",
    textMuted: "#94A3B8",
    aura1: "rgba(245, 158, 11, 0.22)",
    aura2: "rgba(99, 102, 241, 0.18)",
    aura3: "rgba(16, 185, 129, 0.14)",
    aura4: "rgba(217, 119, 6, 0.20)",
    defaultConfig: {
      presetId: "eco-glass",
      colorMode: "dark",
      wheelStops: [
        makeStopFromHex("primary", "#F59E0B"),
        makeStopFromHex("secondary", "#6366F1"),
        makeStopFromHex("aura", "#10B981"),
      ],
      gradAngle: 145,
      glassBlur: 28,
      glassOpacity: 0.58,
    },
  },
  {
    id: "northpeak-light",
    name: "Northpeak Pastel Glass",
    subtitle: "Airy white frost over pastel periwinkle, rose-peach & mint aura",
    badge: "LIGHT GLASS",
    colorMode: "light",
    bgBase: "#EEF2FF",
    surfaceRgb: "255, 255, 255",
    surfaceElevatedRgb: "255, 255, 255",
    borderRgba: "rgba(255, 255, 255, 0.84)",
    specularTopRgba: "rgba(255, 255, 255, 0.98)",
    specularSideRgba: "rgba(255, 255, 255, 0.68)",
    shadowCss:
      "0 18px 42px -14px rgba(59, 91, 175, 0.11), 0 4px 14px -4px rgba(15, 23, 42, 0.05)",
    textPrimary: "#0F172A",
    textMuted: "#475569",
    aura1: "rgba(116, 150, 255, 0.44)",
    aura2: "rgba(255, 166, 198, 0.40)",
    aura3: "rgba(134, 239, 218, 0.36)",
    aura4: "rgba(196, 181, 253, 0.38)",
    defaultConfig: {
      presetId: "northpeak-light",
      colorMode: "light",
      wheelStops: [
        makeStopFromHex("primary", "#3B6EF6"),
        makeStopFromHex("secondary", "#7C5CFA"),
        makeStopFromHex("aura", "#F48FB1"),
      ],
      gradAngle: 135,
      glassBlur: 26,
      glassOpacity: 0.72,
    },
  },
  {
    id: "northpeak-dark",
    name: "Northpeak Nebula Dark",
    subtitle: "Deep obsidian-navy frost over indigo, cobalt & violet nebula",
    badge: "NEBULA DARK",
    colorMode: "dark",
    bgBase: "#060813",
    surfaceRgb: "13, 17, 34",
    surfaceElevatedRgb: "19, 25, 48",
    borderRgba: "rgba(165, 180, 252, 0.16)",
    specularTopRgba: "rgba(255, 255, 255, 0.22)",
    specularSideRgba: "rgba(147, 197, 253, 0.12)",
    shadowCss:
      "0 20px 50px -14px rgba(2, 4, 15, 0.68), 0 4px 16px -4px rgba(59, 130, 246, 0.12)",
    textPrimary: "#F1F5F9",
    textMuted: "#94A3B8",
    aura1: "rgba(67, 97, 238, 0.36)",
    aura2: "rgba(139, 61, 225, 0.32)",
    aura3: "rgba(20, 184, 166, 0.20)",
    aura4: "rgba(219, 39, 119, 0.18)",
    defaultConfig: {
      presetId: "northpeak-dark",
      colorMode: "dark",
      wheelStops: [
        makeStopFromHex("primary", "#5B7CFA"),
        makeStopFromHex("secondary", "#9B5DE5"),
        makeStopFromHex("aura", "#2DD4BF"),
      ],
      gradAngle: 135,
      glassBlur: 26,
      glassOpacity: 0.62,
    },
  },
  {
    id: "aura-spatial",
    name: "Aura Warm Spatial (VisionOS)",
    subtitle: "Champagne & smoked-taupe spatial sheets over warm espresso-amber",
    badge: "VISIONOS SPATIAL",
    colorMode: "light",
    isSpatial: true,
    bgBase: "#C9B7A2",
    surfaceRgb: "238, 229, 217",
    surfaceElevatedRgb: "248, 242, 234",
    borderRgba: "rgba(255, 251, 245, 0.68)",
    specularTopRgba: "rgba(255, 253, 249, 0.92)",
    specularSideRgba: "rgba(255, 248, 238, 0.56)",
    shadowCss:
      "0 24px 56px -14px rgba(46, 31, 18, 0.26), 0 6px 18px -4px rgba(62, 42, 24, 0.12)",
    textPrimary: "#1B1510",
    textMuted: "#5C4E41",
    aura1: "rgba(96, 68, 44, 0.42)",
    aura2: "rgba(250, 236, 216, 0.64)",
    aura3: "rgba(168, 124, 81, 0.40)",
    aura4: "rgba(74, 53, 36, 0.34)",
    defaultConfig: {
      presetId: "aura-spatial",
      colorMode: "light",
      wheelStops: [
        makeStopFromHex("primary", "#A47148"),
        makeStopFromHex("secondary", "#6F4E37"),
        makeStopFromHex("aura", "#E6CCB2"),
      ],
      gradAngle: 135,
      glassBlur: 32,
      glassOpacity: 0.66,
    },
  },
  {
    id: "obsidian-gold",
    name: "Chairman Obsidian Gold",
    subtitle: "Sovereign black-onyx glass rimmed with 24k champagne speculars",
    badge: "SOVEREIGN",
    colorMode: "dark",
    bgBase: "#08080A",
    surfaceRgb: "16, 15, 13",
    surfaceElevatedRgb: "24, 22, 18",
    borderRgba: "rgba(201, 169, 97, 0.24)",
    specularTopRgba: "rgba(246, 226, 175, 0.32)",
    specularSideRgba: "rgba(201, 169, 97, 0.16)",
    shadowCss:
      "0 22px 52px -14px rgba(0, 0, 0, 0.76), 0 4px 18px -4px rgba(201, 169, 97, 0.12)",
    textPrimary: "#F5F2EB",
    textMuted: "#A8A090",
    aura1: "rgba(201, 169, 97, 0.26)",
    aura2: "rgba(146, 98, 36, 0.22)",
    aura3: "rgba(68, 64, 60, 0.28)",
    aura4: "rgba(234, 179, 8, 0.14)",
    defaultConfig: {
      presetId: "obsidian-gold",
      colorMode: "dark",
      wheelStops: [
        makeStopFromHex("primary", "#C9A961"),
        makeStopFromHex("secondary", "#E6C875"),
        makeStopFromHex("aura", "#9A6B28"),
      ],
      gradAngle: 135,
      glassBlur: 24,
      glassOpacity: 0.68,
    },
  },
  {
    id: "cyber-emerald",
    name: "Emerald Bio-Glass",
    subtitle: "Bioluminescent emerald & arctic-cyan deep longevity glass",
    badge: "BIO-OPS",
    colorMode: "dark",
    bgBase: "#050D0B",
    surfaceRgb: "9, 22, 19",
    surfaceElevatedRgb: "14, 31, 27",
    borderRgba: "rgba(52, 211, 153, 0.19)",
    specularTopRgba: "rgba(167, 243, 208, 0.25)",
    specularSideRgba: "rgba(45, 212, 191, 0.14)",
    shadowCss:
      "0 20px 48px -14px rgba(2, 12, 9, 0.74), 0 4px 18px -4px rgba(16, 185, 129, 0.14)",
    textPrimary: "#ECFDF5",
    textMuted: "#94A3B8",
    aura1: "rgba(16, 185, 129, 0.30)",
    aura2: "rgba(6, 182, 212, 0.26)",
    aura3: "rgba(59, 130, 246, 0.18)",
    aura4: "rgba(52, 211, 153, 0.16)",
    defaultConfig: {
      presetId: "cyber-emerald",
      colorMode: "dark",
      wheelStops: [
        makeStopFromHex("primary", "#10B981"),
        makeStopFromHex("secondary", "#06B6D4"),
        makeStopFromHex("aura", "#34D399"),
      ],
      gradAngle: 135,
      glassBlur: 26,
      glassOpacity: 0.6,
    },
  },
  {
    id: "crimson-velvet",
    name: "Crimson Velvet Glass",
    subtitle: "Smoked ruby-obsidian sheets over rose-crimson & amethyst glow",
    badge: "VELVET",
    colorMode: "dark",
    bgBase: "#0D060A",
    surfaceRgb: "24, 11, 17",
    surfaceElevatedRgb: "34, 15, 24",
    borderRgba: "rgba(251, 113, 133, 0.20)",
    specularTopRgba: "rgba(255, 228, 230, 0.24)",
    specularSideRgba: "rgba(244, 63, 94, 0.14)",
    shadowCss:
      "0 22px 50px -14px rgba(12, 2, 6, 0.76), 0 4px 18px -4px rgba(244, 63, 94, 0.14)",
    textPrimary: "#FFF1F2",
    textMuted: "#A1A1AA",
    aura1: "rgba(244, 63, 94, 0.30)",
    aura2: "rgba(168, 85, 247, 0.25)",
    aura3: "rgba(251, 146, 60, 0.16)",
    aura4: "rgba(236, 72, 153, 0.20)",
    defaultConfig: {
      presetId: "crimson-velvet",
      colorMode: "dark",
      wheelStops: [
        makeStopFromHex("primary", "#F43F5E"),
        makeStopFromHex("secondary", "#A855F7"),
        makeStopFromHex("aura", "#FB7185"),
      ],
      gradAngle: 135,
      glassBlur: 26,
      glassOpacity: 0.64,
    },
  },
];

export const DEFAULT_GLASS_THEME: GlassThemeConfig =
  GLASS_PRESETS[1].defaultConfig; // Northpeak Nebula Dark default

export function getPresetById(
  id: GlassPresetId
): GlassPresetDefinition | undefined {
  if (id === "custom") return undefined;
  return GLASS_PRESETS.find((p) => p.id === id);
}

// ─── Config Normalization & Validation ────────────────────────────────────────

const VALID_PRESET_IDS = new Set<GlassPresetId>([
  "northpeak-light",
  "northpeak-dark",
  "aura-spatial",
  "obsidian-gold",
  "cyber-emerald",
  "crimson-velvet",
  "custom",
]);

const STOP_IDS: [GlassWheelStopId, GlassWheelStopId, GlassWheelStopId] = [
  "primary",
  "secondary",
  "aura",
];

export function normalizeGlassThemeConfig(raw: any): GlassThemeConfig {
  if (!raw || typeof raw !== "object") {
    return structuredCloneConfig(DEFAULT_GLASS_THEME);
  }

  const presetCandidate = (raw.presetId ?? raw.glass_preset) as GlassPresetId;
  const presetId: GlassPresetId = VALID_PRESET_IDS.has(presetCandidate)
    ? presetCandidate
    : "northpeak-dark";

  const presetDef = getPresetById(presetId);
  const rawMode = raw.colorMode ?? raw.color_mode;
  const colorMode: GlassColorMode =
    rawMode === "light" || rawMode === "dark"
      ? rawMode
      : presetDef?.colorMode ?? "dark";

  const rawStops = Array.isArray(raw.wheelStops ?? raw.wheel_stops)
    ? (raw.wheelStops ?? raw.wheel_stops)
    : presetDef?.defaultConfig.wheelStops ?? DEFAULT_GLASS_THEME.wheelStops;

  const normalizedStops = STOP_IDS.map((stopId, idx) => {
    const candidate = rawStops[idx];
    if (candidate && typeof candidate === "object") {
      if (
        typeof candidate.hue === "number" &&
        typeof candidate.sat === "number" &&
        typeof candidate.light === "number"
      ) {
        return makeStopFromHsl(
          stopId,
          candidate.hue,
          candidate.sat,
          candidate.light
        );
      }
      if (typeof candidate.hex === "string") {
        return makeStopFromHex(stopId, candidate.hex);
      }
    }
    return (
      presetDef?.defaultConfig.wheelStops[idx] ??
      DEFAULT_GLASS_THEME.wheelStops[idx]
    );
  }) as [GlassWheelStop, GlassWheelStop, GlassWheelStop];

  const gradAngle = clamp(
    Number(raw.gradAngle ?? raw.grad_angle ?? 135),
    0,
    360
  );
  const glassBlur = clamp(
    Math.round(Number(raw.glassBlur ?? raw.glass_blur ?? 26)),
    8,
    44
  );
  const glassOpacity = Number(
    clamp(Number(raw.glassOpacity ?? raw.glass_opacity ?? 0.62), 0.25, 0.92).toFixed(
      2
    )
  );

  return {
    presetId,
    colorMode,
    wheelStops: normalizedStops,
    gradAngle,
    glassBlur,
    glassOpacity,
  };
}

export function structuredCloneConfig(
  cfg: GlassThemeConfig
): GlassThemeConfig {
  return {
    presetId: cfg.presetId,
    colorMode: cfg.colorMode,
    gradAngle: cfg.gradAngle,
    glassBlur: cfg.glassBlur,
    glassOpacity: cfg.glassOpacity,
    wheelStops: [
      { ...cfg.wheelStops[0] },
      { ...cfg.wheelStops[1] },
      { ...cfg.wheelStops[2] },
    ],
  };
}

// ─── CSS Custom Properties Engine ─────────────────────────────────────────────

export function computeGlassCssVariables(
  config: GlassThemeConfig
): Record<string, string> {
  const preset = getPresetById(config.presetId);
  const [primary, secondary, aura] = config.wheelStops;

  const pRgb = hexToRgb(primary.hex);
  const sRgb = hexToRgb(secondary.hex);
  const aRgb = hexToRgb(aura.hex);

  const pTriplet = `${pRgb.r}, ${pRgb.g}, ${pRgb.b}`;
  const sTriplet = `${sRgb.r}, ${sRgb.g}, ${sRgb.b}`;
  const aTriplet = `${aRgb.r}, ${aRgb.g}, ${aRgb.b}`;

  const isLight = config.colorMode === "light";
  const opacity = clamp(config.glassOpacity, 0.25, 0.92);
  const elevatedOpacity = clamp(opacity + 0.12, 0.35, 0.96);

  // Determine base, surface, speculars, and ambient mesh orbs
  let bgBase: string;
  let surfaceRgb: string;
  let surfaceElevatedRgb: string;
  let borderRgba: string;
  let specularTopRgba: string;
  let specularSideRgba: string;
  let shadowCss: string;
  let textPrimary: string;
  let textMuted: string;
  let aura1: string;
  let aura2: string;
  let aura3: string;
  let aura4: string;

  if (preset) {
    bgBase = preset.bgBase;
    surfaceRgb = preset.surfaceRgb;
    surfaceElevatedRgb = preset.surfaceElevatedRgb;
    borderRgba = preset.borderRgba;
    specularTopRgba = preset.specularTopRgba;
    specularSideRgba = preset.specularSideRgba;
    shadowCss = preset.shadowCss;
    textPrimary = preset.textPrimary;
    textMuted = preset.textMuted;
    aura1 = preset.aura1;
    aura2 = preset.aura2;
    aura3 = preset.aura3;
    aura4 = preset.aura4;
  } else {
    // Custom 360° Color Wheel physics!
    if (isLight) {
      // Soft tinted porcelain base + crisp white frost
      const tintR = Math.round(244 + (pRgb.r - 244) * 0.06);
      const tintG = Math.round(246 + (pRgb.g - 246) * 0.06);
      const tintB = Math.round(252 + (pRgb.b - 252) * 0.08);
      bgBase = rgbToHex(tintR, tintG, tintB);
      surfaceRgb = "255, 255, 255";
      surfaceElevatedRgb = "255, 255, 255";
      borderRgba = "rgba(255, 255, 255, 0.82)";
      specularTopRgba = "rgba(255, 255, 255, 0.97)";
      specularSideRgba = "rgba(255, 255, 255, 0.65)";
      shadowCss = `0 18px 42px -14px rgba(${pTriplet}, 0.14), 0 4px 14px -4px rgba(15, 23, 42, 0.06)`;
      textPrimary = "#0F172A";
      textMuted = "#475569";
      aura1 = `rgba(${pTriplet}, 0.36)`;
      aura2 = `rgba(${sTriplet}, 0.34)`;
      aura3 = `rgba(${aTriplet}, 0.34)`;
      aura4 = `rgba(${sTriplet}, 0.22)`;
    } else {
      // Deep tinted obsidian-nebula base + luminous tinted frost rim
      const baseR = Math.round(6 + pRgb.r * 0.035);
      const baseG = Math.round(8 + pRgb.g * 0.035);
      const baseB = Math.round(15 + pRgb.b * 0.045);
      bgBase = rgbToHex(baseR, baseG, baseB);
      const surfR = Math.round(12 + pRgb.r * 0.05);
      const surfG = Math.round(15 + pRgb.g * 0.05);
      const surfB = Math.round(26 + sRgb.b * 0.06);
      surfaceRgb = `${surfR}, ${surfG}, ${surfB}`;
      surfaceElevatedRgb = `${Math.min(255, surfR + 8)}, ${Math.min(
        255,
        surfG + 9
      )}, ${Math.min(255, surfB + 14)}`;
      borderRgba = `rgba(${pTriplet}, 0.22)`;
      specularTopRgba = "rgba(255, 255, 255, 0.22)";
      specularSideRgba = `rgba(${sTriplet}, 0.14)`;
      shadowCss = `0 22px 50px -14px rgba(0, 0, 0, 0.72), 0 4px 18px -4px rgba(${pTriplet}, 0.14)`;
      textPrimary = "#F1F5F9";
      textMuted = "#94A3B8";
      aura1 = `rgba(${pTriplet}, 0.34)`;
      aura2 = `rgba(${sTriplet}, 0.30)`;
      aura3 = `rgba(${aTriplet}, 0.26)`;
      aura4 = `rgba(${pTriplet}, 0.18)`;
    }
  }

  return {
    "--theme-grad-start": primary.hex,
    "--theme-grad-end": secondary.hex,
    "--theme-grad-aura": aura.hex,
    "--theme-grad-angle": `${config.gradAngle}deg`,
    "--theme-grad-start-rgb": pTriplet,
    "--theme-grad-end-rgb": sTriplet,
    "--theme-grad-aura-rgb": aTriplet,
    "--color-primary": primary.hex,
    "--color-primary-hover": secondary.hex,
    "--color-glow": `rgba(${pTriplet}, 0.45)`,
    "--glass-bg-base": bgBase,
    "--glass-surface-rgb": surfaceRgb,
    "--glass-surface": `rgba(${surfaceRgb}, ${opacity})`,
    "--glass-surface-elevated": `rgba(${surfaceElevatedRgb}, ${elevatedOpacity})`,
    "--glass-border": borderRgba,
    "--glass-specular": specularTopRgba,
    "--glass-specular-side": specularSideRgba,
    "--glass-shadow": shadowCss,
    "--glass-blur": `${config.glassBlur}px`,
    "--glass-opacity": String(opacity),
    "--glass-text-primary": textPrimary,
    "--glass-text-muted": textMuted,
    "--glass-aura-1": aura1,
    "--glass-aura-2": aura2,
    "--glass-aura-3": aura3,
    "--glass-aura-4": aura4,
    "--bg-primary": bgBase,
    "--text-primary": textPrimary,
  };
}

export function applyGlassThemeToDocument(
  config: GlassThemeConfig,
  options: { persist?: boolean; dispatch?: boolean } = {}
): void {
  if (typeof document === "undefined") return;
  const { persist = true, dispatch = true } = options;

  const normalized = normalizeGlassThemeConfig(config);
  const vars = computeGlassCssVariables(normalized);
  const root = document.documentElement;

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  root.dataset.glassPreset = normalized.presetId;
  root.dataset.glassMode = normalized.colorMode;

  if (persist && typeof window !== "undefined") {
    try {
      localStorage.setItem("theme-grad-start", normalized.wheelStops[0].hex);
      localStorage.setItem("theme-grad-end", normalized.wheelStops[1].hex);
      localStorage.setItem(
        GLASS_THEME_STORAGE_KEY,
        JSON.stringify(normalized)
      );
    } catch {
      // Ignore storage quota / privacy mode errors
    }

    if (dispatch) {
      window.dispatchEvent(
        new CustomEvent(GLASS_THEME_EVENT, { detail: normalized })
      );
    }
  }
}

export function loadGlassThemeFromStorage(): GlassThemeConfig {
  if (typeof window === "undefined") {
    return structuredCloneConfig(DEFAULT_GLASS_THEME);
  }
  try {
    const raw = localStorage.getItem(GLASS_THEME_STORAGE_KEY);
    if (raw) {
      return normalizeGlassThemeConfig(JSON.parse(raw));
    }
    // Backwards-compatibility with legacy dual-hex storage
    const legacyLeft = localStorage.getItem("theme-grad-start");
    const legacyRight = localStorage.getItem("theme-grad-end");
    if (legacyLeft && legacyRight) {
      return normalizeGlassThemeConfig({
        ...DEFAULT_GLASS_THEME,
        wheelStops: [
          makeStopFromHex("primary", legacyLeft),
          makeStopFromHex("secondary", legacyRight),
          DEFAULT_GLASS_THEME.wheelStops[2],
        ],
      });
    }
  } catch {
    // Fall through
  }
  return structuredCloneConfig(DEFAULT_GLASS_THEME);
}

export function loadSavedCustomThemes(): SavedCustomGlassTheme[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_CUSTOM_GLASS_THEMES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          id: String(item.id || `custom-${idx}`),
          name: String(item.name || `Custom Glass ${idx + 1}`),
          config: normalizeGlassThemeConfig(item.config || item),
          createdAt: String(item.createdAt || new Date().toISOString()),
        }));
      }
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export function saveCustomThemesToStorage(
  themes: SavedCustomGlassTheme[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_CUSTOM_GLASS_THEMES_KEY, JSON.stringify(themes));
  } catch {
    // Ignore storage errors
  }
}
