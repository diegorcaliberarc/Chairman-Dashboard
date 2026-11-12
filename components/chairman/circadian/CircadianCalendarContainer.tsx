"use client";

import React, { useMemo, useState } from "react";
import { Radio } from "lucide-react";
import { CircadianEventDTO } from "@/lib/circadianTypes";
import {
  assignOrbitalTracks,
  dateToMinutes,
  describeAnnularWedge,
  describeTimeArc,
  getDurationMinutes,
  getTimelapseColorAtMinutes,
  minutesTo12Hour,
  polarToCartesian,
} from "@/lib/circadianMath";
import { SolarDialCanvas } from "./SolarDialCanvas";
import { SolarDialTicks } from "./SolarDialTicks";
import {
  ComputedRibbonGeometry,
  RadialEventRibbon,
} from "./RadialEventRibbon";
import { RealtimeSolarBeacon } from "./RealtimeSolarBeacon";
import {
  DynamicTracerCanvas,
  TracerConnectionSpec,
} from "./DynamicTracerCanvas";
import { TetheredEventCard } from "./TetheredEventCard";

export interface CircadianCalendarContainerProps {
  events: CircadianEventDTO[];
  highlightedTelemetry?: string | null;
  currentMinutes: number;
  isLiveTime: boolean;
  onScrubMinutes: (mins: number) => void;
  onResetLive: () => void;
  viewMode: "solar" | "quadrants";
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onToggleChecklist: (
    eventId: string,
    checklistId: string,
    nextVal: boolean
  ) => void;
  onEditEvent: (event: CircadianEventDTO) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddChecklist: (eventId: string, label: string) => void;
  radarOverlaySvg?: React.ReactNode;
}

