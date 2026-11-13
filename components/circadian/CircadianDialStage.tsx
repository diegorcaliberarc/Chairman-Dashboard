"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  Edit3,
  ListOrdered,
  Plus,
  Radio,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  CalendarHabitDTO,
  CalendarHighlightSpanDTO,
  CircadianEventDTO,
  DOMAIN_CONFIG,
  SubtaskListStyle,
  formatSubtaskMarker,
} from "@/lib/circadianTypes";
import {
  assignOrbitalTracks,
  buildTimelapseProgressArcs,
  buildTimelapseWheelSegments,
  cartesianToMinutes,
  dateToMinutes,
  describeAnnularWedge,
  describeCubicTracer,
  describeTimeArc,
  getCircadianPhase,
  getDurationMinutes,
  getTimelapseColorAtMinutes,
  minutesTo12Hour,
  minutesToAngleRad,
  polarToCartesian,
  timeToCartesian,
} from "@/lib/circadianMath";

export type RadarLayerKey =
  | "energy_forecast"
  | "activity_density"
  | "posture_biometrics"
  | "metabolic_burn";

export interface CircadianRadarLayerDTO {
  id: string;
  layerType: RadarLayerKey;
  label: string;
  shortLabel: string;
  unit: string;
  color: string;
  secondaryColor?: string;
  description?: string;
  bucketValues: number[]; // 96 15-min buckets [0..100]
  peakBucket?: number;
  troughBucket?: number;
  peakValue?: number;
  troughValue?: number;
  averageValue?: number;
}

