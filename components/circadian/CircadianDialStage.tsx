"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  Edit3,
  ListOrdered,
  Plus,
  Radio,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [isDraggingTime, setIsDraggingTime] = useState(false);
  const [quickItemText, setQuickItemText] = useState("");

  // Interactive In-Canvas Zoom & Pan states
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Master 940 × 940 ViewBox — leaves ample margin around outer wedges for non-clipped labels
  const VB_W = 940;
  const VB_H = 940;
  const CX = 470;
  const CY = 470;

  const scaleFactor = viewMode === "quadrants" ? 0.74 : 1;
  const R_SKY = 176 * scaleFactor;
  const R_TIMELAPSE_INNER = 176 * scaleFactor;
  const R_TIMELAPSE_OUTER = 192 * scaleFactor;
  const R_SOLAR_ARC = 126 * scaleFactor;
  const R_WEDGE_INNER = 208 * scaleFactor;
  const R_WEDGE_OUTER = 296 * scaleFactor;

  const activeId = hoveredEventId ?? selectedEventId;

  // Non-passive wheel handler on the container to zoom the solar wheel independently without zooming the page
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      setZoom((prev) => Math.min(2.5, Math.max(0.75, +(prev + delta).toFixed(2))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

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

  // Multi-stop time-lapse progress arc from 00:00 up to currentMinutes
  const solarProgressArcs = useMemo(
    () => buildTimelapseProgressArcs(CX, CY, R_SOLAR_ARC, currentMinutes, 96),
    [CX, CY, R_SOLAR_ARC, currentMinutes]
  );

  // Precompute wedge geometries + strictly deduplicate 1-to-1 + non-colliding labels
  const wedgeItems = useMemo(() => {
    // 1. Filter out all-day events and < 5 min zero-width dots
    const timedEvents = events.filter((ev) => {
      if (ev.allDay) return false;
      const s = new Date(ev.startTime).getTime();
      const e = new Date(ev.endTime).getTime();
      if (s === e) return false;
      const dur = getDurationMinutes(
        dateToMinutes(new Date(ev.startTime)),
        dateToMinutes(new Date(ev.endTime))
      );
      return dur >= 5;
    });

    // 2. Strict 1-to-1 Event Deduplication: Ensure each scheduled routine only appears ONCE on the 24h dial
    // (Prevents overnight sleep routines that cross midnight from rendering duplicate wedges/labels)
    const seenSignatures = new Set<string>();
    const uniqueTimedEvents = timedEvents.filter((ev) => {
      const startMin = dateToMinutes(new Date(ev.startTime));
      const endMin = dateToMinutes(new Date(ev.endTime));
      const cleanTitle = ev.title.trim().toLowerCase();
      const sig = `${cleanTitle}:${startMin}:${endMin}`;
      if (seenSignatures.has(sig)) return false;
      seenSignatures.add(sig);
      return true;
    });

    // 3. Build geometry items
    const raw = uniqueTimedEvents.map((ev) => {
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
        3.0
      );

      const anchorPt = polarToCartesian(
        CX,
        CY,
        R_WEDGE_OUTER + 20 * scaleFactor,
        wedge.midAngleRad
      );
      const isRight = anchorPt.x >= CX;

      return {
        event: ev,
        startMin,
        endMin,
        durMin,
        midMin,
        timelapseColor: getTimelapseColorAtMinutes(midMin),
        wedge,
        anchorPt,
        isRight,
        labelX: isRight ? anchorPt.x + 20 : anchorPt.x - 20,
        labelY: anchorPt.y,
        textAnchor: (isRight ? "start" : "end") as "start" | "end",
      };
    });

    // 4. Collision-Avoidance Label Relaxation Pass (Separately on Left and Right)
    const relaxLabels = (items: typeof raw, isRightSide: boolean) => {
      if (items.length <= 1) return;
      // Sort vertically by target natural anchor Y
      items.sort((a, b) => a.anchorPt.y - b.anchorPt.y);
      const minGap = 34; // Minimum vertical gap between adjacent labels
      const topBound = 85;
      const bottomBound = VB_H - 85;

      // Forward pass
      for (let i = 1; i < items.length; i++) {
        if (items[i].labelY - items[i - 1].labelY < minGap) {
          items[i].labelY = items[i - 1].labelY + minGap;
        }
      }

      // Check bottom overflow
      const bottomOver = items[items.length - 1].labelY - bottomBound;
      if (bottomOver > 0) {
        for (let i = items.length - 1; i >= 0; i--) {
          items[i].labelY -= bottomOver;
        }
      }

      // Backward pass
      for (let i = items.length - 2; i >= 0; i--) {
        if (items[i + 1].labelY - items[i].labelY < minGap) {
          items[i].labelY = items[i + 1].labelY - minGap;
        }
      }

      // Check top overflow
      const topOver = topBound - items[0].labelY;
      if (topOver > 0) {
        for (let i = 0; i < items.length; i++) {
          items[i].labelY += topOver;
        }
      }

      // Compute refined labelX and leader elbow connector
      for (const item of items) {
        item.labelX = isRightSide
          ? Math.max(item.anchorPt.x + 18, CX + R_WEDGE_OUTER + 24)
          : Math.min(item.anchorPt.x - 18, CX - R_WEDGE_OUTER - 24);
      }
    };

    const rightItems = raw.filter((i) => i.isRight);
    const leftItems = raw.filter((i) => !i.isRight);

    relaxLabels(rightItems, true);
    relaxLabels(leftItems, false);

    return raw;
  }, [
    events,
    CX,
    CY,
    R_WEDGE_INNER,
    R_WEDGE_OUTER,
    scaleFactor,
    VB_H,
  ]);

  // Quadrant card assignment for Quadrant Mode
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
        cardX: 110,
        cardY: 175,
        isLeft: true,
        posClass: "left-2 top-4",
      },
      2: {
        cardX: VB_W - 110,
        cardY: 175,
        isLeft: false,
        posClass: "right-2 top-4",
      },
      3: {
        cardX: 110,
        cardY: VB_H - 185,
        isLeft: true,
        posClass: "left-2 bottom-4",
      },
      4: {
        cardX: VB_W - 110,
        cardY: VB_H - 185,
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
    const isRightEvent = selectedWedgeItem.isRight;
    const placeLeft = !isRightEvent;
    const cardX = placeLeft ? 116 : VB_W - 116;
    const cardY = Math.max(
      180,
      Math.min(VB_H - 190, selectedWedgeItem.wedge.outerMidPoint.y)
    );
    const dialPt = selectedWedgeItem.wedge.outerMidPoint;
    const tracerPath = describeCubicTracer(
      dialPt.x,
      dialPt.y,
      selectedWedgeItem.wedge.midAngleRad,
      cardX,
      cardY,
      placeLeft,
      56
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
  const solarTagPt = polarToCartesian(
    CX,
    CY,
    R_SOLAR_ARC + 24 * scaleFactor,
    nowRad
  );
  const liveSolarColor = getTimelapseColorAtMinutes(currentMinutes);

  // Time scrubbing calculation using exact SVG CTM
  const updateScrubFromPointer = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (ctm) {
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgPt = pt.matrixTransform(ctm.inverse());
      // Account for pan and zoom
      const adjX = (svgPt.x - CX - pan.x) / zoom + CX;
      const adjY = (svgPt.y - CY - pan.y) / zoom + CY;
      const mins = cartesianToMinutes(CX, CY, adjX, adjY);
      onScrubMinutes(Math.round(mins));
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VB_W;
    const y = ((clientY - rect.top) / rect.height) * VB_H;
    const adjX = (x - CX - pan.x) / zoom + CX;
    const adjY = (y - CY - pan.y) / zoom + CY;
    onScrubMinutes(Math.round(cartesianToMinutes(CX, CY, adjX, adjY)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Left click on background or middle/secondary drag initiates canvas panning
    if (
      e.button === 1 ||
      e.button === 2 ||
      (e.target as HTMLElement).id === "canvas-bg"
    ) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingTime) {
      updateScrubFromPointer(e.clientX, e.clientY);
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDraggingTime(false);
    setIsPanning(false);
  };

  const resetZoomPan = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const skyImgBleed = 1.15;
  const skyImgSize = R_SKY * 2 * skyImgBleed;

  const selectedInspectorStyle: SubtaskListStyle = selectedWedgeItem
    ? subtaskStylesById[selectedWedgeItem.event.id] ??
      selectedWedgeItem.event.subtaskStyle ??
      "roman"
    : "roman";

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex items-center justify-center select-none ${
        isPanning ? "cursor-grabbing" : "cursor-default"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Dedicated Floating Canvas Zoom & Pan HUD (Top Right) */}
      <div className="absolute top-2 right-2 z-40 flex items-center gap-1 p-1 rounded-xl bg-[#090D18]/90 backdrop-blur-xl border border-white/10 shadow-2xl text-zinc-300">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={resetZoomPan}
          className="px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-200 transition"
          title="Reset Zoom & Pan to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={resetZoomPan}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition border-l border-white/10 ml-0.5"
          title="Center Canvas"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Master 1:1 Isotropic SVG Viewport — 940×940 Circle Geometry */}
      <svg
        ref={svgRef}
        viewBox="0 0 940 940"
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 w-full max-w-[860px] aspect-square h-auto max-h-[calc(100vh-140px)] block mx-auto overflow-hidden"
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

          {/* Atmospheric Ambient Bloom Radiance Filter */}
          <filter id="dialAtmosphereGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="36" result="blur" />
          </filter>

          <filter id="timelapseHaloBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>

          {/* Deep Spherical Atmospheric Vignette */}
          <radialGradient id="skyAtmosphereDepth" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#030712" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#030712" stopOpacity="0.05" />
            <stop offset="85%" stopColor="#020617" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.75" />
          </radialGradient>

          {/* Soft Center Core Depth Gradient */}
          <radialGradient id="centerCoreAperture" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#020617" stopOpacity="0.72" />
            <stop offset="50%" stopColor="#030712" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#030712" stopOpacity="0" />
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

        {/* Clickable Background for Canvas Panning */}
        <rect
          id="canvas-bg"
          x={0}
          y={0}
          width={VB_W}
          height={VB_H}
          fill="transparent"
          className="cursor-grab active:cursor-grabbing"
        />

        {/* Master Zoom & Pan Transformed Graphics Group */}
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transition: isPanning ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* ========================================================================= */}
          {/* 1. ATMOSPHERIC AMBIENT RADIANCE (BLOOM GLOW MATCHING REFERENCE MOCKUP)    */}
          {/* ========================================================================= */}
          <g filter="url(#dialAtmosphereGlow)" opacity="0.48" className="pointer-events-none">
            {/* Top Daylight Azure Bloom */}
            <circle cx={CX} cy={CY - 48 * scaleFactor} r={R_SKY * 0.9} fill="#38bdf8" />
            {/* Right Sunset Warm Amber Bloom */}
            <circle cx={CX + 54 * scaleFactor} cy={CY + 12 * scaleFactor} r={R_SKY * 0.8} fill="#f59e0b" />
            {/* Bottom Starry Midnight Violet Bloom */}
            <circle cx={CX} cy={CY + 56 * scaleFactor} r={R_SKY * 0.85} fill="#4338ca" />
            {/* Left Dawn Soft Twilight Rose Bloom */}
            <circle cx={CX - 54 * scaleFactor} cy={CY} r={R_SKY * 0.75} fill="#a855f7" />
          </g>

          {/* Soft Ambient 24-Hour Time-Lapse Ring Halo */}
          <g opacity="0.24" filter="url(#timelapseHaloBlur)" className="pointer-events-none">
            {timelapseWheelSegments
              .filter((_, i) => i % 2 === 0)
              .map((seg, idx) => (
                <path key={`halo-${idx}`} d={seg.d} fill={seg.color} />
              ))}
          </g>

          {/* ========================================================================= */}
          {/* 2. LUMINOUS 24-HOUR DAY-TO-NIGHT SKY & HORIZON SPHERE                     */}
          {/* ========================================================================= */}
          <g
            clipPath="url(#skySphereCircleClip)"
            className="cursor-crosshair"
            onPointerDown={(e) => {
              setIsDraggingTime(true);
              updateScrubFromPointer(e.clientX, e.clientY);
            }}
          >
            <circle cx={CX} cy={CY} r={R_SKY} fill="#050814" />
            <image
              href="/circadian/sky-timelapse.jpg"
              x={CX - skyImgSize / 2}
              y={CY - skyImgSize / 2}
              width={skyImgSize}
              height={skyImgSize}
              preserveAspectRatio="xMidYMid slice"
              opacity="0.9"
            />
            {/* Seamless Atmospheric Depth Overlay */}
            <circle cx={CX} cy={CY} r={R_SKY} fill="url(#skyAtmosphereDepth)" />

            {/* Translucent Center Aperture (Allows sky and starry night to shine through) */}
            <circle cx={CX} cy={CY} r={R_SOLAR_ARC - 16 * scaleFactor} fill="url(#centerCoreAperture)" />
          </g>

          {/* ========================================================================= */}
          {/* 3. 360° DAY-TO-NIGHT TIME-LAPSE SPECTRUM WHEEL BAND                       */}
          {/* ========================================================================= */}
          <g
            className="cursor-crosshair"
            onPointerDown={(e) => {
              setIsDraggingTime(true);
              updateScrubFromPointer(e.clientX, e.clientY);
            }}
          >
            {timelapseWheelSegments.map((seg, idx) => (
              <path key={`tl-${idx}`} d={seg.d} fill={seg.color} opacity="0.88" />
            ))}
            <circle
              cx={CX}
              cy={CY}
              r={R_TIMELAPSE_INNER}
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1"
            />
            <circle
              cx={CX}
              cy={CY}
              r={R_TIMELAPSE_OUTER}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1.2"
            />
          </g>

          {/* ========================================================================= */}
          {/* 4. CLOCK CARDINAL ORIENTATION (12 TOP, 3 RIGHT, 6 BOTTOM, 9 LEFT)         */}
          {/* ========================================================================= */}
          {/* 24-Hour Precision Ticks around Rim */}
          <g className="pointer-events-none">
            {Array.from({ length: 24 }, (_, idx) => {
              const mins = idx * 60;
              const isMajor = mins % 360 === 0;
              const rad = minutesToAngleRad(mins);
              const r1 = isMajor ? R_SKY - 9 * scaleFactor : R_TIMELAPSE_INNER + 2 * scaleFactor;
              const r2 = isMajor ? R_TIMELAPSE_OUTER + 2 * scaleFactor : R_TIMELAPSE_OUTER - 1 * scaleFactor;
              const p1 = polarToCartesian(CX, CY, r1, rad);
              const p2 = polarToCartesian(CX, CY, r2, rad);
              return (
                <line
                  key={`tick-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isMajor ? "#ffffff" : "rgba(255, 255, 255, 0.42)"}
                  strokeWidth={isMajor ? 2.2 * scaleFactor : 1.1 * scaleFactor}
                />
              );
            })}
          </g>

          {/* Standard Clock Cardinal Time Labels matching Reference Mockup */}
          <g className="pointer-events-none select-none font-mono">
            {/* Top: 12:00 PM (Midday Solar Apex / High Noon) */}
            <text
              x={CX}
              y={CY - R_SKY + 20 * scaleFactor}
              textAnchor="middle"
              fill="#ffffff"
              stroke="rgba(4, 7, 16, 0.85)"
              strokeWidth="2.5"
              paintOrder="stroke"
              fontSize={11.5 * scaleFactor}
              fontWeight={800}
              letterSpacing="0.04em"
            >
              12:00 PM
            </text>

            {/* Right: 6:00 PM (Sunset / Evening Dusk) */}
            <text
              x={CX + R_SKY - 28 * scaleFactor}
              y={CY + 4 * scaleFactor}
              textAnchor="middle"
              fill="#fef3c7"
              stroke="rgba(4, 7, 16, 0.85)"
              strokeWidth="2.5"
              paintOrder="stroke"
              fontSize={11.5 * scaleFactor}
              fontWeight={800}
              letterSpacing="0.04em"
            >
              6:00 PM
            </text>

            {/* Bottom: 12:00 AM (Midnight Nadir) */}
            <text
              x={CX}
              y={CY + R_SKY - 12 * scaleFactor}
              textAnchor="middle"
              fill="#cbd5e1"
              stroke="rgba(4, 7, 16, 0.85)"
              strokeWidth="2.5"
              paintOrder="stroke"
              fontSize={11.5 * scaleFactor}
              fontWeight={800}
              letterSpacing="0.04em"
            >
              12:00 AM
            </text>

            {/* Left: 6:00 AM (Sunrise / Morning Dawn) */}
            <text
              x={CX - R_SKY + 28 * scaleFactor}
              y={CY + 4 * scaleFactor}
              textAnchor="middle"
              fill="#fef3c7"
              stroke="rgba(4, 7, 16, 0.85)"
              strokeWidth="2.5"
              paintOrder="stroke"
              fontSize={11.5 * scaleFactor}
              fontWeight={800}
              letterSpacing="0.04em"
            >
              6:00 AM
            </text>

            {/* Subtle Standard Clock 3 PM / 9 PM / 3 AM / 9 AM Indicators at Octants */}
            {[
              { mins: 900, label: "3 PM", deg: 45 },
              { mins: 1260, label: "9 PM", deg: 135 },
              { mins: 180, label: "3 AM", deg: 225 },
              { mins: 540, label: "9 AM", deg: 315 },
            ].map((oct) => {
              const rad = minutesToAngleRad(oct.mins);
              const pt = polarToCartesian(CX, CY, R_SKY - 18 * scaleFactor, rad);
              return (
                <text
                  key={oct.label}
                  x={pt.x}
                  y={pt.y + 3.5}
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.5)"
                  fontSize={8.5 * scaleFactor}
                  fontWeight={600}
                >
                  {oct.label}
                </text>
              );
            })}
          </g>

          {/* ========================================================================= */}
          {/* 5. GOLDEN ORBITAL RING & REAL-TIME CELESTIAL BEACON                       */}
          {/* ========================================================================= */}
          <g>
            {/* Concentric Gold Orbit Ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R_SOLAR_ARC}
              fill="none"
              stroke="rgba(245, 158, 11, 0.45)"
              strokeWidth="1.6"
              strokeDasharray="4 3"
            />
            {/* Inner Concentric Glow Line */}
            <circle
              cx={CX}
              cy={CY}
              r={R_SOLAR_ARC - 18 * scaleFactor}
              fill="none"
              stroke="rgba(226, 232, 240, 0.18)"
              strokeWidth="1"
            />

            {/* Progress Arc to Live Scrubbed Time */}
            <g filter="url(#arcNeonGlow)" className="pointer-events-none">
              {solarProgressArcs.map((seg, i) => (
                <path
                  key={`sp-${i}`}
                  d={seg.d}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={4.8 * scaleFactor}
                  strokeLinecap="round"
                />
              ))}
            </g>

            {/* Glowing Golden Sun Beacon */}
            <circle
              cx={solarInnerPt.x}
              cy={solarInnerPt.y}
              r={12 * scaleFactor}
              fill={liveSolarColor}
              fillOpacity="0.25"
              className="animate-ping pointer-events-none"
            />
            <circle
              cx={solarInnerPt.x}
              cy={solarInnerPt.y}
              r={5.5 * scaleFactor}
              fill="#fffbeb"
              stroke="#f59e0b"
              strokeWidth="2.4"
              filter="url(#solarNodeGlow)"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsDraggingTime(true);
              }}
            />

            {/* Floating Live Time Pill Badge (e.g. "10:37 AM") */}
            <g
              transform={`translate(${solarTagPt.x.toFixed(1)}, ${solarTagPt.y.toFixed(1)})`}
              className="pointer-events-none"
            >
              <rect
                x={-34 * scaleFactor}
                y={-10 * scaleFactor}
                width={68 * scaleFactor}
                height={20 * scaleFactor}
                rx={10 * scaleFactor}
                fill="rgba(8, 11, 20, 0.92)"
                stroke="rgba(245, 158, 11, 0.75)"
                strokeWidth="1.2"
                filter="url(#arcNeonGlow)"
              />
              <text
                x={0}
                y={3.5 * scaleFactor}
                textAnchor="middle"
                fill="#fef3c7"
                fontSize={9.2 * scaleFactor}
                fontWeight={700}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {minutesTo12Hour(currentMinutes, true)}
              </text>
            </g>
          </g>

          {/* ========================================================================= */}
          {/* 6. OUTER CURVED ANNULAR WEDGES (RENDERED FIRST IN DOM Z-ORDER)            */}
          {/* ========================================================================= */}
          <g id="circadian-wedges-layer">
            {wedgeItems.map((item) => {
              const { event, wedge, timelapseColor } = item;
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
                  key={`wedge-${event.id}`}
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
                    {event.mediaUrl ? (
                      <>
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
                      </>
                    ) : (
                      /* Clean Luminous Glass Wedge */
                      <rect
                        x={wedge.bbox.x}
                        y={wedge.bbox.y}
                        width={wedge.bbox.width}
                        height={wedge.bbox.height}
                        fill={strokeColor}
                        fillOpacity={isHighlighted ? 0.35 : 0.18}
                      />
                    )}
                  </g>

                  {/* Wedge Perimeter Stroke */}
                  <path
                    d={wedge.path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHighlighted ? 3.4 : 2.2}
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
                </g>
              );
            })}
          </g>

          {/* ========================================================================= */}
          {/* 7. ALL LABELS & CONNECTORS LAYER (STRICTLY ON TOP OF WEDGES FOR Z-INDEX)   */}
          {/* ========================================================================= */}
          {viewMode === "solar" && (
            <g id="circadian-labels-top-layer" className="pointer-events-none select-none">
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
                  isRight,
                } = item;
                const isSelected = selectedEventId === event.id;
                const isHovered = hoveredEventId === event.id;
                const matchesTelemetry =
                  !highlightedTelemetry ||
                  event.telemetrySource === highlightedTelemetry;
                const isHighlighted = isSelected || isHovered;
                const strokeColor = event.accentColor || timelapseColor;

                const elbowX = isRight
                  ? Math.min(labelX - 10, CX + R_WEDGE_OUTER + 22)
                  : Math.max(labelX + 10, CX - R_WEDGE_OUTER - 22);

                return (
                  <g
                    key={`label-${event.id}`}
                    opacity={!matchesTelemetry ? 0.28 : isHighlighted ? 1 : 0.94}
                    className="transition-opacity duration-200"
                  >
                    {/* Precision Connector Line with Dot */}
                    <circle
                      cx={wedge.outerMidPoint.x}
                      cy={wedge.outerMidPoint.y}
                      r={isHighlighted ? 3.2 : 2.2}
                      fill={strokeColor}
                      filter={isHighlighted ? "url(#arcNeonGlow)" : undefined}
                    />
                    <polyline
                      points={`${wedge.outerMidPoint.x},${wedge.outerMidPoint.y} ${elbowX},${labelY} ${
                        isRight ? labelX - 6 : labelX + 6
                      },${labelY}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2 : 1.3}
                      strokeOpacity={isHighlighted ? 0.95 : 0.65}
                    />

                    {/* Task Title */}
                    <text
                      x={labelX}
                      y={labelY - 4}
                      textAnchor={textAnchor}
                      fill="#f8fafc"
                      stroke="rgba(8, 11, 20, 0.92)"
                      strokeWidth="3.2"
                      paintOrder="stroke"
                      fontSize={11.5}
                      fontWeight={isHighlighted ? 700 : 600}
                      letterSpacing="0.01em"
                    >
                      {event.title}
                    </text>

                    {/* Time Window */}
                    <text
                      x={labelX}
                      y={labelY + 11}
                      textAnchor={textAnchor}
                      fill={isHighlighted ? strokeColor : "rgba(148, 163, 184, 0.92)"}
                      stroke="rgba(8, 11, 20, 0.92)"
                      strokeWidth="2.8"
                      paintOrder="stroke"
                      fontSize={9.5}
                      fontWeight={600}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {minutesTo12Hour(startMin)} - {minutesTo12Hour(endMin)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ========================================================================= */}
          {/* 8. ILLUMINATED BEZIER TRACER FOR SELECTED BLOCK                           */}
          {/* ========================================================================= */}
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

          {/* Quadrant Mode Tracers */}
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
        </g>
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
          {selectedWedgeItem.event.mediaUrl ? (
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
                  {DOMAIN_CONFIG[selectedWedgeItem.event.domain]?.shortLabel || selectedWedgeItem.event.domain}
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
          ) : (
            <div
              className="p-3.5 border-b relative"
              style={{
                backgroundColor: `${selectedWedgeItem.event.accentColor}14`,
                borderColor: `${selectedWedgeItem.event.accentColor}33`,
              }}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase border"
                  style={{
                    backgroundColor: `${selectedWedgeItem.event.accentColor}25`,
                    color: selectedWedgeItem.event.accentColor,
                    borderColor: `${selectedWedgeItem.event.accentColor}55`,
                  }}
                >
                  {DOMAIN_CONFIG[selectedWedgeItem.event.domain]?.shortLabel || selectedWedgeItem.event.domain}
                </span>

                <div className="flex items-center gap-1">
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
              </div>

              <div className="text-[10px] font-mono font-semibold" style={{ color: selectedWedgeItem.event.accentColor }}>
                {minutesTo12Hour(selectedWedgeItem.startMin)} — {minutesTo12Hour(selectedWedgeItem.endMin)}
              </div>
              <h4 className="text-sm font-bold text-white leading-tight truncate mt-0.5">
                {selectedWedgeItem.event.title}
              </h4>
            </div>
          )}

          <div className="p-3 space-y-2.5">
            {selectedWedgeItem.event.description && (
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                {selectedWedgeItem.event.description}
              </p>
            )}

            {/* Subtask Checklists with Roman/Bullet Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                  {selectedInspectorStyle === "roman"
                    ? "Nested Subtasks (Roman)"
                    : "Checklists (Bullets)"}
                </span>
                <span className="text-[9px] font-mono text-zinc-500">
                  {selectedWedgeItem.event.checklists.filter((c) => c.isCompleted).length}/
                  {selectedWedgeItem.event.checklists.length}
                </span>
              </div>

              <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
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
                    className="w-full flex items-start gap-2 p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-left transition group"
                  >
                    <span
                      className="font-mono text-[10px] font-bold shrink-0 mt-0.5"
                      style={{
                        color: chk.isCompleted
                          ? "#6b7280"
                          : selectedWedgeItem.event.accentColor,
                      }}
                    >
                      {formatSubtaskMarker(idx, selectedInspectorStyle)}
                    </span>
                    <span
                      className={`text-[11px] leading-tight flex-1 ${
                        chk.isCompleted
                          ? "line-through text-zinc-500"
                          : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {chk.label}
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                        chk.isCompleted
                          ? "bg-amber-500 border-amber-500 text-black"
                          : "border-white/20 group-hover:border-white/40"
                      }`}
                    >
                      {chk.isCompleted && <Check size={10} strokeWidth={3} />}
                    </span>
                  </button>
                ))}
              </div>

              {/* Inline Add Checklist Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!quickItemText.trim()) return;
                  onAddChecklist(selectedWedgeItem.event.id, quickItemText.trim());
                  setQuickItemText("");
                }}
                className="flex items-center gap-1.5 pt-1"
              >
                <input
                  type="text"
                  value={quickItemText}
                  onChange={(e) => setQuickItemText(e.target.value)}
                  placeholder="Add subtask..."
                  className="flex-1 px-2.5 py-1 text-[11px] rounded-lg bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50"
                />
                <button
                  type="submit"
                  disabled={!quickItemText.trim()}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition"
                >
                  <Plus size={13} />
                </button>
              </form>
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-zinc-400">
              <span className="font-mono">
                {selectedWedgeItem.event.isRecurring ? "24h Block" : "One-Time"}
              </span>
              <span className="font-bold uppercase tracking-wider text-zinc-300">
                {selectedWedgeItem.event.telemetrySource
                  ? selectedWedgeItem.event.telemetrySource.replace("_", " ")
                  : "Google Calendar"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quadrant Mode: 4 Floating Visual Cards */}
      {viewMode === "quadrants" && (
        <div className="pointer-events-auto">
          {quadrantAssignments.map(({ slot, item, anchor }) => {
            const { event, startMin, durMin } = item;
            const isHighlighted = activeId === event.id;
            const color = event.accentColor || item.timelapseColor;
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
                {event.mediaUrl ? (
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
                        {DOMAIN_CONFIG[event.domain]?.shortLabel || event.domain}
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {event.title}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-3 border-b flex flex-col gap-1.5"
                    style={{
                      backgroundColor: `${color}14`,
                      borderColor: `${color}30`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase border"
                        style={{ color, borderColor: `${color}55`, backgroundColor: `${color}20` }}
                      >
                        {slotLabel}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-zinc-300">
                        {Math.round((durMin / 60) * 10) / 10}h
                      </span>
                    </div>
                    <div>
                      <div
                        className="text-[9px] font-mono font-bold uppercase"
                        style={{ color }}
                      >
                        {minutesTo12Hour(startMin)} | {DOMAIN_CONFIG[event.domain]?.shortLabel || event.domain}
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5">
                        {event.title}
                      </div>
                    </div>
                  </div>
                )}

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
                      className="w-full flex items-center justify-between text-[10px] text-zinc-300 hover:text-white"
                    >
                      <span className="truncate pr-1">{chk.label}</span>
                      <span
                        className={`w-3 h-3 rounded flex items-center justify-center border shrink-0 ${
                          chk.isCompleted
                            ? "bg-amber-500 border-amber-500 text-black"
                            : "border-white/20"
                        }`}
                      >
                        {chk.isCompleted && <Check size={8} strokeWidth={3} />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
