"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  Edit3,
  Plus,
  Radio,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  CircadianEventDTO,
  DOMAIN_CONFIG,
} from "@/lib/circadianTypes";
import {
  assignOrbitalTracks,
  cartesianToMinutes,
  dateToMinutes,
  describeAnnularWedge,
  describeCubicTracer,
  describeTimeArc,
  getCircadianPhase,
  getDurationMinutes,
  minutesTo12Hour,
  minutesToAngleRad,
  polarToCartesian,
  timeToCartesian,
} from "@/lib/circadianMath";

interface CircadianDialStageProps {
  events: CircadianEventDTO[];
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
}

// Deterministic starfield coordinates inside the night hemisphere of the dial
const NIGHT_STARS = Array.from({ length: 46 }, (_, i) => {
  // Spread across bottom night hemisphere (angle 15deg -> 165deg, i.e., ~19:00 to ~05:00)
  const seed1 = Math.sin(i * 12.9898) * 43758.5453;
  const f1 = seed1 - Math.floor(seed1);
  const seed2 = Math.sin((i + 77) * 78.233) * 19341.123;
  const f2 = seed2 - Math.floor(seed2);
  const deg = 10 + f1 * 160; // Bottom hemisphere (0deg is 6PM right, 90deg is 12AM bottom, 180deg is 6AM left)
  const rad = (deg * Math.PI) / 180;
  const dist = 28 + Math.sqrt(f2) * 138;
  return {
    id: i,
    dx: Math.cos(rad) * dist,
    dy: Math.sin(rad) * dist,
    r: i % 5 === 0 ? 1.45 : i % 2 === 0 ? 1.0 : 0.65,
    opacity: 0.25 + (i % 7) * 0.1,
  };
});

