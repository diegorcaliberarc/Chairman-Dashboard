"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Sunrise,
  Compass,
  Mountain,
  ChevronRight,
  Plus,
  Lock,
  Unlock,
  CalendarRange,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  CloudSun,
  Layers,
  Target,
  X,
  CheckCircle2,
  Gauge,
  Navigation,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";

type HorizonTier = "1_year" | "10_year" | "30_year" | "80_year";
type WaypointTerrain =
  | "summit_peak"
  | "valley_station"
  | "river_crossing"
  | "coastal_harbor"
  | "citadel";

interface HorizonPillar {
  id: string;
  title: string;
  description: string | null;
  ray_angle_degrees: number;
  accent_color: string;
  sort_order: number;
}

interface HorizonSliver {
  id: string;
  pillar_id: string;
  horizon_tier: HorizonTier;
  title: string;
  strategic_intent: string | null;
  target_year: number;
  resource_weight_pct: number;
  is_milestone_locked: boolean;
}

interface JourneyWaypoint {
  id: string;
  title: string;
  terrain_type: WaypointTerrain;
  coord_x: number;
  coord_y: number;
  coord_z: number;
  linked_horizon_sliver_id: string | null;
  target_date: string | null;
  completion_percentage: number;
  accent_glow_color: string;
  hud_description: string | null;
}

interface JourneyPath {
  id: string;
  from_waypoint_id: string;
  to_waypoint_id: string;
  path_curve_type: string;
  is_active_pathway: boolean;
}

interface CircadianBlock {
  id: string;
  title: string;
  domain: string;
  start_time: string;
  end_time: string;
  accent_color: string;
}

type DiurnalPhase = "dawn" | "solar_noon" | "sunset" | "midnight";

function detectLocalDiurnalPhase(hour: number): DiurnalPhase {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "solar_noon";
  if (hour >= 17 && hour < 21) return "sunset";
  return "midnight";
}

const DIURNAL_PALETTES: Record<
  DiurnalPhase,
  {
    label: string;
    skyTop: string;
    skyMid: string;
    skyHorizon: string;
    celestialColor: string;
    riverHighlight: string;
    ridgeFar: string;
    ridgeMid: string;
    ridgeNear: string;
  }
> = {
  dawn: {
    label: "Dawn (05:00–09:00)",
    skyTop: "#0b1026",
    skyMid: "#2c1d3e",
    skyHorizon: "#d97736",
    celestialColor: "#fbbf24",
    riverHighlight: "rgba(251, 191, 36, 0.52)",
    ridgeFar: "#1e1b38",
    ridgeMid: "#14182c",
    ridgeNear: "#0b0f1c",
  },
  solar_noon: {
    label: "Solar Noon (09:00–17:00)",
    skyTop: "#08162b",
    skyMid: "#133155",
    skyHorizon: "#38bdf8",
    celestialColor: "#fef08a",
    riverHighlight: "rgba(56, 189, 248, 0.55)",
    ridgeFar: "#162a45",
    ridgeMid: "#0f1e33",
    ridgeNear: "#091220",
  },
  sunset: {
    label: "Sunset (17:00–21:00)",
    skyTop: "#090b1a",
    skyMid: "#3b1736",
    skyHorizon: "#e11d48",
    celestialColor: "#f59e0b",
    riverHighlight: "rgba(245, 158, 11, 0.58)",
    ridgeFar: "#24132c",
    ridgeMid: "#160f21",
    ridgeNear: "#0a0a14",
  },
  midnight: {
    label: "Midnight (21:00–05:00)",
    skyTop: "#04060d",
    skyMid: "#0b1329",
    skyHorizon: "#1e1b4b",
    celestialColor: "#e2e8f0",
    riverHighlight: "rgba(167, 139, 250, 0.48)",
    ridgeFar: "#0f172a",
    ridgeMid: "#090f1d",
    ridgeNear: "#050811",
  },
};

const TIER_META: Record<
  HorizonTier,
  { label: string; radiusRatio: number; horizonYears: string }
> = {
  "1_year": { label: "1-Year Arc", radiusRatio: 0.28, horizonYears: "2027" },
  "10_year": { label: "10-Year Decadal", radiusRatio: 0.51, horizonYears: "2036" },
  "30_year": { label: "30-Year Generational", radiusRatio: 0.74, horizonYears: "2056" },
  "80_year": { label: "80-Year Life Horizon", radiusRatio: 0.94, horizonYears: "2106" },
};

const WAYFINDING_CRUMBS = [
  {
    level: 0,
    label: "80-Year Life Horizon",
    zoom: 0.3,
    rangeText: "0.1x–0.5x",
  },
  {
    level: 1,
    label: "2026-2036 Decadal",
    zoom: 1.0,
    rangeText: "0.5x–1.5x",
  },
  {
    level: 2,
    label: "2027 Tactical Arc",
    zoom: 2.5,
    rangeText: "1.5x–4.0x",
  },
  {
    level: 3,
    label: "Today: Circadian Solar Ring",
    zoom: 4.5,
    rangeText: "4.0x+",
  },
];

function catmullRomPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