export function CircadianCalendarContainer({
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
  radarOverlaySvg,
}: CircadianCalendarContainerProps) {
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [isDraggingTime, setIsDraggingTime] = useState(false);

  const VB_W = 1000;
  const VB_H = 760;
  const CX = VB_W / 2;
  const CY = VB_H / 2;

  const scaleFactor = viewMode === "quadrants" ? 0.75 : 1;
  const R_SKY = 180 * scaleFactor;
  const R_TIMELAPSE_INNER = 180 * scaleFactor;
  const R_TIMELAPSE_OUTER = 195 * scaleFactor;
  const R_SOLAR_ARC = 90 * scaleFactor;
  const R_ORBITAL_TRACKS = useMemo(
    () => [148, 131, 114].map((r) => r * scaleFactor),
    [scaleFactor]
  );
  const R_WEDGE_INNER = 204 * scaleFactor;
  const R_WEDGE_OUTER = 290 * scaleFactor;

  const activeId = hoveredEventId ?? selectedEventId;
  const orbitalMap = useMemo(() => assignOrbitalTracks(events), [events]);

  const ribbonItems: ComputedRibbonGeometry[] = useMemo(() => {
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
      const ribbonPath = describeTimeArc(CX, CY, trackRadius, startMin, endMin);

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
  }, [
    events,
    CX,
    CY,
    R_WEDGE_INNER,
    R_WEDGE_OUTER,
    R_ORBITAL_TRACKS,
    orbitalMap,
  ]);

  const quadrantAssignments = useMemo(() => {
    const slots: Record<number, ComputedRibbonGeometry | null> = {
      1: null,
      2: null,
      3: null,
      4: null,
    };

    for (const item of ribbonItems) {
      const slot = item.event.quadrantSlot;
      if (slot && slot >= 1 && slot <= 4 && !slots[slot]) {
        slots[slot] = item;
      }
    }

    for (const item of ribbonItems) {
      if (Object.values(slots).some((v) => v?.event.id === item.event.id)) {
        continue;
      }
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
      1: { cardX: 242, cardY: 165, isLeft: true, posClass: "left-2 top-4" },
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
        return { slot, item, anchor, dialPt };
      })
      .filter(Boolean) as Array<{
      slot: number;
      item: ComputedRibbonGeometry;
      anchor: { cardX: number; cardY: number; isLeft: boolean; posClass: string };
      dialPt: { x: number; y: number };
    }>;
  }, [ribbonItems, CX, CY, R_WEDGE_OUTER, VB_W, VB_H]);

  const selectedItem = useMemo(
    () => ribbonItems.find((w) => w.event.id === selectedEventId) ?? null,
    [ribbonItems, selectedEventId]
  );

  const tracers: TracerConnectionSpec[] = useMemo(() => {
    if (viewMode === "quadrants") {
      return quadrantAssignments.map(({ slot, item, anchor, dialPt }) => ({
        id: `q-${slot}`,
        dialPoint: dialPt,
        midAngleRad: item.wedge.midAngleRad,
        cardAnchor: {
          x: anchor.cardX,
          y: anchor.cardY,
          isLeft: anchor.isLeft,
        },
        color: item.timelapseColor || item.event.accentColor,
        isHighlighted: activeId === item.event.id,
        dimmed: Boolean(activeId && activeId !== item.event.id),
      }));
    }

    if (!selectedItem) return [];
    const placeLeft = selectedItem.cosM < 0 ? false : true;
    const cardX = !placeLeft ? VB_W - 248 : 248;
    const cardY = Math.max(
      175,
      Math.min(VB_H - 185, selectedItem.wedge.outerMidPoint.y)
    );
    return [
      {
        id: `sel-${selectedItem.event.id}`,
        dialPoint: selectedItem.wedge.outerMidPoint,
        midAngleRad: selectedItem.wedge.midAngleRad,
        cardAnchor: { x: cardX, y: cardY, isLeft: placeLeft },
        color: selectedItem.timelapseColor,
        accentColor: selectedItem.event.accentColor,
        isHighlighted: true,
      },
    ];
  }, [viewMode, quadrantAssignments, selectedItem, activeId, VB_W, VB_H]);

  return (
    <div className="relative w-full flex items-center justify-center select-none">
      <SolarDialCanvas
        vbWidth={VB_W}
        vbHeight={VB_H}
        cx={CX}
        cy={CY}
        rSky={R_SKY}
        rTimelapseInner={R_TIMELAPSE_INNER}
        rTimelapseOuter={R_TIMELAPSE_OUTER}
        rWedgeInner={R_WEDGE_INNER}
        rOrbitalTracks={R_ORBITAL_TRACKS}
        scaleFactor={scaleFactor}
        wedgeClips={ribbonItems.map((r) => ({
          id: r.event.id,
          path: r.wedge.path,
        }))}
        isDraggingTime={isDraggingTime}
        onSetDraggingTime={setIsDraggingTime}
        onScrubMinutes={onScrubMinutes}
      >
        {radarOverlaySvg}

        <SolarDialTicks
          cx={CX}
          cy={CY}
          rSky={R_SKY}
          rTimelapseInner={R_TIMELAPSE_INNER}
          rTimelapseOuter={R_TIMELAPSE_OUTER}
          scaleFactor={scaleFactor}
        />

        {ribbonItems.map((item) => {
          const matchesTelemetry =
            !highlightedTelemetry ||
            item.event.telemetrySource === highlightedTelemetry;
          return (
            <RadialEventRibbon
              key={item.event.id}
              item={item}
              cx={CX}
              cy={CY}
              rWedgeOuter={R_WEDGE_OUTER}
              scaleFactor={scaleFactor}
              isSelected={selectedEventId === item.event.id}
              isHovered={hoveredEventId === item.event.id}
              hasAnyActive={Boolean(activeId)}
              matchesTelemetry={matchesTelemetry}
              showExternalLabel={viewMode === "solar"}
              onHoverChange={setHoveredEventId}
              onSelect={(id) =>
                onSelectEvent(selectedEventId === id ? null : id)
              }
            />
          );
        })}

        <RealtimeSolarBeacon
          cx={CX}
          cy={CY}
          rSolarArc={R_SOLAR_ARC}
          rTimelapseOuter={R_TIMELAPSE_OUTER}
          currentMinutes={currentMinutes}
          scaleFactor={scaleFactor}
          onStartScrub={() => setIsDraggingTime(true)}
        />

        <DynamicTracerCanvas tracers={tracers} />
      </SolarDialCanvas>

      {!isLiveTime && (
        <button
          onClick={onResetLive}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg transition-all"
        >
          <Radio size={12} className="animate-pulse text-amber-400" />
          Time-Lapse Scrub: {minutesTo12Hour(currentMinutes)} · Snap to Live
        </button>
      )}

      {viewMode === "solar" && selectedItem && (
        <TetheredEventCard
          event={selectedItem.event}
          startMin={selectedItem.startMin}
          endMin={selectedItem.endMin}
          durMin={selectedItem.durMin}
          timelapseColor={selectedItem.timelapseColor}
          mode="inspector"
          positionClassName={selectedItem.cosM >= 0 ? "left-2" : "right-2"}
          topPercent={Math.max(
            8,
            Math.min(
              54,
              ((Math.max(
                175,
                Math.min(VB_H - 185, selectedItem.wedge.outerMidPoint.y)
              ) -
                120) /
                VB_H) *
                100
            )
          )}
          onToggleChecklist={onToggleChecklist}
          onAddChecklist={onAddChecklist}
          onEdit={onEditEvent}
          onDelete={onDeleteEvent}
          onClose={() => onSelectEvent(null)}
        />
      )}

      {viewMode === "quadrants" &&
        quadrantAssignments.map(({ slot, item, anchor }) => (
          <TetheredEventCard
            key={`quad-${slot}`}
            event={item.event}
            startMin={item.startMin}
            endMin={item.endMin}
            durMin={item.durMin}
            timelapseColor={item.timelapseColor}
            mode="quadrant"
            quadrantSlot={slot}
            positionClassName={anchor.posClass}
            isHighlighted={activeId === item.event.id}
            onHoverChange={setHoveredEventId}
            onToggleChecklist={onToggleChecklist}
            onEdit={onEditEvent}
          />
        ))}
    </div>
  );
}
