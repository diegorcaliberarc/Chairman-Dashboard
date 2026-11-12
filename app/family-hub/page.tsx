"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Droplets,
  Footprints,
  HeartPulse,
  Layers,
  LayoutGrid,
  Loader2,
  Moon,
  Pill,
  RefreshCw,
  ShieldAlert,
  Sun,
  Utensils,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";

interface ScheduleBlock {
  id: string;
  startHour: number;
  endHour: number;
  label: string;
  category: string;
  color: string;
  notes?: string;
}

interface MedicationSpec {
  id: string;
  name: string;
  dosage: string;
  cadence: string;
  intervalHours: number;
  scheduleHours: number[];
  critical?: boolean;
  instructions?: string;
}

interface HouseholdEntity {
  id: string;
  name: string;
  entity_type: "human_adult" | "human_child" | "canine_senior" | "canine_adult";
  accent_color: string;
  daily_water_target_oz: number;
  daily_food_target_grams: number;
  special_care_notes: string | null;
  schedule_blocks: ScheduleBlock[];
  medications: MedicationSpec[];
}

interface TelemetryLog {
  id: string;
  entity_id: string;
  log_date: string;
  water_consumed_oz: number;
  food_consumed_grams: number;
  potty_walk_completed: boolean;
  medication_administered: boolean;
  medication_name: string | null;
  activity_minutes: number;
  logged_at: string;
  notes: string | null;
}

// Solar Zenith Dial Geometry: 12:00 Noon at Top (0 deg), 18:00 Right (90 deg), 00:00 Midnight Bottom (180 deg), 06:00 Left (270 deg)
function hourToSolarDeg(hour: number): number {
  return ((hour / 24) * 360 + 180) % 360;
}

