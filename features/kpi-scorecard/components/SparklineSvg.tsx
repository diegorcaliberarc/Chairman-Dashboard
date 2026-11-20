"use client";

import React from "react";
import { RagBucket } from "../types";

interface SparklineSvgProps {
  points: number[];
  rag: RagBucket;
  width?: number;
  height?: number;
}

export function SparklineSvg({
  points,
  rag,
  width = 96,
  height = 26,
}: SparklineSvgProps) {
  const safePts = points.length >= 2 ? points : [0, 0, 0, 0, 0, 0];
  const minV = Math.min(...safePts) - 4;
  const maxV = Math.max(...safePts) + 4;
  const span = Math.max(1, maxV - minV);

  const strokeColor =
    rag === "GREEN" ? "#10b981" : rag === "YELLOW" ? "#eab308" : "#ef4444";

  const coords = safePts.map((v, idx) => {
    const x = 4 + (idx / (safePts.length - 1)) * (width - 8);
    const y = height - 4 - ((v - minV) / span) * (height - 8);
    return { x, y };
  });

  const polyline = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
      />
      {coords.map((c, idx) => (
        <circle
          key={idx}
          cx={c.x}
          cy={c.y}
          r={idx === coords.length - 1 ? 2.8 : 1.4}
          fill={strokeColor}
          fillOpacity={idx === coords.length - 1 ? 1 : 0.55}
        />
      ))}
      <circle cx={last.x} cy={last.y} r="5" fill={strokeColor} fillOpacity="0.2" />
    </svg>
  );
}
