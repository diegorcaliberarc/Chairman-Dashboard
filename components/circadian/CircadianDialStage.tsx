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
}: CircadianDialStageProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [isDraggingTime, setIsDraggingTime] = useState(false);
  const [quickItemText, setQuickItemText] = useState("");

  // Pure isotropic SVG coordinate space — guarantees 100% geometric circle at every screen aspect ratio
  const VB_W = 1000;
  const VB_H = 760;
  const CX = VB_W / 2; // 500
  const CY = VB_H / 2; // 380

  const scaleFactor = viewMode === "quadrants" ? 0.75 : 1;
  const R_SKY = 180 * scaleFactor;
  const R_TIMELAPSE_INNER = 180 * scaleFactor;
  const R_TIMELAPSE_OUTER = 195 * scaleFactor;
  const R_SOLAR_ARC = 90 * scaleFactor;
  const R_ORBITAL_TRACKS = [148, 131, 114].map((r) => r * scaleFactor);
  const R_WEDGE_INNER = 204 * scaleFactor;
  const R_WEDGE_OUTER = 290 * scaleFactor;

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

  // Subtle outer ambient time-lapse guide band behind wedges so open hours also show day->night progression
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

  // Section 18: Precompute GPU-friendly 96-point Polar Radar Isobar Polygons & Thermal Arcs
  const rRadarMin = 56 * scaleFactor;
  const rRadarMax = 175 * scaleFactor;
  const computedRadarOverlays = useMemo(() => {
    if (!activeRadarTypes.length || !radarLayers.length) return [];
    const activeSet = new Set(activeRadarTypes);
    const filtered = radarLayers.filter((l) => activeSet.has(l.layerType));

    return filtered.map((layer, layerIdx) => {
      const vals = layer.bucketValues.length === 96
        ? layer.bucketValues
        : Array.from({ length: 96 }, (_, i) => layer.bucketValues[i % Math.max(1, layer.bucketValues.length)] ?? 50);

      const pts = vals.map((v, b) => {
        const mins = b * 15 + 7.5;
        const rad = minutesToAngleRad(mins);
        const norm = Math.max(0, Math.min(100, v)) / 100;
        const r = rRadarMin + norm * (rRadarMax - rRadarMin);
        return polarToCartesian(CX, CY, r, rad);
      });

      const smoothIsobarPath = buildSmoothClosedSpline(pts);

      // Peak & Trough anchor coordinates
      let peakIdx = layer.peakBucket ?? 0;
      if (layer.peakBucket === undefined) {
        for (let i = 1; i < vals.length; i++) {
          if (vals[i] > vals[peakIdx]) peakIdx = i;
        }
      }
      const peakMins = peakIdx * 15 + 7.5;
      const peakNorm = Math.max(0, Math.min(100, vals[peakIdx] ?? 80)) / 100;
      const peakPt = polarToCartesian(
        CX,
        CY,
        rRadarMin + peakNorm * (rRadarMax - rRadarMin),
        minutesToAngleRad(peakMins)
      );

      // Live reading along currentMinutes vector
      const liveBucket = Math.min(95, Math.max(0, Math.floor((((currentMinutes % 1440) + 1440) % 1440) / 15)));
      const liveVal = vals[liveBucket] ?? 50;
      const livePt = polarToCartesian(
        CX,
        CY,
        rRadarMin + (Math.max(0, Math.min(100, liveVal)) / 100) * (rRadarMax - rRadarMin),
        minutesToAngleRad(currentMinutes)
      );

      // Outer circumferential thermal Doppler arcs (for intensity >= 45%)
      const rThermalRadius = R_WEDGE_OUTER + (6 + layerIdx * 5.5) * scaleFactor;
      const thermalSegments: Array<{ d: string; opacity: number }> = [];
      for (let b = 0; b < 96; b++) {
        const v = vals[b] ?? 0;
        if (v < 45) continue;
        const m1 = b * 15 + 0.6;
        const m2 = (b + 1) * 15 - 0.6;
        const p1 = polarToCartesian(CX, CY, rThermalRadius, minutesToAngleRad(m1));
        const p2 = polarToCartesian(CX, CY, rThermalRadius, minutesToAngleRad(m2));
        thermalSegments.push({
          d: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${rThermalRadius.toFixed(2)} ${rThermalRadius.toFixed(2)} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
          opacity: Number((0.28 + ((v - 45) / 55) * 0.68).toFixed(2)),
        });
      }

      return {
        layer,
        smoothIsobarPath,
        peakPt,
        peakVal: vals[peakIdx] ?? 0,
        livePt,
        liveVal,
        thermalSegments,
      };
    });
  }, [
    activeRadarTypes,
    radarLayers,
    CX,
    CY,
    rRadarMin,
    rRadarMax,
    R_WEDGE_OUTER,
    scaleFactor,
    currentMinutes,
  ]);

  const radarOuterPadding = computedRadarOverlays.length > 0
    ? (6 + computedRadarOverlays.length * 5.5) * scaleFactor
    : 0;

  // Orbital track assignment for nested concentric bands
  const orbitalMap = useMemo(() => assignOrbitalTracks(events), [events]);

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

      // External label anchor (expands cleanly when outer thermal radar rings are toggled)
      const labelRadius = R_WEDGE_OUTER + 22 + radarOuterPadding;
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
  }, [events, CX, CY, R_WEDGE_INNER, R_WEDGE_OUTER, R_ORBITAL_TRACKS, orbitalMap, radarOuterPadding]);

  // Assign up to 4 quadrant cards for PRD Section 2.3 Quadrant Mode
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

    const cardAnchors: Record<
      number,
      { cardX: number; cardY: number; isLeft: boolean; posClass: string }
    > = {
      1: {
        cardX: 242,
        cardY: 165,
        isLeft: true,
        posClass: "left-2 top-4",
      },
      2: {
        cardX: VB_W - 242,
        cardY: 165,
        isLeft: false,
        posClass: "right-2 top-4",
      },
      3: {
        cardX: 242,
        cardY: VB_H - 175,
        isLeft: true,
        posClass: "left-2 bottom-4",
      },
      4: {
        cardX: VB_W - 242,
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
          56
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
    const placeLeft = !isRightEvent;
    const cardX = placeLeft ? 248 : VB_W - 248;
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
  const solarRimPt = polarToCartesian(CX, CY, R_TIMELAPSE_OUTER, nowRad);
  const solarTagPt = polarToCartesian(
    CX,
    CY,
    R_SOLAR_ARC + 26 * scaleFactor,
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

  // Bleed factor so sky-timelapse.jpg's inner spherical horizon aligns seamlessly at R_SKY
  const skyImgBleed = 1.18;
  const skyImgSize = R_SKY * 2 * skyImgBleed;

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
      {/* Master Isotropic SVG Viewport — 100% Pure Vector + Clipped Texture Circle */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 w-full h-auto max-h-[calc(100vh-132px)] block mx-auto overflow-visible"
      >
        <defs>
          {/* Multi-layered Solar Beacon Glow */}
          <filter id="solarNodeGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
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

          {/* Soft Ambient Halo Blur for Outer Time-Lapse Glow */}
          <filter id="timelapseHaloBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>

          {/* Inner Spherical Depth Vignette over Day-to-Night Sky Time-Lapse */}
          <radialGradient id="skyDepthVignette" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#050814" stopOpacity="0.32" />
            <stop offset="55%" stopColor="#050814" stopOpacity="0.06" />
            <stop offset="86%" stopColor="#050814" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#04060e" stopOpacity="0.62" />
          </radialGradient>

          {/* Wedge Dark Vignette Overlay so borders & labels stay razor-sharp */}
          <radialGradient id="wedgeVignette" cx="50%" cy="50%" r="55%">
            <stop offset="58%" stopColor="#05070d" stopOpacity="0.34" />
            <stop offset="82%" stopColor="#05070d" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#05070d" stopOpacity="0.45" />
          </radialGradient>

          {/* Exact Mathematical Circle ClipPath for the Day-to-Night Time-Lapse Sphere */}
          <clipPath id="skySphereCircleClip">
            <circle cx={CX} cy={CY} r={R_SKY} />
          </clipPath>

          {/* Section 18 Radial Thermal Isobar Gradients */}
          {computedRadarOverlays.map(({ layer }) => (
            <radialGradient
              key={`radar-grad-${layer.layerType}`}
              id={`radar-grad-${layer.layerType}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={layer.color} stopOpacity="0.04" />
              <stop offset="55%" stopColor={layer.color} stopOpacity="0.18" />
              <stop
                offset="100%"
                stopColor={layer.secondaryColor || layer.color}
                stopOpacity="0.42"
              />
            </radialGradient>
          ))}

          {/* ClipPaths for each Curved Annular Media Wedge */}
          {wedgeItems.map(({ event, wedge }) => (
            <clipPath key={`clip-${event.id}`} id={`wedge-clip-${event.id}`}>
              <path d={wedge.path} />
            </clipPath>
          ))}
        </defs>

        {/* 1. Soft Ambient 24-Hour Time-Lapse Atmospheric Halo Behind the Wheel */}
        <g opacity="0.26" filter="url(#timelapseHaloBlur)" className="pointer-events-none">
          {timelapseWheelSegments
            .filter((_, i) => i % 2 === 0)
            .map((seg, idx) => (
              <path key={`halo-${idx}`} d={seg.d} fill={seg.color} />
            ))}
        </g>

        {/* 2. Pure-Circle Clipped 24-Hour Day-to-Night Sky & Milky Way Time-Lapse Sphere */}
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
          {/* Subtle glass depth vignette */}
          <circle cx={CX} cy={CY} r={R_SKY} fill="url(#skyDepthVignette)" />

          {/* Section 18: Meteorological Range Grid + Smooth 96-Point Polar Radar Isobar Polygons */}
          {computedRadarOverlays.length > 0 && (
            <g
              className="pointer-events-none"
              style={{ willChange: "transform, opacity" }}
            >
              {[0.25, 0.5, 0.75, 1].map((frac) => {
                const rr = rRadarMin + frac * (rRadarMax - rRadarMin);
                return (
                  <circle
                    key={`radar-grid-${frac}`}
                    cx={CX}
                    cy={CY}
                    r={rr}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.22)"
                    strokeWidth="0.85"
                    strokeDasharray={frac === 1 ? undefined : "2 4"}
                  />
                );
              })}

              {computedRadarOverlays.map(
                ({ layer, smoothIsobarPath, peakPt, peakVal, livePt }) => (
                  <g key={`isobar-${layer.layerType}`}>
                    <path
                      d={smoothIsobarPath}
                      fill={`url(#radar-grad-${layer.layerType})`}
                      stroke={layer.color}
                      strokeWidth={2 * scaleFactor}
                      strokeLinejoin="round"
                      filter="url(#arcNeonGlow)"
                    />
                    {/* Peak Isobar Telemetry Node */}
                    <circle
                      cx={peakPt.x}
                      cy={peakPt.y}
                      r={3.8 * scaleFactor}
                      fill="#ffffff"
                      stroke={layer.color}
                      strokeWidth="1.8"
                    />
                    <text
                      x={peakPt.x}
                      y={peakPt.y - 6 * scaleFactor}
                      textAnchor="middle"
                      fill="#ffffff"
                      stroke="rgba(4, 7, 16, 0.85)"
                      strokeWidth="2.5"
                      paintOrder="stroke"
                      fontSize={8.5 * scaleFactor}
                      fontWeight={700}
                    >
                      {layer.shortLabel} {peakVal}%
                    </text>
                    {/* Live Solar Vector Intersection Pip */}
                    <circle
                      cx={livePt.x}
                      cy={livePt.y}
                      r={3.4 * scaleFactor}
                      fill={layer.color}
                      stroke="#ffffff"
                      strokeWidth="1.3"
                    />
                  </g>
                )
              )}
            </g>
          )}
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
          {/* Crisp inner & outer glass bevel strokes framing the time-lapse wheel */}
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

        {/* Subtle Outer Time-Lapse Continuum Guide Track (connects open hours between wedges) */}
        <g opacity="0.5" className="pointer-events-none">
          {outerTimelapseTrackSegments.map((seg, idx) => (
            <path key={`otl-${idx}`} d={seg.d} fill={seg.color} />
          ))}
        </g>

        {/* 4. 24-Hour Precision Ticks Etched Across the Time-Lapse Rim */}
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

        {/* 5. Cardinal & Intermediate Hour Labels with Crisp Contrast Backing */}
        <g
          className="pointer-events-none"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {[
            { mins: 720, label: "12:00 PM", dx: 0, dy: 24 * scaleFactor },
            { mins: 1080, label: "6:00 PM", dx: -36 * scaleFactor, dy: 4 },
            { mins: 0, label: "12:00 AM", dx: 0, dy: -16 * scaleFactor },
            { mins: 360, label: "6:00 AM", dx: 36 * scaleFactor, dy: 4 },
          ].map((c) => {
            const pt = timeToCartesian(CX, CY, R_SKY, c.mins);
            return (
              <g key={c.label}>
                <text
                  x={pt.x + c.dx}
                  y={pt.y + c.dy}
                  textAnchor="middle"
                  fill="#ffffff"
                  stroke="rgba(5, 8, 18, 0.75)"
                  strokeWidth="3.5"
                  paintOrder="stroke"
                  fontSize={11.5 * scaleFactor}
                  fontWeight={700}
                  letterSpacing="0.04em"
                >
                  {c.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* 6. Nested Inner Orbital Event Bands (PRD Section 2.2) */}
        <g>
          {R_ORBITAL_TRACKS.map((r, idx) => (
            <circle
              key={idx}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={4 * scaleFactor}
            />
          ))}

          {wedgeItems.map(({ event, ribbonPath, timelapseColor }) => {
            const isHighlighted = activeId === event.id;
            const matchesTelemetry =
              !highlightedTelemetry ||
              event.telemetrySource === highlightedTelemetry;
            const domainColor =
              DOMAIN_CONFIG[event.domain]?.color ?? timelapseColor;
            return (
              <path
                key={`ribbon-${event.id}`}
                d={ribbonPath}
                fill="none"
                stroke={domainColor}
                strokeWidth={(isHighlighted ? 7.5 : 5) * scaleFactor}
                strokeLinecap="round"
                opacity={
                  !matchesTelemetry
                    ? 0.25
                    : activeId && !isHighlighted
                    ? 0.45
                    : 0.94
                }
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

        {/* 7. Inner Solar Orbit Ring with 24-Hour Time-Lapse Gradient Trail & Live Beacon */}
        <g>
          <circle
            cx={CX}
            cy={CY}
            r={R_SOLAR_ARC}
            fill="rgba(6, 9, 19, 0.34)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
          />

          {/* Radial solar vector from center through solar node to time-lapse rim */}
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

          {/* Time-Lapse Colored Solar Progress Arc (shifts organically from Midnight -> Dawn -> Noon -> Sunset -> Night) */}
          <g filter="url(#arcNeonGlow)" className="pointer-events-none">
            {solarProgressArcs.map((seg, i) => (
              <path
                key={`sp-${i}`}
                d={seg.d}
                fill="none"
                stroke={seg.color}
                strokeWidth={5.5 * scaleFactor}
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Origin Anchor Node at 00:00 Midnight Nadir */}
          <circle
            cx={solarMidnightPt.x}
            cy={solarMidnightPt.y}
            r={4 * scaleFactor}
            fill="#818cf8"
            stroke="#e0e7ff"
            strokeWidth="1.2"
          />

          {/* Rim Time Indicator Pip on the 24-Hour Time-Lapse Ring */}
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

          {/* Real-Time Pulsing Solar Sphere (r = 7px with multi-layer glow) */}
          <circle
            cx={solarInnerPt.x}
            cy={solarInnerPt.y}
            r={13 * scaleFactor}
            fill={liveSolarColor}
            fillOpacity="0.32"
            className="solar-pulse-ring pointer-events-none"
          />
          <circle
            cx={solarInnerPt.x}
            cy={solarInnerPt.y}
            r={7 * scaleFactor}
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

          {/* Anchored Live Timestamp Micro-Pill on Orbit */}
          <g
            transform={`translate(${solarTagPt.x.toFixed(1)}, ${solarTagPt.y.toFixed(1)})`}
            className="pointer-events-none"
          >
            <rect
              x={-37 * scaleFactor}
              y={-10.5 * scaleFactor}
              width={74 * scaleFactor}
              height={21 * scaleFactor}
              rx={10.5 * scaleFactor}
              fill="rgba(7, 10, 19, 0.88)"
              stroke="rgba(251, 191, 36, 0.65)"
              strokeWidth="1.1"
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
            <circle cx={CX} cy={CY} r={3} fill="#ffffff" opacity="0.85" />
            <text
              x={CX}
              y={CY + 52 * scaleFactor}
              textAnchor="middle"
              fill="#ffffff"
              stroke="rgba(5, 8, 18, 0.8)"
              strokeWidth="3"
              paintOrder="stroke"
              fontSize={9.5 * scaleFactor}
              fontWeight={700}
              letterSpacing="0.14em"
            >
              {currentPhase.name}
            </text>
          </g>
        </g>

        {/* 8. Outer Curved Annular Visual Media Wedges */}
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
            // Blend wedge frame naturally with its circadian time-of-day sky color unless overridden
            const strokeColor = isHighlighted
              ? event.accentColor || timelapseColor
              : timelapseColor;

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

                {/* Time-Lapse Harmonized Glowing Annular Frame */}
                <path
                  d={wedge.path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 3.2 : 2.2}
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

                {/* External Wedge Callout Label (Solar Mode) */}
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
                        (R_WEDGE_OUTER + 12 + radarOuterPadding) *
                          Math.cos(wedge.midAngleRad)
                      }
                      y2={
                        CY +
                        (R_WEDGE_OUTER + 12 + radarOuterPadding) *
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

        {/* 8.5 Section 18 Outer Circumferential Thermal Doppler Radar Arcs */}
        {computedRadarOverlays.length > 0 && (
          <g
            className="pointer-events-none"
            style={{ willChange: "transform, opacity" }}
          >
            {computedRadarOverlays.map(({ layer, thermalSegments }) => (
              <g key={`thermal-${layer.layerType}`} filter="url(#arcNeonGlow)">
                {thermalSegments.map((seg, idx) => (
                  <path
                    key={`tseg-${layer.layerType}-${idx}`}
                    d={seg.d}
                    fill="none"
                    stroke={layer.color}
                    strokeWidth={3.2 * scaleFactor}
                    strokeLinecap="round"
                    opacity={seg.opacity}
                  />
                ))}
              </g>
            ))}
          </g>
        )}

        {/* 9. Illuminated Cubic Bezier Callout Tracers — Solar Inspector Mode */}
        {viewMode === "solar" && selectedWedgeItem && selectedInspectorGeometry && (
          <g className="pointer-events-none">
            <path
              d={selectedInspectorGeometry.tracerPath}
              fill="none"
              stroke={selectedWedgeItem.timelapseColor}
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
              stroke={selectedWedgeItem.timelapseColor}
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
            const color = item.timelapseColor || item.event.accentColor;
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
          className={`absolute z-30 w-[262px] rounded-2xl bg-[#0b0e17]/95 backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.75)] overflow-hidden animate-fade-in ${
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

      {/* 4 Flanking Quadrant Visual Event Cards (Quadrants Mode) */}
      {viewMode === "quadrants" &&
        quadrantAssignments.map(({ slot, item, anchor }) => {
          const { event, startMin, durMin, timelapseColor } = item;
          const isHighlighted = activeId === event.id;
          const color = timelapseColor || event.accentColor;
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
