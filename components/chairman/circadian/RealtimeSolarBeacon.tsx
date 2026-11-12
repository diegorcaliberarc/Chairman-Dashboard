"use client";

import React, { useMemo } from "react";
import {
  buildTimelapseProgressArcs,
  getCircadianPhase,
  getTimelapseColorAtMinutes,
  minutesTo12Hour,
  minutesToAngleRad,
  polarToCartesian,
  timeToCartesian,
} from "@/lib/circadianMath";

export interface RealtimeSolarBeaconProps {
  cx: number;
  cy: number;
  rSolarArc: number;
  rTimelapseOuter: number;
  currentMinutes: number;
  scaleFactor?: number;
  onStartScrub?: (e: React.PointerEvent<SVGCircleElement>) => void;
}

export function RealtimeSolarBeacon({
  cx,
  cy,
  rSolarArc,
  rTimelapseOuter,
  currentMinutes,
  scaleFactor = 1,
  onStartScrub,
}: RealtimeSolarBeaconProps) {
  const solarProgressArcs = useMemo(
    () => buildTimelapseProgressArcs(cx, cy, rSolarArc, currentMinutes, 96),
    [cx, cy, rSolarArc, currentMinutes]
  );

  const nowRad = minutesToAngleRad(currentMinutes);
  const solarInnerPt = polarToCartesian(cx, cy, rSolarArc, nowRad);
  const solarMidnightPt = timeToCartesian(cx, cy, rSolarArc, 0);
  const solarRimPt = polarToCartesian(cx, cy, rTimelapseOuter, nowRad);
  const solarTagPt = polarToCartesian(
    cx,
    cy,
    rSolarArc + 26 * scaleFactor,
    nowRad
  );
  const currentPhase = getCircadianPhase(currentMinutes);
  const liveSolarColor = getTimelapseColorAtMinutes(currentMinutes);

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={rSolarArc}
        fill="rgba(6, 9, 19, 0.34)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      {/* Radial solar vector from center through solar node to time-lapse rim */}
      <line
        x1={cx}
        y1={cy}
        x2={solarRimPt.x}
        y2={solarRimPt.y}
        stroke={liveSolarColor}
        strokeOpacity="0.5"
        strokeWidth="1.2"
        strokeDasharray="3 4"
        className="pointer-events-none"
      />

      {/* Multi-stop Time-Lapse Solar Progress Trail */}
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

      {/* Rim Time Indicator Pip */}
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
          onStartScrub?.(e);
        }}
      />

      {/* Pulsing Solar Sphere */}
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
          onStartScrub?.(e);
        }}
      />

      {/* Anchored Live Timestamp Micro-Pill */}
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
        <circle cx={cx} cy={cy} r={3} fill="#ffffff" opacity="0.85" />
        <text
          x={cx}
          y={cy + 52 * scaleFactor}
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
  );
}
