"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  TacticalWaypoint,
  RouteLeg,
  WeatherRadarLayer,
} from "@/lib/temporalTypes";
import {
  Play,
  Pause,
  Compass,
  Layers,
  CloudRain,
  Sun,
  Shield,
  MapPin,
  Car,
  Clock,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
} from "lucide-react";

interface GeospatialTacticalMapProps {
  waypoints: TacticalWaypoint[];
  routeLegs: RouteLeg[];
  scrubbedMinutes: number; // 0..1439
  onScrubMinutes: (mins: number) => void;
  isLiveTime: boolean;
  onResetLive: () => void;
}

export function GeospatialTacticalMap({
  waypoints,
  routeLegs,
  scrubbedMinutes,
  onScrubMinutes,
  isLiveTime,
  onResetLive,
}: GeospatialTacticalMapProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [showHomeCluster, setShowHomeCluster] = useState(true);
  const [cameraView, setCameraView] = useState<"chase" | "tactical" | "overview">("tactical");
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>("wp-start-work");

  // Master timeline animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onScrubMinutes((scrubbedMinutes + 2) % 1440);
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying, scrubbedMinutes, onScrubMinutes]);

  // Map projection coordinates to 2.5D Canvas space (El Paso bounds)
  // El Paso approximate bounds: lat 31.74 to 31.84, lng -106.53 to -106.46
  const LAT_MIN = 31.745;
  const LAT_MAX = 31.835;
  const LNG_MIN = -106.525;
  const LNG_MAX = -106.465;

  const projectToCanvas = (lat: number, lng: number, elev: number = 0) => {
    // 900x560 canvas space with slight 2.5D perspective tilt
    const normX = (lng - LNG_MIN) / (LNG_MAX - LNG_MIN);
    const normY = 1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);

    // Apply isometric/perspective distortion:
    const x = 70 + normX * 760;
    const y = 60 + normY * 420 - (elev - 1100) * 0.08;
    return { x, y };
  };

  // Interpolate Current User Position "YOU ARE HERE" Beacon
  const currentBeacon = useMemo(() => {
    // Find matching leg or closest waypoint
    const activeLeg = routeLegs.find(
      (leg) => scrubbedMinutes >= leg.startMinute && scrubbedMinutes <= leg.endMinute
    );

    if (activeLeg && activeLeg.pathCoordinates.length > 1) {
      const progress =
        (scrubbedMinutes - activeLeg.startMinute) /
        Math.max(1, activeLeg.endMinute - activeLeg.startMinute);
      const indexFloat = progress * (activeLeg.pathCoordinates.length - 1);
      const idx = Math.floor(indexFloat);
      const frac = indexFloat - idx;

      const p1 = activeLeg.pathCoordinates[idx];
      const p2 = activeLeg.pathCoordinates[Math.min(idx + 1, activeLeg.pathCoordinates.length - 1)];

      const lng = p1[0] + (p2[0] - p1[0]) * frac;
      const lat = p1[1] + (p2[1] - p1[1]) * frac;
      const pt = projectToCanvas(lat, lng, 1160);

      return {
        lat,
        lng,
        x: pt.x,
        y: pt.y,
        isMoving: true,
        mode: activeLeg.mode,
        label: "TRANSIT IN PROGRESS",
        color: "#FF9900",
      };
    }

    // Otherwise stationary at closest waypoint
    const closest = waypoints.reduce((prev, curr) => {
      return Math.abs(curr.minuteOfDay - scrubbedMinutes) <
        Math.abs(prev.minuteOfDay - scrubbedMinutes)
        ? curr
        : prev;
    }, waypoints[0]);

    const pt = projectToCanvas(closest.lat, closest.lng, closest.elevation);
    return {
      lat: closest.lat,
      lng: closest.lng,
      x: pt.x,
      y: pt.y,
      isMoving: false,
      mode: "STATIONARY" as const,
      label: closest.title,
      color: "#FF9900",
    };
  }, [scrubbedMinutes, routeLegs, waypoints]);

  // Lighting azimuth & sky color based on minute
  const lighting = useMemo(() => {
    const hour = scrubbedMinutes / 60;
    if (hour >= 5.5 && hour < 8) {
      // Dawn (05:30 - 08:00)
      return {
        phase: "Dawn Twilight",
        skyGrad: "from-[#080d1a] via-[#161a2e] to-[#2a1b24]",
        accent: "#38bdf8",
        sunColor: "#fbbf24",
      };
    } else if (hour >= 8 && hour < 16.5) {
      // High Midday (08:00 - 16:30)
      return {
        phase: "Solar Midday",
        skyGrad: "from-[#070b16] via-[#0d1424] to-[#121c32]",
        accent: "#60a5fa",
        sunColor: "#fef08a",
      };
    } else if (hour >= 16.5 && hour < 19.5) {
      // Golden Hour / Sunset (16:30 - 19:30)
      return {
        phase: "Golden Hour & Sunset",
        skyGrad: "from-[#110e1a] via-[#241318] to-[#3a1d12]",
        accent: "#f97316",
        sunColor: "#f59e0b",
      };
    } else {
      // Starry Night (19:30 - 05:30)
      return {
        phase: "Tactical Night",
        skyGrad: "from-[#04060c] via-[#070a14] to-[#0a0f1e]",
        accent: "#818cf8",
        sunColor: "#6366f1",
      };
    }
  }, [scrubbedMinutes]);

  const formatScrubTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const selectedWp = waypoints.find((w) => w.id === selectedWaypointId) || waypoints[0];

  return (
    <div className="relative w-full rounded-3xl bg-[#090D16] border border-white/[0.08] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col">
      {/* Top HUD Status Bar */}
      <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0C101C]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/35 text-amber-300 font-mono text-xs font-bold">
            <Navigation size={13} className="animate-pulse" />
            <span>EL PASO 3D TACTICAL MESH</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lighting.accent }} />
            <span>{lighting.phase}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-amber-400 font-bold">{formatScrubTime(scrubbedMinutes)}</span>
          </div>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showRadar
                ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <CloudRain size={13} />
            Radar Tiles
          </button>

          <button
            onClick={() => setShowHomeCluster(!showHomeCluster)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showHomeCluster
                ? "bg-purple-500/20 border-purple-400/50 text-purple-200"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Shield size={13} />
            Home Cluster
          </button>

          <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[11px] font-semibold">
            {(["chase", "tactical", "overview"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCameraView(mode)}
                className={`px-2 py-0.5 rounded capitalize transition-all ${
                  cameraView === mode
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className={`relative w-full h-[540px] bg-gradient-to-b ${lighting.skyGrad} overflow-hidden select-none`}>
        <svg
          viewBox="0 0 900 540"
          className="w-full h-full"
          style={{
            transform:
              cameraView === "chase"
                ? "scale(1.15) translateY(-20px)"
                : cameraView === "overview"
                ? "scale(0.92)"
                : "none",
            transition: "transform 0.5s ease-out",
          }}
        >
          <defs>
            {/* Custom Charcoal/Navy Night Shader Gradient for Buildings & Topography */}
            <linearGradient id="terrainDarkShader" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B0F1C" />
              <stop offset="50%" stopColor="#11182B" />
              <stop offset="100%" stopColor="#0E1322" />
            </linearGradient>

            <linearGradient id="routeGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF9900" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFCC00" stopOpacity="1" />
            </linearGradient>

            <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="radarSweep" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="15" />
            </filter>
          </defs>

          {/* 3D Topographic Mountain Ridges (Franklin Mountains Backbone) */}
          <g opacity="0.38">
            <path
              d="M 50 490 Q 220 280 430 320 T 780 260 L 860 520 L 50 520 Z"
              fill="url(#terrainDarkShader)"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.2"
            />
            <path
              d="M 120 480 Q 310 240 520 290 T 840 210 L 880 520 L 120 520 Z"
              fill="#0A0E1A"
              stroke="rgba(56, 189, 248, 0.15)"
              strokeWidth="0.8"
            />
            {/* Elevation Contour Lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <path
                key={`contour-${i}`}
                d={`M 140 ${460 - i * 28} Q 360 ${340 - i * 24} 620 ${370 - i * 22} T 820 ${310 - i * 18}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            ))}
          </g>

          {/* Animated Weather Radar Clouds Overlay */}
          {showRadar && (
            <g opacity="0.22" filter="url(#radarSweep)">
              <ellipse cx="320" cy="220" rx="190" ry="110" fill="#38bdf8" />
              <ellipse cx="580" cy="310" rx="220" ry="130" fill="#10b981" />
              <ellipse cx="440" cy="270" rx="120" ry="70" fill="#f59e0b" />
            </g>
          )}

          {/* 3D Route Polylines */}
          <g>
            {routeLegs.map((leg) => {
              const pts = leg.pathCoordinates.map(([lng, lat]) => projectToCanvas(lat, lng, 1150));
              const d = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "");

              const isCompletedLeg = scrubbedMinutes >= leg.endMinute;
              const isActiveLeg = scrubbedMinutes >= leg.startMinute && scrubbedMinutes < leg.endMinute;

              const strokeColor = isActiveLeg ? "#FF9900" : isCompletedLeg ? "#0088FF" : "#99FF33";
              const strokeWidth = isActiveLeg ? 4.5 : 2.5;

              return (
                <g key={leg.id}>
                  {/* Outer Glow Path */}
                  <path
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth + 4}
                    strokeOpacity={isActiveLeg ? 0.45 : 0.15}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Solid Trajectory Core */}
                  <path
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isActiveLeg ? "6 4" : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>

          {/* Home-Base Radial Sub-Nodes (Water grass, Wake/Shower, Garage, Breakfast) */}
          {showHomeCluster && (
            <g>
              {(() => {
                const homeWp = waypoints.find((w) => w.isHomeBaseHub);
                if (!homeWp || !homeWp.homeRadialOffset) return null;
                const center = projectToCanvas(homeWp.lat, homeWp.lng, homeWp.elevation);

                return homeWp.homeRadialOffset.map((sub, i) => {
                  const x = center.x + sub.dx * 1.5;
                  const y = center.y + sub.dy * 1.5;

                  return (
                    <g key={`home-sub-${i}`} className="cursor-pointer group">
                      <line
                        x1={center.x}
                        y1={center.y}
                        x2={x}
                        y2={y}
                        stroke="rgba(157, 78, 221, 0.45)"
                        strokeWidth="1.2"
                        strokeDasharray="2 3"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="6.5"
                        fill="#151A2C"
                        stroke="#9D4EDD"
                        strokeWidth="1.5"
                        className="group-hover:fill-purple-600 transition-colors"
                      />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fill="#E2F1FF"
                        fontSize="8.5"
                        fontWeight="600"
                        className="pointer-events-none drop-shadow"
                      >
                        {sub.label}
                      </text>
                    </g>
                  );
                });
              })()}
            </g>
          )}

          {/* Floating Glassmorphic Waypoint Destination Pins */}
          <g>
            {waypoints.map((wp) => {
              const pt = projectToCanvas(wp.lat, wp.lng, wp.elevation);
              const isSelected = selectedWaypointId === wp.id;
              const isPast = scrubbedMinutes >= wp.minuteOfDay;
              const pinColor = isSelected ? "#FF9900" : isPast ? "#0088FF" : "#99FF33";

              return (
                <g
                  key={wp.id}
                  onClick={() => setSelectedWaypointId(wp.id)}
                  className="cursor-pointer group"
                  transform={`translate(${pt.x}, ${pt.y})`}
                >
                  {/* Vertical Pin Anchor Line */}
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="-26"
                    stroke={pinColor}
                    strokeWidth="1.5"
                    strokeDasharray={isSelected ? "2 2" : undefined}
                  />

                  {/* Ground Ripple */}
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="9"
                    ry="4.5"
                    fill={pinColor}
                    fillOpacity="0.2"
                    stroke={pinColor}
                    strokeWidth="1"
                  />

                  {/* Floating Circular Pin with Thumbnail Photo */}
                  <g transform="translate(0, -38)">
                    <circle
                      cx="0"
                      cy="0"
                      r="16"
                      fill="#0B0F1D"
                      stroke={pinColor}
                      strokeWidth={isSelected ? "3" : "1.8"}
                      filter={isSelected ? "url(#beaconGlow)" : undefined}
                    />

                    {/* Clip preview image inside pin */}
                    {wp.mediaUrl && (
                      <>
                        <clipPath id={`pin-clip-${wp.id}`}>
                          <circle cx="0" cy="0" r="14" />
                        </clipPath>
                        <image
                          href={wp.mediaUrl}
                          x="-14"
                          y="-14"
                          width="28"
                          height="28"
                          preserveAspectRatio="xMidYMid slice"
                          clipPath={`url(#pin-clip-${wp.id})`}
                        />
                      </>
                    )}

                    {/* Milestone Time Badge */}
                    <rect
                      x="-26"
                      y="18"
                      width="52"
                      height="15"
                      rx="7.5"
                      fill="rgba(10, 14, 26, 0.9)"
                      stroke={pinColor}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="29"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="700"
                    >
                      {wp.timeWindow}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Interpolated Real-Time Amber "YOU ARE HERE" Beacon */}
          <g transform={`translate(${currentBeacon.x}, ${currentBeacon.y})`} className="pointer-events-none">
            {/* Glowing Pulse Rings */}
            <circle cx="0" cy="0" r="28" fill="#FF9900" fillOpacity="0.2" className="animate-ping" />
            <circle cx="0" cy="0" r="14" fill="#FF9900" fillOpacity="0.35" filter="url(#beaconGlow)" />
            <circle cx="0" cy="0" r="7.5" fill="#FFFFFF" stroke="#FF9900" strokeWidth="3" />

            {/* Floating Glassmorphic Beacon Label */}
            <g transform="translate(0, -28)">
              <rect
                x="-48"
                y="-18"
                width="96"
                height="22"
                rx="11"
                fill="rgba(14, 17, 26, 0.95)"
                stroke="#FF9900"
                strokeWidth="1.5"
                filter="url(#beaconGlow)"
              />
              <text
                x="0"
                y="-4"
                textAnchor="middle"
                fill="#FFCC00"
                fontSize="9.5"
                fontWeight="900"
                letterSpacing="0.08em"
              >
                YOU ARE HERE
              </text>
            </g>
          </g>
        </svg>

        {/* Floating Waypoint Inspection Card */}
        {selectedWp && (
          <div className="absolute top-4 left-4 max-w-[280px] rounded-2xl bg-[#0D1220]/90 backdrop-blur-xl border border-white/10 p-3.5 shadow-2xl z-20">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                {selectedWp.timeWindow} · {selectedWp.category.replace("_", " ")}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mb-1">{selectedWp.title}</h4>
            <div className="space-y-1 mb-2">
              {selectedWp.subtasks.map((task, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10.5px] text-zinc-300">
                  <span className="text-amber-400 font-mono">▪</span>
                  <span>{task}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9.5px] font-mono text-zinc-400">
              <span>Elev: {selectedWp.elevation}m</span>
              <span className="text-emerald-400">{selectedWp.status.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Master 24-Hour Timeline Scrubber Dock (00:00 to 23:59) */}
      <div className="p-4 bg-[#0B0E18] border-t border-white/[0.08] flex flex-col gap-2.5 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center font-bold transition-all shadow-[0_0_15px_rgba(251,191,36,0.35)]"
              title={isPlaying ? "Pause Simulation" : "Play Timeline"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>

            <button
              onClick={onResetLive}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                isLiveTime
                  ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              ● LIVE CLOCK
            </button>

            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {formatScrubTime(scrubbedMinutes)}
            </span>
          </div>

          {/* Quick Scrub Anchors */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
            {[
              { label: "Dawn", mins: 360 },
              { label: "School", mins: 480 },
              { label: "HQ", mins: 600 },
              { label: "Dusk", mins: 1050 },
              { label: "Dinner", mins: 1110 },
            ].map((anchor) => (
              <button
                key={anchor.label}
                onClick={() => onScrubMinutes(anchor.mins)}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-amber-300 transition-colors"
              >
                {anchor.label}
              </button>
            ))}
          </div>
        </div>

        {/* Range Slider Track with Gradient Tint */}
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="1439"
            step="1"
            value={scrubbedMinutes}
            onChange={(e) => onScrubMinutes(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-900 via-amber-600 to-indigo-950 accent-amber-400"
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
          <span>00:00 MIDNIGHT</span>
          <span>06:00 DAWN</span>
          <span>12:00 NOON</span>
          <span>18:00 DUSK</span>
          <span>23:59 RECOVERY</span>
        </div>
      </div>
    </div>
  );
}