export default function MacroHorizonPage() {
  const router = useRouter();

  const [activeEngine, setActiveEngine] = useState<"rising_sun" | "spatial_journey">(
    "rising_sun"
  );
  const [pillars, setPillars] = useState<HorizonPillar[]>([]);
  const [slivers, setSlivers] = useState<HorizonSliver[]>([]);
  const [waypoints, setWaypoints] = useState<JourneyWaypoint[]>([]);
  const [paths, setPaths] = useState<JourneyPath[]>([]);
  const [circadianEvents, setCircadianEvents] = useState<CircadianBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // Continuous Powers of Ten Semantic Zoom (0.2x to 5.0x)
  const [zoom, setZoom] = useState<number>(0.32);
  const targetZoomRef = useRef<number>(0.32);
  const [selectedSliver, setSelectedSliver] = useState<HorizonSliver | null>(null);

  // Milestone Creator Modal
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [msPillarId, setMsPillarId] = useState("");
  const [msTier, setMsTier] = useState<HorizonTier>("1_year");
  const [msTitle, setMsTitle] = useState("");
  const [msIntent, setMsIntent] = useState("");
  const [msYear, setMsYear] = useState(2027);
  const [msWeight, setMsWeight] = useState(25);

  // Engine 2: Spatial Journey Topographic Canvas state
  const journeyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const journeyContainerRef = useRef<HTMLDivElement | null>(null);
  const screenWaypointsRef = useRef<
    Array<{ wp: JourneyWaypoint; sx: number; sy: number }>
  >([]);
  const [selectedWaypoint, setSelectedWaypoint] =
    useState<JourneyWaypoint | null>(null);
  const [hoveredWaypoint, setHoveredWaypoint] = useState<{
    wp: JourneyWaypoint;
    sx: number;
    sy: number;
  } | null>(null);
  const [diurnalOverride, setDiurnalOverride] = useState<"auto" | DiurnalPhase>(
    "auto"
  );
  const [journeyFps, setJourneyFps] = useState<number>(60);

  // Outpost Creator Modal (Engine 2)
  const [showOutpostModal, setShowOutpostModal] = useState(false);
  const [outpostTitle, setOutpostTitle] = useState("");
  const [outpostTerrain, setOutpostTerrain] =
    useState<WaypointTerrain>("citadel");
  const [outpostDesc, setOutpostDesc] = useState("");
  const [outpostCompletion, setOutpostCompletion] = useState(35);

  const loadHorizon = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/horizon", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.pillars)) {
        setPillars(data.pillars);
        setSlivers(Array.isArray(data.slivers) ? data.slivers : []);
        setWaypoints(Array.isArray(data.waypoints) ? data.waypoints : []);
        setPaths(Array.isArray(data.paths) ? data.paths : []);
        setCircadianEvents(
          Array.isArray(data.circadianEvents) ? data.circadianEvents : []
        );
        if (data.pillars[0] && !msPillarId) {
          setMsPillarId(data.pillars[0].id);
        }
        if (data.slivers[0] && !selectedSliver) {
          setSelectedSliver(data.slivers[0]);
        }
        if (data.waypoints[0] && !selectedWaypoint) {
          setSelectedWaypoint(data.waypoints[0]);
        }
      }
    } catch (err) {
      console.error("Failed loading horizon:", err);
    } finally {
      setLoading(false);
    }
  }, [msPillarId, selectedSliver, selectedWaypoint]);

  useEffect(() => {
    loadHorizon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Smooth Zoom Animation Loop for Breadcrumb & Wheel Transitions
  useEffect(() => {
    let raf = 0;
    const step = () => {
      setZoom((prev) => {
        const diff = targetZoomRef.current - prev;
        if (Math.abs(diff) < 0.004) return targetZoomRef.current;
        return Number((prev + diff * 0.16).toFixed(3));
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const jumpToZoom = (target: number) => {
    targetZoomRef.current = Math.min(5.0, Math.max(0.2, target));
  };

  const handleSemanticWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.18 : 0.18;
    const next = Math.min(5.0, Math.max(0.2, targetZoomRef.current + delta));
    targetZoomRef.current = next;
  };

  // Current Semantic Altitude Level (0..3)
  const activeZoomLevel = useMemo(() => {
    if (zoom < 0.5) return 0;
    if (zoom < 1.5) return 1;
    if (zoom < 4.0) return 2;
    return 3;
  }, [zoom]);

  const pillarById = useMemo(
    () => new Map(pillars.map((p) => [p.id, p])),
    [pillars]
  );

  const handleToggleSliverLock = async (sliver: HorizonSliver) => {
    const res = await fetch("/api/horizon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_sliver",
        id: sliver.id,
        is_milestone_locked: !sliver.is_milestone_locked,
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.slivers)) {
      setSlivers(data.slivers);
      const updated = data.slivers.find((s: HorizonSliver) => s.id === sliver.id);
      if (updated) setSelectedSliver(updated);
    }
  };

  const handleCreateMilestone = async () => {
    if (!msTitle.trim() || !msPillarId) return;
    const res = await fetch("/api/horizon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_sliver",
        pillar_id: msPillarId,
        horizon_tier: msTier,
        title: msTitle.trim(),
        strategic_intent: msIntent.trim() || null,
        target_year: msYear,
        resource_weight_pct: msWeight,
        is_milestone_locked: true,
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.slivers)) {
      setSlivers(data.slivers);
      setShowMilestoneModal(false);
      setMsTitle("");
      setMsIntent("");
    }
  };

  const handleUpdateWaypointCompletion = async (
    wp: JourneyWaypoint,
    nextPct: number
  ) => {
    const clamped = Math.min(100, Math.max(0, nextPct));
    const res = await fetch("/api/horizon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_waypoint",
        id: wp.id,
        completion_percentage: clamped,
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.waypoints)) {
      setWaypoints(data.waypoints);
      const updated = data.waypoints.find((w: JourneyWaypoint) => w.id === wp.id);
      if (updated) setSelectedWaypoint(updated);
    }
  };

  const handleCreateOutpost = async () => {
    if (!outpostTitle.trim()) return;
    const lastWp = waypoints[waypoints.length - 1];
    const res = await fetch("/api/horizon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_waypoint",
        title: outpostTitle.trim(),
        terrain_type: outpostTerrain,
        coord_x: Math.min(88, (lastWp?.coord_x || 40) + 9),
        coord_y: Math.max(16, (lastWp?.coord_y || 55) - 8),
        coord_z: (lastWp?.coord_z || 500) + 180,
        completion_percentage: outpostCompletion,
        accent_glow_color: "#e5c07b",
        hud_description:
          outpostDesc.trim() ||
          "Sovereign expedition outpost charted along the River of Time.",
        connectFromWaypointId: lastWp?.id,
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.waypoints)) {
      setWaypoints(data.waypoints);
      setPaths(data.paths || []);
      setShowOutpostModal(false);
      setOutpostTitle("");
      setOutpostDesc("");
    }
  };

  // ─── Engine 2: 60 FPS Spatial Journey Topographic River-and-Mountain Canvas ─
  const activeDiurnalPhase: DiurnalPhase = useMemo(() => {
    if (diurnalOverride !== "auto") return diurnalOverride;
    return detectLocalDiurnalPhase(new Date().getHours());
  }, [diurnalOverride]);

  useEffect(() => {
    if (activeEngine !== "spatial_journey") return;

    let rafId = 0;
    let frames = 0;
    let fpsClock = performance.now();

    const drawTopography = (now: number) => {
      frames++;
      if (now - fpsClock >= 1000) {
        setJourneyFps(Math.min(60, Math.round((frames * 1000) / (now - fpsClock))));
        frames = 0;
        fpsClock = now;
      }

      const canvas = journeyCanvasRef.current;
      const container = journeyContainerRef.current;
      if (!canvas || !container) {
        rafId = requestAnimationFrame(drawTopography);
        return;
      }

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(420, Math.floor(rect.height));

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafId = requestAnimationFrame(drawTopography);
        return;
      }

      const palette = DIURNAL_PALETTES[activeDiurnalPhase];
      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Diurnal Atmospheric Sky Gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.68);
      sky.addColorStop(0, palette.skyTop);
      sky.addColorStop(0.55, palette.skyMid);
      sky.addColorStop(1, palette.skyHorizon);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Subtle Stars in Dawn / Sunset / Midnight
      if (activeDiurnalPhase !== "solar_noon") {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (let i = 0; i < 48; i++) {
          const sx = ((i * 197) % 997) / 997 * w;
          const sy = ((i * 313) % 613) / 613 * (h * 0.38);
          const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.0012 + i));
          ctx.globalAlpha = twinkle * (activeDiurnalPhase === "midnight" ? 0.85 : 0.4);
          ctx.beginPath();
          ctx.arc(sx, sy, (i % 2) + 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Celestial Body (Sun / Moon)
      const celestialX =
        activeDiurnalPhase === "dawn"
          ? w * 0.24
          : activeDiurnalPhase === "solar_noon"
          ? w * 0.55
          : activeDiurnalPhase === "sunset"
          ? w * 0.78
          : w * 0.82;
      const celestialY =
        activeDiurnalPhase === "solar_noon" ? h * 0.14 : h * 0.25;

      const sunGlow = ctx.createRadialGradient(
        celestialX,
        celestialY,
        4,
        celestialX,
        celestialY,
        130
      );
      sunGlow.addColorStop(0, palette.celestialColor);
      sunGlow.addColorStop(0.28, `${palette.celestialColor}44`);
      sunGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 130, 0, Math.PI * 2);
      ctx.fill();

      // 2. Layered Mountain Ridges + Topographic Contour Lines
      const drawMountainLayer = (
        baseY: number,
        amp: number,
        freq: number,
        phase: number,
        fill: string,
        contourAlpha: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) {
          const nx = x / w;
          const peakBoost = nx > 0.62 ? (nx - 0.62) * 185 : 0;
          const y =
            baseY -
            peakBoost -
            Math.sin(nx * freq + phase) * amp -
            Math.cos(nx * freq * 2.3 + phase * 1.7) * (amp * 0.38);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        // Topographic elevation contour stroke
        ctx.strokeStyle = `rgba(229, 192, 123, ${contourAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      };

      drawMountainLayer(h * 0.56, 46, 5.2, 0.5, palette.ridgeFar, 0.22);
      drawMountainLayer(h * 0.68, 38, 6.8, 1.9, palette.ridgeMid, 0.16);
      drawMountainLayer(h * 0.82, 28, 4.4, 3.1, palette.ridgeNear, 0.12);

      // Subtle Topographic Survey Grid Lines in Valley Floor
      ctx.save();
      ctx.strokeStyle = "rgba(229, 192, 123, 0.06)";
      ctx.lineWidth = 1;
      for (let c = 1; c <= 6; c++) {
        ctx.beginPath();
        const cyBase = h * 0.52 + c * (h * 0.075);
        for (let x = 0; x <= w; x += 16) {
          const y = cyBase + Math.sin(x * 0.012 + c) * 9;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 3. Illuminated Winding "River of Time"
      const riverPoints: Array<{ x: number; y: number; halfWidth: number }> = [];
      const steps = 65;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps; // 0 = foreground valley left, 1 = high summit source right
        const rx = w * (0.08 + t * 0.78) + Math.sin(t * Math.PI * 3.1) * (w * 0.055);
        const ry = h * (0.93 - t * 0.68) + Math.cos(t * Math.PI * 2.4) * 14;
        const hw = Math.max(2.2, (1 - t) * 28 + 2.5);
        riverPoints.push({ x: rx, y: ry, halfWidth: hw });
      }

      ctx.beginPath();
      for (let i = 0; i < riverPoints.length; i++) {
        const p = riverPoints[i];
        if (i === 0) ctx.moveTo(p.x - p.halfWidth, p.y);
        else ctx.lineTo(p.x - p.halfWidth, p.y);
      }
      for (let i = riverPoints.length - 1; i >= 0; i--) {
        const p = riverPoints[i];
        ctx.lineTo(p.x + p.halfWidth, p.y);
      }
      ctx.closePath();

      const riverGrad = ctx.createLinearGradient(0, h, w * 0.85, h * 0.22);
      riverGrad.addColorStop(0, "rgba(14, 165, 233, 0.55)");
      riverGrad.addColorStop(0.5, palette.riverHighlight);
      riverGrad.addColorStop(1, "rgba(229, 192, 123, 0.75)");
      ctx.fillStyle = riverGrad;
      ctx.fill();

      // Animated Specular Shimmer Ripples on the River of Time
      const rippleShift = (now * 0.00045) % 1;
      for (let r = 0; r < 18; r++) {
        const prog = (r / 18 + rippleShift) % 1;
        const idx = Math.min(
          riverPoints.length - 1,
          Math.floor(prog * riverPoints.length)
        );
        const rp = riverPoints[idx];
        ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(rp.x - rp.halfWidth * 0.45, rp.y);
        ctx.lineTo(rp.x + rp.halfWidth * 0.45, rp.y);
        ctx.stroke();
      }

      // 4. Project Waypoints onto Screen
      const projected = waypoints.map((wp) => ({
        wp,
        sx: (Math.min(92, Math.max(8, Number(wp.coord_x))) / 100) * w,
        sy: (Math.min(90, Math.max(14, Number(wp.coord_y))) / 100) * h,
      }));
      screenWaypointsRef.current = projected;
      const projById = new Map(projected.map((p) => [p.wp.id, p]));

      // 5. Animated Catmull-Rom Spline Paths Connecting Outposts
      if (projected.length >= 2) {
        const orderedPts = projected.map((p) => ({ x: p.sx, y: p.sy }));
        const splineSamples: Array<{ x: number; y: number }> = [];

        for (let i = 0; i < orderedPts.length - 1; i++) {
          const p0 = orderedPts[Math.max(0, i - 1)];
          const p1 = orderedPts[i];
          const p2 = orderedPts[i + 1];
          const p3 = orderedPts[Math.min(orderedPts.length - 1, i + 2)];
          for (let s = 0; s <= 24; s++) {
            splineSamples.push(catmullRomPoint(p0, p1, p2, p3, s / 24));
          }
        }

        // Outer Golden Trail Glow
        ctx.save();
        ctx.beginPath();
        splineSamples.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = "rgba(229, 192, 123, 0.25)";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Crisp Expedition Dashed Spline
        ctx.setLineDash([6, 5]);
        ctx.lineDashOffset = -(now * 0.03);
        ctx.strokeStyle = "#e5c07b";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Traveling Expedition Beacon Orbs along Catmull-Rom Spline
        for (let b = 0; b < 3; b++) {
          const phase = ((now * 0.00018 + b / 3) % 1) * (splineSamples.length - 1);
          const sample = splineSamples[Math.floor(phase)];
          if (sample) {
            ctx.beginPath();
            ctx.arc(sample.x, sample.y, 3.6, 0, Math.PI * 2);
            ctx.fillStyle = "#fef08a";
            ctx.fill();
          }
        }
      }

      // Draw any explicit custom branch paths
      for (const path of paths) {
        const a = projById.get(path.from_waypoint_id);
        const b = projById.get(path.to_waypoint_id);
        if (!a || !b) continue;
        ctx.save();
        ctx.strokeStyle = path.is_active_pathway
          ? "rgba(245, 158, 11, 0.35)"
          : "rgba(148, 163, 184, 0.2)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
        ctx.restore();
      }

      // 6. Glowing Waypoint Outposts & Completion Halos
      for (const { wp, sx, sy } of projected) {
        const isSel = selectedWaypoint?.id === wp.id;
        const isHov = hoveredWaypoint?.wp.id === wp.id;
        const glowColor = wp.accent_glow_color || "#e5c07b";

        // Pulsing beacon halo
        const pulseR = 22 + Math.sin(now * 0.0035 + sx) * 4 + (isSel || isHov ? 8 : 0);
        const halo = ctx.createRadialGradient(sx, sy, 4, sx, sy, pulseR);
        halo.addColorStop(0, `${glowColor}88`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
        ctx.fill();

        // Outer Completion Progress Ring
        ctx.beginPath();
        ctx.arc(sx, sy, 13, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const pctAngle =
          -Math.PI / 2 + (Math.PI * 2 * (wp.completion_percentage || 0)) / 100;
        ctx.beginPath();
        ctx.arc(sx, sy, 13, -Math.PI / 2, pctAngle);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        // Outpost Core Diamond / Citadel Node
        ctx.save();
        ctx.translate(sx, sy);
        if (wp.terrain_type === "summit_peak" || wp.terrain_type === "citadel") {
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = isSel ? "#ffffff" : glowColor;
          ctx.fillRect(-5.5, -5.5, 11, 11);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = isSel ? "#ffffff" : glowColor;
          ctx.fill();
        }
        ctx.restore();

        // Elevation Callout Label
        ctx.font = `${isSel || isHov ? "700" : "600"} 11px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(wp.title, sx, sy - 20);

        ctx.font = "600 9.5px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = glowColor;
        ctx.fillText(
          `${wp.completion_percentage}% · ${Math.round(wp.coord_z)}m`,
          sx,
          sy + 26
        );
      }

      ctx.restore();
      rafId = requestAnimationFrame(drawTopography);
    };

    rafId = requestAnimationFrame(drawTopography);
    return () => cancelAnimationFrame(rafId);
  }, [
    activeEngine,
    activeDiurnalPhase,
    waypoints,
    paths,
    selectedWaypoint,
    hoveredWaypoint,
  ]);

  const handleJourneyMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = journeyCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = screenWaypointsRef.current.find(
      (p) => Math.hypot(mx - p.sx, my - p.sy) <= 22
    );
    if (hit) {
      setHoveredWaypoint({ wp: hit.wp, sx: hit.sx, sy: hit.sy });
    } else if (hoveredWaypoint) {
      setHoveredWaypoint(null);
    }
  };

  const handleJourneyClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = journeyCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = screenWaypointsRef.current.find(
      (p) => Math.hypot(mx - p.sx, my - p.sy) <= 24
    );
    if (hit) {
      setSelectedWaypoint(hit.wp);
    }
  };

  // Current Local Time Solar Angle for Level 3 Circadian Solar Ring
  const nowDate = new Date();
  const currentDecimalHour = nowDate.getHours() + nowDate.getMinutes() / 60;
  const solarAngleDeg = (currentDecimalHour / 24) * 360 - 90;

  return (
    <ExecutiveModuleShell
      moduleId="HORIZON"
      eyebrow="Sections 21 & 22 · Macro Temporal & Spatial Cartography"
      title="Macro Horizon & Spatial Journey"
      subtitle="Rising Sun 80-Year Panorama, Powers of Ten Semantic Zoom (0.2x–5.0x) & Topographic River-of-Time Expedition"
      accentColor="#e5c07b"
      headerActions={
        <>
          {/* Master Dual-Engine Switcher */}
          <div className="flex rounded-xl overflow-hidden border border-amber-300/25 bg-[#0b0f19] p-0.5">
            <button
              onClick={() => setActiveEngine("rising_sun")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeEngine === "rising_sun"
                  ? "bg-gradient-to-r from-[#e5c07b] to-[#f59e0b] text-[#090b11] shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sunrise size={14} />
              Engine 1 · Rising Sun & Zoom
            </button>
            <button
              onClick={() => setActiveEngine("spatial_journey")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeEngine === "spatial_journey"
                  ? "bg-gradient-to-r from-[#e5c07b] to-[#f59e0b] text-[#090b11] shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Mountain size={14} />
              Engine 2 · Spatial Journey
            </button>
          </div>

          <button
            onClick={() =>
              activeEngine === "rising_sun"
                ? setShowMilestoneModal(true)
                : setShowOutpostModal(true)
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-amber-300/30 text-[#e5c07b] text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Plus size={14} />
            {activeEngine === "rising_sun" ? "New Milestone" : "New Outpost"}
          </button>
        </>
      }
    >
      {activeEngine === "rising_sun" ? (
        /* ═══════════════════════════════════════════════════════════════════════
           ENGINE 1: RISING SUN PANORAMA & "POWERS OF TEN" SEMANTIC ZOOM (0.2x–5.0x)
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-5">
          {/* Macro Altitude Wayfinding Breadcrumb Bar + Continuous Semantic Zoom Slider */}
          <div className="p-4 rounded-2xl bg-[#0b0f19]/95 border border-amber-200/15 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl">
            {/* Breadcrumb Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              {WAYFINDING_CRUMBS.map((crumb, idx) => {
                const isActive = activeZoomLevel === crumb.level;
                return (
                  <React.Fragment key={crumb.level}>
                    {idx > 0 && (
                      <ChevronRight size={14} className="text-zinc-600 shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => jumpToZoom(crumb.zoom)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide border transition-all ${
                        isActive
                          ? "bg-[#e5c07b]/20 border-[#e5c07b] text-[#fde68a] shadow-[0_0_15px_rgba(229,192,123,0.22)]"
                          : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.07]"
                      }`}
                    >
                      [ {crumb.label} ]
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Smooth Continuous Semantic Zoom Slider (0.2x to 5.0x) */}
            <div className="flex items-center gap-3 bg-black/45 px-4 py-2 rounded-xl border border-white/[0.08]">
              <Compass size={15} className="text-[#e5c07b] shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Powers of Ten Zoom
              </span>
              <input
                type="range"
                min={0.2}
                max={5.0}
                step={0.02}
                value={zoom}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  targetZoomRef.current = val;
                  setZoom(val);
                }}
                className="w-36 sm:w-48 accent-[#e5c07b] cursor-pointer"
              />
              <span className="text-xs font-mono font-extrabold text-[#e5c07b] w-12 text-right">
                {zoom.toFixed(2)}x
              </span>
            </div>
          </div>

          {/* Interactive Semantic Zoom Viewport (Scroll Mouse Wheel to Fly Across Scales!) */}
          <div
            onWheel={handleSemanticWheel}
            className="relative rounded-3xl bg-[#0b0f19] border border-amber-200/15 overflow-hidden shadow-2xl min-h-[580px] flex flex-col justify-between p-6 select-none"
          >
            {/* Top Altitude HUD Overlay */}
            <div className="flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-amber-300/25 text-[11px] font-mono text-[#e5c07b]">
                <Sparkles size={12} />
                ALTITUDE LOD {activeZoomLevel} ·{" "}
                {WAYFINDING_CRUMBS[activeZoomLevel]?.label}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 bg-black/50 px-3 py-1 rounded-full border border-white/10">
                Scroll mouse-wheel or drag slider to morph temporal scale
              </div>
            </div>

            {/* ── LEVEL 0 (0.1x–0.5x): 180° RISING SUN 80-YEAR PANORAMA ── */}
            {activeZoomLevel === 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center my-auto pt-3">
                <div className="xl:col-span-8 relative flex items-center justify-center">
                  <svg
                    viewBox="0 0 900 490"
                    className="w-full max-w-[860px] h-auto overflow-visible"
                  >
                    <defs>
                      <radialGradient id="risingSunCore" cx="50%" cy="94%" r="75%">
                        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                        <stop offset="14%" stopColor="#f59e0b" stopOpacity="0.55" />
                        <stop offset="42%" stopColor="#e5c07b" stopOpacity="0.16" />
                        <stop offset="76%" stopColor="#7c3aed" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#0b0f19" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Ambient Solar Corona */}
                    <rect
                      x="0"
                      y="0"
                      width="900"
                      height="480"
                      fill="url(#risingSunCore)"
                    />

                    {/* Concentric Horizon Arcs (1Y, 10Y, 30Y, 80Y) */}
                    {(
                      Object.entries(TIER_META) as Array<
                        [HorizonTier, (typeof TIER_META)[HorizonTier]]
                      >
                    ).map(([tierKey, meta]) => {
                      const r = meta.radiusRatio * 410;
                      return (
                        <g key={tierKey}>
                          <path
                            d={`M ${450 - r} 455 A ${r} ${r} 0 0 1 ${450 + r} 455`}
                            fill="none"
                            stroke="rgba(229, 192, 123, 0.2)"
                            strokeWidth="1.2"
                            strokeDasharray={tierKey === "80_year" ? "none" : "5 5"}
                          />
                          <text
                            x={450 + r - 8}
                            y={447}
                            textAnchor="end"
                            fill="rgba(229, 192, 123, 0.65)"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {meta.label} ({meta.horizonYears})
                          </text>
                        </g>
                      );
                    })}

                    {/* 5 Life Pillar Crepuscular Rays */}
                    {pillars.map((pillar) => {
                      const rad = (Number(pillar.ray_angle_degrees) * Math.PI) / 180;
                      const outerR = 415;
                      const x2 = 450 - Math.cos(rad) * outerR;
                      const y2 = 455 - Math.sin(rad) * outerR;
                      const labelR = 438;
                      const lx = 450 - Math.cos(rad) * labelR;
                      const ly = 455 - Math.sin(rad) * labelR;

                      return (
                        <g key={pillar.id}>
                          <line
                            x1={450}
                            y1={455}
                            x2={x2}
                            y2={y2}
                            stroke={pillar.accent_color}
                            strokeOpacity="0.38"
                            strokeWidth="2"
                          />
                          <text
                            x={lx}
                            y={ly}
                            textAnchor="middle"
                            fill={pillar.accent_color}
                            fontSize="11"
                            fontWeight="700"
                          >
                            {pillar.title}
                          </text>
                        </g>
                      );
                    })}

                    {/* Glowing Milestone Sliver Prisms */}
                    {slivers.map((sliver) => {
                      const pillar = pillarById.get(sliver.pillar_id);
                      if (!pillar) return null;
                      const tierInfo =
                        TIER_META[sliver.horizon_tier] || TIER_META["10_year"];
                      const rad = (Number(pillar.ray_angle_degrees) * Math.PI) / 180;
                      const r = tierInfo.radiusRatio * 410;
                      const sx = 450 - Math.cos(rad) * r;
                      const sy = 455 - Math.sin(rad) * r;
                      const isSel = selectedSliver?.id === sliver.id;
                      const size = 7 + (sliver.resource_weight_pct / 100) * 9;

                      return (
                        <g
                          key={sliver.id}
                          onClick={() => setSelectedSliver(sliver)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={sx}
                            cy={sy}
                            r={size + (isSel ? 9 : 4)}
                            fill={pillar.accent_color}
                            fillOpacity={isSel ? 0.35 : 0.16}
                          />
                          <polygon
                            points={`${sx},${sy - size} ${sx + size * 0.85},${sy} ${sx},${
                              sy + size
                            } ${sx - size * 0.85},${sy}`}
                            fill={
                              sliver.is_milestone_locked
                                ? pillar.accent_color
                                : "#1e293b"
                            }
                            stroke="#ffffff"
                            strokeWidth={isSel ? 2.2 : 1.1}
                          />
                          <text
                            x={sx}
                            y={sy - size - 6}
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="9.5"
                            fontFamily="monospace"
                          >
                            {sliver.target_year}
                          </text>
                        </g>
                      );
                    })}

                    {/* Rising Sun Horizon Baseline & Solar Disc */}
                    <line
                      x1="20"
                      y1="455"
                      x2="880"
                      y2="455"
                      stroke="#e5c07b"
                      strokeOpacity="0.55"
                      strokeWidth="2"
                    />
                    <path
                      d="M 392 455 A 58 58 0 0 1 508 455 Z"
                      fill="#fbbf24"
                    />
                  </svg>
                </div>

                {/* Right 4 Cols: Selected Sliver Prism Inspector */}
                <div className="xl:col-span-4 space-y-3">
                  {selectedSliver ? (
                    <div className="p-5 rounded-2xl bg-[#111728]/95 border border-amber-300/25 space-y-3.5 shadow-xl">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-[#e5c07b] border border-amber-400/30">
                          {TIER_META[selectedSliver.horizon_tier]?.label} ·{" "}
                          {selectedSliver.target_year}
                        </span>
                        <button
                          onClick={() => handleToggleSliverLock(selectedSliver)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase border transition-all ${
                            selectedSliver.is_milestone_locked
                              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                              : "bg-white/5 border-white/15 text-zinc-400"
                          }`}
                        >
                          {selectedSliver.is_milestone_locked ? (
                            <>
                              <Lock size={11} /> Locked
                            </>
                          ) : (
                            <>
                              <Unlock size={11} /> Draft
                            </>
                          )}
                        </button>
                      </div>

                      <div>
                        <div
                          className="text-[10.5px] font-bold uppercase tracking-wider mb-1"
                          style={{
                            color:
                              pillarById.get(selectedSliver.pillar_id)
                                ?.accent_color || "#e5c07b",
                          }}
                        >
                          {pillarById.get(selectedSliver.pillar_id)?.title}
                        </div>
                        <h3 className="text-sm font-extrabold text-white leading-snug">
                          {selectedSliver.title}
                        </h3>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {selectedSliver.strategic_intent}
                      </p>

                      <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-400">
                            Capital & Attention Weight
                          </span>
                          <span className="text-[#e5c07b] font-bold">
                            {selectedSliver.resource_weight_pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#e5c07b] to-[#f59e0b]"
                            style={{
                              width: `${selectedSliver.resource_weight_pct}%`,
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => jumpToZoom(1.0)}
                        className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-[#e5c07b] transition-colors"
                      >
                        Zoom Into 2026–2036 Decadal Runway →
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* ── LEVEL 1 (0.5x–1.5x): 10-YEAR STRATEGIC DECADE RUNWAY (2026–2036) ── */}
            {activeZoomLevel === 1 && (
              <div className="my-auto py-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#e5c07b]">
                      2026–2036 Strategic Decade Runway
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Annual milestone vectors & capital/resource allocation weights across all 5 Sovereign Pillars.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    {Array.from({ length: 11 }, (_, i) => 2026 + i).map((yr) => (
                      <span
                        key={yr}
                        className="px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]"
                      >
                        &apos;{String(yr).slice(2)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {pillars.map((pillar) => {
                    const decadalSlivers = slivers.filter(
                      (s) =>
                        s.pillar_id === pillar.id &&
                        (s.horizon_tier === "1_year" ||
                          s.horizon_tier === "10_year")
                    );
                    const avgWeight =
                      decadalSlivers.length > 0
                        ? Math.round(
                            decadalSlivers.reduce(
                              (acc, s) => acc + s.resource_weight_pct,
                              0
                            ) / decadalSlivers.length
                          )
                        : 20;

                    return (
                      <div
                        key={pillar.id}
                        className="p-4 rounded-2xl bg-[#101626]/90 border border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                      >
                        <div className="lg:col-span-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: pillar.accent_color }}
                            />
                            <span className="text-xs font-bold text-white">
                              {pillar.title}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400">
                            Resource Weight:{" "}
                            <span
                              className="font-bold"
                              style={{ color: pillar.accent_color }}
                            >
                              {avgWeight}%
                            </span>
                          </div>
                        </div>

                        {/* 2026-2036 Decade Track */}
                        <div className="lg:col-span-9 relative h-16 rounded-xl bg-black/50 border border-white/[0.06] px-4 flex items-center">
                          <div
                            className="absolute left-4 right-4 h-0.5 opacity-35"
                            style={{ backgroundColor: pillar.accent_color }}
                          />
                          {decadalSlivers.map((s) => {
                            const clampedYr = Math.min(
                              2036,
                              Math.max(2026, s.target_year)
                            );
                            const pct = ((clampedYr - 2026) / 10) * 86 + 5;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setSelectedSliver(s)}
                                style={{
                                  left: `${pct}%`,
                                  borderColor: pillar.accent_color,
                                }}
                                className="absolute -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border text-left hover:scale-105 transition-transform shadow-lg max-w-[240px]"
                              >
                                <div className="text-[9.5px] font-mono font-bold text-amber-300">
                                  {s.target_year} · {s.resource_weight_pct}% wt
                                </div>
                                <div className="text-[11px] font-semibold text-white truncate">
                                  {s.title}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── LEVEL 2 (1.5x–4.0x): 1-YEAR TACTICAL QUARTERLY ARC (Q1–Q4) ── */}
            {activeZoomLevel === 2 && (
              <div className="my-auto py-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#f59e0b]">
                      2027 Tactical Quarterly Execution Arc (Q1–Q4)
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Locked 1-year horizon slivers decomposed into quarterly sprint epics & pillar velocity gauges.
                    </p>
                  </div>
                  <button
                    onClick={() => jumpToZoom(4.5)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold"
                  >
                    Dock Into Today&apos;s Solar Ring →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    {
                      q: "Q1 · FOUNDATION",
                      months: "JAN – MAR",
                      velocity: 91,
                      focus: "Multi-Tenant Core & Metabolic Cut Lock",
                    },
                    {
                      q: "Q2 · EXPANSION",
                      months: "APR – JUN",
                      velocity: 86,
                      focus: "Enterprise Fleet Logos & Living OS Dock",
                    },
                    {
                      q: "Q3 · SCALE",
                      months: "JUL – SEP",
                      velocity: 79,
                      focus: "5-Account Synced Alpha & IOS Yard #1",
                    },
                    {
                      q: "Q4 · HARVEST",
                      months: "OCT – DEC",
                      velocity: 84,
                      focus: "Treasury Reserve Sweep & Sanctuary Audit",
                    },
                  ].map((quarter, qi) => {
                    const oneYearSlivers = slivers.filter(
                      (s) => s.horizon_tier === "1_year"
                    );
                    const assigned = oneYearSlivers.filter(
                      (_, idx) => idx % 4 === qi || (qi === 0 && idx === 4)
                    );

                    return (
                      <div
                        key={quarter.q}
                        className="p-4 rounded-2xl bg-[#101727]/95 border border-white/[0.09] flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-extrabold text-[#e5c07b]">
                              {quarter.q}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {quarter.months}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            {quarter.focus}
                          </p>

                          {/* Velocity Gauge */}
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                            <div className="flex items-center justify-between text-[10.5px] font-mono">
                              <span className="inline-flex items-center gap-1 text-zinc-400">
                                <Gauge size={12} className="text-emerald-400" />
                                Sprint Velocity
                              </span>
                              <span className="text-emerald-300 font-bold">
                                {quarter.velocity}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full"
                                style={{ width: `${quarter.velocity}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            {assigned.map((s) => {
                              const p = pillarById.get(s.pillar_id);
                              return (
                                <div
                                  key={s.id}
                                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1"
                                >
                                  <div
                                    className="text-[9.5px] font-bold uppercase tracking-wider"
                                    style={{
                                      color: p?.accent_color || "#e5c07b",
                                    }}
                                  >
                                    {p?.title}
                                  </div>
                                  <div className="text-xs font-semibold text-white">
                                    {s.title}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── LEVEL 3 (4.0x+): TODAY'S 360° CIRCADIAN SOLAR RING PORTAL ── */}
            {activeZoomLevel === 3 && (
              <div className="my-auto py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 flex items-center justify-center">
                  <svg viewBox="0 0 380 380" className="w-72 sm:w-80 h-auto">
                    {/* Outer 24-Hour Dial */}
                    <circle
                      cx="190"
                      cy="190"
                      r="152"
                      fill="rgba(15, 23, 42, 0.55)"
                      stroke="rgba(229, 192, 123, 0.3)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="190"
                      cy="190"
                      r="114"
                      fill="rgba(9, 11, 17, 0.9)"
                      stroke="rgba(56, 189, 248, 0.22)"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />

                    {/* 24-Hour Ticks */}
                    {Array.from({ length: 24 }, (_, hr) => {
                      const rad = ((hr / 24) * 360 - 90) * (Math.PI / 180);
                      const x1 = 190 + Math.cos(rad) * 144;
                      const y1 = 190 + Math.sin(rad) * 144;
                      const x2 = 190 + Math.cos(rad) * 152;
                      const y2 = 190 + Math.sin(rad) * 152;
                      return (
                        <g key={hr}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(255,255,255,0.35)"
                            strokeWidth={hr % 6 === 0 ? 2 : 1}
                          />
                          {hr % 6 === 0 && (
                            <text
                              x={190 + Math.cos(rad) * 168}
                              y={194 + Math.sin(rad) * 168}
                              textAnchor="middle"
                              fill="#e5c07b"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              {String(hr).padStart(2, "0")}:00
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Live Solar Position Beacon */}
                    {(() => {
                      const rad = (solarAngleDeg * Math.PI) / 180;
                      const sx = 190 + Math.cos(rad) * 152;
                      const sy = 190 + Math.sin(rad) * 152;
                      return (
                        <g>
                          <line
                            x1="190"
                            y1="190"
                            x2={sx}
                            y2={sy}
                            stroke="#fbbf24"
                            strokeWidth="1.8"
                            strokeDasharray="3 3"
                          />
                          <circle cx={sx} cy={sy} r="13" fill="rgba(251,191,36,0.28)" />
                          <circle cx={sx} cy={sy} r="6.5" fill="#fef08a" />
                        </g>
                      );
                    })()}

                    <text
                      x="190"
                      y="182"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="800"
                    >
                      TODAY · SOLAR RING
                    </text>
                    <text
                      x="190"
                      y="202"
                      textAnchor="middle"
                      fill="#e5c07b"
                      fontSize="11"
                      fontFamily="monospace"
                    >
                      80Y INTENT → DAILY EXECUTION
                    </text>
                  </svg>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="p-6 rounded-2xl bg-[#101728]/95 border border-amber-300/30 space-y-4 shadow-xl">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-[10.5px] font-mono text-amber-200 uppercase">
                      <Target size={12} />
                      Powers of Ten Docked · 5.0x Micro Scale
                    </div>
                    <h3 className="text-lg font-extrabold text-white">
                      Today&apos;s 360° Circadian Solar Command
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Every 80-year dynasty pillar and 10-year strategic sliver resolves down to how the next 24 solar hours are allocated. Launch directly into the live 24-Hour Circadian Solar Arc Calendar or lock a new macro milestone.
                    </p>

                    {circadianEvents.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          Synced Circadian Blocks ({circadianEvents.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {circadianEvents.slice(0, 4).map((ev) => (
                            <div
                              key={ev.id}
                              className="px-3 py-2 rounded-lg bg-black/45 border border-white/[0.07] flex items-center gap-2 text-xs text-zinc-200 truncate"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: ev.accent_color || "#38bdf8",
                                }}
                              />
                              <span className="truncate">{ev.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => router.push("/calendar")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e5c07b] to-[#f59e0b] hover:brightness-110 text-[#090b11] text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
                      >
                        <CalendarRange size={15} />
                        Portal to /calendar Solar Ring
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMilestoneModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-xs font-bold text-white transition-all"
                      >
                        <Plus size={14} />
                        Create Horizon Milestone
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Pillar Legend Strip */}
            <div className="pt-4 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
              <div className="flex flex-wrap items-center gap-3">
                {pillars.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.accent_color }}
                    />
                    {p.title}
                  </span>
                ))}
              </div>
              <span className="font-mono text-[10px] text-zinc-500">
                {slivers.length} MILESTONE SLIVERS PERSISTED
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════
           ENGINE 2: SPATIAL JOURNEY TOPOGRAPHIC RIVER-AND-MOUNTAIN CANVAS (60 FPS)
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Diurnal Sky Lighting Control Bar */}
          <div className="p-4 rounded-2xl bg-[#0b0f19]/95 border border-amber-200/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Navigation size={15} className="text-[#e5c07b]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Topographic River-of-Time Expedition Vista
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10.5px] font-mono">
                {journeyFps} FPS · Catmull-Rom Splines
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] font-mono text-zinc-400 mr-1">
                Diurnal Sky Sync:
              </span>
              {(
                [
                  { id: "auto", label: "Live Local Hour", icon: <Sparkles size={12} /> },
                  { id: "dawn", label: "Dawn", icon: <CloudSun size={12} /> },
                  { id: "solar_noon", label: "Solar Noon", icon: <Sun size={12} /> },
                  { id: "sunset", label: "Sunset", icon: <Sunset size={12} /> },
                  { id: "midnight", label: "Midnight", icon: <Moon size={12} /> },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setDiurnalOverride(mode.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    diurnalOverride === mode.id
                      ? "bg-[#e5c07b]/20 border-[#e5c07b] text-[#fde68a]"
                      : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white"
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            {/* 60 FPS Topographic Canvas */}
            <div
              ref={journeyContainerRef}
              className="xl:col-span-8 relative h-[560px] rounded-3xl overflow-hidden border border-amber-200/20 shadow-2xl select-none"
            >
              <canvas
                ref={journeyCanvasRef}
                onMouseMove={handleJourneyMouseMove}
                onMouseLeave={() => setHoveredWaypoint(null)}
                onClick={handleJourneyClick}
                className="w-full h-full block cursor-crosshair"
              />

              {/* Active Atmospheric Telemetry Badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 text-[11px] font-mono text-amber-200 pointer-events-none">
                SKY_LIGHTING: {DIURNAL_PALETTES[activeDiurnalPhase].label}
              </div>

              {/* Hover Glassmorphic Flight-HUD Card */}
              {hoveredWaypoint && (
                <div
                  className="pointer-events-none absolute z-20 w-72 p-3.5 rounded-2xl bg-[#0b101e]/85 backdrop-blur-xl border border-amber-300/35 shadow-2xl"
                  style={{
                    left: Math.min(
                      Math.max(14, hoveredWaypoint.sx + 18),
                      (journeyContainerRef.current?.clientWidth || 640) - 300
                    ),
                    top: Math.min(
                      Math.max(14, hoveredWaypoint.sy - 30),
                      (journeyContainerRef.current?.clientHeight || 520) - 165
                    ),
                  }}
                >
                  <div className="flex items-center justify-between text-[9.5px] font-mono uppercase tracking-widest text-amber-300 mb-1">
                    <span>
                      FLIGHT-HUD // {hoveredWaypoint.wp.terrain_type.replace("_", " ")}
                    </span>
                    <span>ALT {Math.round(hoveredWaypoint.wp.coord_z)}m</span>
                  </div>
                  <div className="text-xs font-extrabold text-white mb-1">
                    {hoveredWaypoint.wp.title}
                  </div>
                  <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                    {hoveredWaypoint.wp.hud_description}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-emerald-300">
                    <span>COMPLETION</span>
                    <span>{hoveredWaypoint.wp.completion_percentage}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Selected Outpost Flight-HUD Command Panel */}
            <div className="xl:col-span-4 flex flex-col gap-4">
              {selectedWaypoint && (
                <div className="p-5 rounded-2xl bg-[#0d1322]/95 border border-amber-300/25 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-[10px] font-mono font-bold uppercase text-[#e5c07b]">
                      OUTPOST TELEMETRY ·{" "}
                      {selectedWaypoint.terrain_type.replace("_", " ")}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      Z:{Math.round(selectedWaypoint.coord_z)}m
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {selectedWaypoint.title}
                    </h3>
                    {selectedWaypoint.target_date && (
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Target Arrival:{" "}
                        {new Date(selectedWaypoint.target_date).getFullYear()}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-black/35 p-3 rounded-xl border border-white/[0.06]">
                    {selectedWaypoint.hud_description}
                  </p>

                  {/* Interactive Expedition Completion Control */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Expedition Readiness</span>
                      <span
                        className="font-extrabold"
                        style={{ color: selectedWaypoint.accent_glow_color }}
                      >
                        {selectedWaypoint.completion_percentage}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={selectedWaypoint.completion_percentage}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSelectedWaypoint({
                          ...selectedWaypoint,
                          completion_percentage: val,
                        });
                      }}
                      onMouseUp={(e) =>
                        handleUpdateWaypointCompletion(
                          selectedWaypoint,
                          Number((e.target as HTMLInputElement).value)
                        )
                      }
                      className="w-full accent-[#e5c07b] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Expedition Outpost Roster */}
              <div className="p-4 rounded-2xl bg-[#0d1322]/90 border border-white/[0.08] space-y-2.5 flex-1">
                <div className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center justify-between">
                  <span>River of Time Outposts ({waypoints.length})</span>
                  <Layers size={13} className="text-[#e5c07b]" />
                </div>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {waypoints.map((wp, idx) => {
                    const active = selectedWaypoint?.id === wp.id;
                    return (
                      <button
                        key={wp.id}
                        onClick={() => setSelectedWaypoint(wp)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          active
                            ? "bg-amber-500/15 border-amber-400/50 text-white"
                            : "bg-white/[0.025] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-[#090b11] shrink-0"
                            style={{ backgroundColor: wp.accent_glow_color }}
                          >
                            0{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {wp.title}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 uppercase">
                              {wp.terrain_type.replace("_", " ")}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#e5c07b] shrink-0">
                          {wp.completion_percentage}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Horizon Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1424] border border-amber-300/25 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#e5c07b]">
                Lock New Horizon Milestone Sliver
              </h2>
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Life Pillar
                </label>
                <select
                  value={msPillarId}
                  onChange={(e) => setMsPillarId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                >
                  {pillars.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0e1424]">
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                    Horizon Arc Tier
                  </label>
                  <select
                    value={msTier}
                    onChange={(e) => {
                      const t = e.target.value as HorizonTier;
                      setMsTier(t);
                      setMsYear(
                        t === "1_year"
                          ? 2027
                          : t === "10_year"
                          ? 2034
                          : t === "30_year"
                          ? 2056
                          : 2106
                      );
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                  >
                    <option value="1_year" className="bg-[#0e1424]">
                      1-Year Tactical
                    </option>
                    <option value="10_year" className="bg-[#0e1424]">
                      10-Year Decadal
                    </option>
                    <option value="30_year" className="bg-[#0e1424]">
                      30-Year Generational
                    </option>
                    <option value="80_year" className="bg-[#0e1424]">
                      80-Year Dynasty
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                    Target Year
                  </label>
                  <input
                    type="number"
                    value={msYear}
                    onChange={(e) => setMsYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  placeholder="e.g. Equipsynx $10M ARR Autonomous Yard Network"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Strategic Intent
                </label>
                <textarea
                  value={msIntent}
                  onChange={(e) => setMsIntent(e.target.value)}
                  rows={2}
                  placeholder="Compounding strategic objective..."
                  className="w-full p-2.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Resource Allocation Weight ({msWeight}%)
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={msWeight}
                  onChange={(e) => setMsWeight(Number(e.target.value))}
                  className="w-full accent-[#e5c07b]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="px-3.5 py-2 rounded-lg bg-white/5 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMilestone}
                disabled={!msTitle.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#e5c07b] to-[#f59e0b] text-[#090b11] text-xs font-extrabold uppercase tracking-wider"
              >
                <CheckCircle2 size={13} />
                Lock Sliver Prism
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Spatial Journey Outpost Modal */}
      {showOutpostModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1424] border border-amber-300/25 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#e5c07b]">
                Chart New Expedition Outpost
              </h2>
              <button
                onClick={() => setShowOutpostModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Outpost Name
                </label>
                <input
                  type="text"
                  value={outpostTitle}
                  onChange={(e) => setOutpostTitle(e.target.value)}
                  placeholder="e.g. Sovereign Industrial Corridor Gate"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Topographic Terrain Class
                </label>
                <select
                  value={outpostTerrain}
                  onChange={(e) =>
                    setOutpostTerrain(e.target.value as WaypointTerrain)
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                >
                  <option value="valley_station" className="bg-[#0e1424]">
                    Valley Station
                  </option>
                  <option value="coastal_harbor" className="bg-[#0e1424]">
                    Coastal Harbor
                  </option>
                  <option value="citadel" className="bg-[#0e1424]">
                    Mid-Ridge Citadel
                  </option>
                  <option value="river_crossing" className="bg-[#0e1424]">
                    Highland River Crossing
                  </option>
                  <option value="summit_peak" className="bg-[#0e1424]">
                    Summit Peak
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Flight-HUD Briefing
                </label>
                <textarea
                  value={outpostDesc}
                  onChange={(e) => setOutpostDesc(e.target.value)}
                  rows={2}
                  placeholder="Operational milestone & terrain notes..."
                  className="w-full p-2.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Initial Completion ({outpostCompletion}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={outpostCompletion}
                  onChange={(e) => setOutpostCompletion(Number(e.target.value))}
                  className="w-full accent-[#e5c07b]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowOutpostModal(false)}
                className="px-3.5 py-2 rounded-lg bg-white/5 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOutpost}
                disabled={!outpostTitle.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#e5c07b] to-[#f59e0b] text-[#090b11] text-xs font-extrabold uppercase tracking-wider"
              >
                Connect Spline Outpost
              </button>
            </div>
          </div>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
