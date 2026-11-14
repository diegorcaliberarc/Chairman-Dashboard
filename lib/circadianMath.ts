import { CircadianEventDTO } from "./circadianTypes";

export interface PolarPoint {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extract minutes since local midnight [0, 1440) from Date (including fractional minutes for smooth orbit)
 */
export function dateToMinutes(date: Date, includeSeconds = false): number {
  const base = date.getHours() * 60 + date.getMinutes();
  return includeSeconds ? base + date.getSeconds() / 60 : base;
}

/**
 * Parse "HH:MM" string to minutes [0, 1440)
 */
export function hhmmToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  const h = Math.max(0, Math.min(23, parseInt(hStr || "0", 10)));
  const m = Math.max(0, Math.min(59, parseInt(mStr || "0", 10)));
  return h * 60 + m;
}

/**
 * Format minutes [0, 1440) to 12-hour string e.g. "08:30 AM"
 */
export function minutesTo12Hour(minutes: number, compact = false): string {
  const norm = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const hPad = compact ? String(h12) : String(h12).padStart(2, "0");
  const mPad = String(m).padStart(2, "0");
  return `${hPad}:${mPad} ${period}`;
}

/**
 * Format minutes [0, 1440) to "HH:MM" 24h input format
 */
export function minutesToHHMM(minutes: number): string {
  const norm = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Section 4.1 Angle Translation Formula:
 * 06:00 -> 180° (9 o'clock / Western dawn emergence)
 * 12:00 -> 270° (12 o'clock / High noon solar apex)
 * 18:00 -> 360° / 0° (3 o'clock / Sunset dusk)
 * 00:00 -> 90° (6 o'clock / Pitch-black midnight nadir)
 */
export function minutesToAngleDeg(minutes: number): number {
  const f = minutes / 1440;
  return f * 360 + 90;
}

export function minutesToAngleRad(minutes: number): number {
  return (minutesToAngleDeg(minutes) * Math.PI) / 180;
}

/**
 * Inverse mapping: pointer angle around (cx, cy) -> minutes [0, 1440)
 */
export function cartesianToMinutes(cx: number, cy: number, x: number, y: number): number {
  const rad = Math.atan2(y - cy, x - cx);
  let deg = (rad * 180) / Math.PI; // [-180, 180]
  // Subtract 90° offset from Section 4.1
  let shifted = (deg - 90) % 360;
  if (shifted < 0) shifted += 360;
  return (shifted / 360) * 1440;
}

/**
 * Section 4.2 Radial Cartesian Position:
 * X = Cx + R * cos(theta)
 * Y = Cy + R * sin(theta)
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number
): PolarPoint {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export function timeToCartesian(
  cx: number,
  cy: number,
  radius: number,
  minutes: number
): PolarPoint {
  return polarToCartesian(cx, cy, radius, minutesToAngleRad(minutes));
}

/**
 * Duration in minutes across possible midnight wrap
 */
export function getDurationMinutes(startMinutes: number, endMinutes: number): number {
  const s = ((startMinutes % 1440) + 1440) % 1440;
  const e = ((endMinutes % 1440) + 1440) % 1440;
  if (s === e) return 0;
  if (Math.abs(endMinutes - startMinutes) >= 1439) return 1439;
  return e > s ? e - s : 1440 - s + e;
}

/**
 * Section 2.2 Segment Sweep Angle Formula:
 * deltaTheta = (Duration / 1440) * 360°
 */
export function getSweepAngleDeg(startMinutes: number, endMinutes: number): number {
  const dur = getDurationMinutes(startMinutes, endMinutes);
  if (dur === 0) return 0;
  return (dur / 1440) * 360;
}

/**
 * Clockwise SVG arc path between startMinutes and endMinutes
 */
export function describeTimeArc(
  cx: number,
  cy: number,
  radius: number,
  startMinutes: number,
  endMinutes: number
): string {
  const duration = Math.min(1438, Math.max(4, getDurationMinutes(startMinutes, endMinutes)));
  const startRad = minutesToAngleRad(startMinutes);
  const sweepDeg = (duration / 1440) * 360;
  const endRad = startRad + (sweepDeg * Math.PI) / 180;

  const start = polarToCartesian(cx, cy, radius, startRad);
  const end = polarToCartesian(cx, cy, radius, endRad);
  const largeArcFlag = sweepDeg > 180 ? 1 : 0;

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/**
 * Curved Annular Sector (Wedge) path + tight bounding box for high-impact visual media clipping
 */
export function describeAnnularWedge(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startMinutes: number,
  endMinutes: number,
  gapDeg = 2.4
): {
  path: string;
  bbox: BoundingBox;
  midPoint: PolarPoint;
  outerMidPoint: PolarPoint;
  midAngleDeg: number;
  midAngleRad: number;
} {
  const rawSweep = getSweepAngleDeg(startMinutes, endMinutes);
  // Cap at 300° so wedges remain fragmented sectors and never form a solid 360° donut
  const effectiveSweep = Math.max(6, Math.min(300, rawSweep - gapDeg));
  const startDeg = minutesToAngleDeg(startMinutes) + gapDeg / 2;
  const endDeg = startDeg + effectiveSweep;

  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const midAngleDeg = startDeg + effectiveSweep / 2;
  const midAngleRad = (midAngleDeg * Math.PI) / 180;

  const pOuterStart = polarToCartesian(cx, cy, rOuter, startRad);
  const pOuterEnd = polarToCartesian(cx, cy, rOuter, endRad);
  const pInnerEnd = polarToCartesian(cx, cy, rInner, endRad);
  const pInnerStart = polarToCartesian(cx, cy, rInner, startRad);

  const largeArc = effectiveSweep > 180 ? 1 : 0;

  const path = [
    `M ${pOuterStart.x.toFixed(2)} ${pOuterStart.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${pOuterEnd.x.toFixed(2)} ${pOuterEnd.y.toFixed(2)}`,
    `L ${pInnerEnd.x.toFixed(2)} ${pInnerEnd.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${pInnerStart.x.toFixed(2)} ${pInnerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");

  // Sample 32 points along inner & outer arcs to compute exact tight bounding box for image slice
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = startRad + t * (endRad - startRad);
    const po = polarToCartesian(cx, cy, rOuter, ang);
    const pi = polarToCartesian(cx, cy, rInner, ang);
    minX = Math.min(minX, po.x, pi.x);
    minY = Math.min(minY, po.y, pi.y);
    maxX = Math.max(maxX, po.x, pi.x);
    maxY = Math.max(maxY, po.y, pi.y);
  }

  const bleed = 8;
  const bbox: BoundingBox = {
    x: minX - bleed,
    y: minY - bleed,
    width: Math.max(40, maxX - minX + bleed * 2),
    height: Math.max(40, maxY - minY + bleed * 2),
  };

  return {
    path,
    bbox,
    midPoint: polarToCartesian(cx, cy, (rInner + rOuter) / 2, midAngleRad),
    outerMidPoint: polarToCartesian(cx, cy, rOuter, midAngleRad),
    midAngleDeg,
    midAngleRad,
  };
}

/**
 * Section 4.3 Cubic Bezier Tracer Curve:
 * C1 projected outward along dial normal vector (+60px)
 * C2 aligned horizontally with card anchor point (+-40px)
 */
export function describeCubicTracer(
  dialX: number,
  dialY: number,
  thetaRad: number,
  cardX: number,
  cardY: number,
  cardIsOnLeft: boolean,
  normalOutreach = 60
): string {
  const c1x = dialX + Math.cos(thetaRad) * normalOutreach;
  const c1y = dialY + Math.sin(thetaRad) * normalOutreach;
  const c2x = cardX + (cardIsOnLeft ? 40 : -40);
  const c2y = cardY;

  return `M ${dialX.toFixed(2)},${dialY.toFixed(2)} C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${cardX.toFixed(2)},${cardY.toFixed(2)}`;
}

/**
 * Assign concentric inner orbital track index (0, 1, 2) for overlapping events
 * Section 2.2: R = 140px, 120px, 100px
 */
export function assignOrbitalTracks(
  events: CircadianEventDTO[]
): Map<string, { track: number; startMin: number; endMin: number }> {
  const result = new Map<string, { track: number; startMin: number; endMin: number }>();

  const parsed = events.map((ev) => {
    const s = dateToMinutes(new Date(ev.startTime));
    const e = dateToMinutes(new Date(ev.endTime));
    const dur = getDurationMinutes(s, e);
    return { id: ev.id, startMin: s, endMin: e, dur };
  });

  // Sort longer background windows (like sleep/fasting) to outer/primary track first, then by start time
  parsed.sort((a, b) => a.startMin - b.startMin || b.dur - a.dur);

  const trackIntervals: Array<Array<[number, number]>> = [[], [], []];

  const overlaps = (a1: number, a2: number, b1: number, b2: number) => {
    return Math.max(a1, b1) < Math.min(a2, b2);
  };

  for (const item of parsed) {
    // Expand wrap-around interval into 1 or 2 linear segments in [0, 1440]
    const segments: Array<[number, number]> =
      item.endMin > item.startMin
        ? [[item.startMin, item.endMin]]
        : [
            [item.startMin, 1440],
            [0, item.endMin],
          ];

    let chosenTrack = 0;
    for (let t = 0; t < 3; t++) {
      const hasConflict = segments.some(([s1, e1]) =>
        trackIntervals[t].some(([s2, e2]) => overlaps(s1, e1, s2, e2))
      );
      if (!hasConflict) {
        chosenTrack = t;
        break;
      }
      if (t === 2) chosenTrack = 2;
    }

    segments.forEach((seg) => trackIntervals[chosenTrack].push(seg));
    result.set(item.id, {
      track: chosenTrack,
      startMin: item.startMin,
      endMin: item.endMin,
    });
  }

  return result;
}

/**
 * Section 2.1 Diurnal Color Gradient & Circadian Phase Metadata
 */
export function getCircadianPhase(minutes: number): {
  name: string;
  subtitle: string;
  colorStart: string;
  colorEnd: string;
  pillColor: string;
} {
  const m = ((minutes % 1440) + 1440) % 1440;
  // Dawn: 05:00 (300) - 08:00 (480)
  if (m >= 300 && m < 480) {
    return {
      name: "DAWN EMERGENCE",
      subtitle: "Cortisol Awakening & Metabolic Priming",
      colorStart: "#38bdf8",
      colorEnd: "#f59e0b",
      pillColor: "#38bdf8",
    };
  }
  // Daylight: 08:00 (480) - 16:30 (990)
  if (m >= 480 && m < 990) {
    return {
      name: "SOLAR APEX",
      subtitle: "Peak Cognitive Output & Executive Velocity",
      colorStart: "#fbbf24",
      colorEnd: "#f97316",
      pillColor: "#fbbf24",
    };
  }
  // Sunset / Dusk: 16:30 (990) - 19:30 (1170)
  if (m >= 990 && m < 1170) {
    return {
      name: "TWILIGHT DUSK",
      subtitle: "Physical Decompression & Pack Anchor",
      colorStart: "#ea580c",
      colorEnd: "#9333ea",
      pillColor: "#f97316",
    };
  }
  // Night: 19:30 - 05:00
  return {
    name: "MIDNIGHT NADIR",
    subtitle: "Cellular Repair & Melatonin Consolidation",
    colorStart: "#312e81",
    colorEnd: "#090d16",
    pillColor: "#818cf8",
  };
}

// ─── 24-Hour Day-to-Night Time-Lapse Color Continuum ──────────────────────────

const TIMELAPSE_STOPS: Array<{ min: number; rgb: [number, number, number] }> = [
  { min: 0,    rgb: [7, 11, 25] },     // 00:00 Pitch-black Milky Way midnight
  { min: 150,  rgb: [13, 21, 48] },    // 02:30 Deep astral night
  { min: 270,  rgb: [28, 46, 108] },   // 04:30 Pre-dawn cobalt indigo
  { min: 330,  rgb: [14, 132, 199] },  // 05:30 Nautical dawn cyan
  { min: 365,  rgb: [56, 189, 248] },  // 06:05 Dawn horizon break (#38bdf8)
  { min: 405,  rgb: [251, 191, 36] },  // 06:45 Sunrise golden crest
  { min: 470,  rgb: [96, 185, 250] },  // 07:50 Crisp morning cerulean sky
  { min: 600,  rgb: [59, 158, 248] },  // 10:00 High morning azure
  { min: 720,  rgb: [147, 213, 255] }, // 12:00 Radiant High Noon zenith sky
  { min: 825,  rgb: [253, 224, 71] },  // 13:45 Solar apex warm crown
  { min: 945,  rgb: [251, 191, 36] },  // 15:45 Afternoon solar amber (#fbbf24)
  { min: 1050, rgb: [249, 115, 22] },  // 17:30 Golden hour tangerine (#f97316)
  { min: 1105, rgb: [234, 88, 12] },   // 18:25 Fiery sunset ember (#ea580c)
  { min: 1165, rgb: [147, 51, 234] },  // 19:25 Twilight dusk magenta (#9333ea)
  { min: 1245, rgb: [49, 46, 129] },   // 20:45 Cosmic nightfall indigo (#312e81)
  { min: 1350, rgb: [17, 20, 48] },    // 22:30 Starfield midnight navy
  { min: 1440, rgb: [7, 11, 25] },     // 24:00 Seamless wrap to 00:00
];

export function getTimelapseColorAtMinutes(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  for (let i = 0; i < TIMELAPSE_STOPS.length - 1; i++) {
    const a = TIMELAPSE_STOPS[i];
    const b = TIMELAPSE_STOPS[i + 1];
    if (m >= a.min && m <= b.min) {
      const t = (m - a.min) / Math.max(1, b.min - a.min);
      const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t);
      const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t);
      const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t);
      return `rgb(${r}, ${g}, ${bl})`;
    }
  }
  return "rgb(7, 11, 25)";
}

/**
 * Generates seamless pure-SVG annular slices around the 360° wheel
 * to render a true vector 24-hour Day-to-Night Time-Lapse color ring
 */
export function buildTimelapseWheelSegments(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  steps = 144
): Array<{ d: string; color: string; midMin: number }> {
  const stepMin = 1440 / steps;
  const overlapDeg = 0.55; // Slight overlap prevents anti-aliasing hairline seams
  const segments: Array<{ d: string; color: string; midMin: number }> = [];

  for (let i = 0; i < steps; i++) {
    const startMin = i * stepMin;
    const midMin = startMin + stepMin / 2;
    const startDeg = minutesToAngleDeg(startMin) - overlapDeg / 2;
    const endDeg = minutesToAngleDeg(startMin + stepMin) + overlapDeg / 2;
    const sRad = (startDeg * Math.PI) / 180;
    const eRad = (endDeg * Math.PI) / 180;

    const pOS = polarToCartesian(cx, cy, rOuter, sRad);
    const pOE = polarToCartesian(cx, cy, rOuter, eRad);
    const pIE = polarToCartesian(cx, cy, rInner, eRad);
    const pIS = polarToCartesian(cx, cy, rInner, sRad);

    const d = [
      `M ${pOS.x.toFixed(2)} ${pOS.y.toFixed(2)}`,
      `A ${rOuter} ${rOuter} 0 0 1 ${pOE.x.toFixed(2)} ${pOE.y.toFixed(2)}`,
      `L ${pIE.x.toFixed(2)} ${pIE.y.toFixed(2)}`,
      `A ${rInner} ${rInner} 0 0 0 ${pIS.x.toFixed(2)} ${pIS.y.toFixed(2)}`,
      "Z",
    ].join(" ");

    segments.push({
      d,
      color: getTimelapseColorAtMinutes(midMin),
      midMin,
    });
  }

  return segments;
}

/**
 * Generates multi-stop time-lapse stroke segments from 00:00 up to currentMinutes
 * so the inner solar progress trail shifts organically from night -> dawn -> noon -> sunset -> night
 */
export function buildTimelapseProgressArcs(
  cx: number,
  cy: number,
  radius: number,
  currentMinutes: number,
  maxSteps = 96
): Array<{ d: string; color: string }> {
  const clamped = Math.max(6, Math.min(1438, currentMinutes));
  const steps = Math.max(4, Math.round((clamped / 1440) * maxSteps));
  const stepMin = clamped / steps;
  const arcs: Array<{ d: string; color: string }> = [];

  for (let i = 0; i < steps; i++) {
    const m1 = Math.max(0, i * stepMin - 0.8);
    const m2 = Math.min(1439.5, (i + 1) * stepMin + 0.8);
    const r1 = minutesToAngleRad(m1);
    const r2 = minutesToAngleRad(m2);
    const p1 = polarToCartesian(cx, cy, radius, r1);
    const p2 = polarToCartesian(cx, cy, radius, r2);
    arcs.push({
      d: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      color: getTimelapseColorAtMinutes((m1 + m2) / 2),
    });
  }

  return arcs;
}

