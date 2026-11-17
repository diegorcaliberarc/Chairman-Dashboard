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
  resolveEventVisual,
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
  minutesToMilitary,
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

  // Label View Mode: "orbital" (Direct Orbital HUD matching Image 2) vs "split" (Split Column Rails matching Image 1)
  const [labelMode, setLabelMode] = useState<"orbital" | "split">("orbital");

  // Interactive In-Canvas Zoom & Pan states
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Master 1000 × 1000 ViewBox — leaves ample margin around outer wedges for non-clipped labels
  const VB_W = 1000;
  const VB_H = 1000;
  const CX = 500;
  const CY = 500;

  const scaleFactor = viewMode === "quadrants" ? 0.74 : 1;
  const R_SKY = 180 * scaleFactor;
  const R_TIMELAPSE_INNER = 180 * scaleFactor;
  const R_TIMELAPSE_OUTER = 196 * scaleFactor;
  const R_SOLAR_ARC = 126 * scaleFactor;
  const R_WEDGE_INNER = 180 * scaleFactor;
  const R_WEDGE_OUTER = 328 * scaleFactor;

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

  // Precompute wedge geometries + strictly deduplicate 1-to-1 + non-colliding labels
  const wedgeItems = useMemo(() => {
    // 1. Filter out all-day events, < 5 min zero-width dots, and >= 18h / 24h day-spanning blocks
    // so a single multi-day task never forms a giant 360° ring wrapping the entire wheel
    const timedEvents = events.filter((ev) => {
      if (ev.allDay) return false;
      const s = new Date(ev.startTime).getTime();
      const e = new Date(ev.endTime).getTime();
      if (s === e) return false;
      const dur = getDurationMinutes(
        dateToMinutes(new Date(ev.startTime)),
        dateToMinutes(new Date(ev.endTime))
      );
      return dur >= 5 && dur < 1080;
    });

    // 2. Strict 1-to-1 Event Deduplication: Ensure each scheduled routine only appears ONCE
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

    // 3. Build geometry items with 24-hour military clock math (Full-Thickness Annular Cards)
    const raw = uniqueTimedEvents.map((ev) => {
      const startMin = dateToMinutes(new Date(ev.startTime));
      const endMin = dateToMinutes(new Date(ev.endTime));
      const durMin = getDurationMinutes(startMin, endMin);
      const midMin = (startMin + durMin / 2) % 1440;

      // FULL THICKNESS WEDGES: Match reference mockup exactly (no splitting in half!)
      const rInner = R_WEDGE_INNER;
      const rOuter = R_WEDGE_OUTER;

      const wedge = describeAnnularWedge(
        CX,
        CY,
        rInner,
        rOuter,
        startMin,
        endMin,
        1.5
      );

      const visual = resolveEventVisual(ev.title, ev.domain);
      const mediaUrl = ev.mediaUrl || visual.mediaUrl;
      const accentColor = ev.accentColor || visual.accentColor;

      return {
        event: ev,
        mediaUrl,
        accentColor,
        startMin,
        endMin,
        durMin,
        midMin,
        timelapseColor: getTimelapseColorAtMinutes(midMin),
        wedge,
        midAngleDeg: wedge.midAngleDeg,
        midAngleRad: wedge.midAngleRad,
      };
    });

    // Sort by midAngleDeg for clean angular stagger detection
    raw.sort((a, b) => a.midAngleDeg - b.midAngleDeg);

    // 4. Stagger connectors for closely spaced events (< 18° angular delta or multi-track)
    const itemsWithAnchors = raw.map((item, idx) => {
      const isRight = Math.cos(item.midAngleRad) >= 0;
      let staggerLevel = 0;
      if (idx > 0) {
        const prev = raw[idx - 1];
        const angDiff = Math.abs(item.midAngleDeg - prev.midAngleDeg);
        if (angDiff < 18) {
          staggerLevel = idx % 3;
        }
      }
      const radialOffset = staggerLevel * 32 * scaleFactor;
      const anchorPt = polarToCartesian(
        CX,
        CY,
        R_WEDGE_OUTER + (22 + radialOffset) * scaleFactor,
        item.midAngleRad
      );

      // Image 2 Direct Orbital HUD label positioning
      const orbitalDist = R_WEDGE_OUTER + (20 + staggerLevel * 18) * scaleFactor;
      const orbitalAnchor = polarToCartesian(
        CX,
        CY,
        orbitalDist,
        item.midAngleRad
      );
      const cosA = Math.cos(item.midAngleRad);
      const sinA = Math.sin(item.midAngleRad);

      let orbitalAnchorMode: "start" | "end" | "middle" = "start";
      let orbitalTx = orbitalAnchor.x;
      let orbitalTy1 = orbitalAnchor.y - 6 * scaleFactor;
      let orbitalTy2 = orbitalAnchor.y + 11 * scaleFactor;

      if (cosA > 0.3) {
        orbitalAnchorMode = "start";
        orbitalTx = orbitalAnchor.x + 8 * scaleFactor;
      } else if (cosA < -0.3) {
        orbitalAnchorMode = "end";
        orbitalTx = orbitalAnchor.x - 8 * scaleFactor;
      } else {
        orbitalAnchorMode = "middle";
        if (sinA < 0) {
          orbitalTy1 = orbitalAnchor.y - 12 * scaleFactor;
          orbitalTy2 = orbitalAnchor.y + 4 * scaleFactor;
        } else {
          orbitalTy1 = orbitalAnchor.y + 10 * scaleFactor;
          orbitalTy2 = orbitalAnchor.y + 26 * scaleFactor;
        }
      }

      const timeRange12h = `${minutesTo12Hour(item.startMin, true)} – ${minutesTo12Hour(item.endMin, true)}`;

      return {
        ...item,
        staggerLevel,
        anchorPt,
        isRight,
        labelX: isRight ? anchorPt.x + 22 : anchorPt.x - 22,
        labelY: anchorPt.y,
        textAnchor: (isRight ? "start" : "end") as "start" | "end",
        orbitalAnchor,
        orbitalAnchorMode,
        orbitalTx,
        orbitalTy1,
        orbitalTy2,
        timeRange12h,
      };
    });

    // 5. Collision-Avoidance Label Relaxation Pass (Separately on Left and Right)
    const relaxLabels = (items: typeof itemsWithAnchors, isRightSide: boolean) => {
      if (items.length <= 1) {
        if (items.length === 1) {
          items[0].labelX = isRightSide
            ? CX + R_WEDGE_OUTER + 28 * scaleFactor
            : CX - R_WEDGE_OUTER - 28 * scaleFactor;
        }
        return;
      }
      // Sort vertically by target natural anchor Y
      items.sort((a, b) => a.anchorPt.y - b.anchorPt.y);
      const minGap = 62; // Minimum vertical gap between adjacent labels
      const topBound = 55;
      const bottomBound = VB_H - 55;

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

      // Enforce clean column rail alignment matching reference mockup
      for (const item of items) {
        item.labelX = isRightSide
          ? CX + R_WEDGE_OUTER + 34 * scaleFactor
          : CX - R_WEDGE_OUTER - 34 * scaleFactor;
      }
    };

    const rightItems = itemsWithAnchors.filter((i) => i.isRight);
    const leftItems = itemsWithAnchors.filter((i) => !i.isRight);

    relaxLabels(rightItems, true);
    relaxLabels(leftItems, false);

    return itemsWithAnchors;
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
      className={`relative w-full h-full min-h-[640px] flex items-center justify-center select-none overflow-hidden ${
        isPanning ? "cursor-grabbing" : "cursor-default"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Dedicated Floating Canvas Controls & Mode Switcher (Top Right) */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
        {/* Switchable Label Mode Toggle: Orbital HUD (Image 2) vs Split Columns (Image 1) */}
        {viewMode === "solar" && (
          <div className="flex items-center bg-[#090D18]/90 backdrop-blur-xl border border-white/10 rounded-xl p-0.5 shadow-2xl text-zinc-300">
            <button
              type="button"
              onClick={() => setLabelMode("orbital")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                labelMode === "orbital"
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Direct Orbital HUD Labels (Image 2 style)"
            >
              <Sparkles size={12} className={labelMode === "orbital" ? "text-amber-300" : "text-zinc-400"} />
              <span>Orbital HUD</span>
            </button>
            <button
              type="button"
              onClick={() => setLabelMode("split")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                labelMode === "split"
                  ? "bg-sky-400/20 text-sky-300 border border-sky-400/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Split Column Rails (Image 1 style)"
            >
              <ListOrdered size={12} className={labelMode === "split" ? "text-sky-300" : "text-zinc-400"} />
              <span>Split Columns</span>
            </button>
          </div>
        )}

        {/* Zoom & Pan HUD */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#090D18]/90 backdrop-blur-xl border border-white/10 shadow-2xl text-zinc-300">
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
      </div>

      {/* Master 1:1 Isotropic SVG Viewport — 1000×1000 Circle Geometry */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 w-full h-full max-w-none max-h-none block mx-auto overflow-visible"
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

          {/* Radiant Outer Bloom Glow Filter for Arcs & Tracks */}
          <filter id="radiantOuterGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Left Hemisphere Gradient: Bottom (00:00) Midnight Indigo -> Mid-Left (06:00) Dawn Horizon -> Top (12:00) Brilliant Sky Blue */}
          <linearGradient id="ringGradLeftHemisphere" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="25%" stopColor="#312e81" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="75%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Right Hemisphere Gradient: Top (12:00) Soft Golden Yellow -> 18:00 Sunset Orange -> Bottom (24:00) Sunset Ember / Indigo */}
          <linearGradient id="ringGradRightHemisphere" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>

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

          {/* Subtle Dark Vignette Overlay for Photo-Filled Wedges */}
          <radialGradient id="wedgeVignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
          </radialGradient>

          {/* Image 2 Smoked Lens Aperture Gradient */}
          <radialGradient id="centerIrisGlassGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#080c1a" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0b1022" stopOpacity="0.88" />
            <stop offset="85%" stopColor="#04060d" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020308" stopOpacity="0.98" />
          </radialGradient>

          {/* Luminous Golden Solar Arc Gradient */}
          <linearGradient id="goldenArcGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Authentic Concentric Smoked Glass Cockpit Core Gradient */}
          <radialGradient id="centerCoreGlassGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#080c18" stopOpacity="0.94" />
            <stop offset="70%" stopColor="#050812" stopOpacity="0.97" />
            <stop offset="100%" stopColor="#03060f" stopOpacity="0.99" />
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
            {/* Top Daylight Azure Bloom (12:00 Solar Apex) */}
            <circle cx={CX} cy={CY - 48 * scaleFactor} r={R_SKY * 0.9} fill="#38bdf8" />
            {/* Left Dawn Sunrise Warm Amber Bloom (06:00 Dawn) */}
            <circle cx={CX - 54 * scaleFactor} cy={CY} r={R_SKY * 0.8} fill="#f59e0b" />
            {/* Right Sunset Fiery Ember Bloom (18:00 Dusk) */}
            <circle cx={CX + 54 * scaleFactor} cy={CY} r={R_SKY * 0.8} fill="#ea580c" />
            {/* Bottom Starry Midnight Indigo Bloom (00:00 / 24:00 Nadir) */}
            <circle cx={CX} cy={CY + 56 * scaleFactor} r={R_SKY * 0.85} fill="#312e81" />
          </g>

          {/* ========================================================================= */}
          {/* 2. AUTHENTIC REFERENCE DAY-TO-NIGHT DIAL SPHERE                           */}
          {/* ========================================================================= */}
          <g
            clipPath="url(#skySphereCircleClip)"
            className="cursor-crosshair"
            onPointerDown={(e) => {
              setIsDraggingTime(true);
              updateScrubFromPointer(e.clientX, e.clientY);
            }}
          >
            {/* Base Dark Midnight Rim */}
            <circle cx={CX} cy={CY} r={R_SKY} fill="#050814" />

            {/* Authentic Reference Dial from Mockup (Sky, Sunset, Dawn, Night City Lights) */}
            <image
              href="/circadian/reference_dial_celestial_v6.png?v=6.0.0"
              x={CX - R_SKY}
              y={CY - R_SKY}
              width={R_SKY * 2}
              height={R_SKY * 2}
              preserveAspectRatio="xMidYMid meet"
            />

            {/* Crisp Outer Rim Border */}
            <circle
              cx={CX}
              cy={CY}
              r={R_SKY}
              fill="none"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1.2"
            />
          </g>

          {/* ========================================================================= */}
          {/* 3. CARDINAL CLOCK HOUR MARKERS (MATCHING IMAGE 2 AESTHETIC)               */}
          {/* ========================================================================= */}
          <g id="dial-clock-cardinal-markers" className="pointer-events-none select-none font-sans">
            {/* Top: 12:00 PM (Solar Apex High Noon) */}
            <text
              x={CX}
              y={CY - R_SKY + 22 * scaleFactor}
              textAnchor="middle"
              fill="#ffffff"
              stroke="rgba(8, 11, 20, 0.95)"
              strokeWidth="3.2"
              paintOrder="stroke"
              fontSize={13 * scaleFactor}
              fontWeight={800}
              letterSpacing="0.03em"
            >
              12:00 PM
            </text>

            {/* Left: - 6:00 AM (Western Sunrise Dawn) */}
            <text
              x={CX - R_SKY + 34 * scaleFactor}
              y={CY + 4.5 * scaleFactor}
              textAnchor="middle"
              fill="#fef3c7"
              stroke="rgba(8, 11, 20, 0.95)"
              strokeWidth="3.2"
              paintOrder="stroke"
              fontSize={12 * scaleFactor}
              fontWeight={800}
              letterSpacing="0.03em"
            >
              - 6:00 AM
            </text>

            {/* Right: 6:00 PM - (Sunset Dusk) */}
            <text
              x={CX + R_SKY - 34 * scaleFactor}
              y={CY + 4.5 * scaleFactor}
              textAnchor="middle"
              fill="#fef3c7"
              stroke="rgba(8, 11, 20, 0.95)"
              strokeWidth="3.2"
              paintOrder="stroke"
              fontSize={12 * scaleFactor}
              fontWeight={800}
              letterSpacing="0.03em"
            >
              6:00 PM -
            </text>

            {/* Bottom: 12:00 AM (Midnight Nadir) */}
            <text
              x={CX}
              y={CY + R_SKY - 12 * scaleFactor}
              textAnchor="middle"
              fill="#cbd5e1"
              stroke="rgba(8, 11, 20, 0.96)"
              strokeWidth="3.2"
              paintOrder="stroke"
              fontSize={11.5 * scaleFactor}
              fontWeight={800}
              letterSpacing="0.03em"
            >
              12:00 AM
            </text>

            {/* 24-Hour Precision Hour Ticks Around Rim */}
            {Array.from({ length: 24 }, (_, hour) => {
              const deg = (hour / 24) * 360 + 90;
              const rad = (deg * Math.PI) / 180;
              const isCardinal = hour === 0 || hour === 6 || hour === 12 || hour === 18;
              const isSubCardinal = hour === 3 || hour === 9 || hour === 15 || hour === 21;
              const tickOuter = R_SKY - 2 * scaleFactor;
              const tickInner = isCardinal
                ? R_SKY - 10 * scaleFactor
                : isSubCardinal
                ? R_SKY - 7 * scaleFactor
                : R_SKY - 4.5 * scaleFactor;
              const p1 = polarToCartesian(CX, CY, tickInner, rad);
              const p2 = polarToCartesian(CX, CY, tickOuter, rad);

              return (
                <line
                  key={`hour-tick-${hour}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isCardinal ? "#ffffff" : isSubCardinal ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.35)"}
                  strokeWidth={isCardinal ? 2.2 : isSubCardinal ? 1.5 : 0.9}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* ========================================================================= */}
          {/* 4. CENTRAL APERTURE & IMAGE 2 LUMINOUS GOLDEN SOLAR TIME ARC              */}
          {/* ========================================================================= */}
          {(() => {
            const R_APERTURE = 106 * scaleFactor;
            const R_GOLD_ARC = 94 * scaleFactor;
            const R_CORE = 64 * scaleFactor;

            const currentAngleRad = minutesToAngleRad(currentMinutes);
            const nadirAngleRad = currentAngleRad + Math.PI;

            const node1 = polarToCartesian(CX, CY, R_GOLD_ARC, currentAngleRad);
            const node2 = polarToCartesian(CX, CY, R_GOLD_ARC, nadirAngleRad);

            // Compute arc sweep between 06:00 (dawn) and current time or across solar day
            const dayStartMin = 360; // 06:00 AM
            const dayEndMin = 1080;  // 06:00 PM

            return (
              <g id="center-solar-aperture" className="pointer-events-none select-none">
                {/* Smoked Lens Aperture Disc */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R_APERTURE}
                  fill="url(#centerIrisGlassGrad)"
                  stroke="rgba(255, 255, 255, 0.18)"
                  strokeWidth={1.2}
                  filter="url(#arcNeonGlow)"
                />

                {/* Subtle Concentric Hairline Track */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R_GOLD_ARC}
                  fill="none"
                  stroke="rgba(245, 158, 11, 0.22)"
                  strokeWidth={1.2}
                  strokeDasharray="2 3"
                />

                {/* Radiant Golden Solar Daytime Arc (Image 2 aesthetic) */}
                <path
                  d={describeTimeArc(CX, CY, R_GOLD_ARC, dayStartMin, Math.max(dayStartMin + 30, Math.min(dayEndMin, currentMinutes)))}
                  fill="none"
                  stroke="url(#goldenArcGrad)"
                  strokeWidth={3.5 * scaleFactor}
                  strokeLinecap="round"
                  filter="url(#radiantOuterGlow)"
                />

                {/* Golden Node 1: Current Live Solar Time with Tag */}
                <g id="solar-node-current">
                  <circle
                    cx={node1.x}
                    cy={node1.y}
                    r={6.5 * scaleFactor}
                    fill="#fef08a"
                    filter="url(#solarNodeGlow)"
                  />
                  <circle
                    cx={node1.x}
                    cy={node1.y}
                    r={3.0 * scaleFactor}
                    fill="#ffffff"
                  />
                  <text
                    x={node1.x}
                    y={node1.y - 9 * scaleFactor}
                    textAnchor="middle"
                    fill="#fef3c7"
                    stroke="rgba(4, 7, 15, 0.95)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    fontSize={10 * scaleFactor}
                    fontWeight={700}
                    letterSpacing="0.02em"
                  >
                    {minutesTo12Hour(currentMinutes, true)}
                  </text>
                </g>

                {/* Golden Node 2: Nadir / Horizon Complementary Node with Tag */}
                <g id="solar-node-nadir">
                  <circle
                    cx={node2.x}
                    cy={node2.y}
                    r={6.5 * scaleFactor}
                    fill="#fef08a"
                    filter="url(#solarNodeGlow)"
                  />
                  <circle
                    cx={node2.x}
                    cy={node2.y}
                    r={3.0 * scaleFactor}
                    fill="#ffffff"
                  />
                  <text
                    x={node2.x}
                    y={node2.y - 9 * scaleFactor}
                    textAnchor="middle"
                    fill="#fef3c7"
                    stroke="rgba(4, 7, 15, 0.95)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    fontSize={10 * scaleFactor}
                    fontWeight={700}
                    letterSpacing="0.02em"
                  >
                    {minutesTo12Hour(currentMinutes, true)}
                  </text>
                </g>

                {/* Inner Smoked Cockpit Core Disc */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R_CORE}
                  fill="url(#centerCoreGlassGrad)"
                  stroke="rgba(255, 255, 255, 0.14)"
                  strokeWidth={1.2}
                  filter="url(#arcNeonGlow)"
                />
                {/* Hairline Dashed Ring */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={52 * scaleFactor}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={0.8}
                  strokeDasharray="3 4"
                />

                {/* Crisp Digital Time Readout */}
                <text
                  x={CX}
                  y={CY - 2 * scaleFactor}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  stroke="rgba(4, 7, 15, 0.95)"
                  strokeWidth={4.5 * scaleFactor}
                  paintOrder="stroke"
                  fontSize={25 * scaleFactor}
                  fontWeight={800}
                  letterSpacing="-0.02em"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {minutesTo12Hour(currentMinutes, true)}
                </text>
                <text
                  x={CX}
                  y={CY + 18 * scaleFactor}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(226, 232, 240, 0.95)"
                  stroke="rgba(4, 7, 15, 0.95)"
                  strokeWidth={3 * scaleFactor}
                  paintOrder="stroke"
                  fontSize={9 * scaleFactor}
                  fontWeight={700}
                  letterSpacing="0.14em"
                >
                  24H SOLAR ARC
                </text>
              </g>
            );
          })()}

          {/* ========================================================================= */}
          {/* 5. LUMINOUS CIRCADIAN GRADIENT LIGHT STRIP (TOUCHING INNER RING)          */}
          {/* ========================================================================= */}
          <g id="circadian-gradient-light-strip" className="pointer-events-none">
            {/* Right Hemisphere Light Strip (12:00 Solar Noon -> 18:00 Dusk -> 24:00 Midnight): Yellow to Amber */}
            <path
              d={`M ${CX} ${CY - R_WEDGE_INNER} A ${R_WEDGE_INNER} ${R_WEDGE_INNER} 0 0 1 ${CX} ${CY + R_WEDGE_INNER}`}
              fill="none"
              stroke="url(#ringGradRightHemisphere)"
              strokeWidth="3.4"
              strokeLinecap="round"
              filter="url(#radiantOuterGlow)"
              opacity="0.95"
            />
            {/* Left Hemisphere Light Strip (24:00 Midnight -> 06:00 Dawn -> 12:00 Solar Noon): Indigo to Azure Blue */}
            <path
              d={`M ${CX} ${CY + R_WEDGE_INNER} A ${R_WEDGE_INNER} ${R_WEDGE_INNER} 0 0 1 ${CX} ${CY - R_WEDGE_INNER}`}
              fill="none"
              stroke="url(#ringGradLeftHemisphere)"
              strokeWidth="3.4"
              strokeLinecap="round"
              filter="url(#radiantOuterGlow)"
              opacity="0.95"
            />
            {/* Crisp Inner Rim Border Base */}
            <circle
              cx={CX}
              cy={CY}
              r={R_WEDGE_INNER}
              fill="none"
              stroke="rgba(255, 255, 255, 0.28)"
              strokeWidth="1"
            />
          </g>

          {/* Underlying Circadian Radial Guide Track with Hemisphere Glow (Reference Styling) */}
          <g id="circadian-track-rings" className="pointer-events-none" opacity="0.35">
            <path
              d={`M ${CX} ${CY + R_WEDGE_OUTER} A ${R_WEDGE_OUTER} ${R_WEDGE_OUTER} 0 0 1 ${CX} ${CY - R_WEDGE_OUTER}`}
              fill="none"
              stroke="url(#ringGradLeftHemisphere)"
              strokeWidth="1.2"
              strokeDasharray="5 7"
            />
            <path
              d={`M ${CX} ${CY - R_WEDGE_OUTER} A ${R_WEDGE_OUTER} ${R_WEDGE_OUTER} 0 0 1 ${CX} ${CY + R_WEDGE_OUTER}`}
              fill="none"
              stroke="url(#ringGradRightHemisphere)"
              strokeWidth="1.2"
              strokeDasharray="5 7"
            />
          </g>

          {/* ========================================================================= */}
          {/* 6. OUTER CURVED ANNULAR WEDGES (RENDERED FIRST IN DOM Z-ORDER)            */}
          {/* ========================================================================= */}
          <g id="circadian-wedges-layer">
            {wedgeItems.map((item) => {
              const { event, wedge, timelapseColor, mediaUrl, accentColor } = item;
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
              const strokeColor = timelapseColor;
              const imageHref = mediaUrl || event.mediaUrl;

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
                    {imageHref ? (
                      <>
                        <image
                          href={imageHref}
                          x={wedge.bbox.x}
                          y={wedge.bbox.y}
                          width={wedge.bbox.width}
                          height={wedge.bbox.height}
                          preserveAspectRatio="xMidYMid slice"
                        />
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

                  {/* Wedge Perimeter Stroke with Radiant Outer Glow matching Image 2 */}
                  <path
                    d={wedge.path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHighlighted ? 4.2 : 3.0}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    filter={isHighlighted ? "url(#radiantOuterGlow)" : "url(#arcNeonGlow)"}
                    opacity={
                      !matchesTelemetry
                        ? 0.3
                        : activeId && !isHighlighted
                        ? 0.74
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
            <g id="circadian-labels-top-layer" className="select-none">
              {labelMode === "orbital" ? (
                /* --------------------------------------------------------------------- */
                /* IMAGE 2 DIRECT ORBITAL HUD LABELS (PRIMARY DEFAULT VIEW)             */
                /* --------------------------------------------------------------------- */
                <g id="orbital-hud-labels">
                  {wedgeItems.map((item) => {
                    const {
                      event,
                      wedge,
                      timelapseColor,
                      accentColor,
                      orbitalTx,
                      orbitalTy1,
                      orbitalTy2,
                      orbitalAnchorMode,
                      timeRange12h,
                    } = item;
                    const isSelected = selectedEventId === event.id;
                    const isHovered = hoveredEventId === event.id;
                    const matchesTelemetry =
                      !highlightedTelemetry ||
                      event.telemetrySource === highlightedTelemetry;
                    const isHighlighted = isSelected || isHovered;
                    const strokeColor = timelapseColor;

                    return (
                      <g
                        key={`orbital-label-${event.id}`}
                        className="cursor-pointer transition-opacity duration-200 group"
                        opacity={!matchesTelemetry ? 0.28 : isHighlighted ? 1 : 0.92}
                        onClick={() =>
                          onSelectEvent(selectedEventId === event.id ? null : event.id)
                        }
                        onMouseEnter={() => setHoveredEventId(event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                      >
                        {/* Outer Wedge Midpoint Luminous Pip */}
                        <circle
                          cx={wedge.outerMidPoint.x}
                          cy={wedge.outerMidPoint.y}
                          r={isHighlighted ? 5.0 : 3.4}
                          fill={strokeColor}
                          filter={isHighlighted ? "url(#radiantOuterGlow)" : "url(#arcNeonGlow)"}
                        />
                        <circle
                          cx={wedge.outerMidPoint.x}
                          cy={wedge.outerMidPoint.y}
                          r={isHighlighted ? 2.5 : 1.6}
                          fill="#ffffff"
                        />

                        {/* Event Title (Bold Crisp Typography, matching Image 2) */}
                        <text
                          x={orbitalTx}
                          y={orbitalTy1}
                          textAnchor={orbitalAnchorMode}
                          fill={isHighlighted ? "#ffffff" : "#f8fafc"}
                          stroke="rgba(4, 7, 15, 0.96)"
                          strokeWidth={3.8 * scaleFactor}
                          paintOrder="stroke"
                          fontSize={13.5 * scaleFactor}
                          fontWeight={700}
                          letterSpacing="0.01em"
                        >
                          {event.title.length > 25 ? event.title.slice(0, 24) + "…" : event.title}
                        </text>

                        {/* 12-Hour Time Window Subtitle (Image 2 style) */}
                        <text
                          x={orbitalTx}
                          y={orbitalTy2}
                          textAnchor={orbitalAnchorMode}
                          fill={isHighlighted ? strokeColor : "rgba(203, 213, 225, 0.88)"}
                          stroke="rgba(4, 7, 15, 0.96)"
                          strokeWidth={3 * scaleFactor}
                          paintOrder="stroke"
                          fontSize={11 * scaleFactor}
                          fontWeight={600}
                          letterSpacing="0.02em"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {timeRange12h}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ) : (
                /* --------------------------------------------------------------------- */
                /* IMAGE 1 SPLIT COLUMNS RAILS (SECONDARY VIEW VIA TOGGLE)              */
                /* --------------------------------------------------------------------- */
                <g id="split-column-labels" className="pointer-events-none">
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
                      accentColor,
                    } = item;
                    const isSelected = selectedEventId === event.id;
                    const isHovered = hoveredEventId === event.id;
                    const matchesTelemetry =
                      !highlightedTelemetry ||
                      event.telemetrySource === highlightedTelemetry;
                    const isHighlighted = isSelected || isHovered;
                    const strokeColor = timelapseColor;

                    const elbowX = isRight
                      ? Math.min(labelX - 10, CX + R_WEDGE_OUTER + 16)
                      : Math.max(labelX + 10, CX - R_WEDGE_OUTER - 16);

                    const pillWidth = Math.min(310, Math.max(175, event.title.length * 9.0 + 38));
                    const pillHeight = 54;
                    const pillX = isRight ? labelX - 8 : labelX - pillWidth + 8;
                    const pillY = labelY - 27;

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
                          r={isHighlighted ? 4.8 : 3.5}
                          fill={strokeColor}
                          filter={isHighlighted ? "url(#arcNeonGlow)" : undefined}
                        />
                        <polyline
                          points={`${wedge.outerMidPoint.x},${wedge.outerMidPoint.y} ${elbowX},${labelY} ${
                            isRight ? labelX - 8 : labelX + 8
                          },${labelY}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isHighlighted ? 2.6 : 1.8}
                          strokeOpacity={isHighlighted ? 0.95 : 0.75}
                        />

                        {/* High-Contrast Dark Glass Backdrop Pill */}
                        <rect
                          x={pillX}
                          y={pillY}
                          width={pillWidth}
                          height={pillHeight}
                          rx={10}
                          fill="rgba(8, 12, 22, 0.94)"
                          stroke={isHighlighted ? strokeColor : "rgba(255, 255, 255, 0.15)"}
                          strokeWidth={isHighlighted ? 1.9 : 1.2}
                          filter="url(#arcNeonGlow)"
                        />

                        {/* Task Title */}
                        <text
                          x={isRight ? labelX + 8 : labelX - 8}
                          y={labelY - 6}
                          textAnchor={textAnchor}
                          fill="#f8fafc"
                          fontSize={14.8}
                          fontWeight={isHighlighted ? 800 : 700}
                          letterSpacing="0.01em"
                        >
                          {event.title.length > 28 ? event.title.slice(0, 27) + "…" : event.title}
                        </text>

                        {/* Time Window (24-Hour Military Format) */}
                        <text
                          x={isRight ? labelX + 8 : labelX - 8}
                          y={labelY + 15}
                          textAnchor={textAnchor}
                          fill={isHighlighted ? strokeColor : "rgba(148, 163, 184, 0.95)"}
                          fontSize={12.2}
                          fontWeight={700}
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {minutesToMilitary(startMin)} - {minutesToMilitary(endMin, true)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
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
