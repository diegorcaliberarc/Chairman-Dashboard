export type FontPresetId =
  | "inter"
  | "system"
  | "jakarta"
  | "outfit"
  | "space-grotesk"
  | "fira-code"
  | "jetbrains-mono"
  | "cinzel"
  | "playfair"
  | "custom";

export type NumberFontPresetId =
  | "match-text"
  | "jetbrains-mono"
  | "fira-code"
  | "space-grotesk"
  | "tabular-sans"
  | "digital-mono";

export type AppFontSize = "small" | "medium" | "large";

export interface FontKitItem {
  id: string;
  name: string;
  category: "sans" | "serif" | "mono" | "display";
  fontFamily: string;
  googleFontFamily?: string;
  description: string;
}

export interface FontKitConfig {
  letterFont: string; // Font family css string
  letterFontId: FontPresetId;
  numberFont: string; // Number font family css string
  numberFontId: NumberFontPresetId;
  fontSize: AppFontSize;
}

export const FONT_KIT_STORAGE_KEY = "chairman-font-kit-v1";
export const FONT_KIT_EVENT = "chairmanFontKitChanged";

export const FONT_KIT_PRESETS: FontKitItem[] = [
  {
    id: "inter",
    name: "Inter (Executive Neo-Grotesque)",
    category: "sans",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    googleFontFamily: "Inter:wght@400;500;600;700;800",
    description: "Crisp, ultra-legible Swiss-style interface typography.",
  },
  {
    id: "jakarta",
    name: "Plus Jakarta Sans (Liquid Modern)",
    category: "sans",
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    googleFontFamily: "Plus+Jakarta+Sans:wght@400;500;600;700;800",
    description: "Lush contemporary geometry tailored for glassmorphic interfaces.",
  },
  {
    id: "outfit",
    name: "Outfit (Spatial VisionOS)",
    category: "sans",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    googleFontFamily: "Outfit:wght@400;500;600;700;800",
    description: "Warm, expansive geometric sans inspired by spatial computing.",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk (Tech Cockpit)",
    category: "sans",
    fontFamily: "'Space Grotesk', sans-serif",
    googleFontFamily: "Space+Grotesk:wght@400;500;600;700",
    description: "Futuristic proportional sans with aerospace telemetric character.",
  },
  {
    id: "cinzel",
    name: "Cinzel Decorative (Imperial Chairman)",
    category: "serif",
    fontFamily: "'Cinzel', Georgia, serif",
    googleFontFamily: "Cinzel:wght@500;700;800",
    description: "Classical Roman monument proportions for commanding authority.",
  },
  {
    id: "playfair",
    name: "Playfair Display (Haute Horlogerie)",
    category: "serif",
    fontFamily: "'Playfair Display', Georgia, serif",
    googleFontFamily: "Playfair+Display:ital,wght@0,600;0,700;1,400",
    description: "High-contrast editorial serif reminiscent of luxury Swiss dials.",
  },
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono (Architect Developer)",
    category: "mono",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    googleFontFamily: "JetBrains+Mono:wght@400;500;700;800",
    description: "Precision monospaced code font with unmistakable optical clarity.",
  },
  {
    id: "fira-code",
    name: "Fira Code (Telemetry Matrix)",
    category: "mono",
    fontFamily: "'Fira Code', monospace",
    googleFontFamily: "Fira+Code:wght@400;500;700",
    description: "Engineered ligatures and balanced rhythm for telemetry arrays.",
  },
  {
    id: "system",
    name: "System Native (Apple SF / Segoe UI)",
    category: "sans",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    description: "Zero network latency native OS font stack.",
  },
];

export const NUMBER_FONT_PRESETS: Array<{
  id: NumberFontPresetId;
  name: string;
  fontFamily: string;
  description: string;
}> = [
  {
    id: "match-text",
    name: "Match Letter Font (Harmonic)",
    fontFamily: "inherit",
    description: "Numbers share the identical typeface as body copy.",
  },
  {
    id: "jetbrains-mono",
    name: "JetBrains Monospaced (Tabular Telemetry)",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    description: "Guarantees zero-jitter fixed-width tabular figures.",
  },
  {
    id: "fira-code",
    name: "Fira Code Numbers (Matrix)",
    fontFamily: "'Fira Code', monospace",
    description: "Laser-cut numeric glyphs for financial and shift ledgers.",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk Figures (Futuristic)",
    fontFamily: "'Space Grotesk', sans-serif",
    description: "Geometric tabular numerals with cockpit aesthetic.",
  },
  {
    id: "digital-mono",
    name: "Digital Segment LCD (Celestial Dial)",
    fontFamily: "'JetBrains Mono', monospace",
    description: "Glowing electronic chronometer styling for digital clock readouts.",
  },
  {
    id: "tabular-sans",
    name: "Inter Tabular Numbers",
    fontFamily: "'Inter', sans-serif",
    description: "Proportional sans with font-variant-numeric: tabular-nums.",
  },
];

