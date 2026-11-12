"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  CalendarClock,
  Car,
  CheckCircle2,
  ChefHat,
  Circle,
  Gauge,
  Home,
  Plane,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";

type LogisticsCategory =
  | "culinary"
  | "household_cleaning"
  | "property_maintenance"
  | "vehicle_fleet"
  | "travel"
  | "appointment";

interface ChecklistEntry {
  id: string;
  label: string;
  done: boolean;
}

interface LogisticsItem {
  id: string;
  category: LogisticsCategory;
  title: string;
  description: string | null;
  schedule_interval: string | null;
  interval_value: number;
  last_completed_at: string | null;
  next_due_date: string | null;
  telemetry_metric: string | null;
  current_metric_reading: number | null;
  threshold_metric_due: number | null;
  checklist_items: ChecklistEntry[];
}

interface VaultRecipe {
  id: string;
  title: string;
  method: string;
  tempAndTime: string;
  baseServings: number;
  rawProteinOrCarbG: number;
  seasoningSaltG: number;
  fatOilMl: number;
  notes: string;
}

const VAULT_RECIPES: VaultRecipe[] = [
  {
    id: "air_chicken",
    title: "Air-Fried Chicken Breast Bulk Protocol",
    method: "Butterfly even thickness · Dry-brine 30m · Air-Fry Basket",
    tempAndTime: "390°F · 13–14 min (Pull @ 162°F carry-over to 165°F)",
    baseServings: 4,
    rawProteinOrCarbG: 1000,
    seasoningSaltG: 12,
    fatOilMl: 10,
    notes: "Garlic powder, smoked paprika, cracked pepper + avocado oil mist.",
  },
  {
    id: "cast_ribeye",
    title: "Cast-Iron Reverse-Sear Prime Ribeye",
    method: "Wire-rack convection low bake → Smoking Lodge 12\" sear",
    tempAndTime: "250°F Oven to 118°F internal → 60s/side @ 500°F Cast-Iron",
    baseServings: 2,
    rawProteinOrCarbG: 680,
    seasoningSaltG: 9,
    fatOilMl: 15,
    notes: "Finish basting 20g Kerrygold + crushed garlic clove + rosemary.",
  },
  {
    id: "crispy_russet",
    title: "Par-Boiled Crispy Russet Wedges",
    method: "Alkaline baking-soda par-boil 7m → Rough-shake → Air-Crisp",
    tempAndTime: "400°F · 18 min (Shake halfway)",
    baseServings: 4,
    rawProteinOrCarbG: 1200,
    seasoningSaltG: 10,
    fatOilMl: 12,
    notes: "High-potassium clean glycogen sponge; stores 5 days in glass lock-containers.",
  },
  {
    id: "jasmine_batch",
    title: "Rinsed Jasmine White Rice Batch",
    method: "Triple cold-water starch rinse → 1 : 1.15 water ratio",
    tempAndTime: "Pressure/Rice Cooker · 14 min + 10 min natural steam rest",
    baseServings: 6,
    rawProteinOrCarbG: 540,
    seasoningSaltG: 6,
    fatOilMl: 5,
    notes: "Fluff immediately with rice paddle for rapid gastric-emptying carb base.",
  },
];

function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

function AnimatedCompletionRing({
  done,
  total,
  accent = "#f59e0b",
  size = 64,
}: {
  done: number;
  total: number;
  accent?: string;
  size?: number;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div
      className="relative shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={pct === 100 ? "#10b981" : accent}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-bold text-white">{pct}%</span>
    </div>
  );
}