function polarToXY(cx: number, cy: number, r: number, degFromTop: number) {
  const rad = ((degFromTop - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSolarArc(
  cx: number,
  cy: number,
  r: number,
  startHour: number,
  endHour: number
): string[] {
  const segments: Array<[number, number]> = [];
  if (endHour < startHour) {
    segments.push([startHour, 24]);
    segments.push([0, endHour]);
  } else if (endHour > startHour) {
    segments.push([startHour, endHour]);
  }

  return segments.map(([s, e]) => {
    const spanHours = Math.min(23.98, Math.max(0.08, e - s));
    const startDeg = hourToSolarDeg(s);
    const endDeg = hourToSolarDeg(s + spanHours);
    const p1 = polarToXY(cx, cy, r, startDeg);
    const p2 = polarToXY(cx, cy, r, endDeg);
    const largeArc = spanHours > 12 ? 1 : 0;
    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  });
}

function isHourInBlock(hour: number, block: ScheduleBlock): boolean {
  if (block.endHour < block.startHour) {
    return hour >= block.startHour || hour < block.endHour;
  }
  return hour >= block.startHour && hour < block.endHour;
}

function formatHourRange(s: number, e: number): string {
  const fmt = (h: number) => {
    const norm = ((h % 24) + 24) % 24;
    const hh = Math.floor(norm);
    const mm = Math.round((norm - hh) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  return `${fmt(s)}–${fmt(e)}`;
}

function formatCountdown(msRemaining: number): string {
  const abs = Math.max(0, Math.floor(msRemaining / 1000));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")}`;
}

const ENTITY_TYPE_BADGE: Record<string, string> = {
  human_adult: "Chairman • Adult",
  human_child: "Youth • Student",
  canine_senior: "Senior Canine (12yo)",
  canine_adult: "Prime Canine (7yo)",
};

export default function FamilyCircadianHubPage() {
  const [entities, setEntities] = useState<HouseholdEntity[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"matrix" | "composite">("matrix");
  const [nowDate, setNowDate] = useState<Date>(() => new Date());
  const [hoveredBlock, setHoveredBlock] = useState<{
    entityName: string;
    accent: string;
    block: ScheduleBlock;
  } | null>(null);
  const [selectedMedByEntity, setSelectedMedByEntity] = useState<
    Record<string, string>
  >({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNowDate(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadHub = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/family-hub", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.entities)) {
        setEntities(data.entities);
        const defaults: Record<string, string> = {};
        for (const ent of data.entities as HouseholdEntity[]) {
          if (ent.medications?.[0]?.name) {
            defaults[ent.id] = ent.medications[0].name;
          }
        }
        setSelectedMedByEntity((prev) => ({ ...defaults, ...prev }));
      }
      if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch Family Hub:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

  const currentSolarHour = useMemo(() => {
    return (
      nowDate.getHours() +
      nowDate.getMinutes() / 60 +
      nowDate.getSeconds() / 3600
    );
  }, [nowDate]);

  const totalsByEntity = useMemo(() => {
    const map = new Map<
      string,
      {
        waterOz: number;
        foodGrams: number;
        walksCount: number;
        medsGiven: string[];
        medTimestamps: Record<string, string>;
        recentLogs: TelemetryLog[];
      }
    >();

    for (const ent of entities) {
      map.set(ent.id, {
        waterOz: 0,
        foodGrams: 0,
        walksCount: 0,
        medsGiven: [],
        medTimestamps: {},
        recentLogs: [],
      });
    }

    for (const lg of logs) {
      const bucket = map.get(lg.entity_id);
      if (!bucket) continue;
      bucket.waterOz += Number(lg.water_consumed_oz || 0);
      bucket.foodGrams += Number(lg.food_consumed_grams || 0);
      if (lg.potty_walk_completed) bucket.walksCount += 1;
      if (lg.medication_administered && lg.medication_name) {
        bucket.medsGiven.push(lg.medication_name);
        if (!bucket.medTimestamps[lg.medication_name]) {
          bucket.medTimestamps[lg.medication_name] = lg.logged_at;
        }
      }
      bucket.recentLogs.push(lg);
    }
    return map;
  }, [entities, logs]);

  const logEntityTelemetry = async (
    entityId: string,
    eventType: "water" | "food" | "walk" | "medication",
    extra?: {
      amount?: number;
      medication_name?: string;
      activity_minutes?: number;
      notes?: string;
    }
  ) => {
    const key = `${entityId}:${eventType}:${extra?.medication_name || ""}`;
    setBusyKey(key);
    try {
      const res = await fetch("/api/family-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_id: entityId,
          event_type: eventType,
          ...extra,
        }),
      });
      const data = await res.json();
      if (data.log) {
        setLogs((prev) => [data.log, ...prev]);
      }
    } finally {
      setBusyKey(null);
    }
  };

  const cometEntity = useMemo(
    () => entities.find((e) => e.name.toLowerCase().includes("comet")) || null,
    [entities]
  );

  // Compute live q12h countdown for Comet Crash Cart medications
  const getNextDoseStatus = (
    med: MedicationSpec,
    lastLoggedIso?: string
  ): { msUntilNext: number; nextLabel: string; overdue: boolean } => {
    const nowMs = nowDate.getTime();
    if (lastLoggedIso) {
      const lastMs = new Date(lastLoggedIso).getTime();
      const targetMs = lastMs + (med.intervalHours || 12) * 3600 * 1000;
      const diff = targetMs - nowMs;
      const targetTime = new Date(targetMs).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        msUntilNext: Math.max(0, diff),
        nextLabel: `Next q${med.intervalHours}h window @ ${targetTime}`,
        overdue: diff <= 0,
      };
    }

    // Otherwise anchor to scheduleHours today / tomorrow
    const sorted = [...(med.scheduleHours || [7, 19])].sort((a, b) => a - b);
    for (const sh of sorted) {
      const d = new Date(nowDate);
      d.setHours(Math.floor(sh), Math.round((sh % 1) * 60), 0, 0);
      if (d.getTime() > nowMs) {
        return {
          msUntilNext: d.getTime() - nowMs,
          nextLabel: `Scheduled @ ${String(Math.floor(sh)).padStart(2, "0")}:00`,
          overdue: false,
        };
      }
    }
    const tomorrow = new Date(nowDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const first = sorted[0] ?? 7;
    tomorrow.setHours(Math.floor(first), 0, 0, 0);
    return {
      msUntilNext: tomorrow.getTime() - nowMs,
      nextLabel: `Scheduled Tomorrow @ 0${Math.floor(first)}:00`,
      overdue: false,
    };
  };

  const renderSingleEntityWheel = (entity: HouseholdEntity) => {
    const size = 216;
    const cx = size / 2;
    const cy = size / 2;
    const r = 80;
    const needleDeg = hourToSolarDeg(currentSolarHour);
    const needleTip = polarToXY(cx, cy, r + 8, needleDeg);
    const activeBlock =
      entity.schedule_blocks.find((b) => isHourInBlock(currentSolarHour, b)) ||
      null;

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible select-none"
          >
            {/* Outer Subtle Halo */}
            <circle
              cx={cx}
              cy={cy}
              r={r + 12}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
            {/* Base Track */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="rgba(9,11,17,0.85)"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={14}
            />

            {/* Schedule Blocks */}
            {entity.schedule_blocks.map((blk) => {
              const paths = describeSolarArc(
                cx,
                cy,
                r,
                blk.startHour,
                blk.endHour
              );
              const isCurrent = activeBlock?.id === blk.id;
              return paths.map((d, idx) => (
                <path
                  key={`${blk.id}_${idx}`}
                  d={d}
                  fill="none"
                  stroke={blk.color}
                  strokeWidth={isCurrent ? 16 : 13}
                  strokeLinecap="butt"
                  opacity={isCurrent ? 1 : 0.78}
                  className="cursor-pointer transition-all hover:opacity-100"
                  onMouseEnter={() =>
                    setHoveredBlock({
                      entityName: entity.name,
                      accent: entity.accent_color,
                      block: blk,
                    })
                  }
                  onMouseLeave={() => setHoveredBlock(null)}
                />
              ));
            })}

            {/* Cardinal Hour Labels */}
            {[
              { h: 12, label: "12☀" },
              { h: 18, label: "18" },
              { h: 0, label: "00☾" },
              { h: 6, label: "06" },
            ].map((mk) => {
              const deg = hourToSolarDeg(mk.h);
              const pos = polarToXY(cx, cy, r - 22, deg);
              return (
                <text
                  key={mk.h}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-zinc-500 text-[8.5px] font-mono font-semibold"
                >
                  {mk.label}
                </text>
              );
            })}

            {/* Live Real-Time Solar Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="#fbbf24"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle
              cx={needleTip.x}
              cy={needleTip.y}
              r={4}
              fill="#fbbf24"
              stroke="#090b11"
              strokeWidth={1.5}
            />
            <circle cx={cx} cy={cy} r={4} fill={entity.accent_color} />
          </svg>

          {/* Center Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-9 text-center">
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: entity.accent_color }}
            >
              {entity.name.split(" ")[0]}
            </span>
            <span className="text-[9.5px] text-zinc-300 font-medium line-clamp-2 leading-tight mt-0.5">
              {activeBlock ? activeBlock.label : "Free Window"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderCompositeMasterWheel = () => {
    const size = 560;
    const cx = size / 2;
    const cy = size / 2;
    const ringRadii = [228, 192, 156, 120, 84]; // Outer Diego -> Max -> Nova -> Astro -> Inner Comet
    const needleDeg = hourToSolarDeg(currentSolarHour);
    const needleTip = polarToXY(cx, cy, 246, needleDeg);

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center rounded-2xl border border-white/[0.08] bg-[#0b0f18]/90 p-6">
        <div className="xl:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[560px] aspect-square flex items-center justify-center">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full select-none overflow-visible"
            >
              {/* Shared Pack Walk & Family Overlap Highlight Wedges (06:00-07:15 & 18:00-20:30) */}
              {[
                { start: 6.0, end: 7.25, color: "rgba(20,184,166,0.10)" },
                { start: 18.0, end: 20.5, color: "rgba(139,92,246,0.11)" },
              ].map((win, idx) => {
                const paths = describeSolarArc(cx, cy, 156, win.start, win.end);
                return paths.map((d, pIdx) => (
                  <path
                    key={`ov_${idx}_${pIdx}`}
                    d={d}
                    fill="none"
                    stroke={win.color}
                    strokeWidth={176}
                  />
                ));
              })}

              {/* 24 Hour Radial Grid */}
              {Array.from({ length: 24 }).map((_, h) => {
                const deg = hourToSolarDeg(h);
                const pInner = polarToXY(cx, cy, 62, deg);
                const pOuter = polarToXY(cx, cy, 244, deg);
                const pLabel = polarToXY(cx, cy, 258, deg);
                return (
                  <g key={h}>
                    <line
                      x1={pInner.x}
                      y1={pInner.y}
                      x2={pOuter.x}
                      y2={pOuter.y}
                      stroke={
                        h % 6 === 0
                          ? "rgba(255,255,255,0.16)"
                          : "rgba(255,255,255,0.04)"
                      }
                      strokeWidth={h % 6 === 0 ? 1.2 : 0.75}
                    />
                    {h % 3 === 0 && (
                      <text
                        x={pLabel.x}
                        y={pLabel.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-zinc-400 text-[10px] font-mono font-bold"
                      >
                        {String(h).padStart(2, "0")}:00
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 5 Concentric Entity Rings */}
              {entities.slice(0, 5).map((ent, idx) => {
                const r = ringRadii[idx] ?? 84;
                return (
                  <g key={ent.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth={20}
                    />
                    {ent.schedule_blocks.map((blk) => {
                      const paths = describeSolarArc(
                        cx,
                        cy,
                        r,
                        blk.startHour,
                        blk.endHour
                      );
                      const isActive = isHourInBlock(currentSolarHour, blk);
                      return paths.map((d, sIdx) => (
                        <path
                          key={`${ent.id}_${blk.id}_${sIdx}`}
                          d={d}
                          fill="none"
                          stroke={blk.color}
                          strokeWidth={isActive ? 22 : 18}
                          opacity={isActive ? 1 : 0.82}
                          className="cursor-pointer transition-all hover:opacity-100"
                          onMouseEnter={() =>
                            setHoveredBlock({
                              entityName: ent.name,
                              accent: ent.accent_color,
                              block: blk,
                            })
                          }
                          onMouseLeave={() => setHoveredBlock(null)}
                        />
                      ));
                    })}
                  </g>
                );
              })}

              {/* Unified Live Solar Needle */}
              <line
                x1={cx}
                y1={cy}
                x2={needleTip.x}
                y2={needleTip.y}
                stroke="#fbbf24"
                strokeWidth={2.5}
              />
              <circle
                cx={needleTip.x}
                cy={needleTip.y}
                r={5.5}
                fill="#fbbf24"
                stroke="#090b11"
                strokeWidth={2}
              />
              <circle
                cx={cx}
                cy={cy}
                r={48}
                fill="#090b11"
                stroke="rgba(251,191,36,0.35)"
                strokeWidth={1.5}
              />
              <text
                x={cx}
                y={cy - 8}
                textAnchor="middle"
                className="fill-amber-300 text-[10px] font-bold uppercase tracking-widest"
              >
                SOLAR NOW
              </text>
              <text
                x={cx}
                y={cy + 10}
                textAnchor="middle"
                className="fill-white text-xs font-mono font-bold"
              >
                {nowDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </text>
            </svg>
          </div>
        </div>

        {/* Concentric Legend & Synchronized Overlap Intelligence */}
        <div className="xl:col-span-5 space-y-4">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Compass size={15} /> 5-Ring Concentric Orbital Key
            </div>
            <p className="text-[11px] text-zinc-300 mt-1">
              Hover any arc to inspect cross-entity synchronization. Solar Noon (`12:00`) sits at top zenith; Midnight (`00:00`) anchors bottom nadir.
            </p>
            <div className="mt-3 space-y-2">
              {entities.slice(0, 5).map((ent, idx) => {
                const active = ent.schedule_blocks.find((b) =>
                  isHourInBlock(currentSolarHour, b)
                );
                return (
                  <div
                    key={ent.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-black/40 border border-white/[0.07] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ent.accent_color }}
                      />
                      <span className="font-semibold text-white truncate">
                        Ring {idx + 1}: {ent.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 truncate">
                      {active ? active.label : "Idle"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hovered Block Inspector */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 min-h-[116px]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Orbital Segment Inspector
            </div>
            {hoveredBlock ? (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold"
                    style={{ color: hoveredBlock.accent }}
                  >
                    {hoveredBlock.entityName}
                  </span>
                  <span className="text-xs font-mono text-amber-300">
                    {formatHourRange(
                      hoveredBlock.block.startHour,
                      hoveredBlock.block.endHour
                    )}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {hoveredBlock.block.label}
                </div>
                {hoveredBlock.block.notes && (
                  <p className="text-xs text-zinc-400">
                    {hoveredBlock.block.notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mt-2">
                Move cursor across any orbital ring to inspect exact start/end times, care instructions, and overlap windows.
              </p>
            )}
          </div>

          {/* Detected Synchronous Windows */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Synchronized Household Windows
            </div>
            <div className="rounded-lg bg-teal-500/10 border border-teal-500/30 p-2.5 text-xs">
              <div className="font-bold text-teal-300">
                06:00–07:15 • Dawn Pack Walk & Sling Window
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">
                Diego hydration + Nova gentle walk + Astro trail run + Comet Parachute Sling #1 & AM Crash Cart.
              </div>
            </div>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-2.5 text-xs">
              <div className="font-bold text-blue-300">
                08:00–15:00 • Protected Deep Focus & Recovery Window
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">
                Diego Caliber Arc & Sovereign Deep Work • Maximiliano School • Comet IVDD Crate Immobilization • Nova/Astro Rest.
              </div>
            </div>
            <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-2.5 text-xs">
              <div className="font-bold text-purple-300">
                18:00–20:30 • Shared Family Sanctuary & Evening Care
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">
                Family dinner, dusk pack stroll, Nova dental regimen, and Comet 19:00 q12h Crash Cart dosing.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ExecutiveModuleShell
      moduleId="FAMILY_HUB"
      eyebrow="Section 16 • Synchronous Biometrics"
      title="Multi-Entity Circadian Command Hub"
      subtitle="5-Entity Synchronous Solar Matrix — Diego, Maximiliano, Nova, Astro & Comet IVDD Spine Recovery"
      accentColor="#14b8a6"
      headerActions={
        <>
          <div className="inline-flex rounded-xl bg-black/50 p-1 border border-white/10">
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "matrix"
                  ? "bg-teal-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid size={13} /> 5-Wheel Command Matrix
            </button>
            <button
              onClick={() => setViewMode("composite")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "composite"
                  ? "bg-teal-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers size={13} /> Composite Master Overlap Wheel
            </button>
          </div>
          <button
            onClick={loadHub}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-300"
            title="Sync Household Telemetry"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </>
      }
    >
      {/* COMET IVDD CRASH CART PRIORITY CLINICAL BANNER */}
      {cometEntity && (
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/50 via-[#130c14] to-[#0d111a] p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-rose-500/25 text-rose-200 border border-rose-400/40 text-[10px] font-bold uppercase tracking-wider">
                    IVDD Spine Recovery Crash Cart
                  </span>
                  <h2 className="text-sm font-bold text-white">
                    Comet (12yo Senior Corgi) — Strict Crate Immobilization & Parachute Sling Protocol
                  </h2>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Zero stairs or jumping • Full hind-quarter parachute sling support on all potty dispatches • q12h Analgesia & Muscle Relaxant timers active.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                logEntityTelemetry(cometEntity.id, "walk", {
                  activity_minutes: 8,
                  notes: "Parachute Sling Assisted Potty Window verified — spine horizontal",
                })
              }
              disabled={busyKey === `${cometEntity.id}:walk:`}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/25"
            >
              <Footprints size={14} />
              Log Parachute Sling Potty (
              {totalsByEntity.get(cometEntity.id)?.walksCount || 0}/4)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cometEntity.medications.map((med) => {
              const cometStats = totalsByEntity.get(cometEntity.id);
              const lastIso = cometStats?.medTimestamps[med.name];
              const doseState = getNextDoseStatus(med, lastIso);
              const verifiedCount =
                cometStats?.medsGiven.filter((m) => m === med.name).length || 0;

              return (
                <div
                  key={med.id}
                  className="rounded-xl border border-rose-500/25 bg-black/45 p-3.5 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Pill size={13} className="text-rose-400" />
                        {med.name}{" "}
                        <span className="text-rose-300 font-mono text-[11px]">
                          ({med.dosage})
                        </span>
                      </div>
                      <div className="text-[10.5px] text-zinc-400 mt-0.5">
                        {med.cadence} • {med.instructions}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                      {verifiedCount}x today
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.07]">
                    <div>
                      <div className="text-[9.5px] uppercase tracking-wider text-zinc-400">
                        {doseState.nextLabel}
                      </div>
                      <div
                        className={`text-base font-mono font-bold ${
                          doseState.overdue ? "text-rose-400" : "text-amber-300"
                        }`}
                      >
                        T-{formatCountdown(doseState.msUntilNext)}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        logEntityTelemetry(cometEntity.id, "medication", {
                          medication_name: med.name,
                          notes: `Crash Cart Verified: ${med.name} (${med.dosage})`,
                        })
                      }
                      disabled={
                        busyKey === `${cometEntity.id}:medication:${med.name}`
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 size={12} />
                      Verify Dose
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 1 OR 2 */}
      {loading && entities.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 size={28} className="animate-spin text-teal-400" />
          <span className="text-xs uppercase tracking-widest">
            Calibrating 5-Entity Synchronous Circadian Matrix...
          </span>
        </div>
      ) : viewMode === "composite" ? (
        renderCompositeMasterWheel()
      ) : null}

      {/* 5-WHEEL COMMAND MATRIX + GRANULAR ENTITY TELEMETRY LOGGERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {entities.map((ent) => {
          const stats = totalsByEntity.get(ent.id) || {
            waterOz: 0,
            foodGrams: 0,
            walksCount: 0,
            medsGiven: [],
            medTimestamps: {},
            recentLogs: [],
          };
          const waterPct = Math.min(
            100,
            Math.round(
              (stats.waterOz / Math.max(1, ent.daily_water_target_oz)) * 100
            )
          );
          const foodPct = Math.min(
            100,
            Math.round(
              (stats.foodGrams / Math.max(1, ent.daily_food_target_grams)) * 100
            )
          );
          const isComet = ent.name.toLowerCase().includes("comet");
          const isCanine = ent.entity_type.startsWith("canine");
          const waterStep = isCanine ? 4 : 8;
          const foodStep = isComet ? 60 : isCanine ? 140 : 250;
          const selectedMed =
            selectedMedByEntity[ent.id] || ent.medications?.[0]?.name || "Dose";

          return (
            <div
              key={ent.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 backdrop-blur-md transition-all ${
                isComet
                  ? "border-rose-500/35 bg-rose-950/[0.12]"
                  : "border-white/[0.08] bg-white/[0.025]"
              }`}
            >
              {/* Entity Header */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider border"
                    style={{
                      color: ent.accent_color,
                      borderColor: `${ent.accent_color}55`,
                      backgroundColor: `${ent.accent_color}18`,
                    }}
                  >
                    {ENTITY_TYPE_BADGE[ent.entity_type] || ent.entity_type}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {stats.walksCount} {isComet ? "Sling" : isCanine ? "Walks" : "Sessions"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-2">{ent.name}</h3>
                <p className="text-[10.5px] text-zinc-400 line-clamp-2 mt-0.5 min-h-[30px]">
                  {ent.special_care_notes}
                </p>
              </div>

              {/* 1:1 Individual 24h Solar Wheel (shown in Matrix view) */}
              {viewMode === "matrix" && renderSingleEntityWheel(ent)}

              {/* Hydration & Nutrition Progress Bars */}
              <div className="space-y-2.5 pt-2 border-t border-white/[0.07]">
                <div>
                  <div className="flex items-center justify-between text-[10.5px] mb-1">
                    <span className="text-sky-300 flex items-center gap-1 font-medium">
                      <Droplets size={11} /> Hydration
                    </span>
                    <span className="font-mono text-zinc-300">
                      {stats.waterOz} / {ent.daily_water_target_oz} oz
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all"
                      style={{ width: `${waterPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10.5px] mb-1">
                    <span className="text-emerald-300 flex items-center gap-1 font-medium">
                      <Utensils size={11} /> Nutrition
                    </span>
                    <span className="font-mono text-zinc-300">
                      {stats.foodGrams} / {ent.daily_food_target_grams} g
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${foodPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Granular 1-Click Telemetry Loggers */}
              <div className="space-y-2 pt-2 border-t border-white/[0.07]">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() =>
                      logEntityTelemetry(ent.id, "water", { amount: waterStep })
                    }
                    disabled={busyKey === `${ent.id}:water:`}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-200 text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Droplets size={11} /> +{waterStep} fl oz
                  </button>

                  <button
                    onClick={() =>
                      logEntityTelemetry(ent.id, "food", { amount: foodStep })
                    }
                    disabled={busyKey === `${ent.id}:food:`}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Utensils size={11} /> +{foodStep}g Food
                  </button>
                </div>

                <button
                  onClick={() =>
                    logEntityTelemetry(ent.id, "walk", {
                      activity_minutes: isComet ? 8 : 25,
                    })
                  }
                  disabled={busyKey === `${ent.id}:walk:`}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-[10.5px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isComet
                      ? "bg-rose-500/20 hover:bg-rose-500/30 border-rose-400/40 text-rose-200"
                      : "bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/30 text-purple-200"
                  }`}
                >
                  <Footprints size={11} />
                  {isComet
                    ? "Log Parachute Sling Potty"
                    : isCanine
                    ? "Log Potty / Pack Walk"
                    : "Log Movement / Training"}
                </button>

                {ent.medications?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedMed}
                      onChange={(e) =>
                        setSelectedMedByEntity((p) => ({
                          ...p,
                          [ent.id]: e.target.value,
                        }))
                      }
                      className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-zinc-200 truncate"
                    >
                      {ent.medications.map((m) => (
                        <option key={m.id} value={m.name} className="bg-[#090b11]">
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        logEntityTelemetry(ent.id, "medication", {
                          medication_name: selectedMed,
                        })
                      }
                      disabled={
                        busyKey === `${ent.id}:medication:${selectedMed}`
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/35 text-amber-200 text-[10px] font-bold shrink-0 flex items-center gap-1"
                    >
                      <Pill size={10} /> Verify
                    </button>
                  </div>
                )}

                {/* Latest Persisted Telemetry Log Entry */}
                {stats.recentLogs[0] && (
                  <div className="rounded-lg bg-black/35 border border-white/[0.05] px-2.5 py-1.5 text-[10px] text-zinc-400 truncate">
                    <span className="text-zinc-500 font-mono mr-1">
                      {new Date(stats.recentLogs[0].logged_at).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                    {stats.recentLogs[0].notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ExecutiveModuleShell>
  );
}