function buildSmoothClosedSpline(points: Array<{ x: number; y: number }>): string {
  const n = points.length;
  if (n < 3) return "";
  const tension = 0.22;
  const cmds: string[] = [
    `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`,
  ];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    cmds.push(
      `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    );
  }
  cmds.push("Z");
  return cmds.join(" ");
}

interface CircadianDialStageProps {
  events: CircadianEventDTO[];
  highlightedTelemetry?: string | null;
  currentMinutes: number;
  isLiveTime: boolean;
  onScrubMinutes: (mins: number) => void;
  onResetLive: () => void;
  viewMode: "solar" | "quadrants";
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onToggleChecklist: (eventId: string, checklistId: string, nextVal: boolean) => void;
  onEditEvent: (event: CircadianEventDTO) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddChecklist: (eventId: string, label: string) => void;
  radarLayers?: CircadianRadarLayerDTO[];
  activeRadarTypes?: RadarLayerKey[];
  habits?: CalendarHabitDTO[];
  highlightSpans?: CalendarHighlightSpanDTO[];
  selectedDate?: string;
  subtaskStylesById?: Record<string, SubtaskListStyle>;
  onToggleSubtaskStyle?: (eventId: string) => void;
  onQuickIncrementHabit?: (habitId: string, delta: number) => void;
}

export function CircadianDialStage({
  events,
  highlightedTelemetry = null,
  currentMinutes,
  isLiveTime,
  onScrubMinutes,
  onResetLive,
  viewMode,
  selectedEventId,
  onSelectEvent,
  onToggleChecklist,
  onEditEvent,
  onDeleteEvent,
  onAddChecklist,
  radarLayers = [],
  activeRadarTypes = [],
  habits = [],
  highlightSpans = [],
  selectedDate,
  subtaskStylesById = {},
  onToggleSubtaskStyle,
  onQuickIncrementHabit,
}: CircadianDialStageProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [isDraggingTime, setIsDraggingTime] = useState(false);
  const [quickItemText, setQuickItemText] = useState("");

  // Exact 1:1 Isotropic SVG Coordinate Space (760 × 760) — preserves pure geometric circles at every aspect ratio
  const VB_W = 760;
  const VB_H = 760;
  const CX = 380;
  const CY = 380;

  const scaleFactor = viewMode === "quadrants" ? 0.72 : 1;
  const R_SKY = 168 * scaleFactor;
  const R_TIMELAPSE_INNER = 168 * scaleFactor;
  const R_TIMELAPSE_OUTER = 182 * scaleFactor;
  const R_CLOCK_CORE = 78 * scaleFactor;
  const R_SOLAR_ARC = 104 * scaleFactor;
  const R_WEDGE_INNER = 196 * scaleFactor;
  const R_WEDGE_OUTER = 278 * scaleFactor;

  const activeId = hoveredEventId ?? selectedEventId;

  // 144-step 24-Hour Day-to-Night Time-Lapse Wheel Ring
  const timelapseWheelSegments = useMemo(
    () =>
      buildTimelapseWheelSegments(
        CX,
        CY,
        R_TIMELAPSE_INNER,
        R_TIMELAPSE_OUTER,
        144
      ),
    [CX, CY, R_TIMELAPSE_INNER, R_TIMELAPSE_OUTER]
  );

  // Subtle outer ambient time-lapse guide band behind wedges
  const outerTimelapseTrackSegments = useMemo(
    () =>
      buildTimelapseWheelSegments(
        CX,
        CY,
        R_WEDGE_INNER,
        R_WEDGE_INNER + 4 * scaleFactor,
        96
      ),
    [CX, CY, R_WEDGE_INNER, scaleFactor]
  );

  // Multi-stop time-lapse progress arc from 00:00 up to currentMinutes
  const solarProgressArcs = useMemo(
    () => buildTimelapseProgressArcs(CX, CY, R_SOLAR_ARC, currentMinutes, 96),
    [CX, CY, R_SOLAR_ARC, currentMinutes]
  );

  // Precompute wedge geometries + non-colliding label anchors
  const wedgeItems = useMemo(() => {
    const raw = events.map((ev) => {
      const startMin = dateToMinutes(new Date(ev.startTime));
      const endMin = dateToMinutes(new Date(ev.endTime));
      const durMin = getDurationMinutes(startMin, endMin);
      const midMin = (startMin + durMin / 2) % 1440;
      const wedge = describeAnnularWedge(
        CX,
        CY,
        R_WEDGE_INNER,
        R_WEDGE_OUTER,
        startMin,
        endMin,
        2.2
      );

      const labelRadius = R_WEDGE_OUTER + 16 * scaleFactor;
      const anchorPt = polarToCartesian(CX, CY, labelRadius, wedge.midAngleRad);
      const cosM = Math.cos(wedge.midAngleRad);
      const textAnchor: "start" | "end" | "middle" =
        Math.abs(cosM) < 0.22 ? "middle" : cosM > 0 ? "start" : "end";

      return {
        event: ev,
        startMin,
        endMin,
        durMin,
        midMin,
        timelapseColor: getTimelapseColorAtMinutes(midMin),
        wedge,
        labelX: anchorPt.x,
        labelY: anchorPt.y,
        textAnchor,
        cosM,
      };
    });

    const resolveSide = (items: typeof raw) => {
      const sorted = [...items].sort((a, b) => a.labelY - b.labelY);
      const minGap = 36;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].labelY - sorted[i - 1].labelY < minGap) {
          sorted[i].labelY = sorted[i - 1].labelY + minGap;
        }
      }
    };
    resolveSide(raw.filter((i) => i.cosM >= 0));
    resolveSide(raw.filter((i) => i.cosM < 0));

    return raw;
  }, [
    events,
    CX,
    CY,
    R_WEDGE_INNER,
    R_WEDGE_OUTER,
    scaleFactor,
  ]);

  // Compute glowing empty slate / free-time arcs between scheduled events
  const freeArcs = useMemo(() => {
    if (events.length === 0) return [];
    // Sort intervals by startMin
    const intervals = events
      .map((ev) => {
        const s = dateToMinutes(new Date(ev.startTime));
        const e = dateToMinutes(new Date(ev.endTime));
        return { s, e };
      })
      .sort((a, b) => a.s - b.s);

    const gaps: { startMin: number; endMin: number }[] = [];
    for (let i = 0; i < intervals.length; i++) {
      const current = intervals[i];
      const next = intervals[(i + 1) % intervals.length];
      const gapStart = current.e % 1440;
      const gapEnd = next.s % 1440;
      const gapDur = (gapEnd - gapStart + 1440) % 1440;
      if (gapDur > 20) {
        gaps.push({ startMin: gapStart, endMin: gapEnd });
      }
    }

    return gaps.map((gap, idx) => {
      const wedge = describeAnnularWedge(
        CX,
        CY,
        R_WEDGE_INNER,
        R_WEDGE_OUTER,
        gap.startMin,
        gap.endMin,
        2.2
      );
      return {
        id: `gap-${idx}`,
        path: wedge.path,
        startMin: gap.startMin,
        endMin: gap.endMin,
      };
    });
  }, [events, CX, CY, R_WEDGE_INNER, R_WEDGE_OUTER]);

  // Assign up to 4 quadrant cards for Quadrant Mode
  const quadrantAssignments = useMemo(() => {
    const slots: Record<number, (typeof wedgeItems)[number] | null> = {
      1: null,
      2: null,
      3: null,
      4: null,
    };

    for (const item of wedgeItems) {
      const slot = item.event.quadrantSlot;
      if (slot && slot >= 1 && slot <= 4 && !slots[slot]) {
        slots[slot] = item;
      }
    }

    for (const item of wedgeItems) {
      if (Object.values(slots).some((v) => v?.event.id === item.event.id))
        continue;
      const m = item.startMin;
      const preferred =
        m >= 360 && m < 720
          ? [1, 3, 2, 4]
          : m >= 720 && m < 1020
          ? [2, 4, 1, 3]
          : m >= 1020
          ? [4, 2, 3, 1]
          : [3, 1, 4, 2];
      for (const s of preferred) {
        if (!slots[s]) {
          slots[s] = item;
          break;
        }
      }
    }

    const cardAnchors: Record<
      number,
      { cardX: number; cardY: number; isLeft: boolean; posClass: string }
    > = {
      1: {
        cardX: 98,
        cardY: 165,
        isLeft: true,
        posClass: "left-2 top-4",
      },
      2: {
        cardX: VB_W - 98,
        cardY: 165,
        isLeft: false,
        posClass: "right-2 top-4",
      },
      3: {
        cardX: 98,
        cardY: VB_H - 175,
        isLeft: true,
        posClass: "left-2 bottom-4",
      },
      4: {
        cardX: VB_W - 98,
        cardY: VB_H - 175,
        isLeft: false,
        posClass: "right-2 bottom-4",
      },
    };

    return [1, 2, 3, 4]
      .map((slot) => {
        const item = slots[slot];
        if (!item) return null;
        const anchor = cardAnchors[slot];
        const dialPt = polarToCartesian(
          CX,
          CY,
          R_WEDGE_OUTER,
          item.wedge.midAngleRad
        );
        const tracerPath = describeCubicTracer(
          dialPt.x,
          dialPt.y,
          item.wedge.midAngleRad,
          anchor.cardX,
          anchor.cardY,
          anchor.isLeft,
          48
        );
        return {
          slot,
          item,
          anchor,
          dialPt,
          tracerPath,
        };
      })
      .filter(Boolean) as Array<{
      slot: number;
      item: (typeof wedgeItems)[number];
      anchor: { cardX: number; cardY: number; isLeft: boolean; posClass: string };
      dialPt: { x: number; y: number };
      tracerPath: string;
    }>;
  }, [wedgeItems, CX, CY, R_WEDGE_OUTER, VB_W, VB_H]);

  const selectedWedgeItem = useMemo(
    () => wedgeItems.find((w) => w.event.id === selectedEventId) ?? null,
    [wedgeItems, selectedEventId]
  );

  const selectedInspectorGeometry = useMemo(() => {
    if (!selectedWedgeItem || viewMode !== "solar") return null;
    const isRightEvent = selectedWedgeItem.cosM >= 0;
    const placeLeft = !isRightEvent;
    const cardX = placeLeft ? 104 : VB_W - 104;
    const cardY = Math.max(
      175,
      Math.min(VB_H - 185, selectedWedgeItem.wedge.outerMidPoint.y)
    );
    const dialPt = selectedWedgeItem.wedge.outerMidPoint;
    const tracerPath = describeCubicTracer(
      dialPt.x,
      dialPt.y,
      selectedWedgeItem.wedge.midAngleRad,
      cardX,
      cardY,
      placeLeft,
      46
    );
    return {
      placeLeft,
      cardX,
      cardY,
      dialPt,
      tracerPath,
    };
  }, [selectedWedgeItem, viewMode, VB_W, VB_H]);

  // Real-time Solar Node coordinates
  const nowRad = minutesToAngleRad(currentMinutes);
  const solarInnerPt = polarToCartesian(CX, CY, R_SOLAR_ARC, nowRad);
  const solarMidnightPt = timeToCartesian(CX, CY, R_SOLAR_ARC, 0);
  const solarRimPt = polarToCartesian(CX, CY, R_TIMELAPSE_OUTER, nowRad);
  const solarTagPt = polarToCartesian(
    CX,
    CY,
    R_SOLAR_ARC + 25 * scaleFactor,
    nowRad
  );
  const currentPhase = getCircadianPhase(currentMinutes);
  const liveSolarColor = getTimelapseColorAtMinutes(currentMinutes);

  // Interactive pointer time scrubbing using exact SVG screen CTM (zero aspect distortion)
  const updateScrubFromPointer = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (ctm) {
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgPt = pt.matrixTransform(ctm.inverse());
      const mins = cartesianToMinutes(CX, CY, svgPt.x, svgPt.y);
      onScrubMinutes(Math.round(mins));
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VB_W;
    const y = ((clientY - rect.top) / rect.height) * VB_H;
    onScrubMinutes(Math.round(cartesianToMinutes(CX, CY, x, y)));
  };

  const skyImgBleed = 1.18;
  const skyImgSize = R_SKY * 2 * skyImgBleed;

  const selectedInspectorStyle: SubtaskListStyle = selectedWedgeItem
    ? subtaskStylesById[selectedWedgeItem.event.id] ??
      selectedWedgeItem.event.subtaskStyle ??
      "roman"
    : "roman";

  return (
    <div
      className="relative w-full flex items-center justify-center select-none"
      onPointerMove={(e) => {
        if (isDraggingTime) {
          updateScrubFromPointer(e.clientX, e.clientY);
        }
      }}
      onPointerUp={() => setIsDraggingTime(false)}
      onPointerLeave={() => setIsDraggingTime(false)}
    >
      {/* Master 1:1 Isotropic SVG Viewport — Strict 760×760 Circle Geometry */}
      <svg
        ref={svgRef}
        viewBox="0 0 760 760"
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 w-full max-w-[760px] aspect-square h-auto max-h-[calc(100vh-132px)] block mx-auto overflow-visible"
      >
        <defs>
          <filter id="solarNodeGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arcNeonGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="timelapseHaloBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>

          <radialGradient id="skyDepthVignette" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#050814" stopOpacity="0.32" />
            <stop offset="55%" stopColor="#050814" stopOpacity="0.06" />
            <stop offset="86%" stopColor="#050814" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#04060e" stopOpacity="0.62" />
          </radialGradient>

          <radialGradient id="wedgeVignette" cx="50%" cy="50%" r="55%">
            <stop offset="58%" stopColor="#05070d" stopOpacity="0.34" />
            <stop offset="82%" stopColor="#05070d" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#05070d" stopOpacity="0.45" />
          </radialGradient>

          <clipPath id="skySphereCircleClip">
            <circle cx={CX} cy={CY} r={R_SKY} />
          </clipPath>

          {wedgeItems.map(({ event, wedge }) => (
            <clipPath key={`clip-${event.id}`} id={`wedge-clip-${event.id}`}>
              <path d={wedge.path} />
            </clipPath>
          ))}
        </defs>

        {/* 1. Soft Ambient 24-Hour Time-Lapse Atmospheric Halo */}
        <g opacity="0.26" filter="url(#timelapseHaloBlur)" className="pointer-events-none">
          {timelapseWheelSegments
            .filter((_, i) => i % 2 === 0)
            .map((seg, idx) => (
              <path key={`halo-${idx}`} d={seg.d} fill={seg.color} />
            ))}
        </g>

        {/* 2. Pure-Circle Clipped 24-Hour Day-to-Night Sky & Milky Way Sphere */}
        <g
          clipPath="url(#skySphereCircleClip)"
          className="cursor-crosshair"
          onPointerDown={(e) => {
            setIsDraggingTime(true);
            updateScrubFromPointer(e.clientX, e.clientY);
          }}
        >
          <circle cx={CX} cy={CY} r={R_SKY} fill="#070b18" />
          <image
            href="/circadian/sky-timelapse.jpg"
            x={CX - skyImgSize / 2}
            y={CY - skyImgSize / 2}
            width={skyImgSize}
            height={skyImgSize}
            preserveAspectRatio="xMidYMid slice"
          />
          <circle cx={CX} cy={CY} r={R_SKY} fill="url(#skyDepthVignette)" />
        </g>

        {/* 3. Continuous 360° 24-Hour Day-to-Night Time-Lapse Color Spectrum Wheel Band */}
        <g
          className="cursor-crosshair"
          onPointerDown={(e) => {
            setIsDraggingTime(true);
            updateScrubFromPointer(e.clientX, e.clientY);
          }}
        >
          {timelapseWheelSegments.map((seg, idx) => (
            <path key={`tl-${idx}`} d={seg.d} fill={seg.color} opacity="0.92" />
          ))}
          <circle
            cx={CX}
            cy={CY}
            r={R_TIMELAPSE_INNER}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_TIMELAPSE_OUTER}
            fill="none"
            stroke="rgba(255,255,255,0.34)"
            strokeWidth="1.2"
          />
        </g>

        {/* Subtle Outer Time-Lapse Continuum Guide Track */}
        <g opacity="0.5" className="pointer-events-none">
          {outerTimelapseTrackSegments.map((seg, idx) => (
            <path key={`otl-${idx}`} d={seg.d} fill={seg.color} />
          ))}
        </g>

        {/* 4. 12-Hour Regular Clock Dial Precision Ticks (12 on Top, 3 on Right, 6 on Bottom, 9 on Left) */}
        <g className="pointer-events-none">
          {Array.from({ length: 48 }, (_, idx) => {
            const mins = idx * 30;
            const isCardinal = mins % 360 === 0;
            const isHour = mins % 60 === 0;
            const rad = minutesToAngleRad(mins);
            const r1 = isCardinal
              ? R_SKY - 12 * scaleFactor
              : isHour
              ? R_TIMELAPSE_INNER + 2 * scaleFactor
              : R_TIMELAPSE_INNER + 5 * scaleFactor;
            const r2 = isCardinal
              ? R_TIMELAPSE_OUTER + 3 * scaleFactor
              : R_TIMELAPSE_OUTER - 1.5 * scaleFactor;
            const p1 = polarToCartesian(CX, CY, r1, rad);
            const p2 = polarToCartesian(CX, CY, r2, rad);
            return (
              <line
                key={idx}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={
                  isCardinal
                    ? "#ffffff"
                    : isHour
                    ? "rgba(255,255,255,0.75)"
                    : "rgba(255,255,255,0.35)"
                }
                strokeWidth={isCardinal ? 2 : isHour ? 1.2 : 0.75}
              />
            );
          })}
        </g>

        {/* 5. Regular Clock Style Anchors: 12 on Top, 3 on Right, 6 on Bottom, 9 on Left */}
        <g
          className="pointer-events-none select-none"
          style={{ fontFamily: "var(--font-letters, sans-serif)" }}
        >
          {[
            { mins: 720, label: "12", dx: 0, dy: 16 * scaleFactor },
            { mins: 1080, label: "3", dx: -24 * scaleFactor, dy: 4 * scaleFactor },
            { mins: 0, label: "6", dx: 0, dy: -12 * scaleFactor },
            { mins: 360, label: "9", dx: 24 * scaleFactor, dy: 4 * scaleFactor },
          ].map((c) => {
            const pt = timeToCartesian(CX, CY, R_SKY - 4 * scaleFactor, c.mins);
            return (
              <g key={c.label}>
                <text
                  x={pt.x + c.dx}
                  y={pt.y + c.dy}
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.95)"
                  stroke="rgba(8, 11, 20, 0.85)"
                  strokeWidth="2.8"
                  paintOrder="stroke"
                  fontSize={14 * scaleFactor}
                  fontWeight={800}
                  letterSpacing="0.04em"
                >
                  {c.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* 5.5 Realistic Sunrise (06:24 AM) and Sunset (05:48 PM / 17:48) Markers on Color Wheel */}
        <g className="pointer-events-none">
          {[
            {
              mins: 384, // 06:24 AM Sunrise
              label: "SUNRISE 06:24",
              type: "sunrise",
              color: "#fbbf24",
              icon: "🌅",
            },
            {
              mins: 1068, // 17:48 (05:48 PM) Sunset
              label: "SUNSET 17:48",
              type: "sunset",
              color: "#f97316",
              icon: "🌇",
            },
          ].map((sol) => {
            const rad = minutesToAngleRad(sol.mins);
            const ptIn = polarToCartesian(CX, CY, R_TIMELAPSE_INNER - 6 * scaleFactor, rad);
            const ptOut = polarToCartesian(CX, CY, R_TIMELAPSE_OUTER + 8 * scaleFactor, rad);
            const tagPt = polarToCartesian(CX, CY, R_TIMELAPSE_OUTER + 24 * scaleFactor, rad);
            return (
              <g key={sol.type}>
                <line
                  x1={ptIn.x}
                  y1={ptIn.y}
                  x2={ptOut.x}
                  y2={ptOut.y}
                  stroke={sol.color}
                  strokeWidth={2.4 * scaleFactor}
                  filter="url(#arcNeonGlow)"
                />
                <circle
                  cx={ptOut.x}
                  cy={ptOut.y}
                  r={3.8 * scaleFactor}
                  fill={sol.color}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                <rect
                  x={tagPt.x - 42 * scaleFactor}
                  y={tagPt.y - 8 * scaleFactor}
                  width={84 * scaleFactor}
                  height={16 * scaleFactor}
                  rx={8 * scaleFactor}
                  fill="rgba(8, 12, 24, 0.92)"
                  stroke={sol.color}
                  strokeWidth="1"
                />
                <text
                  x={tagPt.x}
                  y={tagPt.y + 3.2 * scaleFactor}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={7.8 * scaleFactor}
                  fontWeight={800}
                  letterSpacing="0.06em"
                >
                  {sol.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* 7. Inner Solar Orbit Ring & Live Beacon */}
        <g>
          <circle
            cx={CX}
            cy={CY}
            r={R_SOLAR_ARC}
            fill="rgba(6, 9, 19, 0.34)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
          />

          <line
            x1={CX}
            y1={CY}
            x2={solarRimPt.x}
            y2={solarRimPt.y}
            stroke={liveSolarColor}
            strokeOpacity="0.5"
            strokeWidth="1.2"
            strokeDasharray="3 4"
            className="pointer-events-none"
          />

          <g filter="url(#arcNeonGlow)" className="pointer-events-none">
            {solarProgressArcs.map((seg, i) => (
              <path
                key={`sp-${i}`}
                d={seg.d}
                fill="none"
                stroke={seg.color}
                strokeWidth={5.2 * scaleFactor}
                strokeLinecap="round"
              />
            ))}
          </g>

          <circle
            cx={solarMidnightPt.x}
            cy={solarMidnightPt.y}
            r={4 * scaleFactor}
            fill="#818cf8"
            stroke="#e0e7ff"
            strokeWidth="1.2"
          />

          <circle
            cx={solarRimPt.x}
            cy={solarRimPt.y}
            r={4.8 * scaleFactor}
            fill={liveSolarColor}
            stroke="#ffffff"
            strokeWidth="1.6"
            filter="url(#solarNodeGlow)"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDraggingTime(true);
            }}
          />

          <circle
            cx={solarInnerPt.x}
            cy={solarInnerPt.y}
            r={12.5 * scaleFactor}
            fill={liveSolarColor}
            fillOpacity="0.32"
            className="solar-pulse-ring pointer-events-none"
          />
          <circle
            cx={solarInnerPt.x}
            cy={solarInnerPt.y}
            r={6.8 * scaleFactor}
            fill="#fefce8"
            stroke="#f59e0b"
            strokeWidth="2.2"
            filter="url(#solarNodeGlow)"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDraggingTime(true);
            }}
          />

          <g
            transform={`translate(${solarTagPt.x.toFixed(1)}, ${solarTagPt.y.toFixed(1)})`}
            className="pointer-events-none"
          >
            <rect
              x={-36 * scaleFactor}
              y={-10 * scaleFactor}
              width={72 * scaleFactor}
              height={20 * scaleFactor}
              rx={10 * scaleFactor}
              fill="rgba(7, 10, 19, 0.88)"
              stroke="rgba(251, 191, 36, 0.65)"
              strokeWidth="1.1"
            />
            <text
              x={0}
              y={3.4 * scaleFactor}
              textAnchor="middle"
              fill="#fef3c7"
              fontSize={9.2 * scaleFactor}
              fontWeight={700}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {minutesTo12Hour(currentMinutes, true)}
            </text>
          </g>

          {/* Hollow Center Clock Core with Giant Digital Time Display */}
          <g className="pointer-events-none select-none">
            {/* Dark navy/black backplate core */}
            <circle
              cx={CX}
              cy={CY}
              r={R_CLOCK_CORE}
              fill="#0E111A"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth="1.8"
            />
            {/* Subtle outer glowing gradient ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R_CLOCK_CORE - 4 * scaleFactor}
              fill="none"
              stroke="rgba(226, 241, 255, 0.22)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Giant Digital Time Display e.g. "10:37 AM" with soft white-blue glow */}
            <text
              x={CX}
              y={CY + 11 * scaleFactor}
              textAnchor="middle"
              fill="#ffffff"
              style={{
                fontFamily: "var(--font-numbers, inherit)",
                fontVariantNumeric: "tabular-nums",
                filter: "drop-shadow(0 0 12px rgba(226, 241, 255, 0.55)) drop-shadow(0 0 24px rgba(56, 189, 248, 0.25))",
              }}
              fontSize={32 * scaleFactor}
              fontWeight={800}
              letterSpacing="-0.02em"
            >
              {minutesTo12Hour(currentMinutes, false)}
            </text>
          </g>
        </g>

        {/* 8. Empty Slates / Free Time Arc Outlines (Subtle glowing translucent blue arcs) */}
        <g className="pointer-events-none">
          {freeArcs.map((gap) => (
            <path
              key={gap.id}
              d={gap.path}
              fill="none"
              stroke="rgba(56, 189, 248, 0.42)"
              strokeWidth={1.8 * scaleFactor}
              strokeDasharray="6 6"
              filter="url(#arcNeonGlow)"
              opacity="0.8"
            />
          ))}
        </g>

        {/* 9. Outer Curved Annular Visual Media Wedges */}
        <g>
          {wedgeItems.map((item) => {
            const {
              event,
              wedge,
              startMin,
              endMin,
              timelapseColor,
              labelX,
              labelY,
              textAnchor,
            } = item;
            const isSelected = selectedEventId === event.id;
            const isHovered = hoveredEventId === event.id;
            const matchesTelemetry =
              !highlightedTelemetry ||
              event.telemetrySource === highlightedTelemetry;
            const isHighlighted =
              isSelected ||
              isHovered ||
              Boolean(
                highlightedTelemetry &&
                  event.telemetrySource === highlightedTelemetry
              );
            const strokeColor = event.accentColor || timelapseColor;

            return (
              <g
                key={event.id}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                onClick={() =>
                  onSelectEvent(selectedEventId === event.id ? null : event.id)
                }
              >
                <g
                  clipPath={`url(#wedge-clip-${event.id})`}
                  opacity={
                    !matchesTelemetry
                      ? 0.28
                      : activeId && !isHighlighted
                      ? 0.76
                      : 1
                  }
                  className="transition-opacity duration-300"
                >
                  <rect
                    x={wedge.bbox.x}
                    y={wedge.bbox.y}
                    width={wedge.bbox.width}
                    height={wedge.bbox.height}
                    fill="#111827"
                  />
                  {event.mediaType === "video_loop" ? (
                    <foreignObject
                      x={wedge.bbox.x}
                      y={wedge.bbox.y}
                      width={wedge.bbox.width}
                      height={wedge.bbox.height}
                    >
                      <video
                        src={event.mediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </foreignObject>
                  ) : (
                    <image
                      href={event.mediaUrl}
                      x={wedge.bbox.x}
                      y={wedge.bbox.y}
                      width={wedge.bbox.width}
                      height={wedge.bbox.height}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  )}
                  <rect
                    x={wedge.bbox.x}
                    y={wedge.bbox.y}
                    width={wedge.bbox.width}
                    height={wedge.bbox.height}
                    fill="url(#wedgeVignette)"
                  />
                </g>

                <path
                  d={wedge.path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 3.4 : 2.3}
                  strokeLinejoin="round"
                  filter={isHighlighted ? "url(#arcNeonGlow)" : undefined}
                  opacity={
                    !matchesTelemetry
                      ? 0.3
                      : activeId && !isHighlighted
                      ? 0.72
                      : 0.98
                  }
                />

                {viewMode === "solar" && (
                  <g
                    opacity={!matchesTelemetry ? 0.35 : 1}
                    className="transition-opacity duration-200"
                  >
                    <line
                      x1={wedge.outerMidPoint.x}
                      y1={wedge.outerMidPoint.y}
                      x2={
                        CX +
                        (R_WEDGE_OUTER + 8 * scaleFactor) *
                          Math.cos(wedge.midAngleRad)
                      }
                      y2={
                        CY +
                        (R_WEDGE_OUTER + 8 * scaleFactor) *
                          Math.sin(wedge.midAngleRad)
                      }
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2 : 1.3}
                      opacity={0.9}
                    />
                    <text
                      x={labelX}
                      y={labelY - 5}
                      textAnchor={textAnchor}
                      fill="#f8fafc"
                      fontSize={12.5}
                      fontWeight={600}
                      letterSpacing="0.01em"
                    >
                      {event.title}
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 11}
                      textAnchor={textAnchor}
                      fill="rgba(148, 163, 184, 0.92)"
                      fontSize={10}
                      fontWeight={500}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {minutesTo12Hour(startMin)} - {minutesTo12Hour(endMin)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 9. Illuminated Cubic Bezier Callout Tracers — Solar Inspector Mode */}
        {viewMode === "solar" && selectedWedgeItem && selectedInspectorGeometry && (
          <g className="pointer-events-none">
            <path
              d={selectedInspectorGeometry.tracerPath}
              fill="none"
              stroke={
                selectedWedgeItem.event.accentColor ||
                selectedWedgeItem.timelapseColor
              }
              strokeWidth="4"
              opacity="0.26"
              filter="url(#arcNeonGlow)"
            />
            <path
              d={selectedInspectorGeometry.tracerPath}
              fill="none"
              stroke={
                selectedWedgeItem.event.accentColor ||
                selectedWedgeItem.timelapseColor
              }
              strokeWidth="2"
              className="circadian-tracer-animated"
            />
            <circle
              cx={selectedInspectorGeometry.dialPt.x}
              cy={selectedInspectorGeometry.dialPt.y}
              r="4.5"
              fill="#ffffff"
              stroke={
                selectedWedgeItem.event.accentColor ||
                selectedWedgeItem.timelapseColor
              }
              strokeWidth="2"
              filter="url(#arcNeonGlow)"
            />
            <circle
              cx={selectedInspectorGeometry.cardX}
              cy={selectedInspectorGeometry.cardY}
              r="4"
              fill={selectedWedgeItem.event.accentColor}
            />
          </g>
        )}

        {/* 10. Illuminated Cubic Bezier Callout Tracers — 4-Quadrant Simultaneous Mode */}
        {viewMode === "quadrants" &&
          quadrantAssignments.map(({ slot, item, anchor, dialPt, tracerPath }) => {
            const isHighlighted = activeId === item.event.id;
            const color = item.event.accentColor || item.timelapseColor;
            return (
              <g key={`q-tracer-${slot}`} className="pointer-events-none">
                <path
                  d={tracerPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 5 : 2.5}
                  opacity={isHighlighted ? 0.38 : 0.16}
                  filter="url(#arcNeonGlow)"
                />
                <path
                  d={tracerPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 2.4 : 1.6}
                  opacity={activeId && !isHighlighted ? 0.4 : 0.94}
                  className="circadian-tracer-animated"
                />
                <circle
                  cx={dialPt.x}
                  cy={dialPt.y}
                  r={isHighlighted ? 5 : 3.8}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth="2"
                  filter="url(#arcNeonGlow)"
                />
                <circle
                  cx={anchor.cardX}
                  cy={anchor.cardY}
                  r={3.5}
                  fill={color}
                />
              </g>
            );
          })}
      </svg>

      {/* Live / Scrubbed Time Reset Pill */}
      {!isLiveTime && (
        <button
          onClick={onResetLive}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg transition-all"
        >
          <Radio size={12} className="animate-pulse text-amber-400" />
          Time-Lapse Scrub: {minutesTo12Hour(currentMinutes)} · Snap to Live
        </button>
      )}

      {/* Floating Inspector Visual Event Card (Solar Mode when a Wedge is Clicked) */}
      {viewMode === "solar" && selectedWedgeItem && selectedInspectorGeometry && (
        <div
          className={`absolute z-30 w-[268px] rounded-2xl bg-[#0b0e17]/95 backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.75)] overflow-hidden animate-fade-in ${
            selectedInspectorGeometry.placeLeft ? "left-2" : "right-2"
          }`}
          style={{
            top: `${Math.max(
              8,
              Math.min(
                54,
                ((selectedInspectorGeometry.cardY - 120) / VB_H) * 100
              )
            )}%`,
            borderColor: `${selectedWedgeItem.event.accentColor}66`,
          }}
        >
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
            {selectedWedgeItem.event.mediaType === "video_loop" ? (
              <video
                src={selectedWedgeItem.event.mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={selectedWedgeItem.event.mediaUrl}
                alt={selectedWedgeItem.event.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e17] via-transparent to-black/30" />

            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase backdrop-blur-md border"
                style={{
                  backgroundColor: "rgba(9,13,22,0.75)",
                  color: selectedWedgeItem.event.accentColor,
                  borderColor: `${selectedWedgeItem.event.accentColor}55`,
                }}
              >
                {DOMAIN_CONFIG[selectedWedgeItem.event.domain].shortLabel}
              </span>
            </div>

            <div className="absolute top-2 right-2 flex items-center gap-1">
              {onToggleSubtaskStyle && (
                <button
                  onClick={() =>
                    onToggleSubtaskStyle(selectedWedgeItem.event.id)
                  }
                  className="px-1.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-[9px] font-mono font-bold text-amber-300 transition-colors"
                  title="Toggle Roman Numerals (I, II, III) vs Bullets (•)"
                >
                  {selectedInspectorStyle === "roman" ? "I·II" : "•"}
                </button>
              )}
              <button
                onClick={() => onEditEvent(selectedWedgeItem.event)}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-zinc-200 transition-colors"
                title="Edit Block"
              >
                <Edit3 size={12} />
              </button>
              <button
                onClick={() => onDeleteEvent(selectedWedgeItem.event.id)}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-red-950/80 text-zinc-300 hover:text-red-400 transition-colors"
                title="Delete Block"
              >
                <Trash2 size={12} />
              </button>
              <button
                onClick={() => onSelectEvent(null)}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-zinc-200 transition-colors"
                title="Close"
              >
                <X size={12} />
              </button>
            </div>

            <div className="absolute bottom-2 left-3 right-3">
              <div className="text-[10px] font-mono font-semibold text-amber-300/95">
                {minutesTo12Hour(selectedWedgeItem.startMin)} —{" "}
                {minutesTo12Hour(selectedWedgeItem.endMin)}
              </div>
              <h4 className="text-sm font-bold text-white leading-tight truncate">
                {selectedWedgeItem.event.title}
              </h4>
            </div>
          </div>

          <div className="p-3 space-y-2.5">
            {selectedWedgeItem.event.description && (
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                {selectedWedgeItem.event.description}
              </p>
            )}

            <div className="flex items-center justify-between text-[9.5px] font-bold uppercase tracking-wider text-zinc-400">
              <span className="flex items-center gap-1">
                <ListOrdered size={11} className="text-amber-400" />
                Nested Subtasks ({selectedInspectorStyle === "roman" ? "Roman" : "Bullets"})
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {selectedWedgeItem.event.checklists.map((chk, idx) => (
                <button
                  key={chk.id}
                  onClick={() =>
                    onToggleChecklist(
                      selectedWedgeItem.event.id,
                      chk.id,
                      !chk.isCompleted
                    )
                  }
                  className="w-full flex items-start gap-2 text-left py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      chk.isCompleted
                        ? "bg-amber-400 border-amber-400 text-black"
                        : "border-zinc-600 bg-transparent"
                    }`}
                  >
                    {chk.isCompleted && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="text-[10.5px] font-mono font-bold text-amber-300/90 shrink-0 min-w-[20px]">
                    {formatSubtaskMarker(idx, selectedInspectorStyle)}
                  </span>
                  <span
                    className={`text-[11px] leading-snug ${
                      chk.isCompleted
                        ? "line-through text-zinc-500"
                        : "text-zinc-200"
                    }`}
                  >
                    {chk.label}
                  </span>
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickItemText.trim()) return;
                onAddChecklist(selectedWedgeItem.event.id, quickItemText.trim());
                setQuickItemText("");
              }}
              className="flex items-center gap-1.5 pt-1 border-t border-white/10"
            >
              <input
                type="text"
                value={quickItemText}
                onChange={(e) => setQuickItemText(e.target.value)}
                placeholder="Add subtask..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200"
              >
                <Plus size={12} />
              </button>
            </form>

            <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1 font-mono">
                <Clock size={11} />
                {Math.round((selectedWedgeItem.durMin / 60) * 10) / 10}h block
              </span>
              {selectedWedgeItem.event.telemetrySource && (
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-wider text-[9px] text-zinc-300">
                  {selectedWedgeItem.event.telemetrySource.replace("_", " ")}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4 Flanking Quadrant Visual Event Cards (Quadrants Mode) */}
      {viewMode === "quadrants" &&
        quadrantAssignments.map(({ slot, item, anchor }) => {
          const { event, startMin, durMin, timelapseColor } = item;
          const isHighlighted = activeId === event.id;
          const color = event.accentColor || timelapseColor;
          const styleMode =
            subtaskStylesById[event.id] ?? event.subtaskStyle ?? "roman";
          const slotLabel =
            slot === 1
              ? "EARLY MORNING"
              : slot === 2
              ? "MIDDAY / AFTERNOON"
              : slot === 3
              ? "REST & PREP"
              : "EVENING / DUSK";

          return (
            <div
              key={`quad-card-${slot}`}
              onMouseEnter={() => setHoveredEventId(event.id)}
              onMouseLeave={() => setHoveredEventId(null)}
              onClick={() => onEditEvent(event)}
              className={`hidden xl:flex flex-col absolute z-20 w-[232px] rounded-2xl bg-[#0b0e17]/90 backdrop-blur-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                anchor.posClass
              } ${
                isHighlighted
                  ? "scale-[1.03] shadow-[0_14px_40px_rgba(0,0,0,0.85)]"
                  : "shadow-[0_10px_28px_rgba(0,0,0,0.6)] opacity-95"
              }`}
              style={{
                borderColor: isHighlighted ? color : "rgba(255,255,255,0.12)",
              }}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                <img
                  src={event.mediaUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e17] via-black/15 to-transparent" />
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-black/70 border"
                  style={{ color, borderColor: `${color}55` }}
                >
                  {slotLabel}
                </span>
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-zinc-200">
                  {Math.round((durMin / 60) * 10) / 10}h
                </span>
                <div className="absolute bottom-1.5 left-2.5 right-2.5">
                  <div
                    className="text-[9.5px] font-mono font-bold uppercase"
                    style={{ color }}
                  >
                    {minutesTo12Hour(startMin)} |{" "}
                    {DOMAIN_CONFIG[event.domain].shortLabel}
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {event.title}
                  </div>
                </div>
              </div>

              <div
                className="p-2.5 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                {event.checklists.slice(0, 2).map((chk, idx) => (
                  <button
                    key={chk.id}
                    onClick={() =>
                      onToggleChecklist(event.id, chk.id, !chk.isCompleted)
                    }
                    className="w-full flex items-center gap-1.5 text-left py-0.5 px-1 rounded hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                        chk.isCompleted
                          ? "bg-amber-400 border-amber-400 text-black"
                          : "border-zinc-600"
                      }`}
                    >
                      {chk.isCompleted && <Check size={9} strokeWidth={3} />}
                    </span>
                    <span className="text-[9.5px] font-mono font-bold text-amber-300/90 shrink-0">
                      {formatSubtaskMarker(idx, styleMode)}
                    </span>
                    <span
                      className={`text-[10.5px] truncate ${
                        chk.isCompleted
                          ? "line-through text-zinc-500"
                          : "text-zinc-300"
                      }`}
                    >
                      {chk.label}
                    </span>
                  </button>
                ))}
                <div className="flex items-center justify-between pt-1 text-[9px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Sparkles size={9} style={{ color }} />
                    {event.telemetrySource
                      ? event.telemetrySource.replace("_", " ").toUpperCase()
                      : "CIRCADIAN LOCK"}
                  </span>
                  <button
                    onClick={() => onEditEvent(event)}
                    className="text-zinc-400 hover:text-white underline"
                  >
                    Configure
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