export const DEFAULT_FONT_KIT: FontKitConfig = {
  letterFont: FONT_KIT_PRESETS[1].fontFamily, // Plus Jakarta Sans
  letterFontId: "jakarta",
  numberFont: NUMBER_FONT_PRESETS[5].fontFamily, // Inter Tabular Clean Sans
  numberFontId: "tabular-sans",
  fontSize: "medium",
};

export const FONT_SIZE_SCALES: Record<
  AppFontSize,
  {
    rootSize: string;
    label: string;
    description: string;
    bodyScale: string;
    headingScale: string;
    dialScale: number;
  }
> = {
  small: {
    rootSize: "14px",
    label: "Small (Compact Executive)",
    description: "Higher information density for 13\" laptops & dense multi-monitor dashboards.",
    bodyScale: "0.92",
    headingScale: "0.92",
    dialScale: 0.92,
  },
  medium: {
    rootSize: "16px",
    label: "Medium (Balanced Standard)",
    description: "Default standard optical balance for desktop and tablets.",
    bodyScale: "1",
    headingScale: "1",
    dialScale: 1,
  },
  large: {
    rootSize: "18px",
    label: "Large (Expanded Legibility)",
    description: "Generous comfortable text sizing for 4K displays or high-readability setups.",
    bodyScale: "1.08",
    headingScale: "1.08",
    dialScale: 1.08,
  },
};

export function loadFontKitFromStorage(): FontKitConfig {
  if (typeof window === "undefined") return DEFAULT_FONT_KIT;
  try {
    const raw = localStorage.getItem(FONT_KIT_STORAGE_KEY);
    if (!raw) return DEFAULT_FONT_KIT;
    const parsed = JSON.parse(raw);
    return {
      letterFont: parsed.letterFont || DEFAULT_FONT_KIT.letterFont,
      letterFontId: parsed.letterFontId || DEFAULT_FONT_KIT.letterFontId,
      numberFont: parsed.numberFont || DEFAULT_FONT_KIT.numberFont,
      numberFontId: parsed.numberFontId || DEFAULT_FONT_KIT.numberFontId,
      fontSize: ["small", "medium", "large"].includes(parsed.fontSize)
        ? parsed.fontSize
        : "medium",
    };
  } catch {
    return DEFAULT_FONT_KIT;
  }
}

export function saveFontKitToStorage(cfg: FontKitConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FONT_KIT_STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

let loadedGoogleFonts = new Set<string>();

export function ensureGoogleFontLoaded(familyWithWeights: string): void {
  if (typeof document === "undefined" || !familyWithWeights) return;
  if (loadedGoogleFonts.has(familyWithWeights)) return;
  loadedGoogleFonts.add(familyWithWeights);

  const id = `google-font-${familyWithWeights.replace(/[^a-zA-Z0-9]/g, "-")}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${familyWithWeights}&display=swap`;
  document.head.appendChild(link);
}

export function applyFontKitToDocument(
  cfg: FontKitConfig,
  options: { persist?: boolean; dispatch?: boolean } = {}
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty("--font-letters", cfg.letterFont);
  root.style.setProperty("--font-numbers", cfg.numberFont);
  root.style.setProperty("--app-font-size", FONT_SIZE_SCALES[cfg.fontSize].rootSize);
  root.style.setProperty("--app-scale-factor", FONT_SIZE_SCALES[cfg.fontSize].bodyScale);
  root.setAttribute("data-font-size", cfg.fontSize);
  root.setAttribute("data-font-letter", cfg.letterFontId);
  root.setAttribute("data-font-number", cfg.numberFontId);

  // Load Google Font dynamically if needed
  const selectedPreset = FONT_KIT_PRESETS.find((p) => p.id === cfg.letterFontId);
  if (selectedPreset?.googleFontFamily) {
    ensureGoogleFontLoaded(selectedPreset.googleFontFamily);
  }
  const selectedNumber = FONT_KIT_PRESETS.find((p) => p.id === (cfg.numberFontId as any));
  if (selectedNumber?.googleFontFamily) {
    ensureGoogleFontLoaded(selectedNumber.googleFontFamily);
  }

  if (options.persist !== false) {
    saveFontKitToStorage(cfg);
  }

  if (options.dispatch !== false) {
    window.dispatchEvent(
      new CustomEvent(FONT_KIT_EVENT, { detail: cfg })
    );
  }
}