export default function LifeOpsPage() {
  const [items, setItems] = useState<LogisticsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mutating, setMutating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "culinary" | "property" | "fleet" | "radar"
  >("all");
  const [recipeScale, setRecipeScale] = useState<number>(2);

  // Live Fleet Meter Inputs
  const [titanMilesInput, setTitanMilesInput] = useState<string>("142680");
  const [titanVoltsInput, setTitanVoltsInput] = useState<string>("12.70");
  const [liftHoursInput, setLiftHoursInput] = useState<string>("318.5");

  // Add Logistics Item Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [newItemForm, setNewItemForm] = useState({
    category: "appointment" as LogisticsCategory,
    title: "",
    description: "",
    scheduleInterval: "monthly",
    intervalValue: "30",
    nextDueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    telemetryMetric: "",
    currentMetricReading: "",
    thresholdMetricDue: "",
    checklistText: "",
  });

  const fetchLifeOps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/life-ops", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch LifeOps items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLifeOps();
  }, [fetchLifeOps]);

  // Sync fleet inputs from live database rows
  useEffect(() => {
    const titanMilesRow = items.find(
      (i) =>
        i.category === "vehicle_fleet" &&
        i.title.includes("Titan") &&
        i.telemetry_metric === "miles"
    );
    if (titanMilesRow?.current_metric_reading != null) {
      setTitanMilesInput(String(Math.round(Number(titanMilesRow.current_metric_reading))));
    }
    const titanVoltsRow = items.find(
      (i) =>
        i.category === "vehicle_fleet" &&
        i.title.includes("Titan") &&
        i.telemetry_metric === "volts"
    );
    if (titanVoltsRow?.current_metric_reading != null) {
      setTitanVoltsInput(Number(titanVoltsRow.current_metric_reading).toFixed(2));
    }
    const liftHoursRow = items.find(
      (i) =>
        i.category === "vehicle_fleet" &&
        i.title.includes("Scissor Lift") &&
        i.telemetry_metric === "hours"
    );
    if (liftHoursRow?.current_metric_reading != null) {
      setLiftHoursInput(String(Number(liftHoursRow.current_metric_reading)));
    }
  }, [items]);

  const handleToggleChecklist = async (id: string, index: number) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const copy = [...(it.checklist_items || [])];
        if (copy[index]) copy[index] = { ...copy[index], done: !copy[index].done };
        return { ...it, checklist_items: copy };
      })
    );
    try {
      const res = await fetch("/api/life-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_checklist", id, index }),
      });
      const data = await res.json();
      if (Array.isArray(data.items)) setItems(data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteCycle = async (
    id: string,
    opts?: { resetChecklist?: boolean; advanceThreshold?: boolean }
  ) => {
    setMutating(true);
    try {
      const res = await fetch("/api/life-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_cycle",
          id,
          resetChecklist: opts?.resetChecklist ?? false,
          advanceThreshold: opts?.advanceThreshold ?? false,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.items)) setItems(data.items);
    } finally {
      setMutating(false);
    }
  };

  const handleUpdateFleetMeter = async (params: {
    vehiclePrefix?: string;
    metric?: string;
    id?: string;
    reading: number;
  }) => {
    setMutating(true);
    try {
      const res = await fetch("/api/life-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_telemetry",
          ...params,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.items)) setItems(data.items);
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setMutating(true);
    try {
      const res = await fetch(`/api/life-ops?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (Array.isArray(data.items)) setItems(data.items);
    } finally {
      setMutating(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.title.trim()) return;
    setMutating(true);
    try {
      const checklistItems = newItemForm.checklistText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((label, idx) => ({ id: `chk-${Date.now()}-${idx}`, label, done: false }));

      const res = await fetch("/api/life-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_item",
          category: newItemForm.category,
          title: newItemForm.title.trim(),
          description: newItemForm.description.trim(),
          scheduleInterval: newItemForm.scheduleInterval,
          intervalValue: Number(newItemForm.intervalValue || 1),
          nextDueDate: newItemForm.nextDueDate
            ? new Date(`${newItemForm.nextDueDate}T12:00:00`).toISOString()
            : null,
          telemetryMetric: newItemForm.telemetryMetric.trim() || null,
          currentMetricReading:
            newItemForm.currentMetricReading === ""
              ? null
              : Number(newItemForm.currentMetricReading),
          thresholdMetricDue:
            newItemForm.thresholdMetricDue === ""
              ? null
              : Number(newItemForm.thresholdMetricDue),
          checklistItems,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.items)) setItems(data.items);
      setModalOpen(false);
      setNewItemForm((p) => ({
        ...p,
        title: "",
        description: "",
        checklistText: "",
      }));
    } finally {
      setMutating(false);
    }
  };

  // Partitioned domain slices
  const culinaryItems = useMemo(
    () => items.filter((i) => i.category === "culinary"),
    [items]
  );
  const cleaningZones = useMemo(
    () => items.filter((i) => i.category === "household_cleaning"),
    [items]
  );
  const maintenanceItems = useMemo(
    () => items.filter((i) => i.category === "property_maintenance"),
    [items]
  );
  const fleetItems = useMemo(
    () => items.filter((i) => i.category === "vehicle_fleet"),
    [items]
  );
  const travelItems = useMemo(
    () => items.filter((i) => i.category === "travel"),
    [items]
  );
  const appointmentItems = useMemo(
    () => items.filter((i) => i.category === "appointment"),
    [items]
  );

  // Derived Titan & Scissor Lift rows
  const titanRows = useMemo(
    () => fleetItems.filter((i) => i.title.toLowerCase().includes("titan")),
    [fleetItems]
  );
  const liftRows = useMemo(
    () => fleetItems.filter((i) => i.title.toLowerCase().includes("scissor")),
    [fleetItems]
  );
  const otherFleetRows = useMemo(
    () =>
      fleetItems.filter(
        (i) =>
          !i.title.toLowerCase().includes("titan") &&
          !i.title.toLowerCase().includes("scissor")
      ),
    [fleetItems]
  );

  const titanOilRow = titanRows.find((r) => r.title.toLowerCase().includes("oil"));
  const titanTireRow = titanRows.find((r) => r.title.toLowerCase().includes("tire"));
  const titanVoltRow = titanRows.find((r) => r.telemetry_metric === "volts");

  const liftServiceRow = liftRows.find((r) => r.title.toLowerCase().includes("hours"));
  const liftHydraulicsRow = liftRows.find((r) =>
    r.title.toLowerCase().includes("hydraulic")
  );

  const titanCurrentMiles = Number(titanOilRow?.current_metric_reading ?? 142680);
  const titanOilDue = Number(titanOilRow?.threshold_metric_due ?? 145000);
  const titanTireDue = Number(titanTireRow?.threshold_metric_due ?? 146500);

  const liftCurrentHours = Number(liftServiceRow?.current_metric_reading ?? 318.5);
  const liftServiceDue = Number(liftServiceRow?.threshold_metric_due ?? 350);

  const showCulinary = activeTab === "all" || activeTab === "culinary";
  const showProperty = activeTab === "all" || activeTab === "property";
  const showFleet = activeTab === "all" || activeTab === "fleet";
  const showRadar = activeTab === "all" || activeTab === "radar";

  return (
    <ExecutiveModuleShell
      moduleId="LIFE_OPS"
      eyebrow="Section 15 · Domestic & Fleet Command"
      title="LifeOps — Household, Fleet & Logistics Engine"
      subtitle="Culinary batch runway, animated room sanitation cycles, Nissan Titan & Scissor Lift telemetry, and VA/Medical radar."
      accentColor="#f59e0b"
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Plus size={14} /> Add Logistics Item
          </button>
          <button
            onClick={fetchLifeOps}
            disabled={loading || mutating}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-zinc-300 transition"
          >
            <RefreshCw
              size={13}
              className={loading || mutating ? "animate-spin text-amber-400" : ""}
            />
          </button>
        </div>
      }
    >
      {/* Domain Filter Navigation Bar */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Command Domains", icon: <Sparkles size={13} /> },
            { id: "culinary", label: "Culinary & Batch Runway", icon: <ChefHat size={13} /> },
            { id: "property", label: "Property & Room Cycles", icon: <Home size={13} /> },
            { id: "fleet", label: "Titan SV & Scissor Lift", icon: <Car size={13} /> },
            { id: "radar", label: "Travel & Appointment Radar", icon: <CalendarClock size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === tab.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-3 text-[11px] font-mono text-zinc-400">
          {items.length} Active Directives Synced
        </div>
      </section>

      {/* DOMAIN 1: CULINARY VAULT & BATCH PREP RUNWAY */}
      {showCulinary && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400 flex items-center gap-1.5">
                <ChefHat size={13} /> Culinary Vault & Weekly Batch Prep Runway
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dynamic batch recipe scaler and borosilicate container prep checklist
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 px-2">
                Batch Multiplier:
              </span>
              {[1, 2, 3, 4].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setRecipeScale(mult)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition ${
                    recipeScale === mult
                      ? "bg-amber-500/25 text-amber-200 border border-amber-400/40"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Recipe Scaler Cards (7 cols) */}
            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {VAULT_RECIPES.map((rc) => {
                const rawGrams = rc.rawProteinOrCarbG * recipeScale;
                const rawLbs = (rawGrams / 453.592).toFixed(1);
                return (
                  <div
                    key={rc.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 font-mono text-[10px] font-bold text-amber-300">
                          {rc.baseServings * recipeScale} Containers
                        </span>
                        <span className="font-mono text-xs text-emerald-300 font-bold">
                          {rawGrams}g ({rawLbs} lbs)
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-2">{rc.title}</h3>
                      <p className="text-[11px] text-zinc-400 mt-1">{rc.method}</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/[0.06] text-[11px]">
                      <div className="font-mono text-amber-200">{rc.tempAndTime}</div>
                      <div className="font-mono text-zinc-300">
                        Salt: {rc.seasoningSaltG * recipeScale}g · Oil/Butter:{" "}
                        {rc.fatOilMl * recipeScale}ml
                      </div>
                      <p className="text-zinc-400 text-[10.5px]">{rc.notes}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Batch Prep Checklists (5 cols) */}
            <div className="xl:col-span-5 space-y-3.5">
              {culinaryItems.map((item) => {
                const done = item.checklist_items.filter((c) => c.done).length;
                const total = item.checklist_items.length;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                        <p className="text-[11px] text-zinc-400">{item.description}</p>
                      </div>
                      <AnimatedCompletionRing done={done} total={total} accent="#f59e0b" size={56} />
                    </div>

                    <div className="space-y-1.5">
                      {item.checklist_items.map((chk, idx) => (
                        <button
                          key={chk.id || idx}
                          type="button"
                          onClick={() => handleToggleChecklist(item.id, idx)}
                          className="w-full text-left px-3 py-2 rounded-xl bg-black/35 hover:bg-black/55 border border-white/[0.05] flex items-center gap-2.5 text-xs transition"
                        >
                          {chk.done ? (
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={15} className="text-zinc-500 shrink-0" />
                          )}
                          <span className={chk.done ? "line-through text-zinc-500" : "text-zinc-200"}>
                            {chk.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-zinc-400">
                        Cycle: {item.schedule_interval || "weekly"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCompleteCycle(item.id, { resetChecklist: true })
                        }
                        className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[11px] font-bold text-emerald-300 flex items-center gap-1 transition"
                      >
                        <RotateCcw size={11} /> Complete & Reset Batch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* DOMAIN 2: RESIDENTIAL PROPERTY & ANIMATED ROOM CLEANING CYCLES */}
      {showProperty && (
        <section className="space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400 flex items-center gap-1.5">
              <Home size={13} /> Residential Zones & Recurring Property Infrastructure
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              5 architectural room sanitation rings plus HVAC, Water Softener & Linen Sanitization schedules
            </p>
          </div>

          {/* 5 Room Cleaning Zone Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {cleaningZones.map((zone) => {
              const done = zone.checklist_items.filter((c) => c.done).length;
              const total = zone.checklist_items.length;
              const dLeft = daysUntil(zone.next_due_date);
              return (
                <div
                  key={zone.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                          {zone.schedule_interval || "weekly"}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{zone.title}</h3>
                      </div>
                      <AnimatedCompletionRing
                        done={done}
                        total={total}
                        accent="#38bdf8"
                        size={54}
                      />
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {zone.checklist_items.map((chk, idx) => (
                        <button
                          key={chk.id || idx}
                          type="button"
                          onClick={() => handleToggleChecklist(zone.id, idx)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-black/35 hover:bg-black/55 border border-white/[0.05] flex items-start gap-2 text-[11px] transition"
                        >
                          {chk.done ? (
                            <CheckCircle2
                              size={13}
                              className="text-emerald-400 shrink-0 mt-0.5"
                            />
                          ) : (
                            <Circle size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              chk.done ? "line-through text-zinc-500" : "text-zinc-200"
                            }
                          >
                            {chk.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400">
                      {dLeft !== null ? `Next: ${dLeft}d` : "Active"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCompleteCycle(zone.id, { resetChecklist: true })
                      }
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-emerald-500/20 text-[10.5px] font-bold text-zinc-200 hover:text-emerald-200 transition"
                    >
                      Cycle Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recurring Property Maintenance Row (HVAC, Water Softener, Linen) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {maintenanceItems.map((m) => {
              const dLeft = daysUntil(m.next_due_date);
              const done = m.checklist_items.filter((c) => c.done).length;
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-white/[0.08] bg-black/30 p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[10px] font-mono font-bold text-sky-300 flex items-center gap-1">
                        <Wrench size={10} /> {m.schedule_interval}
                      </span>
                      {dLeft !== null && (
                        <span
                          className={`font-mono text-xs font-bold ${
                            dLeft <= 5 ? "text-amber-300" : "text-zinc-300"
                          }`}
                        >
                          Due in {dLeft}d
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2">{m.title}</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{m.description}</p>

                    <div className="mt-3 space-y-1.5">
                      {m.checklist_items.map((chk, idx) => (
                        <button
                          key={chk.id || idx}
                          type="button"
                          onClick={() => handleToggleChecklist(m.id, idx)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] flex items-center gap-2 text-xs transition"
                        >
                          {chk.done ? (
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={13} className="text-zinc-500 shrink-0" />
                          )}
                          <span className={chk.done ? "line-through text-zinc-500" : "text-zinc-200"}>
                            {chk.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400">
                      {done}/{m.checklist_items.length} verified
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCompleteCycle(m.id, { resetChecklist: true })}
                      className="px-3 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-[11px] font-bold text-sky-200 transition"
                    >
                      Mark Serviced
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* DOMAIN 3: AUTOMOTIVE & HEAVY EQUIPMENT FLEET TELEMETRY */}
      {showFleet && (
        <section className="space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400 flex items-center gap-1.5">
              <Car size={13} /> Automotive & Heavy Equipment Telemetry
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live odometer, battery bus, and engine-hour meters persisted to PostgreSQL
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Dedicated Card 1: 2013 Nissan Titan SV */}
            <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/[0.08] via-white/[0.02] to-transparent p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-[10px] font-mono font-bold text-cyan-300">
                    PRIMARY TRUCK · 5.6L V8 VK56DE
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">
                    2013 Nissan Titan SV
                  </h3>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] uppercase text-zinc-400">Current Odometer</div>
                  <div className="text-2xl font-bold text-white">
                    {titanCurrentMiles.toLocaleString()}{" "}
                    <span className="text-xs text-cyan-300">mi</span>
                  </div>
                </div>
              </div>

              {/* 4 Subsystem Gauges: Oil, Tire Rotation, Battery Voltage, Registration */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                <div className="rounded-xl bg-black/45 border border-white/[0.07] p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400">Oil Change Due</div>
                  <div
                    className={`text-sm font-bold mt-1 ${
                      titanOilDue - titanCurrentMiles <= 500
                        ? "text-rose-400"
                        : "text-emerald-300"
                    }`}
                  >
                    {(titanOilDue - titanCurrentMiles).toLocaleString()} mi
                  </div>
                  <div className="text-[9.5px] text-zinc-500 mt-0.5">
                    @{titanOilDue.toLocaleString()} mi
                  </div>
                </div>

                <div className="rounded-xl bg-black/45 border border-white/[0.07] p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400">Tire Rotation</div>
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    {(titanTireDue - titanCurrentMiles).toLocaleString()} mi
                  </div>
                  <div className="text-[9.5px] text-zinc-500 mt-0.5">
                    @{titanTireDue.toLocaleString()} mi
                  </div>
                </div>

                <div className="rounded-xl bg-black/45 border border-white/[0.07] p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400 flex items-center gap-1">
                    <BatteryCharging size={11} className="text-emerald-400" /> Battery Bus
                  </div>
                  <div className="text-sm font-bold text-emerald-300 mt-1">
                    {Number(titanVoltRow?.current_metric_reading ?? 12.7).toFixed(2)} V
                  </div>
                  <div className="text-[9.5px] text-zinc-500 mt-0.5">Min 12.2V AGM</div>
                </div>

                <div className="rounded-xl bg-black/45 border border-white/[0.07] p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400">Registration</div>
                  <div className="text-sm font-bold text-cyan-200 mt-1">
                    {daysUntil(titanVoltRow?.next_due_date ?? null) ?? 74}d
                  </div>
                  <div className="text-[9.5px] text-zinc-500 mt-0.5">State Renewal</div>
                </div>
              </div>

              {/* Live Odometer & Battery Voltage Meter Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={titanMilesInput}
                    onChange={(e) => setTitanMilesInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 font-mono text-xs text-white"
                    placeholder="Odometer mi"
                  />
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() =>
                      handleUpdateFleetMeter({
                        vehiclePrefix: "2013 Nissan Titan SV",
                        metric: "miles",
                        reading: Number(titanMilesInput || 0),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-bold text-cyan-200 shrink-0 transition"
                  >
                    Sync Miles
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    value={titanVoltsInput}
                    onChange={(e) => setTitanVoltsInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 font-mono text-xs text-white"
                    placeholder="Volts"
                  />
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() =>
                      handleUpdateFleetMeter({
                        vehiclePrefix: "2013 Nissan Titan SV",
                        metric: "volts",
                        reading: Number(titanVoltsInput || 12.6),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-xs font-bold text-emerald-200 shrink-0 transition"
                  >
                    Sync Volts
                  </button>
                </div>
              </div>

              {/* Titan Sub-Checklists */}
              <div className="space-y-2">
                {titanRows.map((tr) => (
                  <div
                    key={tr.id}
                    className="rounded-xl bg-black/30 border border-white/[0.06] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">{tr.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCompleteCycle(tr.id, {
                            resetChecklist: false,
                            advanceThreshold: tr.telemetry_metric === "miles",
                          })
                        }
                        className="text-[10px] font-mono text-cyan-300 hover:underline"
                      >
                        Log Service +Interval
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {tr.checklist_items.map((chk, idx) => (
                        <button
                          key={chk.id || idx}
                          type="button"
                          onClick={() => handleToggleChecklist(tr.id, idx)}
                          className="text-left flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-white"
                        >
                          {chk.done ? (
                            <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={12} className="text-zinc-500 shrink-0" />
                          )}
                          <span className={chk.done ? "line-through text-zinc-500" : ""}>
                            {chk.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dedicated Card 2: Scissor Lift & Heavy Equipment */}
            <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-white/[0.02] to-transparent p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-[10px] font-mono font-bold text-amber-300">
                    AERIAL WORK PLATFORM · HEAVY BAY
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">
                    Scissor Lift & Heavy Equipment
                  </h3>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] uppercase text-zinc-400">Engine / Pump Meter</div>
                  <div className="text-2xl font-bold text-white">
                    {liftCurrentHours.toFixed(1)}{" "}
                    <span className="text-xs text-amber-300">hrs</span>
                  </div>
                </div>
              </div>

              {/* 3 Subsystem Gauges */}
              <div className="grid grid-cols-3 gap-2.5 font-mono">
                <div className="rounded-xl bg-black/45 border border-white/[0.07] p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400 flex items-center gap-1">
                    <Gauge size={11} className="text-amber-400" /> Next PM Service
                  </div>
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    {(liftServiceDue - liftCurrentHours).toFixed(1)} hrs
                  </div>
                  <div className="text-[9.5px] text-zinc-500 mt-0.5">
                    @{liftServiceDue.toFixed(0)} hrs
                  </div>
                </div>

                <div className="rounded-xl bg-black/45 border border-white/[0.07] p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400">Hydraulic Fluid</div>
                  <div className="text-sm font-bold text-emerald-300 mt-1">AW-32 NOMINAL</div>
                  <div className="text-[9.5px] text-zinc-500 mt-0.5">Sight-Glass Verified</div>
                </div>

                <div className="rounded-xl bg-black/45 border border-white/[0.07] p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-400" /> Safety Cert
                  </div>
                  <div className="text-sm font-bold text-cyan-200 mt-1">
                    {daysUntil(liftHydraulicsRow?.next_due_date ?? null) ?? 70}d
                  </div>
                  <div className="text-[9.5px] text-zinc-500 mt-0.5">ANSI A92 Annual</div>
                </div>
              </div>

              {/* Live Engine Hours Meter Update Input */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] flex items-center gap-2.5">
                <span className="text-xs text-zinc-400 shrink-0">Hour Meter:</span>
                <input
                  type="number"
                  step="0.1"
                  value={liftHoursInput}
                  onChange={(e) => setLiftHoursInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 font-mono text-xs text-white"
                />
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() =>
                    handleUpdateFleetMeter({
                      vehiclePrefix: "Scissor Lift",
                      metric: "hours",
                      reading: Number(liftHoursInput || 0),
                    })
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-bold text-amber-200 transition"
                >
                  Update Hours Meter
                </button>
              </div>

              {/* Scissor Lift Checklists */}
              <div className="space-y-2">
                {liftRows.map((lr) => (
                  <div
                    key={lr.id}
                    className="rounded-xl bg-black/30 border border-white/[0.06] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">{lr.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCompleteCycle(lr.id, {
                            resetChecklist: false,
                            advanceThreshold: true,
                          })
                        }
                        className="text-[10px] font-mono text-amber-300 hover:underline"
                      >
                        Log Inspection
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {lr.checklist_items.map((chk, idx) => (
                        <button
                          key={chk.id || idx}
                          type="button"
                          onClick={() => handleToggleChecklist(lr.id, idx)}
                          className="text-left flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-white"
                        >
                          {chk.done ? (
                            <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={12} className="text-zinc-500 shrink-0" />
                          )}
                          <span className={chk.done ? "line-through text-zinc-500" : ""}>
                            {chk.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Any additional custom fleet items added by user */}
          {otherFleetRows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherFleetRows.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-zinc-400">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* DOMAIN 4: TRAVEL RUNWAY & CRITICAL APPOINTMENT RADAR */}
      {showRadar && (
        <section className="space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-400 flex items-center gap-1.5">
              <CalendarClock size={13} /> Travel Runway & Critical Appointment Radar
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Flight/hotel itinerary manifest plus countdown radar for VA / VRE, Medical, Dental & Veterinary
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Flight / Hotel Itinerary Manifest (5 cols) */}
            <div className="xl:col-span-5 space-y-3.5">
              {travelItems.map((tv) => {
                const dLeft = daysUntil(tv.next_due_date);
                return (
                  <div
                    key={tv.id}
                    className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.09] via-white/[0.02] to-transparent p-5 space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/35 text-[10px] font-mono font-bold text-violet-200 flex items-center gap-1 w-fit">
                          <Plane size={11} /> FLIGHT & HOTEL MANIFEST
                        </span>
                        <h3 className="text-base font-bold text-white mt-2">{tv.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {dLeft !== null && (
                          <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 font-mono text-xs font-bold text-violet-200">
                            T-{dLeft}d
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteItem(tv.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {tv.description && (
                      <p className="text-xs text-zinc-300 bg-black/35 border border-white/[0.06] rounded-xl p-3 font-mono">
                        {tv.description}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      {tv.checklist_items.map((chk, idx) => (
                        <button
                          key={chk.id || idx}
                          type="button"
                          onClick={() => handleToggleChecklist(tv.id, idx)}
                          className="w-full text-left px-3 py-2 rounded-xl bg-black/35 hover:bg-black/55 border border-white/[0.05] flex items-center gap-2.5 text-xs transition"
                        >
                          {chk.done ? (
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={14} className="text-zinc-500 shrink-0" />
                          )}
                          <span className={chk.done ? "line-through text-zinc-500" : "text-zinc-200"}>
                            {chk.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Critical Appointment Radar Cards (7 cols) */}
            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointmentItems.map((ap) => {
                const dLeft = daysUntil(ap.next_due_date);
                const urgent = dLeft !== null && dLeft <= 7;
                return (
                  <div
                    key={ap.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 ${
                      urgent
                        ? "border-amber-400/45 bg-amber-500/[0.07]"
                        : "border-white/[0.08] bg-white/[0.025]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono font-bold text-zinc-200 flex items-center gap-1">
                          <Stethoscope size={11} className="text-amber-400" />
                          {ap.schedule_interval || "scheduled"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                              urgent
                                ? "bg-amber-500/25 text-amber-200 border border-amber-400/50"
                                : "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                            }`}
                          >
                            {dLeft !== null
                              ? dLeft >= 0
                                ? `D-${dLeft} Days`
                                : `${Math.abs(dLeft)}d Overdue`
                              : "TBD"}
                          </span>
                          <button
                            onClick={() => handleDeleteItem(ap.id)}
                            className="text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-2">{ap.title}</h3>
                      <p className="text-[11px] text-zinc-400 mt-1">{ap.description}</p>

                      <div className="mt-3 space-y-1.5">
                        {ap.checklist_items.map((chk, idx) => (
                          <button
                            key={chk.id || idx}
                            type="button"
                            onClick={() => handleToggleChecklist(ap.id, idx)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg bg-black/35 hover:bg-black/55 flex items-center gap-2 text-[11px] transition"
                          >
                            {chk.done ? (
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            ) : (
                              <Circle size={13} className="text-zinc-500 shrink-0" />
                            )}
                            <span
                              className={
                                chk.done ? "line-through text-zinc-500" : "text-zinc-200"
                              }
                            >
                              {chk.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {ap.next_due_date
                          ? new Date(ap.next_due_date).toLocaleDateString()
                          : "Unscheduled"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCompleteCycle(ap.id, { resetChecklist: true })
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[11px] font-bold text-emerald-200 transition"
                      >
                        Mark Completed
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* + ADD LOGISTICS ITEM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateItem}
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0d111a] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">
                  LifeOps Command Directive
                </div>
                <h2 className="text-base font-bold text-white">Add Logistics Item</h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Domain Category
                </label>
                <select
                  value={newItemForm.category}
                  onChange={(e) =>
                    setNewItemForm({
                      ...newItemForm,
                      category: e.target.value as LogisticsCategory,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                >
                  <option value="appointment">Critical Appointment (VA/Med/Vet)</option>
                  <option value="travel">Travel Itinerary / Manifest</option>
                  <option value="culinary">Culinary & Batch Prep</option>
                  <option value="household_cleaning">Room Cleaning Zone</option>
                  <option value="property_maintenance">Property Maintenance</option>
                  <option value="vehicle_fleet">Vehicle / Equipment Fleet</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={newItemForm.nextDueDate}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, nextDueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={newItemForm.title}
                onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
                placeholder="e.g., VA / VRE Semiannual Check-In or Generator Load Test"
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Operational Details / Manifest Notes
              </label>
              <input
                type="text"
                value={newItemForm.description}
                onChange={(e) =>
                  setNewItemForm({ ...newItemForm, description: e.target.value })
                }
                placeholder="Confirmation #, flight seat, part #, or protocol notes..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Interval Label
                </label>
                <input
                  type="text"
                  value={newItemForm.scheduleInterval}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, scheduleInterval: e.target.value })
                  }
                  placeholder="weekly / quarterly"
                  className="w-full px-2.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Metric Unit (opt)
                </label>
                <input
                  type="text"
                  value={newItemForm.telemetryMetric}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, telemetryMetric: e.target.value })
                  }
                  placeholder="miles / hours"
                  className="w-full px-2.5 py-2 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Current Reading
                </label>
                <input
                  type="number"
                  step="any"
                  value={newItemForm.currentMetricReading}
                  onChange={(e) =>
                    setNewItemForm({
                      ...newItemForm,
                      currentMetricReading: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-2.5 py-2 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Checklist Steps (One per line)
              </label>
              <textarea
                rows={3}
                value={newItemForm.checklistText}
                onChange={(e) =>
                  setNewItemForm({ ...newItemForm, checklistText: e.target.value })
                }
                placeholder={"Prepare documentation\nConfirm appointment 24h prior"}
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutating}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition"
              >
                Create Directive
              </button>
            </div>
          </form>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
