"use client";

import React from "react";
import { CircadianEventDTO, DOMAIN_CONFIG } from "@/lib/circadianTypes";
import { BoundingBox, PolarPoint, minutesTo12Hour } from "@/lib/circadianMath";

export interface ComputedRibbonGeometry {
  event: CircadianEventDTO;
  startMin: number;
  endMin: number;
  durMin: number;
  midMin: number;
  timelapseColor: string;
  wedge: {
    path: string;
    bbox: BoundingBox;
    midPoint: PolarPoint;
    outerMidPoint: PolarPoint;
    midAngleDeg: number;
    midAngleRad: number;
  };
  trackRadius: number;
  ribbonPath: string;
  labelX: number;
  labelY: number;
  textAnchor: "start" | "end" | "middle";
  cosM: number;
}

export interface RadialEventRibbonProps {
  item: ComputedRibbonGeometry;
  cx: number;
  cy: number;
  rWedgeOuter: number;
  scaleFactor?: number;
  isSelected: boolean;
  isHovered: boolean;
  hasAnyActive: boolean;
  matchesTelemetry: boolean;
  showExternalLabel?: boolean;
  onHoverChange: (eventId: string | null) => void;
  onSelect: (eventId: string) => void;
}

export function RadialEventRibbon({
  item,
  cx,
  cy,
  rWedgeOuter,
  scaleFactor = 1,
  isSelected,
  isHovered,
  hasAnyActive,
  matchesTelemetry,
  showExternalLabel = true,
  onHoverChange,
  onSelect,
}: RadialEventRibbonProps) {
  const {
    event,
    wedge,
    ribbonPath,
    startMin,
    endMin,
    timelapseColor,
    labelX,
    labelY,
    textAnchor,
  } = item;

  const isHighlighted = isSelected || isHovered;
  const domainColor = DOMAIN_CONFIG[event.domain]?.color ?? timelapseColor;
  const strokeColor = isHighlighted
    ? event.accentColor || timelapseColor
    : timelapseColor;

  return (
    <g
      className="cursor-pointer group"
      onMouseEnter={() => onHoverChange(event.id)}
      onMouseLeave={() => onHoverChange(null)}
      onClick={() => onSelect(event.id)}
    >
      {/* Inner Concentric Orbital Track Arc */}
      <path
        d={ribbonPath}
        fill="none"
        stroke={domainColor}
        strokeWidth={(isHighlighted ? 7.5 : 5) * scaleFactor}
        strokeLinecap="round"
        opacity={
          !matchesTelemetry
            ? 0.25
            : hasAnyActive && !isHighlighted
            ? 0.45
            : 0.94
        }
        filter={isHighlighted ? "url(#arcNeonGlow)" : undefined}
        className="transition-all duration-300"
      />

      {/* Outer Curved Annular Visual Media Wedge */}
      <g
        clipPath={`url(#wedge-clip-${event.id})`}
        opacity={
          !matchesTelemetry
            ? 0.28
            : hasAnyActive && !isHighlighted
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
            : hasAnyActive && !isHighlighted
            ? 0.72
            : 0.98
        }
      />

      {/* Non-Colliding External Wedge Callout Label */}
      {showExternalLabel && (
        <g
          opacity={!matchesTelemetry ? 0.35 : 1}
          className="transition-opacity duration-200"
        >
          <line
            x1={wedge.outerMidPoint.x}
            y1={wedge.outerMidPoint.y}
            x2={cx + (rWedgeOuter + 12) * Math.cos(wedge.midAngleRad)}
            y2={cy + (rWedgeOuter + 12) * Math.sin(wedge.midAngleRad)}
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
}
