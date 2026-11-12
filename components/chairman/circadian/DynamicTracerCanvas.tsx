"use client";

import React from "react";
import { describeCubicTracer, PolarPoint } from "@/lib/circadianMath";

export interface TracerConnectionSpec {
  id: string;
  dialPoint: PolarPoint;
  midAngleRad: number;
  cardAnchor: { x: number; y: number; isLeft: boolean };
  color: string;
  accentColor?: string;
  isHighlighted?: boolean;
  dimmed?: boolean;
}

export interface DynamicTracerCanvasProps {
  tracers: TracerConnectionSpec[];
  normalOutreach?: number;
}

export function DynamicTracerCanvas({
  tracers,
  normalOutreach = 56,
}: DynamicTracerCanvasProps) {
  if (tracers.length === 0) return null;

  return (
    <g className="pointer-events-none">
      {tracers.map((t) => {
        const path = describeCubicTracer(
          t.dialPoint.x,
          t.dialPoint.y,
          t.midAngleRad,
          t.cardAnchor.x,
          t.cardAnchor.y,
          t.cardAnchor.isLeft,
          normalOutreach
        );
        const primaryStroke = t.accentColor || t.color;

        return (
          <g key={`tracer-${t.id}`}>
            {/* Soft Ambient Neon Bloom */}
            <path
              d={path}
              fill="none"
              stroke={t.color}
              strokeWidth={t.isHighlighted ? 5 : 3}
              opacity={t.isHighlighted ? 0.36 : 0.18}
              filter="url(#arcNeonGlow)"
            />
            {/* Crisp Animated Signal Filament */}
            <path
              d={path}
              fill="none"
              stroke={primaryStroke}
              strokeWidth={t.isHighlighted ? 2.4 : 1.75}
              opacity={t.dimmed ? 0.4 : 0.95}
              className="circadian-tracer-animated"
            />
            {/* Dial Rim Origin Node */}
            <circle
              cx={t.dialPoint.x}
              cy={t.dialPoint.y}
              r={t.isHighlighted ? 5 : 4}
              fill="#ffffff"
              stroke={t.color}
              strokeWidth="2"
              filter="url(#arcNeonGlow)"
            />
            {/* Card Anchor Terminal Node */}
            <circle
              cx={t.cardAnchor.x}
              cy={t.cardAnchor.y}
              r={3.8}
              fill={primaryStroke}
            />
          </g>
        );
      })}
    </g>
  );
}
