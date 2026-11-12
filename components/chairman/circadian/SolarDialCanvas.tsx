"use client";

import React, { useMemo, useRef } from "react";
import {
  buildTimelapseWheelSegments,
  cartesianToMinutes,
} from "@/lib/circadianMath";

export interface WedgeClipSpec {
  id: string;
  path: string;
}

export interface SolarDialCanvasProps {
  vbWidth?: number;
  vbHeight?: number;
  cx: number;
  cy: number;
  rSky: number;
  rTimelapseInner: number;
  rTimelapseOuter: number;
  rWedgeInner: number;
  rOrbitalTracks: number[];
  scaleFactor?: number;
  wedgeClips?: WedgeClipSpec[];
  isDraggingTime: boolean;
  onSetDraggingTime: (dragging: boolean) => void;
  onScrubMinutes: (mins: number) => void;
  children?: React.ReactNode;
}

export function SolarDialCanvas({
  vbWidth = 1000,
  vbHeight = 760,
  cx,
  cy,
  rSky,
  rTimelapseInner,
  rTimelapseOuter,
  rWedgeInner,
  rOrbitalTracks,
  scaleFactor = 1,
  wedgeClips = [],
  isDraggingTime,
  onSetDraggingTime,
  onScrubMinutes,
  children,
}: SolarDialCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const timelapseWheelSegments = useMemo(
    () =>
      buildTimelapseWheelSegments(cx, cy, rTimelapseInner, rTimelapseOuter, 144),
    [cx, cy, rTimelapseInner, rTimelapseOuter]
  );

  const outerTimelapseTrackSegments = useMemo(
    () =>
      buildTimelapseWheelSegments(
        cx,
        cy,
        rWedgeInner,
        rWedgeInner + 4 * scaleFactor,
        96
      ),
    [cx, cy, rWedgeInner, scaleFactor]
  );

  const updateScrubFromPointer = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (ctm) {
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgPt = pt.matrixTransform(ctm.inverse());
      onScrubMinutes(Math.round(cartesianToMinutes(cx, cy, svgPt.x, svgPt.y)));
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * vbWidth;
    const y = ((clientY - rect.top) / rect.height) * vbHeight;
    onScrubMinutes(Math.round(cartesianToMinutes(cx, cy, x, y)));
  };

  const skyImgBleed = 1.18;
  const skyImgSize = rSky * 2 * skyImgBleed;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="relative z-10 w-full h-auto max-h-[calc(100vh-132px)] block mx-auto overflow-visible"
      onPointerMove={(e) => {
        if (isDraggingTime) {
          updateScrubFromPointer(e.clientX, e.clientY);
        }
      }}
      onPointerUp={() => onSetDraggingTime(false)}
      onPointerLeave={() => onSetDraggingTime(false)}
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

        <filter id="timelapseHaloBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>

        <radialGradient id="skyDepthVignette" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#050814" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#050814" stopOpacity="0.06" />
          <stop offset="86%" stopColor="#050814" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#04060e" stopOpacity="0.62" />
        </radialGradient>

        <radialGradient id="wedgeVignette" cx="50%" cy="50%" r="55%">
          <stop offset="58%" stopColor="#05070d" stopOpacity="0.34" />
          <stop offset="82%" stopColor="#05070d" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#05070d" stopOpacity="0.45" />
        </radialGradient>

        <clipPath id="skySphereCircleClip">
          <circle cx={cx} cy={cy} r={rSky} />
        </clipPath>

        {wedgeClips.map((w) => (
          <clipPath key={`clip-${w.id}`} id={`wedge-clip-${w.id}`}>
            <path d={w.path} />
          </clipPath>
        ))}
      </defs>

      {/* Atmospheric 24-Hour Halo */}
      <g opacity="0.26" filter="url(#timelapseHaloBlur)" className="pointer-events-none">
        {timelapseWheelSegments
          .filter((_, i) => i % 2 === 0)
          .map((seg, idx) => (
            <path key={`halo-${idx}`} d={seg.d} fill={seg.color} />
          ))}
      </g>

      {/* Pure 1:1 Circle Clipped Sky & Milky Way Time-Lapse Sphere */}
      <g
        clipPath="url(#skySphereCircleClip)"
        className="cursor-crosshair"
        onPointerDown={(e) => {
          onSetDraggingTime(true);
          updateScrubFromPointer(e.clientX, e.clientY);
        }}
      >
        <circle cx={cx} cy={cy} r={rSky} fill="#070b18" />
        <image
          href="/circadian/sky-timelapse.jpg"
          x={cx - skyImgSize / 2}
          y={cy - skyImgSize / 2}
          width={skyImgSize}
          height={skyImgSize}
          preserveAspectRatio="xMidYMid slice"
        />
        <circle cx={cx} cy={cy} r={rSky} fill="url(#skyDepthVignette)" />
      </g>

      {/* 360° 24-Hour Day-to-Night Time-Lapse Spectrum Ring */}
      <g
        className="cursor-crosshair"
        onPointerDown={(e) => {
          onSetDraggingTime(true);
          updateScrubFromPointer(e.clientX, e.clientY);
        }}
      >
        {timelapseWheelSegments.map((seg, idx) => (
          <path key={`tl-${idx}`} d={seg.d} fill={seg.color} opacity="0.92" />
        ))}
        <circle
          cx={cx}
          cy={cy}
          r={rTimelapseInner}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cy}
          r={rTimelapseOuter}
          fill="none"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth="1.2"
        />
      </g>

      {/* Outer Ambient Time-Lapse Continuum Guide Track */}
      <g opacity="0.5" className="pointer-events-none">
        {outerTimelapseTrackSegments.map((seg, idx) => (
          <path key={`otl-${idx}`} d={seg.d} fill={seg.color} />
        ))}
      </g>

      {/* Concentric Inner Orbital Track Guides */}
      <g className="pointer-events-none">
        {rOrbitalTracks.map((r, idx) => (
          <circle
            key={`orbit-track-${idx}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={4 * scaleFactor}
          />
        ))}
      </g>

      {children}
    </svg>
  );
}
