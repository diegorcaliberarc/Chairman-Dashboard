"use client";

import React from "react";
import {
  minutesToAngleRad,
  polarToCartesian,
  timeToCartesian,
} from "@/lib/circadianMath";

export interface SolarDialTicksProps {
  cx: number;
  cy: number;
  rSky: number;
  rTimelapseInner: number;
  rTimelapseOuter: number;
  scaleFactor?: number;
  showCardinalLabels?: boolean;
}

export function SolarDialTicks({
  cx,
  cy,
  rSky,
  rTimelapseInner,
  rTimelapseOuter,
  scaleFactor = 1,
  showCardinalLabels = true,
}: SolarDialTicksProps) {
  const cardinalAnchors = [
    { mins: 720, label: "12:00 PM", dx: 0, dy: 24 * scaleFactor },
    { mins: 1080, label: "6:00 PM", dx: -36 * scaleFactor, dy: 4 },
    { mins: 0, label: "12:00 AM", dx: 0, dy: -16 * scaleFactor },
    { mins: 360, label: "6:00 AM", dx: 36 * scaleFactor, dy: 4 },
  ];

  return (
    <g className="pointer-events-none">
      {/* 48 Precision 30-Minute Etched Rim Ticks */}
      <g>
        {Array.from({ length: 48 }, (_, idx) => {
          const mins = idx * 30;
          const isCardinal = mins % 360 === 0;
          const isHour = mins % 60 === 0;
          const rad = minutesToAngleRad(mins);
          const r1 = isCardinal
            ? rSky - 12 * scaleFactor
            : isHour
            ? rTimelapseInner + 2 * scaleFactor
            : rTimelapseInner + 5 * scaleFactor;
          const r2 = isCardinal
            ? rTimelapseOuter + 3 * scaleFactor
            : rTimelapseOuter - 1.5 * scaleFactor;
          const p1 = polarToCartesian(cx, cy, r1, rad);
          const p2 = polarToCartesian(cx, cy, r2, rad);

          return (
            <line
              key={`tick-${idx}`}
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

      {/* Crisp Contrast-Backed Cardinal Labels */}
      {showCardinalLabels && (
        <g style={{ fontFamily: "Inter, sans-serif" }}>
          {cardinalAnchors.map((c) => {
            const pt = timeToCartesian(cx, cy, rSky, c.mins);
            return (
              <text
                key={c.label}
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
            );
          })}
        </g>
      )}
    </g>
  );
}