export function CircadianDialStage({
  events,
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
}: CircadianDialStageProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [isDraggingTime, setIsDraggingTime] = useState(false);
  const [quickItemText, setQuickItemText] = useState("");

  // Stage coordinate space
  const VB_W = 1040;
  const VB_H = 760;
  const CX = VB_W / 2; // 520
  const CY = VB_H / 2; // 380

  // Radii adapted gracefully between full Solar Wedges mode & 4-Quadrant Tracer Cards mode
  const scaleFactor = viewMode === "quadrants" ? 0.76 : 1;
  const R_SKY = 174 * scaleFactor;
  const R_SOLAR_ARC = 88 * scaleFactor;
  const R_ORBITAL_TRACKS = [142, 125, 108].map((r) => r * scaleFactor);
  const R_WEDGE_INNER = 192 * scaleFactor;
  const R_WEDGE_OUTER = 278 * scaleFactor;

  const activeId = hoveredEventId ?? selectedEventId;

  // Orbital track assignment for nested concentric bands
  const orbitalMap = useMemo(() => assignOrbitalTracks(events), [events]);

  // Precompute wedge geometries + non-colliding label anchors
  const wedgeItems = useMemo(() => {
    const raw = events.map((ev) => {
      const startMin = dateToMinutes(new Date(ev.startTime));
      const endMin = dateToMinutes(new Date(ev.endTime));
      const durMin = getDurationMinutes(startMin, endMin);
      const wedge = describeAnnularWedge(
        CX,
        CY,
        R_WEDGE_INNER,
        R_WEDGE_OUTER,
        startMin,
        endMin,
        1.5
      );
      const orbital = orbitalMap.get(ev.id) ?? {
        track: 0,
        startMin,
        endMin,
      };
      const trackRadius =
        R_ORBITAL_TRACKS[Math.min(2, orbital.track)] ?? R_ORBITAL_TRACKS[0];
      const ribbonPath = describeTimeArc(
        CX,
        CY,
        trackRadius,
        startMin,
        endMin
      );

      // External label anchor
      const labelRadius = R_WEDGE_OUTER + 22;
      const anchorPt = polarToCartesian(CX, CY, labelRadius, wedge.midAngleRad);
      const cosM = Math.cos(wedge.midAngleRad);
      const textAnchor: "start" | "end" | "middle" =
        Math.abs(cosM) < 0.22 ? "middle" : cosM > 0 ? "start" : "end";

      return {
        event: ev,
        startMin,
        endMin,
        durMin,
        wedge,
        trackRadius,
        ribbonPath,
        labelX: anchorPt.x,
        labelY: anchorPt.y,
        textAnchor,
        cosM,
      };
    });

    // Prevent vertical label collisions on left and right hemispheres
    const resolveSide = (items: typeof raw) => {
      const sorted = [...items].sort((a, b) => a.labelY - b.labelY);
      const minGap = 38;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].labelY - sorted[i - 1].labelY < minGap) {
          sorted[i].labelY = sorted[i - 1].labelY + minGap;
        }
      }
    };
    resolveSide(raw.filter((i) => i.cosM >= 0));
    resolveSide(raw.filter((i) => i.cosM < 0));

    return raw;
  }, [events, CX, CY, R_WEDGE_INNER, R_WEDGE_OUTER, R_ORBITAL_TRACKS, orbitalMap]);

  // Assign up to 4 quadrant cards for PRD Section 2.3 Quadrant Mode
  const quadrantAssignments = useMemo(() => {
    // Slots: 1 = Top-Left, 2 = Top-Right, 3 = Bottom-Left, 4 = Bottom-Right
    const slots: Record<number, (typeof wedgeItems)[number] | null> = {
      1: null,
      2: null,
      3: null,
      4: null,
    };

    // First honor explicit quadrantSlot
    for (const item of wedgeItems) {
      const slot = item.event.quadrantSlot;
      if (slot && slot >= 1 && slot <= 4 && !slots[slot]) {
        slots[slot] = item;
      }
    }

    // Fill remaining open slots by circadian time of day
    for (const item of wedgeItems) {
      if (Object.values(slots).some((v) => v?.event.id === item.event.id)) continue;
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

    // Quadrant card anchor coordinates in SVG viewBox (1040 x 760)
    const cardAnchors: Record<
      number,
      { cardX: number; cardY: number; isLeft: boolean; posClass: string }
    > = {
      1: {
        cardX: 252,
        cardY: 165,
        isLeft: true,
        posClass: "left-3 top-4",
      },
      2: {
        cardX: VB_W - 252,
        cardY: 165,
        isLeft: false,
        posClass: "right-3 top-4",
      },
      3: {
        cardX: 252,
        cardY: VB_H - 175,
        isLeft: true,
        posClass: "left-3 bottom-4",
      },
      4: {
        cardX: VB_W - 252,
        cardY: VB_H - 175,
        isLeft: false,
        posClass: "right-3 bottom-4",
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
          58
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

  // Selected event floating inspector tracer in Solar mode
  const selectedWedgeItem = useMemo(
    () => wedgeItems.find((w) => w.event.id === selectedEventId) ?? null,
    [wedgeItems, selectedEventId]
  );

  const selectedInspectorGeometry = useMemo(() => {
    if (!selectedWedgeItem || viewMode !== "solar") return null;
    const isRightEvent = selectedWedgeItem.cosM >= 0;
    // Place floating inspector card on the side with clearest space or matching side
    const placeLeft = !isRightEvent;
    const cardX = placeLeft ? 258 : VB_W - 258;
    const cardY = Math.max(175, Math.min(VB_H - 185, selectedWedgeItem.wedge.outerMidPoint.y));
    const dialPt = selectedWedgeItem.wedge.outerMidPoint;
    const tracerPath = describeCubicTracer(
      dialPt.x,
      dialPt.y,
      selectedWedgeItem.wedge.midAngleRad,
      cardX,
      cardY,
      placeLeft,
      54
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
  const solarRimPt = polarToCartesian(CX, CY, R_SKY, nowRad);
  const solarProgressPath = describeTimeArc(CX, CY, R_SOLAR_ARC, 0, currentMinutes);
  const solarTagPt = polarToCartesian(CX, CY, R_SOLAR_ARC + 26 * scaleFactor, nowRad);
  const currentPhase = getCircadianPhase(currentMinutes);

  // Interactive pointer time scrubbing along inner dial
  const updateScrubFromPointer = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = VB_W / rect.width;
    const scaleY = VB_H / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const mins = cartesianToMinutes(CX, CY, x, y);
    onScrubMinutes(Math.round(mins));
  };

  // Sky sphere percentage positioning inside the responsive stage
  const skyDiameterPctW = ((R_SKY * 2) / VB_W) * 100;
  const skyDiameterPctH = ((R_SKY * 2) / VB_H) * 100;

  return (
    <div
      className="relative w-full aspect-[1040/760] max-h-[760px] mx-auto select-none"
      onPointerMove={(e) => {
        if (isDraggingTime) {
          updateScrubFromPointer(e.clientX, e.clientY);
        }
      }}
      onPointerUp={() => setIsDraggingTime(false)}
      onPointerLeave={() => setIsDraggingTime(false)}
    >
      {/* 1. Ambient Celestial Backdrop Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.12) 0%, rgba(249, 115, 22, 0.06) 36%, rgba(9, 13, 22, 0) 68%)`,
        }}
      />

      {/* 2. Precision Conic Diurnal Sky Sphere (Layered seamlessly behind SVG ticks & solar ring) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden shadow-[inset_0_0_55px_rgba(0,0,0,0.75)]"
        style={{
          width: `${skyDiameterPctW}%`,
          height: `${skyDiameterPctH}%`,
          // CSS conic-gradient: 0deg = 12:00 PM (top), 90deg = 6:00 PM (right), 180deg = 12:00 AM (bottom), 270deg = 6:00 AM (left)
          background: `
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(9,13,22,0.12) 55%, rgba(4,6,12,0.68) 100%),
            conic-gradient(
              from 0deg at 50% 50%,
              #3b82f6 0deg,
              #60a5fa 28deg,
              #fde68a 62deg,
              #fbbf24 82deg,
              #ea580c 98deg,
              #581c87 122deg,
              #1e1b4b 145deg,
              #060913 180deg,
              #0b132b 215deg,
              #1e3a5f 248deg,
              #38bdf8 275deg,
              #2563eb 322deg,
              #3b82f6 360deg
            )
          `,
        }}
      >
        {/* Subtle Horizon City Glow at Midnight Bottom (12:00 AM) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[24%]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(251, 191, 36, 0.24) 0%, rgba(56, 189, 248, 0.08) 42%, transparent 78%)",
          }}
        />
        {/* Conical Radar Brushed Sheen */}
        <div
          className="absolute inset-0 opacity-35 mix-blend-overlay"
          style={{
            background:
              "conic-gradient(from 215deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.45) 45deg, transparent 95deg, rgba(0,0,0,0.5) 185deg, rgba(255,255,255,0.3) 290deg, transparent 360deg)",
          }}
        />
      </div>

      {/* 3. Master SVG Vector Viewport */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="relative z-10 w-full h-full overflow-visible"
      >
        <defs>
          {/* Multi-layered Solar Beacon Glow */}
          <filter id="solarNodeGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="11" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft Neon Arc Glow */}
          <filter id="arcNeonGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Golden Solar Progress Gradient */}
          <linearGradient id="solarProgressGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="1" />
          </linearGradient>

          {/* Wedge Dark Vignette Overlay so text & borders pop */}
          <radialGradient id="wedgeVignette" cx="50%" cy="50%" r="55%">
            <stop offset="58%" stopColor="#05070d" stopOpacity="0.38" />
            <stop offset="82%" stopColor="#05070d" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#05070d" stopOpacity="0.48" />
          </radialGradient>

          {/* ClipPaths for each Curved Annular Media Wedge */}
          {wedgeItems.map(({ event, wedge }) => (
            <clipPath key={`clip-${event.id}`} id={`wedge-clip-${event.id}`}>
              <path d={wedge.path} />
            </clipPath>
          ))}
        </defs>

        {/* Starfield Pinpoints inside Night Hemisphere */}
        <g className="pointer-events-none">
          {NIGHT_STARS.map((s) => (
            <circle
              key={s.id}
              cx={CX + s.dx * scaleFactor}
              cy={CY + s.dy * scaleFactor}
              r={s.r}
              fill="#f8fafc"
              opacity={s.opacity}
            />
          ))}
        </g>

        {/* Outer Faint Radar Guide Ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R_WEDGE_OUTER + 8}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
          strokeDasharray="3 7"
        />

        {/* Sky Sphere Rim & Interactive Scrubbing Ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R_SKY}
          fill="transparent"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          className="cursor-crosshair"
          onPointerDown={(e) => {
            setIsDraggingTime(true);
            updateScrubFromPointer(e.clientX, e.clientY);
          }}
        />
        <circle
          cx={CX}
          cy={CY}
          r={R_WEDGE_INNER - 6}
          fill="none"
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth="1"
        />

        {/* 24-Hour Precision Ticks (48 half-hour intervals) */}
        <g className="pointer-events-none">
          {Array.from({ length: 48 }, (_, idx) => {
            const mins = idx * 30;
            const isCardinal = mins % 360 === 0;
            const isHour = mins % 60 === 0;
            const rad = minutesToAngleRad(mins);
            const r1 = isCardinal
              ? R_SKY - 13 * scaleFactor
              : isHour
              ? R_SKY - 8 * scaleFactor
              : R_SKY - 4 * scaleFactor;
            const r2 = R_SKY + (isCardinal ? 5 : 2) * scaleFactor;
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
                    ? "rgba(255,255,255,0.85)"
                    : isHour
                    ? "rgba(255,255,255,0.42)"
                    : "rgba(255,255,255,0.16)"
                }
                strokeWidth={isCardinal ? 1.8 : isHour ? 1.1 : 0.75}
              />
            );
          })}
        </g>

        {/* Cardinal Hour Markers Inside Rim (Exact Reference Positions) */}
        <g
          className="pointer-events-none"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {[
            { mins: 720, label: "12:00 PM", dx: 0, dy: 24 * scaleFactor },
            { mins: 1080, label: "6:00 PM", dx: -34 * scaleFactor, dy: 4 },
            { mins: 0, label: "12:00 AM", dx: 0, dy: -18 * scaleFactor },
            { mins: 360, label: "6:00 AM", dx: 34 * scaleFactor, dy: 4 },
          ].map((c) => {
            const pt = timeToCartesian(CX, CY, R_SKY, c.mins);
            return (
              <text
                key={c.label}
                x={pt.x + c.dx}
                y={pt.y + c.dy}
                textAnchor="middle"
                fill="rgba(248, 250, 252, 0.92)"
                fontSize={11.5 * scaleFactor}
                fontWeight={600}
                letterSpacing="0.04em"
              >
                {c.label}
              </text>
            );
          })}
        </g>

        {/* Nested Inner Orbital Event Bands (PRD Section 2.2: R = 140, 120, 100) */}
        <g>
          {R_ORBITAL_TRACKS.map((r, idx) => (
            <circle
              key={idx}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={4.5 * scaleFactor}
            />
          ))}

          {wedgeItems.map(({ event, ribbonPath }) => {
            const isHighlighted = activeId === event.id;
            const domainColor =
              DOMAIN_CONFIG[event.domain]?.color ?? event.accentColor;
            return (
              <path
                key={`ribbon-${event.id}`}
                d={ribbonPath}
                fill="none"
                stroke={domainColor}
                strokeWidth={(isHighlighted ? 7.5 : 5) * scaleFactor}
                strokeLinecap="round"
                opacity={activeId && !isHighlighted ? 0.42 : 0.92}
                filter={isHighlighted ? "url(#arcNeonGlow)" : undefined}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                onClick={() =>
                  onSelectEvent(selectedEventId === event.id ? null : event.id)
                }
              />
            );
          })}
        </g>

        {/* Inner Solar Orbit Ring & Real-Time Pulsing Solar Beacon */}
        <g>
          {/* Faint full inner solar orbit guide */}
          <circle
            cx={CX}
            cy={CY}
            r={R_SOLAR_ARC}
            fill="rgba(8, 11, 20, 0.26)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
          />

          {/* Radial solar ray from center through solar node to rim */}
          <line
            x1={CX}
            y1={CY}
            x2={solarRimPt.x}
            y2={solarRimPt.y}
            stroke="rgba(251, 191, 36, 0.22)"
            strokeWidth="1"
            strokeDasharray="3 4"
            className="pointer-events-none"
          />

          {/* Illuminated Solar Progress Arc from 00:00 Nadir -> Current Time */}
          <path
            d={solarProgressPath}
            fill="none"
            stroke="url(#solarProgressGrad)"
            strokeWidth={5.5 * scaleFactor}
            strokeLinecap="round"
            filter="url(#solarNodeGlow)"
            className="pointer-events-none"
          />

          {/* Origin Anchor Node at 00:00 Midnight Nadir */}
          <circle
            cx={solarMidnightPt.x}
            cy={solarMidnightPt.y}
            r={4.5 * scaleFactor}
            fill="#fde68a"
            filter="url(#solarNodeGlow)"
          />

          {/* Rim Time Indicator Pip */}
          <circle
            cx={solarRimPt.x}
            cy={solarRimPt.y}
            r={4 * scaleFactor}
            fill="#fbbf24"
            stroke="#ffffff"
            strokeWidth="1.2"
            filter="url(#solarNodeGlow)"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDraggingTime(true);
            }}
          />

          {/* Real-Time Pulsing Solar Sphere (PRD Section 2.1: r = 7px with multi-layer glow) */}
          <circle
            cx={solarInnerPt.x}
            cy={solarInnerPt.y}
            r={12 * scaleFactor}
            fill="rgba(251, 191, 36, 0.28)"
            className="solar-pulse-ring pointer-events-none"
          />
          <circle
            cx={solarInnerPt.x}
            cy={solarInnerPt.y}
            r={7 * scaleFactor}
            fill="#fef9c3"
            stroke="#f59e0b"
            strokeWidth="2"
            filter="url(#solarNodeGlow)"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDraggingTime(true);
            }}
          />

          {/* Anchored Live Timestamp Micro-Pill on Orbit */}
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
              fill="rgba(9, 13, 22, 0.82)"
              stroke="rgba(251, 191, 36, 0.55)"
              strokeWidth="1"
            />
            <text
              x={0}
              y={3.5 * scaleFactor}
              textAnchor="middle"
              fill="#fef3c7"
              fontSize={9.5 * scaleFactor}
              fontWeight={700}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {minutesTo12Hour(currentMinutes, true)}
            </text>
          </g>

          {/* Center Phase Readout */}
          <g className="pointer-events-none">
            <circle cx={CX} cy={CY} r={3} fill="rgba(255,255,255,0.65)" />
            <text
              x={CX}
              y={CY + 52 * scaleFactor}
              textAnchor="middle"
              fill="rgba(248, 250, 252, 0.88)"
              fontSize={10 * scaleFactor}
              fontWeight={700}
              letterSpacing="0.14em"
            >
              {currentPhase.name}
            </text>
          </g>
        </g>

        {/* Outer Curved Annular Visual Media Wedges (Reference Image Signature!) */}
        <g>
          {wedgeItems.map((item) => {
            const { event, wedge, startMin, endMin, labelX, labelY, textAnchor } =
              item;
            const isSelected = selectedEventId === event.id;
            const isHovered = hoveredEventId === event.id;
            const isHighlighted = isSelected || isHovered;
            const strokeColor = event.accentColor || DOMAIN_CONFIG[event.domain].color;

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
                {/* Clipped High-Impact Visual Media Inside Curved Annular Wedge */}
                <g
                  clipPath={`url(#wedge-clip-${event.id})`}
                  opacity={activeId && !isHighlighted ? 0.72 : 1}
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
                  {/* Subtle Dark Edge Contrast Vignette */}
                  <rect
                    x={wedge.bbox.x}
                    y={wedge.bbox.y}
                    width={wedge.bbox.width}
                    height={wedge.bbox.height}
                    fill="url(#wedgeVignette)"
                  />
                </g>

                {/* Glowing Domain-Colored Annular Frame */}
                <path
                  d={wedge.path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 3.2 : 2.1}
                  strokeLinejoin="round"
                  filter={isHighlighted ? "url(#arcNeonGlow)" : undefined}
                  opacity={activeId && !isHighlighted ? 0.65 : 0.96}
                />

                {/* External Wedge Callout Label (Shown in Solar Wedges Mode) */}
                {viewMode === "solar" && (
                  <g className="transition-opacity duration-200">
                    {/* Tiny Radial Leader Tick */}
                    <line
                      x1={wedge.outerMidPoint.x}
                      y1={wedge.outerMidPoint.y}
                      x2={
                        CX +
                        (R_WEDGE_OUTER + 12) * Math.cos(wedge.midAngleRad)
                      }
                      y2={
                        CY +
                        (R_WEDGE_OUTER + 12) * Math.sin(wedge.midAngleRad)
                      }
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2 : 1.2}
                      opacity={0.85}
                    />
                    <text
                      x={labelX}
                      y={labelY - 5}
                      textAnchor={textAnchor}
                      fill="#f8fafc"
                      fontSize={13.5}
                      fontWeight={600}
                      letterSpacing="0.01em"
                    >
                      {event.title}
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 12}
                      textAnchor={textAnchor}
                      fill="rgba(148, 163, 184, 0.92)"
                      fontSize={10.5}
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

        {/* Illuminated Cubic Bezier Callout Tracers — Solar Inspector Mode */}
        {viewMode === "solar" && selectedWedgeItem && selectedInspectorGeometry && (
          <g className="pointer-events-none">
            <path
              d={selectedInspectorGeometry.tracerPath}
              fill="none"
              stroke={selectedWedgeItem.event.accentColor}
              strokeWidth="4"
              opacity="0.22"
              filter="url(#arcNeonGlow)"
            />
            <path
              d={selectedInspectorGeometry.tracerPath}
              fill="none"
              stroke={selectedWedgeItem.event.accentColor}
              strokeWidth="1.9"
              className="circadian-tracer-animated"
            />
            <circle
              cx={selectedInspectorGeometry.dialPt.x}
              cy={selectedInspectorGeometry.dialPt.y}
              r="4.5"
              fill="#ffffff"
              stroke={selectedWedgeItem.event.accentColor}
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

        {/* Illuminated Cubic Bezier Callout Tracers — 4-Quadrant Simultaneous Mode (PRD 2.3 & 4.3) */}
        {viewMode === "quadrants" &&
          quadrantAssignments.map(({ slot, item, anchor, dialPt, tracerPath }) => {
            const isHighlighted = activeId === item.event.id;
            const color =
              item.event.accentColor || DOMAIN_CONFIG[item.event.domain].color;
            return (
              <g key={`q-tracer-${slot}`} className="pointer-events-none">
                <path
                  d={tracerPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 5 : 2.5}
                  opacity={isHighlighted ? 0.35 : 0.14}
                  filter="url(#arcNeonGlow)"
                />
                <path
                  d={tracerPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 2.4 : 1.5}
                  opacity={activeId && !isHighlighted ? 0.38 : 0.92}
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
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg transition-all"
        >
          <Radio size={12} className="animate-pulse text-amber-400" />
          Previewing {minutesTo12Hour(currentMinutes)} · Snap to Live Orbit
        </button>
      )}

      {/* Floating Inspector Visual Event Card (Solar Mode when a Wedge is Clicked) */}
      {viewMode === "solar" && selectedWedgeItem && selectedInspectorGeometry && (
        <div
          className={`absolute z-30 w-[262px] rounded-2xl bg-[#0b0e17]/95 backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.75)] overflow-hidden animate-fade-in ${
            selectedInspectorGeometry.placeLeft ? "left-2" : "right-2"
          }`}
          style={{
            top: `${Math.max(8, Math.min(54, ((selectedInspectorGeometry.cardY - 120) / VB_H) * 100))}%`,
            borderColor: `${selectedWedgeItem.event.accentColor}66`,
          }}
        >
          {/* 16:9 Visual Media Header */}
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

          {/* Card Body: Micro-Checklist & Telemetry */}
          <div className="p-3 space-y-2.5">
            {selectedWedgeItem.event.description && (
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                {selectedWedgeItem.event.description}
              </p>
            )}

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {selectedWedgeItem.event.checklists.map((chk) => (
                <button
                  key={chk.id}
                  onClick={() =>
                    onToggleChecklist(
                      selectedWedgeItem.event.id,
                      chk.id,
                      !chk.isCompleted
                    )
                  }
                  className="w-full flex items-center gap-2 text-left py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      chk.isCompleted
                        ? "bg-amber-400 border-amber-400 text-black"
                        : "border-zinc-600 bg-transparent"
                    }`}
                  >
                    {chk.isCompleted && <Check size={11} strokeWidth={3} />}
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

            {/* Quick Add Micro-Checklist Input */}
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
                placeholder="Add micro-step..."
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

      {/* 4 Flanking Quadrant Visual Event Cards (PRD Section 2.3 Simultaneous View) */}
      {viewMode === "quadrants" &&
        quadrantAssignments.map(({ slot, item, anchor }) => {
          const { event, startMin, endMin, durMin } = item;
          const isHighlighted = activeId === event.id;
          const color = event.accentColor || DOMAIN_CONFIG[event.domain].color;
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
              className={`hidden xl:flex flex-col absolute z-20 w-[238px] rounded-2xl bg-[#0b0e17]/90 backdrop-blur-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
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
                {event.checklists.slice(0, 2).map((chk) => (
                  <button
                    key={chk.id}
                    onClick={() =>
                      onToggleChecklist(event.id, chk.id, !chk.isCompleted)
                    }
                    className="w-full flex items-center gap-2 text-left py-0.5 px-1 rounded hover:bg-white/5 transition-colors"
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

