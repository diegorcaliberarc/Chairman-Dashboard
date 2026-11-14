"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Sparkles,
  Music,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Move,
  Shuffle,
  GripVertical,
} from "lucide-react";

/* ============================================================================
 * TYPES & CONSTANTS
 * ========================================================================== */

export type ScenarioId =
  | "playing"
  | "sinatra"
  | "mango"
  | "foot_rub"
  | "walking_dogs";

export type DockPosition = "bottom-left" | "bottom-center" | "top-center";

export type PalsMode = "auto" | ScenarioId;

interface PersistedPalsState {
  minimized: boolean;
  dockPosition: DockPosition;
  mode: PalsMode;
  bondClicks: number;
  customCoords?: { x: number; y: number } | null;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  kind: "heart" | "note" | "sparkle";
  color: string;
}

const STORAGE_KEY = "chairman-pixel-pals-v1";
const AUTO_ROTATE_SECONDS = 45;

interface ScenarioMeta {
  id: ScenarioId;
  label: string;
  shortTag: string;
  emoji: string;
  announcement: string;
  lyricOrBubble: string;
  accentColor: string;
}

const SCENARIOS: ScenarioMeta[] = [
  {
    id: "playing",
    label: "Playing Together",
    shortTag: "Playtime",
    emoji: "💜🩷",
    announcement: "His & Hers Playtime!",
    lyricOrBubble: "boop! ♥ hehe~",
    accentColor: "#ec4899",
  },
  {
    id: "sinatra",
    label: "Sinatra Crooner",
    shortTag: "Sinatra ♪",
    emoji: "🎩🎙️",
    announcement: "Sinatra Serenade ♪",
    lyricOrBubble: "♪ Fly me to the moon...",
    accentColor: "#fbbf24",
  },
  {
    id: "mango",
    label: "Gengar's Mango",
    shortTag: "Mango!",
    emoji: "🥭✨",
    announcement: "Sweet Mango Break!",
    lyricOrBubble: "nom nom! 🥭♥",
    accentColor: "#f97316",
  },
  {
    id: "foot_rub",
    label: "Ditto Foot Spa",
    shortTag: "Foot Rub",
    emoji: "🛋️💆",
    announcement: "Cozy Foot Rub Spa ♥",
    lyricOrBubble: "aaah~ pure bliss ♥",
    accentColor: "#c084fc",
  },
  {
    id: "walking_dogs",
    label: "Walking the Pups",
    shortTag: "Dog Walk",
    emoji: "🐾🐕",
    announcement: "Nova, Astro & Comet Walk!",
    lyricOrBubble: "good pups! 🐾♥",
    accentColor: "#38bdf8",
  },
];

const SCENARIO_ORDER: ScenarioId[] = SCENARIOS.map((s) => s.id);

function pickTimeOfDayScenario(date = new Date()): ScenarioId {
  const hour = date.getHours();
  if (hour >= 6 && hour < 10) return "walking_dogs";
  if (hour >= 10 && hour < 14) return "playing";
  if (hour >= 14 && hour < 17) return "mango";
  if (hour >= 17 && hour < 22) return "sinatra";
  return "foot_rub";
}

/* ============================================================================
 * CRISP 16-BIT PIXEL MATRIX RENDERER
 * Merges horizontal color runs into crisp SVG <rect> spans
 * ========================================================================== */

const PALETTE: Record<string, string> = {
  // Gengar ("His") palette
  O: "#1a0d2e", // deep shadow violet-black outline
  D: "#4c1d95", // deep royal shadow purple
  P: "#5b21b6", // classic Gengar purple
  L: "#7c3aed", // Gengar brow/crown highlight purple
  R: "#ef4444", // crimson mischievous eye
  r: "#fecaca", // bright eye glint
  W: "#ffffff", // crisp white grin / husky fur
  G: "#cbd5e1", // grin tooth divider / silver highlight
  M: "#fb7185", // open singing/chomping mouth interior

  // Ditto ("Hers") palette
  o: "#6b165c", // plum-berry soft pixel outline
  S: "#db2777", // squishy lower pink-berry shade
  B: "#f472b6", // classic Ditto pastel pink
  V: "#e879f9", // lavender-pink midtone
  H: "#fbcfe8", // glossy top pastel highlight
  E: "#1e1b4b", // cute tiny dot eyes & smile line
  C: "#fb7185", // rosy cheek blush

  // Props: Fedora, Microphone, Mango, Pillow, Huskies & Sparkles
  F: "#27272a", // dark charcoal fedora brim/crown
  f: "#52525b", // fedora highlight
  Y: "#fbbf24", // warm gold / mango yellow / hat ribbon / stars
  A: "#f97316", // rich tropical mango orange
  T: "#ef4444", // ripe mango sunset blush
  N: "#22c55e", // fresh green mango leaf
  n: "#15803d", // dark leaf stem
  s: "#94a3b8", // vintage mic silver body
  k: "#475569", // mic stand dark steel
  Q: "#a855f7", // plush lounge pillow mid
  q: "#d8b4fe", // plush lounge pillow highlight
  K: "#1e293b", // husky black/slate coat
  Z: "#38bdf8", // husky ice-blue eyes / collar
  X: "#fde68a", // Comet golden cream fur
  x: "#d97706", // Comet warm amber ear/spot
};

interface PixelSpriteProps {
  rows: string[];
  pixelSize?: number;
  className?: string;
  style?: React.CSSProperties;
  flipX?: boolean;
}

const PixelSprite = React.memo(function PixelSprite({
  rows,
  pixelSize = 2.5,
  className,
  style,
  flipX = false,
}: PixelSpriteProps) {
  const height = rows.length;
  const width = useMemo(
    () => rows.reduce((max, r) => Math.max(max, r.length), 0),
    [rows]
  );

  const rects = useMemo(() => {
    const out: Array<{
      x: number;
      y: number;
      w: number;
      fill: string;
      key: string;
    }> = [];
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        const fill = ch === "." || ch === " " ? undefined : PALETTE[ch];
        if (!fill) {
          x++;
          continue;
        }
        let run = 1;
        while (x + run < row.length && row[x + run] === ch) {
          run++;
        }
        out.push({
          x,
          y,
          w: run,
          fill,
          key: `${y}-${x}`,
        });
        x += run;
      }
    }
    return out;
  }, [rows]);

  return (
    <svg
      width={width * pixelSize}
      height={height * pixelSize}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={className}
      style={{
        ...style,
        transform: `${style?.transform ?? ""} ${flipX ? "scaleX(-1)" : ""}`.trim() || undefined,
      }}
      aria-hidden="true"
    >
      {rects.map((r) => (
        <rect key={r.key} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
});

/* ============================================================================
 * 16-BIT SPRITE MATRICES — GENGAR ("HIS"), DITTO ("HERS") & PROPS
 * ========================================================================== */

// Classic mischievous Gengar (18x17) — Arms down vs Arms cheering
const GENGAR_IDLE_A = [
  "OO....O.OO.O....OO",
  "OPO..OPOPPOPO..OPO",
  "OPPO.OPPLLPPO.OPPO",
  ".OPPOPPLLLLPPOPPO.",
  "..OPPLLLLLLLLPPO..",
  ".OPPLPPPPPPPPPLPO.",
  ".OPPRROPPPPORRPPO.",
  ".OPPRrRPPPPRrRPPO.",
  "OPPPPPPPPPPPPPPPPO",
  "OPPOWGWWGGWWGWOPPO",
  "OPPPOWGWWWWGWOPPPO",
  "ODPPPOOOOOOOOPPPDO",
  "OOPPPPPPPPPPPPPPOO",
  "..ODPPPPPPPPPPDO..",
  "..ODPPPOOOOPPPDO..",
  "..ODPDO....ODPDO..",
  "..OOOO......OOOO..",
];

const GENGAR_HAPPY_HOP = [
  "OO....O.OO.O....OO",
  "OPO..OPOPPOPO..OPO",
  "OPPO.OPPLLPPO.OPPO",
  ".OPPOPPLLLLPPOPPO.",
  "..OPPLLLLLLLLPPO..",
  ".OPPLPPPPPPPPPLPO.",
  "OOPPRROPPPPORRPPOO",
  "OPPPRrRPPPPRrRPPPO",
  "OOPPPPPPPPPPPPPPOO",
  "..OPWGWWGGWWGWPO..",
  "..OPOWGWWWWGWOPO..",
  "..ODPPOOOOOOPPDO..",
  "..ODPPPPPPPPPPDO..",
  "...ODPPPPPPPPDO...",
  "..ODPDO....ODPDO..",
  "..OOOO......OOOO..",
  "..................",
];

// Sinatra Gengar wearing tilted charcoal Fedora with gold band! (18x19)
const GENGAR_SINATRA_A = [
  ".....FFFFFFFF.....",
  "....FFffffffFF....",
  "...FFYYYYYYYYFF...",
  "..FFFFFFFFFFFFFF..",
  "OO..OPPLLLLPPO..OO",
  "OPOOPPLLLLLLPPOOPO",
  ".OPPLLPPPPPPPLPPO.",
  ".OPPRROPPPPORRPPO.",
  ".OPPRrRPPPPRrRPPO.",
  "OPPPPPPPPPPPPPPPPO",
  "OPPPPPPOOOOPPPPPPO",
  "ODPPPPOMMMMOPPPPDO",
  "OOPPPPPOMMOPPPPPPO",
  "..ODPPPPPPPPPPPPDO",
  "..ODPPPOOOOPPPDO..",
  "..ODPDO....ODPDO..",
  "..OOOO......OOOO..",
];

const GENGAR_SINATRA_B = [
  ".....FFFFFFFF.....",
  "....FFffffffFF....",
  "...FFYYYYYYYYFF...",
  "..FFFFFFFFFFFFFF..",
  "OO..OPPLLLLPPO..OO",
  "OPOOPPLLLLLLPPOOPO",
  ".OPPLLPPPPPPPLPPO.",
  ".OPPRROPPPPORRPPO.",
  ".OPPRrRPPPPRrRPPO.",
  "OPPPPPPPPPPPPPPPPO",
  "OPPOWGWWGGWWGWOPPO",
  "ODPPOWGWWWWGWOPPDO",
  "OOPPPPOOOOOOPPPPPO",
  "..ODPPPPPPPPPPPPDO",
  "..ODPPPOOOOPPPDO..",
  "...ODPDO..ODPDO...",
  "...OOOO....OOOO...",
];

// Gengar Mango Chomp frames (18x17)
const GENGAR_MANGO_OPEN = [
  "OO....O.OO.O....OO",
  "OPO..OPOPPOPO..OPO",
  "OPPO.OPPLLPPO.OPPO",
  ".OPPOPPLLLLPPOPPO.",
  "..OPPLLLLLLLLPPO..",
  ".OPPLPPPPPPPPPLPO.",
  ".OPPRROPPPPORRPPO.",
  ".OPPRrRPPPPRrRPPO.",
  "OPPPPPPPPPPPPPPPPO",
  "OPPPOWWWWWWWWOPPPO",
  "OPPPOMMMMMMMMOPPPO",
  "ODPPOMMMMMMMMOPPDO",
  "OOPPPOWWWWWWWPPPPO",
  "..ODPPPPPPPPPPDO..",
  "..ODPPPOOOOPPPDO..",
  "..ODPDO....ODPDO..",
  "..OOOO......OOOO..",
];

const GENGAR_MANGO_BLISS = [
  "OO....O.OO.O....OO",
  "OPO..OPOPPOPO..OPO",
  "OPPO.OPPLLPPO.OPPO",
  ".OPPOPPLLLLPPOPPO.",
  "..OPPLLLLLLLLPPO..",
  ".OPPLPPPPPPPPPLPO.",
  ".OPPPOOPPPPOOPPPO.",
  ".OPPOPPO..OPPOPPO.",
  "OPPCOPPPPPPPPCOPPO",
  "OPPOWGWWGGWWGWOPPO",
  "OPPPPOOOOOOOOPPPPO",
  "ODPPPPPPPPPPPPPPDO",
  "OOPPPPPPPPPPPPPPOO",
  "..ODPPPPPPPPPPDO..",
  "..ODPPPOOOOPPPDO..",
  "..ODPDO....ODPDO..",
  "..OOOO......OOOO..",
];

// Gengar Reclining on Cozy Pillow with Purple Feet Kicked Out! (24x14)
const GENGAR_FOOTRUB_A = [
  "..OO...O.OO...........",
  "..OPO.OPOPPO..........",
  "..OPPOPPLLPPO.........",
  ".qqOPPLLLLLPPO........",
  "qQQOPPOPPPOPPO........",
  "qQQOPOPPPPPOPO........",
  "qQQOPPCOPPPPCPO..OOOO.",
  "qQQOPPOWWWWWOPO.OPPPPO",
  "QQQODPPPPPPPPPDODPPPPD",
  "QQQQODPPPPPPPPPPPPPPDO",
  ".QQQQODPPPPPPPPPPPDOO.",
  "..QQQQOOOOOOOOOOOOO...",
  "......................",
];

const GENGAR_FOOTRUB_B = [
  "..OO...O.OO...........",
  "..OPO.OPOPPO..........",
  "..OPPOPPLLPPO.........",
  ".qqOPPLLLLLPPO........",
  "qQQOPPOPPPOPPO........",
  "qQQOPOPPPPPOPO........",
  "qQQOPPCOPPPPCPO...OOOO",
  "qQQOPPOWWWWWOPO..OPPPP",
  "QQQODPPPPPPPPPDODPPPPD",
  "QQQQODPPPPPPPPPPPPPPDO",
  ".QQQQODPPPPPPPPPPPDOO.",
  "..QQQQOOOOOOOOOOOOO...",
  "......................",
];

// Gengar Walking Frame A & B (18x17)
const GENGAR_WALK_A = [
  "OO....O.OO.O....OO",
  "OPO..OPOPPOPO..OPO",
  "OPPO.OPPLLPPO.OPPO",
  ".OPPOPPLLLLPPOPPO.",
  "..OPPLLLLLLLLPPO..",
  ".OPPLPPPPPPPPPLPO.",
  ".OPPRROPPPPORRPPO.",
  ".OPPRrRPPPPRrRPPO.",
  "OPPPPPPPPPPPPPPPPO",
  "OPPOWGWWGGWWGWOPPO",
  "OPPPOWGWWWWGWOPPPO",
  "ODPPPOOOOOOOOPPPPO",
  "OOPPPPPPPPPPPPPPPO",
  "..ODPPPPPPPPPPDO..",
  "..ODPPPOOOOPPPDO..",
  ".ODPDO......ODPDO.",
  ".OOOO........OOOO.",
];

const GENGAR_WALK_B = [
  "OO....O.OO.O....OO",
  "OPO..OPOPPOPO..OPO",
  "OPPO.OPPLLPPO.OPPO",
  ".OPPOPPLLLLPPOPPO.",
  "..OPPLLLLLLLLPPO..",
  ".OPPLPPPPPPPPPLPO.",
  ".OPPRROPPPPORRPPO.",
  ".OPPRrRPPPPRrRPPO.",
  "OPPPPPPPPPPPPPPPPO",
  "OPPOWGWWGGWWGWOPPO",
  "OPPPOWGWWWWGWOPPPO",
  "ODPPPOOOOOOOOPPPPO",
  "OOPPPPPPPPPPPPPPPO",
  "..ODPPPPPPPPPPDO..",
  "..ODPPPOOOOPPPDO..",
  "...ODPDO..ODPDO...",
  "...OOOO....OOOO...",
];

// Classic Squishy Ditto ("Hers") (16x12)
const DITTO_IDLE_A = [
  "...ooo....ooo...",
  "..oHHHo..oHHHo..",
  "..oHBBooooBBHo..",
  ".oHBBBBBBBBBBHo.",
  "ooBBBBBBBBBBBBoo",
  "oHBBBEBBBBBEBBHo",
  "oBBCBoBBBBBoCBBo",
  "oBBBB.ooooooBBBo",
  ".oBBBBBBBBBBBBo.",
  ".oBBBBVVVVBBBBo.",
  "oSVVVVVVVVVVVVSo",
  "ooSSSSooooSSSSoo",
];

const DITTO_SQUISH_B = [
  "................",
  "..ooo......ooo..",
  ".oHHHo....oHHHo.",
  ".oHBBBooooBBBHo.",
  "ooHBBBBBBBBBBHoo",
  "oBBBBEBBBBBEBBBo",
  "oBBCBoBBBBBoCBBo",
  "oBBBB.ooooooBBBo",
  "oBBBBBVVVVVBBBBo",
  "oSVVVVVVVVVVVVSo",
  "ooSSSSooooSSSSoo",
  "................",
];

// Starry-eyed swooning Ditto for Frank Sinatra! (16x12)
const DITTO_STARRY = [
  "...ooo....ooo...",
  "..oHHHo..oHHHo..",
  "..oHBBooooBBHo..",
  ".oHBBBBBBBBBBHo.",
  "ooBBBYBBBBBYBBoo",
  "oHBBYWYBBBYWYBHo",
  "oBBCBYBBBBBYCBBo",
  "oBBBB.ooooooBBBo",
  ".oBBBBBBBBBBBBo.",
  ".oBBBBVVVVBBBBo.",
  "oSVVVVVVVVVVVVSo",
  "ooSSSSooooSSSSoo",
];

// Ditto kneading Gengar's feet (reaching squish paws left!) (16x12)
const DITTO_KNEAD_A = [
  "....ooo...ooo...",
  "...oHHHo.oHHHo..",
  "...oHBBoooBBHo..",
  "oooHBBBBBBBBBHo.",
  "oHHBBBBBBBBBBBo.",
  "ooBBBEBBBBBEBBHo",
  ".oBCBoBBBBBoCBBo",
  "ooBBB.ooooooBBBo",
  "oHBBBBBBBBBBBBo.",
  ".oBBBBVVVVBBBBo.",
  ".oSVVVVVVVVVVSo.",
  "..ooSSSSSSSSoo..",
];

const DITTO_KNEAD_B = [
  "................",
  "....ooo...ooo...",
  "...oHHHo.oHHHo..",
  "oooHBBBoooBBBHo.",
  "oHHBBBBBBBBBBBoo",
  ".oBBBEBBBBBEBBBo",
  "ooBCBoBBBBBoCBBo",
  "oHBBB.ooooooBBBo",
  ".oBBBBVVVVBBBBo.",
  ".oSVVVVVVVVVVSo.",
  "..ooSSSSSSSSoo..",
  "................",
];

// Vintage Silver Standing Crooner Microphone (8x16)
const CROONER_MIC = [
  "..ssss..",
  ".sGGGGs.",
  ".sGssGs.",
  ".sGGGGs.",
  "..ssss..",
  "...kk...",
  "...ss...",
  "...kk...",
  "...ss...",
  "...kk...",
  "...ss...",
  "...kk...",
  "..kkkk..",
  ".kssssk.",
  "kkkkkkkk",
];

// Tropical Golden-Sunset Mango (10x9)
const MANGO_SPRITE = [
  ".....nnNN.",
  "....nNNNN.",
  "...OYYYYO.",
  "..OYYYYAAO",
  ".OYYYAAATO",
  "OYYAAATTTO",
  ".OYAATTTO.",
  "..OATTTO..",
  "...OOOO...",
];

// Mini Mango Slice for Ditto (7x6)
const MANGO_SLICE = [
  "..OOOO.",
  ".OYYYYO",
  "OYYAAAO",
  "OYAATTO",
  ".OOOOO.",
];

// Siberian Husky Pup (Nova & Astro — black/white coat + ice-blue eye!) (13x10)
const HUSKY_TROT_A = [
  ".......KK.KK.",
  ".KK...KWWKWWK",
  "KWWK..KWKZWKW",
  "KWWK.KWWWWWWK",
  ".KKKZZZZWWWW.",
  "..KKKKKKKKWK.",
  "..KWWWWWWWWK.",
  "..KWK....KWK.",
  "..KK......KK.",
];

const HUSKY_TROT_B = [
  ".......KK.KK.",
  "..KK..KWWKWWK",
  ".KWWK.KWKZWKW",
  ".KWWKKWWWWWWK",
  "..KKZZZZWWWW.",
  "..KKKKKKKKWK.",
  "..KWWWWWWWWK.",
  "...KWK..KWK..",
  "...KK....KK..",
];

// Little Comet Pup (golden-cream spirited pup!) (10x8)
const COMET_PUP_A = [
  ".....xx.xx",
  ".xx..xXXXx",
  "xXXx.xXEXX",
  ".xxTTXXXX.",
  "..xXXXXXx.",
  "..xXx..xXx",
  "..xx....xx",
];

const COMET_PUP_B = [
  ".....xx.xx",
  "..xx.xXXXx",
  ".xXXxxXEXX",
  "..xTTXXXX.",
  "..xXXXXXx.",
  "...xXxxXx.",
  "...xx..xx.",
];

// Mini Pixel Icons for Header / Minimized Pill
const MINI_GENGAR_ICON = [
  "O..OO..O",
  "OPPLLPPO",
  "OPRPPPRO",
  "OPWWWWPO",
  ".OPPPPO.",
];

const MINI_DITTO_ICON = [
  ".oo..oo.",
  "oHBBBBHo",
  "oBEBBBEo",
  "oBooooBo",
  ".oSSSSo.",
];

const PIXEL_HEART = [
  ".TT.TT.",
  "TTTTTTT",
  "TTTTTTT",
  ".TTTTT.",
  "..TTT..",
  "...T...",
];

/* ============================================================================
 * MAIN COMPONENT: DittoGengarPals
 * ========================================================================== */

export function DittoGengarPals() {
  const [hydrated, setHydrated] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dockPosition, setDockPosition] = useState<DockPosition>("bottom-left");
  const [mode, setMode] = useState<PalsMode>("auto");
  const [activeScenario, setActiveScenario] = useState<ScenarioId>("playing");
  const [bondClicks, setBondClicks] = useState<number>(0);
  const [customCoords, setCustomCoords] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  }>({ startX: 0, startY: 0, initX: 0, initY: 0 });

  const [frameTick, setFrameTick] = useState(0);
  const [countdown, setCountdown] = useState(AUTO_ROTATE_SECONDS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [petBubble, setPetBubble] = useState<string | null>(null);
  const [justPetted, setJustPetted] = useState(false);
  const [particles, setParticles] = useState<FloatingHeart[]>([]);

  const nextParticleId = useRef(1);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const petTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted state on mount + pick initial time-of-day scenario
  useEffect(() => {
    const initialTimeScenario = pickTimeOfDayScenario();
    try {
      const raw = window.localStorage.getItem("gengar_ditto_pos") || window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as any;
        if (typeof parsed.minimized === "boolean") {
          setMinimized(parsed.minimized);
        }
        if (
          parsed.dockPosition === "bottom-left" ||
          parsed.dockPosition === "bottom-center" ||
          parsed.dockPosition === "top-center"
        ) {
          setDockPosition(parsed.dockPosition);
        }
        if (parsed.x !== undefined && parsed.y !== undefined) {
          setCustomCoords({ x: parsed.x, y: parsed.y });
        } else if (parsed.customCoords && typeof parsed.customCoords.x === "number" && typeof parsed.customCoords.y === "number") {
          setCustomCoords(parsed.customCoords);
        }
        if (typeof parsed.bondClicks === "number" && parsed.bondClicks >= 0) {
          setBondClicks(parsed.bondClicks);
        }
        if (
          parsed.mode === "auto" ||
          (parsed.mode && SCENARIO_ORDER.includes(parsed.mode as ScenarioId))
        ) {
          setMode(parsed.mode);
          if (parsed.mode !== "auto") {
            setActiveScenario(parsed.mode);
          } else {
            setActiveScenario(initialTimeScenario);
          }
        } else {
          setActiveScenario(initialTimeScenario);
        }
      } else {
        setActiveScenario(initialTimeScenario);
      }
    } catch {
      setActiveScenario(initialTimeScenario);
    }
    setHydrated(true);
  }, []);

  // Persist changes to localStorage and clamp to viewport
  useEffect(() => {
    if (!hydrated) return;
    try {
      const stateToSave: PersistedPalsState = {
        minimized,
        dockPosition,
        mode,
        bondClicks,
        customCoords,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      window.localStorage.setItem("gengar_ditto_pos", JSON.stringify(customCoords));
      window.localStorage.setItem("chairman_companion_pos", JSON.stringify(customCoords));
    } catch {
      // Ignore storage quota errors
    }
  }, [hydrated, minimized, dockPosition, mode, bondClicks, customCoords]);

  // Viewport clamping on window resize
  useEffect(() => {
    const handleResize = () => {
      setCustomCoords((prev) => {
        if (!prev) return null;
        const width = minimized ? 150 : 315;
        const height = minimized ? 44 : 120;
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const clampedX = Math.max(8, Math.min(winW - width, prev.x));
        const clampedY = Math.max(8, Math.min(winH - height, prev.y));
        return { x: Math.round(clampedX), y: Math.round(clampedY) };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [minimized]);

  // Pointer Drag Handlers
  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    // If clicking an interactive button that isn't a drag handle or input, ignore
    if ((e.target as HTMLElement).closest("button:not([data-drag-handle])") || (e.target as HTMLElement).closest("input")) {
      return;
    }
    hasDraggedRef.current = false;
    const rect = containerRef.current?.getBoundingClientRect();
    const curX = rect ? rect.left : (customCoords?.x ?? 280);
    const curY = rect ? rect.top : (customCoords?.y ?? (typeof window !== "undefined" ? window.innerHeight - 130 : 500));
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: curX,
      initY: curY,
    };
    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }, [customCoords]);

  const handleDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }
    const width = minimized ? 160 : 315;
    const height = minimized ? 44 : 120;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;
    const nextX = Math.max(8, Math.min(winW - width, dragStartRef.current.initX + dx));
    const nextY = Math.max(8, Math.min(winH - height, dragStartRef.current.initY + dy));
    setCustomCoords({ x: Math.round(nextX), y: Math.round(nextY) });
  }, [isDragging, minimized]);

  const handleDragPointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, [isDragging]);

  // 280ms crisp 16-bit animation frame clock
  useEffect(() => {
    const id = setInterval(() => {
      setFrameTick((t) => (t + 1) % 1200);
    }, 280);
    return () => clearInterval(id);
  }, []);

  const showAnnouncement = useCallback((msg: string) => {
    setAnnouncement(msg);
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    announceTimerRef.current = setTimeout(() => {
      setAnnouncement(null);
    }, 4800);
  }, []);

  const spawnBurst = useCallback(
    (
      count = 3,
      kind: FloatingHeart["kind"] = "heart",
      baseX = 145,
      baseY = 48
    ) => {
      const colors =
        kind === "note"
          ? ["#fbbf24", "#fde68a", "#f472b6"]
          : ["#f472b6", "#c084fc", "#fb7185", "#fbbf24"];
      const created: FloatingHeart[] = Array.from({ length: count }).map(
        (_, idx) => ({
          id: nextParticleId.current++,
          x: baseX + (idx - (count - 1) / 2) * 18 + ((idx * 7) % 9) - 4,
          y: baseY - (idx % 2) * 6,
          kind,
          color: colors[idx % colors.length],
        })
      );
      setParticles((prev) => [...prev.slice(-10), ...created]);
      setTimeout(() => {
        const ids = new Set(created.map((c) => c.id));
        setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
      }, 1350);
    },
    []
  );

  // Automatic 45-second surprise rotation when in "auto" mode
  useEffect(() => {
    if (mode !== "auto") {
      setCountdown(AUTO_ROTATE_SECONDS);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setActiveScenario((curr) => {
            const idx = SCENARIO_ORDER.indexOf(curr);
            const next = SCENARIO_ORDER[(idx + 1) % SCENARIO_ORDER.length];
            const meta = SCENARIOS.find((s) => s.id === next);
            if (meta) {
              showAnnouncement(`✨ Surprise: ${meta.announcement}`);
              spawnBurst(3, next === "sinatra" ? "note" : "heart");
            }
            return next;
          });
          return AUTO_ROTATE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, showAnnouncement, spawnBurst]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
      if (petTimerRef.current) clearTimeout(petTimerRef.current);
    };
  }, []);

  // 1-click Position Cycling: Bottom-Left -> Bottom-Center -> Top-Center -> Minimized Pill (or reset custom drag)
  const handleCyclePosition = useCallback(() => {
    setPickerOpen(false);
    if (customCoords) {
      setCustomCoords(null);
      showAnnouncement("Snapped back to dock mode");
      return;
    }
    if (minimized) {
      setMinimized(false);
      setDockPosition("bottom-left");
      return;
    }
    if (dockPosition === "bottom-left") {
      setDockPosition("bottom-center");
    } else if (dockPosition === "bottom-center") {
      setDockPosition("top-center");
    } else {
      setMinimized(true);
    }
  }, [customCoords, dockPosition, minimized, showAnnouncement]);

  const handleSelectScenario = useCallback(
    (target: PalsMode) => {
      setMode(target);
      setPickerOpen(false);
      if (target === "auto") {
        const tod = pickTimeOfDayScenario();
        setActiveScenario(tod);
        setCountdown(AUTO_ROTATE_SECONDS);
        const meta = SCENARIOS.find((s) => s.id === tod);
        showAnnouncement(`Auto Surprise ON • ${meta?.shortTag ?? ""}`);
      } else {
        setActiveScenario(target);
        const meta = SCENARIOS.find((s) => s.id === target);
        if (meta) {
          showAnnouncement(meta.announcement);
          spawnBurst(3, target === "sinatra" ? "note" : "heart");
        }
      }
    },
    [showAnnouncement, spawnBurst]
  );

  const handleSurpriseMe = useCallback(() => {
    const others = SCENARIO_ORDER.filter((id) => id !== activeScenario);
    const chosen = others[Math.floor(Math.random() * others.length)];
    setActiveScenario(chosen);
    setCountdown(AUTO_ROTATE_SECONDS);
    const meta = SCENARIOS.find((s) => s.id === chosen);
    if (meta) {
      showAnnouncement(`🎁 ${meta.announcement}`);
      spawnBurst(4, chosen === "sinatra" ? "note" : "heart");
    }
  }, [activeScenario, showAnnouncement, spawnBurst]);

  const handlePetCompanion = useCallback(
    (who: "gengar" | "ditto") => {
      setBondClicks((c) => c + 1);
      setJustPetted(true);
      const lines =
        who === "gengar"
          ? ["heh-heh ♥", "Gengar loves that!", "spooky purr~ 💜"]
          : ["squish~ ♥", "Ditto wiggles! 🩷", "his + hers = ours ♥"];
      const msg = lines[(bondClicks + (who === "gengar" ? 0 : 1)) % lines.length];
      setPetBubble(msg);
      spawnBurst(4, "heart", who === "gengar" ? 102 : 196, 44);

      if (petTimerRef.current) clearTimeout(petTimerRef.current);
      petTimerRef.current = setTimeout(() => {
        setPetBubble(null);
        setJustPetted(false);
      }, 2200);
    },
    [bondClicks, spawnBurst]
  );

  const currentMeta = useMemo(
    () => SCENARIOS.find((s) => s.id === activeScenario) ?? SCENARIOS[0],
    [activeScenario]
  );

  // Positioning classes in foreground z-[75]
  const positionClasses = useMemo(() => {
    switch (dockPosition) {
      case "bottom-center":
        return "fixed bottom-4 left-1/2 -translate-x-1/2 z-[75]";
      case "top-center":
        return "fixed top-3 left-1/2 -translate-x-1/2 z-[75]";
      case "bottom-left":
      default:
        return "fixed bottom-4 left-4 md:left-[272px] z-[75]";
    }
  }, [dockPosition]);

  const positionLabel = useMemo(() => {
    if (customCoords) return `Custom (${customCoords.x}px, ${customCoords.y}px)`;
    if (minimized) return "Mini-Heart Pill";
    if (dockPosition === "bottom-left") return "Bottom-Left";
    if (dockPosition === "bottom-center") return "Bottom-Center";
    return "Top-Center Island";
  }, [customCoords, dockPosition, minimized]);

  const bondPercent = justPetted ? 100 : 99;
  const isEvenFrame = frameTick % 2 === 0;
  const phase4 = frameTick % 4;
  const strollX = 8 + ((frameTick * 4) % 86); // Smooth horizontal pixel parade across the grass

  const containerStyle = useMemo(() => {
    if (customCoords) {
      return {
        position: "fixed" as const,
        top: 0,
        left: 0,
        transform: `translate3d(${customCoords.x}px, ${customCoords.y}px, 0)`,
        zIndex: 75,
        touchAction: "none" as const,
      };
    }
    return { touchAction: "none" as const };
  }, [customCoords]);

  const activePositionClasses = customCoords
    ? "fixed top-0 left-0 z-[75]"
    : positionClasses;

  if (typeof window !== "undefined" && window.location.search.includes("embed=")) {
    return null;
  }

  /* ==========================================================================
   * MINIMIZED MINI-HEART DYNAMIC PILL (~144px x 38px)
   * ======================================================================== */
  if (minimized) {
    return (
      <div
        ref={containerRef}
        style={containerStyle}
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
        onPointerCancel={handleDragPointerUp}
        className={`${activePositionClasses} pointer-events-none select-none`}
      >
        <button
          type="button"
          data-drag-handle="true"
          onClick={() => {
            if (!hasDraggedRef.current) {
              setMinimized(false);
            }
          }}
          title={`Expand His, Hers & Ours Pixel Pals (${currentMeta.label}) • Drag anywhere to move`}
          className="pointer-events-auto cursor-grab active:cursor-grabbing group flex items-center gap-2 w-[160px] h-[38px] px-3 rounded-full bg-[#090a10]/92 backdrop-blur-xl border border-purple-500/35 shadow-[0_8px_28px_rgba(0,0,0,0.65),0_0_16px_rgba(168,85,247,0.22)] hover:border-pink-400/60 transition-all"
        >
          <GripVertical className="w-3 h-3 text-purple-400/50 -ml-1" />
          <span
            className="transition-transform duration-200"
            style={{ transform: isEvenFrame ? "translateY(-1px)" : "translateY(1px)" }}
          >
            <PixelSprite rows={MINI_GENGAR_ICON} pixelSize={2.2} />
          </span>

          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold tracking-tight text-pink-200">
            <Heart className="w-3 h-3 text-pink-400 fill-pink-400 animate-pulse" />
            <span>{bondPercent}%</span>
          </span>

          <span
            className="transition-transform duration-200"
            style={{ transform: !isEvenFrame ? "translateY(-1px)" : "translateY(1px)" }}
          >
            <PixelSprite rows={MINI_DITTO_ICON} pixelSize={2.2} />
          </span>

          <ChevronUp className="w-3.5 h-3.5 ml-auto text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    );
  }

  /* ==========================================================================
   * EXPANDED PIXEL-PALS TERRARIUM STAGE (~315px x 126px)
   * ======================================================================== */
  const popoverOpensDown = dockPosition === "top-center" || (customCoords && customCoords.y < 200);

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`${activePositionClasses} pointer-events-none select-none`}
      aria-label="His, Hers & Ours Pixel Pals Stage"
    >
      {/* Atmospheric Outer Sparkles / Floating Particles — pointer-events-none so clicks pass right through! */}
      <div className="pointer-events-none absolute -inset-6 overflow-visible z-20">
        {particles.map((p) => (
          <div
            key={p.id}
            className="pointer-events-none absolute transition-all duration-1000 ease-out animate-bounce"
            style={{
              left: p.x + 24,
              top: p.y + 8,
              color: p.color,
              filter: "drop-shadow(0 0 6px rgba(244,114,182,0.65))",
            }}
          >
            {p.kind === "note" ? (
              <span className="font-mono text-xs font-bold">♪</span>
            ) : (
              <PixelSprite rows={PIXEL_HEART} pixelSize={1.7} />
            )}
          </div>
        ))}
      </div>

      {/* Scenario Picker Popover */}
      {pickerOpen && (
        <div
          className={`pointer-events-auto absolute left-0 ${
            popoverOpensDown ? "top-full mt-2" : "bottom-full mb-2"
          } w-[310px] rounded-2xl bg-[#0b0c14]/95 backdrop-blur-xl border border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.75)] p-2.5 z-30`}
        >
          <div className="flex items-center justify-between px-1.5 pb-2 mb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[11px] font-semibold tracking-wide text-slate-100">
                HIS • HERS • OURS SCENARIOS
              </span>
            </div>
            <span className="text-[10px] font-mono text-purple-300/90">
              Pets: {bondClicks} ♥
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectScenario("auto")}
              className={`col-span-2 flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-[11px] transition-all border ${
                mode === "auto"
                  ? "bg-gradient-to-r from-purple-600/30 to-pink-500/25 border-pink-400/50 text-white"
                  : "bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Shuffle className="w-3 h-3 text-pink-400" />
                Auto Surprise Rotation
              </span>
              <span className="text-[10px] font-mono text-pink-200/90">
                {mode === "auto" ? `next ${countdown}s` : "45s"}
              </span>
            </button>

            {SCENARIOS.map((sc) => {
              const isPinned = mode === sc.id;
              const isShowing = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(sc.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-left text-[11px] transition-all border ${
                    isPinned
                      ? "bg-purple-500/25 border-purple-400/60 text-white"
                      : isShowing
                      ? "bg-white/[0.08] border-white/20 text-slate-100"
                      : "bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="text-xs leading-none">{sc.emoji}</span>
                  <span className="truncate font-medium">{sc.shortTag}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span>Dock: {positionLabel}</span>
            <span>Tap Gengar or Ditto to pet ♥</span>
          </div>
        </div>
      )}

      {/* Main Compact Glassmorphic Pixel Terrarium (~310px x 116px) */}
      <div className="pointer-events-auto relative w-[310px] h-[116px] rounded-2xl bg-[#090a12]/90 backdrop-blur-xl border border-purple-400/25 shadow-[0_12px_36px_rgba(0,0,0,0.72),0_0_24px_rgba(139,92,246,0.16)] overflow-hidden flex flex-col justify-between">
        {/* Starlight Night Sky Pixel Dots */}
        <div className="pointer-events-none absolute inset-0 opacity-65">
          <div className="absolute top-7 left-5 w-[2px] h-[2px] bg-purple-300" />
          <div className="absolute top-9 left-16 w-[2px] h-[2px] bg-pink-200 animate-pulse" />
          <div className="absolute top-6 left-36 w-[2px] h-[2px] bg-amber-200" />
          <div className="absolute top-10 right-20 w-[2px] h-[2px] bg-sky-200 animate-pulse" />
          <div className="absolute top-7 right-8 w-[2px] h-[2px] bg-pink-300" />
        </div>

        {/* Frank Sinatra Warm Golden Jazz-Club Spotlight Cone */}
        {activeScenario === "sinatra" && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{
              background:
                "conic-gradient(from 158deg at 46% 0%, transparent 0deg, rgba(251,191,36,0.24) 18deg, rgba(251,191,36,0.08) 34deg, transparent 46deg)",
            }}
          />
        )}

        {/* Unified 32px Top Header Bar: HIS & HERS • GENGAR & DITTO */}
        <div
          data-drag-handle="true"
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
          title="Click and drag to move companion anywhere on screen"
          className="relative z-30 h-8 flex items-center justify-between px-2.5 bg-black/60 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
        >
          {/* Left Title + Drag Handle */}
          <div className="flex items-center gap-1.5 pointer-events-none min-w-0">
            <GripVertical className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[9.5px] font-mono font-bold tracking-wider bg-gradient-to-r from-purple-300 via-pink-200 to-pink-300 bg-clip-text text-transparent truncate">
              HIS & HERS • GENGAR & DITTO
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
            {/* Scenario Picker Pill */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen((o) => !o);
              }}
              title="Choose Scenario or Toggle Auto Surprise"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[9px] font-mono text-zinc-300 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6]" />
              <span className="truncate max-w-[50px]">{currentMeta.shortTag}</span>
              {pickerOpen ? (
                <ChevronDown className="w-2.5 h-2.5 text-slate-300" />
              ) : (
                <ChevronUp className="w-2.5 h-2.5 text-slate-300" />
              )}
            </button>

            {/* Live Sync Bond Meter */}
            <span
              title={`His & Hers Bond Sync (${bondClicks} pets)`}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-pink-500/12 border border-pink-400/25 text-[9px] font-mono font-semibold text-pink-200"
            >
              <span>{bondPercent}%</span>
              <span className="text-pink-400">♥</span>
            </span>

            {/* Surprise Me! Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSurpriseMe();
              }}
              title={
                mode === "auto"
                  ? `Surprise Me! (Auto next in ${countdown}s)`
                  : "Trigger a Surprise Scenario!"
              }
              className="p-1 rounded-md bg-amber-400/10 hover:bg-amber-400/20 border border-amber-300/20 text-amber-200 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
            </button>

            {/* 1-Click Position Cycling Button / Dock Snap */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCyclePosition();
              }}
              title={customCoords ? "Snap back to dock" : `Cycle Stage Position (Current: ${positionLabel})`}
              className={`p-1 rounded-md transition-colors ${
                customCoords
                  ? "text-pink-300 bg-purple-500/20 hover:bg-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Move className="w-3 h-3" />
            </button>

            {/* Quick Minimize to Mini-Heart Pill */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen(false);
                setMinimized(true);
              }}
              title="Minimize to Mini-Heart Pill"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Speech / Thought / Lyric Pixel Bubble */}
        <div className="pointer-events-none relative z-20 flex justify-center h-4 mt-0.5">
          <div
            className="px-2 py-[1px] rounded-full bg-[#141625]/90 border border-white/12 text-[9.5px] font-mono tracking-tight text-pink-100 shadow-sm truncate max-w-[278px]"
            style={{
              borderColor: `${currentMeta.accentColor}44`,
            }}
          >
            {petBubble ?? announcement ?? currentMeta.lyricOrBubble}
          </div>
        </div>

        {/* ==================================================================
         * INTERACTIVE 16-BIT PIXEL STAGE FLOOR & SCENARIO ACTORS
         * ================================================================ */}
        <div className="relative z-10 flex-1 w-full overflow-hidden">
          {/* SCENARIO 1: PLAYING TOGETHER ("His, Hers & Ours") */}
          {activeScenario === "playing" && (
            <div className="relative w-full h-full flex items-end justify-center pb-[11px]">
              {/* Gengar ("His") hopping inward to boop/high-five */}
              <button
                type="button"
                onClick={() => handlePetCompanion("gengar")}
                title="Pet Gengar (His)"
                className="relative cursor-pointer focus:outline-none transition-transform duration-200"
                style={{
                  transform: `translate(${
                    phase4 === 1 || phase4 === 2 ? "8px" : "0px"
                  }, ${isEvenFrame ? "-4px" : "0px"})`,
                }}
              >
                <PixelSprite
                  rows={isEvenFrame ? GENGAR_HAPPY_HOP : GENGAR_IDLE_A}
                  pixelSize={2.45}
                />
              </button>

              {/* Floating Twin "Ours" Pixel Hearts Between Them */}
              <div className="pointer-events-none mx-3 mb-5 flex flex-col items-center gap-0.5">
                <div
                  className="transition-transform duration-300"
                  style={{
                    transform: `translateY(${isEvenFrame ? "-5px" : "-1px"}) scale(${
                      phase4 === 2 ? 1.15 : 0.95
                    })`,
                  }}
                >
                  <PixelSprite rows={PIXEL_HEART} pixelSize={2} />
                </div>
              </div>

              {/* Ditto ("Hers") wiggling & hopping happily */}
              <button
                type="button"
                onClick={() => handlePetCompanion("ditto")}
                title="Pet Ditto (Hers)"
                className="relative cursor-pointer focus:outline-none transition-transform duration-200"
                style={{
                  transform: `translate(${
                    phase4 === 1 || phase4 === 2 ? "-8px" : "0px"
                  }, ${!isEvenFrame ? "-4px" : "0px"})`,
                }}
              >
                <PixelSprite
                  rows={isEvenFrame ? DITTO_IDLE_A : DITTO_SQUISH_B}
                  pixelSize={2.5}
                />
              </button>
            </div>
          )}

          {/* SCENARIO 2: FRANK SINATRA CROONER SERENADE */}
          {activeScenario === "sinatra" && (
            <div className="relative w-full h-full flex items-end justify-center pb-[11px] gap-2">
              {/* Dapper Fedora Gengar swaying smoothly */}
              <button
                type="button"
                onClick={() => handlePetCompanion("gengar")}
                title="Pet Crooner Gengar"
                className="relative cursor-pointer focus:outline-none transition-transform duration-300"
                style={{
                  transform: `translateX(${isEvenFrame ? "2px" : "-1px"}) rotate(${
                    isEvenFrame ? "2deg" : "-2deg"
                  })`,
                }}
              >
                <PixelSprite
                  rows={isEvenFrame ? GENGAR_SINATRA_A : GENGAR_SINATRA_B}
                  pixelSize={2.35}
                />
              </button>

              {/* Vintage Silver Standing Crooner Microphone + Floating Notes */}
              <div className="pointer-events-none relative flex flex-col items-center">
                <div
                  className="absolute -top-4 flex gap-1.5 text-[10px] font-mono text-amber-300"
                  style={{
                    transform: `translateY(${isEvenFrame ? "-3px" : "1px"})`,
                  }}
                >
                  <span>♪</span>
                  <span className="text-pink-300">♫</span>
                </div>
                <PixelSprite
                  rows={CROONER_MIC}
                  pixelSize={2.25}
                  style={{
                    transform: isEvenFrame ? "rotate(-3deg)" : "rotate(2deg)",
                  }}
                />
              </div>

              {/* Starry-Eyed Swooning Ditto */}
              <button
                type="button"
                onClick={() => handlePetCompanion("ditto")}
                title="Pet Swooning Ditto"
                className="relative ml-2 cursor-pointer focus:outline-none transition-transform duration-300"
                style={{
                  transform: `translateY(${!isEvenFrame ? "-2px" : "0px"}) rotate(${
                    isEvenFrame ? "-3deg" : "3deg"
                  })`,
                }}
              >
                <PixelSprite
                  rows={isEvenFrame ? DITTO_STARRY : DITTO_SQUISH_B}
                  pixelSize={2.45}
                />
              </button>

              <Music className="pointer-events-none absolute right-5 top-2 w-3 h-3 text-amber-300/80 animate-bounce" />
            </div>
          )}

          {/* SCENARIO 3: GENGAR EATING A TROPICAL MANGO */}
          {activeScenario === "mango" && (
            <div className="relative w-full h-full flex items-end justify-center pb-[11px] gap-1.5">
              {/* Gengar happily chomping a golden-sunset mango */}
              <button
                type="button"
                onClick={() => handlePetCompanion("gengar")}
                title="Pet Mango-Loving Gengar"
                className="relative flex items-end cursor-pointer focus:outline-none transition-transform duration-200"
                style={{
                  transform: `translateY(${phase4 === 1 ? "-3px" : "0px"})`,
                }}
              >
                <PixelSprite
                  rows={
                    phase4 === 0
                      ? GENGAR_MANGO_OPEN
                      : phase4 === 1
                      ? GENGAR_IDLE_A
                      : GENGAR_MANGO_BLISS
                  }
                  pixelSize={2.45}
                />
                {/* Golden Tropical Pixel Mango in Gengar's Paws */}
                <div
                  className="-ml-2 mb-1.5 transition-transform duration-200"
                  style={{
                    transform:
                      phase4 === 1
                        ? "translate(-2px, -3px) scale(0.92)"
                        : "translate(0px, 0px)",
                  }}
                >
                  <PixelSprite rows={MANGO_SPRITE} pixelSize={2.3} />
                </div>
              </button>

              {/* Juice Sparkles when blissfully chomping */}
              <div
                className="pointer-events-none mb-6 mx-1 text-[10px] font-mono text-amber-300 transition-opacity"
                style={{ opacity: phase4 >= 2 ? 1 : 0.35 }}
              >
                ✦♥
              </div>

              {/* Ditto bouncing happily beside with a second mango slice */}
              <button
                type="button"
                onClick={() => handlePetCompanion("ditto")}
                title="Pet Ditto & Her Mango Slice"
                className="relative flex items-end cursor-pointer focus:outline-none transition-transform duration-200"
                style={{
                  transform: `translateY(${!isEvenFrame ? "-4px" : "0px"})`,
                }}
              >
                <div className="-mr-1.5 mb-2 z-10">
                  <PixelSprite rows={MANGO_SLICE} pixelSize={2.2} />
                </div>
                <PixelSprite
                  rows={isEvenFrame ? DITTO_IDLE_A : DITTO_SQUISH_B}
                  pixelSize={2.45}
                />
              </button>
            </div>
          )}

          {/* SCENARIO 4: DITTO RUBBING GENGAR'S FEET */}
          {activeScenario === "foot_rub" && (
            <div className="relative w-full h-full flex items-end justify-center pb-[10px]">
              {/* Blissfully Reclining Gengar on Plush Lounge Cushion */}
              <button
                type="button"
                onClick={() => handlePetCompanion("gengar")}
                title="Pet Relaxed Lounge Gengar"
                className="relative cursor-pointer focus:outline-none"
              >
                <div
                  className="pointer-events-none absolute -top-3 left-5 text-[9px] font-mono text-purple-200"
                  style={{
                    transform: `translateY(${isEvenFrame ? "-2px" : "0px"})`,
                  }}
                >
                  aaah~ ♥
                </div>
                <PixelSprite
                  rows={isEvenFrame ? GENGAR_FOOTRUB_A : GENGAR_FOOTRUB_B}
                  pixelSize={2.55}
                />
              </button>

              {/* Squishy Pink Ditto Kneading Gengar's Purple Feet + Spa Sparkles */}
              <button
                type="button"
                onClick={() => handlePetCompanion("ditto")}
                title="Pet Spa-Therapist Ditto"
                className="relative -ml-2 cursor-pointer focus:outline-none transition-transform duration-200"
                style={{
                  transform: `translateX(${isEvenFrame ? "-2px" : "1px"})`,
                }}
              >
                <div
                  className="pointer-events-none absolute -top-3 right-1 text-[9px] text-pink-300"
                  style={{ opacity: isEvenFrame ? 1 : 0.45 }}
                >
                  ✦♥✦
                </div>
                <PixelSprite
                  rows={isEvenFrame ? DITTO_KNEAD_A : DITTO_KNEAD_B}
                  pixelSize={2.5}
                />
              </button>
            </div>
          )}

          {/* SCENARIO 5: GENGAR WALKING THE DOGS (NOVA, ASTRO & COMET!) */}
          {activeScenario === "walking_dogs" && (
            <div className="relative w-full h-full flex items-end pb-[10px]">
              <div
                className="relative flex items-end transition-transform duration-200 ease-linear"
                style={{
                  transform: `translateX(${strollX}px)`,
                }}
              >
                {/* Ditto trotting cheerfully right alongside Gengar */}
                <button
                  type="button"
                  onClick={() => handlePetCompanion("ditto")}
                  title="Pet Trotting Ditto"
                  className="cursor-pointer focus:outline-none mr-1"
                  style={{
                    transform: `translateY(${!isEvenFrame ? "-3px" : "0px"})`,
                  }}
                >
                  <PixelSprite
                    rows={isEvenFrame ? DITTO_IDLE_A : DITTO_SQUISH_B}
                    pixelSize={2.1}
                  />
                </button>

                {/* Gengar holding pixel leashes */}
                <button
                  type="button"
                  onClick={() => handlePetCompanion("gengar")}
                  title="Pet Dog-Walker Gengar"
                  className="cursor-pointer focus:outline-none"
                  style={{
                    transform: `translateY(${isEvenFrame ? "-2px" : "0px"})`,
                  }}
                >
                  <PixelSprite
                    rows={isEvenFrame ? GENGAR_WALK_A : GENGAR_WALK_B}
                    pixelSize={2.2}
                  />
                </button>

                {/* Crisp SVG Pixel Leashes Connecting Gengar's Hand to Nova, Astro & Comet */}
                <svg
                  width="54"
                  height="32"
                  viewBox="0 0 54 32"
                  shapeRendering="crispEdges"
                  className="pointer-events-none -mx-1 mb-1"
                  aria-hidden="true"
                >
                  {/* Leash to Comet */}
                  <path
                    d="M 0 11 L 12 18 L 22 21"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.4"
                  />
                  {/* Leash to Nova */}
                  <path
                    d="M 0 10 L 18 15 L 36 16"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.4"
                  />
                  {/* Leash to Astro */}
                  <path
                    d="M 0 9 L 24 12 L 52 15"
                    fill="none"
                    stroke="#f472b6"
                    strokeWidth="1.4"
                  />
                </svg>

                {/* Pack Formation: Comet + Siberian Huskies Nova & Astro! */}
                <div className="pointer-events-none flex items-end -ml-4 gap-1">
                  {/* Little Comet */}
                  <div
                    title="Comet"
                    style={{
                      transform: `translateY(${isEvenFrame ? "-2px" : "0px"})`,
                    }}
                  >
                    <PixelSprite
                      rows={isEvenFrame ? COMET_PUP_A : COMET_PUP_B}
                      pixelSize={2.05}
                    />
                  </div>

                  {/* Nova (Black/White Husky with Blue Eyes) */}
                  <div
                    title="Nova"
                    style={{
                      transform: `translateY(${!isEvenFrame ? "-2px" : "0px"})`,
                    }}
                  >
                    <PixelSprite
                      rows={isEvenFrame ? HUSKY_TROT_A : HUSKY_TROT_B}
                      pixelSize={2.25}
                    />
                  </div>

                  {/* Astro (Black/White Husky with Blue Eyes) */}
                  <div
                    title="Astro"
                    style={{
                      transform: `translateY(${isEvenFrame ? "-2px" : "0px"})`,
                    }}
                  >
                    <PixelSprite
                      rows={!isEvenFrame ? HUSKY_TROT_A : HUSKY_TROT_B}
                      pixelSize={2.25}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtle Starlight Pixel Turf / Stage Floor Strip */}
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[10px]">
            <svg
              width="310"
              height="10"
              viewBox="0 0 155 5"
              shapeRendering="crispEdges"
              className="w-full h-full"
              aria-hidden="true"
            >
              {/* Top turf highlight blade pixels */}
              <rect x="0" y="1" width="155" height="1" fill="#1e293b" />
              {Array.from({ length: 26 }).map((_, idx) => (
                <rect
                  key={idx}
                  x={idx * 6 + (idx % 2)}
                  y={0}
                  width={2}
                  height={1}
                  fill={
                    activeScenario === "sinatra"
                      ? idx % 2 === 0
                        ? "#78350f"
                        : "#a16207"
                      : idx % 3 === 0
                      ? "#15803d"
                      : idx % 3 === 1
                      ? "#4c1d95"
                      : "#831843"
                  }
                />
              ))}
              <rect x="0" y="2" width="155" height="3" fill="#0f172a" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DittoGengarPals;
