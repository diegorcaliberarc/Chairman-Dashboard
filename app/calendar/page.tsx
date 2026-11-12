"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Layers,
  MoreHorizontal,
  Orbit,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { CircadianDialStage } from "@/components/circadian/CircadianDialStage";
import { CircadianEventModal } from "@/components/circadian/CircadianEventModal";
import { buildDefaultCircadianEvents } from "@/lib/circadianDefaults";
import {
  CircadianEventDTO,
  DOMAIN_CONFIG,
} from "@/lib/circadianTypes";
import {
  dateToMinutes,
  getCircadianPhase,
  getDurationMinutes,
  minutesTo12Hour,
} from "@/lib/circadianMath";

interface DbTaskLite {
  id: string;
  title: string;
  pillar: string;
  category?: string;
  status: string;
  parentId?: string | null;
}

function toLocalDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CircadianCalendarPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const calConnected = !!(session as any)?.accessToken;

  // Sidebar & global UI states
  const [activeTab, setActiveTab] = useState("CALENDAR");
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [deepWork, setDeepWork] = useState(false);

  // Date & Real-Time Solar Orbit states
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toLocalDateInputValue(new Date())
  );
  const [liveMinutes, setLiveMinutes] = useState<number>(() =>
    dateToMinutes(new Date(), true)
  );
  const [scrubbedMinutes, setScrubbedMinutes] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"solar" | "quadrants">("solar");

  // Circadian events, Chairman tasks, KPIs & Modal state
  const [events, setEvents] = useState<CircadianEventDTO[]>(() =>
    buildDefaultCircadianEvents()
  );
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CircadianEventDTO | null>(
    null
  );

  const [tasks, setTasks] = useState<DbTaskLite[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(false);
  const [healthScore, setHealthScore] = useState<number>(92);
  const [activeTelemetryFilter, setActiveTelemetryFilter] = useState<
    string | null
  >(null);
  const [syncingGCal, setSyncingGCal] = useState<boolean>(false);

  // Real-Time Solar Beacon ticker (updates smoothly every 5s)
  useEffect(() => {
    const tick = () => setLiveMinutes(dateToMinutes(new Date(), true));
    tick();
    const timer = setInterval(tick, 5000);
    return () => clearInterval(timer);
  }, []);

  // Load Circadian Events for selected date
  const fetchCircadianEvents = useCallback(async (dateStr: string) => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/circadian?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        } else {
          setEvents(buildDefaultCircadianEvents(dateStr));
        }
      }
    } catch (err) {
      console.error("Failed to fetch circadian events:", err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchCircadianEvents(selectedDate);
  }, [selectedDate, fetchCircadianEvents]);

  // Load Chairman Dashboard Tasks & Health KPIs for Daily Focus + Micro-Statistics
  useEffect(() => {
    setTasksLoading(true);
    fetch("/api/tasks")
      .then((r) => (r.ok ? r.json() : { tasks: [] }))
      .then((d) => {
        if (Array.isArray(d.tasks)) setTasks(d.tasks);
      })
      .catch(() => {})
      .finally(() => setTasksLoading(false));

    fetch("/api/metrics")
      .then((r) => (r.ok ? r.json() : { metrics: [] }))
      .then((d) => {
        if (Array.isArray(d.metrics) && d.metrics.length > 0) {
          const healthItems = d.metrics.filter(
            (m: any) => m.category === "health"
          );
          if (healthItems.length > 0) {
            const ratios = healthItems.map((m: any) =>
              m.target > 0 ? Math.min(1.1, m.value / m.target) : 0.9
            );
            const avg =
              ratios.reduce((acc: number, v: number) => acc + v, 0) /
              ratios.length;
            setHealthScore(Math.max(68, Math.min(99, Math.round(avg * 94))));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Optional Google Calendar import merge
  const handleImportGoogleCalendar = async () => {
    if (!calConnected) {
      signIn("google");
      return;
    }
    setSyncingGCal(true);
    try {
      const res = await fetch("/api/calendar");
      if (!res.ok) return;
      const data = await res.json();
      const gEvents = (data.events ?? []) as any[];
      const dayPrefix = selectedDate;

      const todaysGCal = gEvents.filter((g) => {
        const dt = g?.start?.dateTime;
        return typeof dt === "string" && dt.startsWith(dayPrefix);
      });

      for (const g of todaysGCal) {
        const alreadyExists = events.some(
          (ev) => ev.title.toLowerCase() === (g.summary || "").toLowerCase()
        );
        if (!alreadyExists && g.summary && g.start?.dateTime && g.end?.dateTime) {
          await fetch("/api/circadian", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: g.summary,
              description: "Synced from Google Calendar",
              domain: "engineering",
              startTime: g.start.dateTime,
              endTime: g.end.dateTime,
              isRecurring: false,
              mediaUrl: "/circadian/saas-build.jpg",
              accentColor: "#38bdf8",
              telemetrySource: "clickup",
              checklists: [
                { label: "Execute scheduled calendar session", isCompleted: false },
              ],
            }),
          });
        }
      }
      await fetchCircadianEvents(selectedDate);
    } finally {
      setSyncingGCal(false);
    }
  };

  // Toggle checklist item (optimistic + DB persistence)
  const handleToggleChecklist = async (
    eventId: string,
    checklistId: string,
    nextVal: boolean
  ) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              checklists: ev.checklists.map((c) =>
                c.id === checklistId ? { ...c, isCompleted: nextVal } : c
              ),
            }
          : ev
      )
    );

    if (!checklistId.startsWith("chk-")) {
      try {
        await fetch("/api/circadian", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "toggle_checklist",
            checklistId,
            isCompleted: nextVal,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Quick-add checklist item inside dial inspector
  const handleAddChecklist = async (eventId: string, label: string) => {
    const tempId = `chk-${Date.now()}`;
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              checklists: [
                ...ev.checklists,
                {
                  id: tempId,
                  eventId,
                  label,
                  isCompleted: false,
                  sortOrder: ev.checklists.length,
                },
              ],
            }
          : ev
      )
    );

    if (!eventId.startsWith("default-")) {
      try {
        const res = await fetch("/api/circadian", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_checklist",
            eventId,
            label,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.checklist) {
            setEvents((prev) =>
              prev.map((ev) =>
                ev.id === eventId
                  ? {
                      ...ev,
                      checklists: ev.checklists.map((c) =>
                        c.id === tempId ? data.checklist : c
                      ),
                    }
                  : ev
              )
            );
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Save (Create or Update) Circadian Event
  const handleSaveEvent = async (payload: any, syncGoogleCal: boolean) => {
    const isEdit = Boolean(payload.id && !String(payload.id).startsWith("default-"));
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch("/api/circadian", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await fetchCircadianEvents(selectedDate);
    } else {
      // Optimistic local fallback
      const localEv: CircadianEventDTO = {
        id: payload.id || `local-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        domain: payload.domain,
        startTime: payload.startTime,
        endTime: payload.endTime,
        isRecurring: payload.isRecurring,
        mediaUrl: payload.mediaUrl,
        mediaType: payload.mediaType,
        mediaAspectRatio: "16:9",
        accentColor: payload.accentColor,
        quadrantSlot: payload.quadrantSlot,
        telemetrySource: payload.telemetrySource,
        checklists: (payload.checklists || []).map((c: any, idx: number) => ({
          id: c.id || `chk-${Date.now()}-${idx}`,
          label: c.label,
          isCompleted: Boolean(c.isCompleted),
          sortOrder: idx,
        })),
      };
      setEvents((prev) =>
        payload.id
          ? prev.map((e) => (e.id === payload.id ? localEv : e))
          : [...prev, localEv]
      );
    }

    if (syncGoogleCal && calConnected) {
      fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          start: payload.startTime,
          end: payload.endTime,
        }),
      }).catch(console.error);
    }
  };

  // Delete Circadian Event
  const handleDeleteEvent = async (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    if (selectedEventId === eventId) setSelectedEventId(null);
    if (!eventId.startsWith("default-") && !eventId.startsWith("local-")) {
      await fetch(`/api/circadian?id=${eventId}`, { method: "DELETE" }).catch(
        console.error
      );
    }
  };

  // Toggle Chairman Task from Daily Focus panel
  const handleToggleChairmanTask = async (task: DbTaskLite) => {
    const nextStatus = task.status === "DONE" ? "PENDING" : "DONE";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: nextStatus }),
    }).catch(() => {});
  };

  const shiftDate = (deltaDays: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + deltaDays);
    setSelectedDate(toLocalDateInputValue(next));
  };

  const effectiveMinutes = scrubbedMinutes ?? liveMinutes;
  const currentPhase = getCircadianPhase(effectiveMinutes);

  // Sorted Agenda items
  const sortedAgenda = useMemo(() => {
    return [...events]
      .map((ev) => {
        const sMin = dateToMinutes(new Date(ev.startTime));
        const eMin = dateToMinutes(new Date(ev.endTime));
        const totalChecks = ev.checklists.length;
        const doneChecks = ev.checklists.filter((c) => c.isCompleted).length;
        const isPast = eMin > sMin && effectiveMinutes >= eMin;
        const isComplete =
          (totalChecks > 0 && doneChecks === totalChecks) || isPast;
        return {
          event: ev,
          sMin,
          eMin,
          doneChecks,
          totalChecks,
          isComplete,
        };
      })
      .sort((a, b) => a.sMin - b.sMin);
  }, [events, effectiveMinutes]);

  // Real-time micro-statistics calculation
  const telemetryVelocity = useMemo(() => {
    const scheduledMins = events.reduce((acc, ev) => {
      const s = dateToMinutes(new Date(ev.startTime));
      const e = dateToMinutes(new Date(ev.endTime));
      return acc + getDurationMinutes(s, e);
    }, 0);
    const completedChecks = events.reduce(
      (acc, ev) => acc + ev.checklists.filter((c) => c.isCompleted).length,
      0
    );
    return scheduledMins + completedChecks * 42;
  }, [events]);

  const activeTopTasks = useMemo(
    () => tasks.filter((t) => !t.parentId && t.status !== "ARCHIVED").slice(0, 3),
    [tasks]
  );

  const activeTasksCount = tasks.filter(
    (t) => !t.parentId && t.status !== "DONE" && t.status !== "ARCHIVED"
  ).length;
  const activeSubtasksCount = tasks.filter(
    (t) => t.parentId && t.status !== "DONE" && t.status !== "ARCHIVED"
  ).length;

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-[#090b11] text-white flex flex-row overflow-x-hidden">
      {/* Shared Executive Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        calConnected={calConnected}
        onCalToggle={() =>
          calConnected ? signOut({ redirect: false }) : signIn("google")
        }
        isAppearanceOpen={isAppearanceOpen}
        setIsAppearanceOpen={setIsAppearanceOpen}
        user={user}
        deepWork={deepWork}
        setDeepWork={setDeepWork}
        activeTasksCount={activeTasksCount}
        activeSubtasksCount={activeSubtasksCount}
        tasksLoading={tasksLoading}
      />

      {/* Main Circadian Solar Command Deck */}
      <div className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_42%_48%,_#111827_0%,_#090b11_68%)]">
        {/* Top Control Header */}
        <header className="px-6 pt-5 pb-2 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: currentPhase.pillColor }}
                />
                <h1 className="text-sm font-bold tracking-[0.18em] uppercase text-zinc-100">
                  Circadian Solar Arc
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border"
                  style={{
                    color: currentPhase.pillColor,
                    borderColor: `${currentPhase.pillColor}44`,
                    backgroundColor: `${currentPhase.pillColor}14`,
                  }}
                >
                  {currentPhase.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {currentPhase.subtitle}
              </p>
            </div>
          </div>

          {/* Date Controls + View Switcher + Add Event */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Stepper */}
            <div className="flex items-center bg-[#12151f] border border-white/10 rounded-xl p-1">
              <button
                onClick={() => shiftDate(-1)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() =>
                  setSelectedDate(toLocalDateInputValue(new Date()))
                }
                className="px-3 py-1 text-xs font-semibold text-zinc-200 hover:text-amber-300 transition-colors flex items-center gap-1.5"
              >
                <CalendarIcon size={12} className="text-amber-400" />
                {formattedSelectedDate}
              </button>
              <button
                onClick={() => shiftDate(1)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Next Day"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Solar Wedges vs Quadrant Bezier Cards Mode */}
            <div className="flex items-center bg-[#12151f] border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode("solar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  viewMode === "solar"
                    ? "bg-white/10 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Orbit size={13} className="text-amber-400" />
                Solar Arc
              </button>
              <button
                onClick={() => setViewMode("quadrants")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  viewMode === "quadrants"
                    ? "bg-white/10 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Layers size={13} className="text-sky-400" />
                Quadrant Tracers
              </button>
            </div>

            {/* New Circadian Block Button */}
            <button
              onClick={() => {
                setEditingEvent(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.28)] hover:brightness-110 transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Block
            </button>
          </div>
        </header>

        {/* Main Workspace Split: Center Celestial Dial + Right Executive Rail */}
        <div className="flex-1 flex flex-col xl:flex-row gap-5 px-6 py-4 items-stretch">
          {/* LEFT / CENTER STAGE: 24-Hour Celestial Dial + Bottom-Left Micro-Statistics */}
          <div className="relative flex-1 flex flex-col items-center justify-center min-h-[580px]">
            <CircadianDialStage
              events={events}
              highlightedTelemetry={activeTelemetryFilter}
              currentMinutes={effectiveMinutes}
              isLiveTime={scrubbedMinutes === null}
              onScrubMinutes={(mins) => setScrubbedMinutes(mins)}
              onResetLive={() => setScrubbedMinutes(null)}
              viewMode={viewMode}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              onToggleChecklist={handleToggleChecklist}
              onEditEvent={(ev) => {
                setEditingEvent(ev);
                setModalOpen(true);
              }}
              onDeleteEvent={handleDeleteEvent}
              onAddChecklist={handleAddChecklist}
            />

            {/* Bottom-Left Floating Card: MICRO-STATISTICS (Reference Image Exact Match) */}
            <div className="xl:absolute xl:left-1 xl:bottom-2 z-20 w-full xl:w-[272px] rounded-2xl bg-[#12151e]/90 backdrop-blur-xl border border-white/[0.08] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-400">
                  MICRO-STATISTICS
                </span>
                {loadingEvents && (
                  <RefreshCw size={11} className="animate-spin text-zinc-500" />
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                {/* Real-Time Velocity Counter */}
                <div className="pr-4 border-r border-white/10">
                  <div
                    className="text-2xl font-bold text-white tracking-tight leading-none"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {telemetryVelocity.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Real-Time
                  </div>
                </div>

                {/* Circular Health Score Ring Gauge */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative w-12 h-12 shrink-0">
                    <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="19"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="19"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(healthScore / 100) * 119.4} 119.4`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-amber-400">
                      <HeartPulse size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-100 leading-tight">
                      Health
                    </div>
                    <div className="text-xs font-semibold text-zinc-300 leading-tight">
                      Score{" "}
                      <span className="text-amber-400 font-mono text-[11px]">
                        {healthScore}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Color Legend Pill Bar (Bottom Center) */}
            <div className="mt-3 xl:mt-0 xl:absolute xl:bottom-2 xl:right-4 hidden 2xl:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#12151e]/80 border border-white/[0.07] text-[10px] text-zinc-400">
              {(
                [
                  ["physical_training", "Training"],
                  ["engineering", "Engineering"],
                  ["nutrition", "Nutrition"],
                  ["family_pets", "Pack & Family"],
                ] as const
              ).map(([dom, lbl]) => (
                <span key={dom} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DOMAIN_CONFIG[dom].color }}
                  />
                  {lbl}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT EXECUTIVE RAIL: DAILY FOCUS + AGENDA + INTEGRATION BADGES */}
          <aside className="w-full xl:w-[336px] shrink-0 flex flex-col gap-4">
            {/* 1. DAILY FOCUS & AGENDA Unified Glass Card */}
            <div className="flex-1 rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 flex flex-col gap-5 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
              {/* DAILY FOCUS SECTION */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-[0.12em] uppercase text-zinc-100">
                    DAILY FOCUS
                  </h2>
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setModalOpen(true);
                    }}
                    className="text-zinc-400 hover:text-white transition-colors"
                    title="Add Focus Block"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 mb-3">
                  Quick task cards
                </p>

                <div className="space-y-2.5">
                  {/* Live Circadian Focus Cards (Top 2 Daytime Blocks) */}
                  {events
                    .filter((ev) => ev.domain !== "logistics")
                    .slice(0, 2)
                    .map((ev) => {
                      const primaryChk = ev.checklists[0];
                      const secondaryChk = ev.checklists[1];
                      return (
                        <div
                          key={`focus-${ev.id}`}
                          onClick={() =>
                            setSelectedEventId(
                              selectedEventId === ev.id ? null : ev.id
                            )
                          }
                          className={`rounded-xl bg-[#191d29] hover:bg-[#1e2332] border p-3 transition-all cursor-pointer ${
                            selectedEventId === ev.id
                              ? "border-amber-400/50"
                              : "border-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (primaryChk) {
                                  handleToggleChecklist(
                                    ev.id,
                                    primaryChk.id,
                                    !primaryChk.isCompleted
                                  );
                                }
                              }}
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                primaryChk?.isCompleted
                                  ? "bg-amber-400 border-amber-400 text-black"
                                  : "border-zinc-500 bg-transparent"
                              }`}
                            >
                              {primaryChk?.isCompleted && (
                                <Check size={11} strokeWidth={3} />
                              )}
                            </button>
                            <span className="text-xs font-semibold text-zinc-100 truncate">
                              {ev.title}
                            </span>
                          </div>

                          {secondaryChk ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleChecklist(
                                  ev.id,
                                  secondaryChk.id,
                                  !secondaryChk.isCompleted
                                );
                              }}
                              className="flex items-center gap-2.5 mt-2 pl-0.5"
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                  secondaryChk.isCompleted
                                    ? "bg-amber-400/80 border-amber-400 text-black"
                                    : "border-zinc-600 bg-transparent"
                                }`}
                              >
                                {secondaryChk.isCompleted && (
                                  <Check size={9} strokeWidth={3} />
                                )}
                              </span>
                              <span
                                className={`text-[11px] truncate ${
                                  secondaryChk.isCompleted
                                    ? "line-through text-zinc-500"
                                    : "text-zinc-400"
                                }`}
                              >
                                {secondaryChk.label}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-zinc-400 mt-1.5 pl-6 line-clamp-2">
                              {primaryChk?.label ||
                                DOMAIN_CONFIG[ev.domain].label}
                            </p>
                          )}
                        </div>
                      );
                    })}

                  {/* Live Chairman Tasks (Synced from /api/tasks if present) */}
                  {activeTopTasks.slice(0, 1).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleChairmanTask(t)}
                      className="rounded-xl bg-[#191d29] hover:bg-[#1e2332] border border-white/[0.06] p-3 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            t.status === "DONE"
                              ? "bg-amber-400 border-amber-400 text-black"
                              : "border-zinc-500"
                          }`}
                        >
                          {t.status === "DONE" && (
                            <Check size={11} strokeWidth={3} />
                          )}
                        </span>
                        <span
                          className={`text-xs font-semibold truncate ${
                            t.status === "DONE"
                              ? "line-through text-zinc-500"
                              : "text-zinc-100"
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-zinc-400 mt-1 pl-6">
                        Chairman Queue · {t.category || t.pillar}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/[0.07]" />

              {/* AGENDA SECTION */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3.5">
                  <h2 className="text-xs font-bold tracking-[0.12em] uppercase text-zinc-100">
                    AGENDA
                  </h2>
                  <button
                    onClick={handleImportGoogleCalendar}
                    disabled={syncingGCal}
                    className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-amber-300 transition-colors"
                    title="Sync Google Calendar Events"
                  >
                    <RefreshCw
                      size={12}
                      className={syncingGCal ? "animate-spin text-amber-400" : ""}
                    />
                    {calConnected ? "Sync GCal" : "Connect GCal"}
                  </button>
                </div>

                <div className="relative space-y-3.5 overflow-y-auto pr-1">
                  {/* Subtle Vertical Timeline Spine */}
                  <div className="pointer-events-none absolute left-[9px] top-3 bottom-3 w-px bg-white/10" />

                  {sortedAgenda.map(
                    ({ event, sMin, doneChecks, totalChecks, isComplete }) => {
                      const isSelected = selectedEventId === event.id;
                      const hh = String(Math.floor(sMin / 60)).padStart(2, "0");
                      const mm = String(Math.floor(sMin % 60)).padStart(2, "0");

                      return (
                        <div
                          key={`agenda-${event.id}`}
                          onClick={() =>
                            setSelectedEventId(isSelected ? null : event.id)
                          }
                          className={`relative flex items-start gap-3 pl-0.5 py-1 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-white/[0.06] pr-2"
                              : "hover:bg-white/[0.03]"
                          }`}
                        >
                          {/* Timeline Node Check Badge */}
                          <span
                            className={`relative z-10 mt-0.5 w-[19px] h-[19px] rounded-full flex items-center justify-center border shrink-0 transition-all ${
                              isComplete
                                ? "border-transparent text-black shadow-sm"
                                : "bg-[#12151e] border-zinc-600 text-zinc-400"
                            }`}
                            style={
                              isComplete
                                ? { backgroundColor: event.accentColor || "#fbbf24" }
                                : undefined
                            }
                          >
                            <Check size={10} strokeWidth={3} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-zinc-100 truncate">
                              <span
                                className="font-mono mr-1.5 text-zinc-300"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                              >
                                {hh}:{mm}
                              </span>
                              {event.title}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                              Status:{" "}
                              {totalChecks > 0
                                ? `${doneChecks}/${totalChecks} protocol · ${DOMAIN_CONFIG[event.domain].shortLabel}`
                                : DOMAIN_CONFIG[event.domain].label}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* 2. INTEGRATION BADGES Glass Card (Reference Image Bottom-Right Match) */}
            <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-300">
                  INTEGRATION BADGES
                </h3>
                {activeTelemetryFilter && (
                  <button
                    onClick={() => setActiveTelemetryFilter(null)}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Show All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    id: "clickup",
                    label: "ClickUp",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path
                          d="M5 14.5L12 8.5L19 14.5"
                          fill="none"
                          stroke="#ec4899"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.5 17.5C8.2 19 10 19.7 12 19.7C14 19.7 15.8 19 17.5 17.5"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    id: "plaid",
                    label: "Plaid",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-zinc-100">
                        <path
                          d="M8 4L20 16M4 8L16 20M16 4L4 16M20 8L8 20"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    id: "garmin",
                    label: "Garmin",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <polygon
                          points="12,5 20,19 4,19"
                          fill="#38bdf8"
                        />
                      </svg>
                    ),
                  },
                  {
                    id: "supabase",
                    label: "Supabase",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path
                          d="M13 3L5 14H12L11 21L19 10H12L13 3Z"
                          fill="#10b981"
                        />
                      </svg>
                    ),
                  },
                ].map((badge) => {
                  const isFiltered = activeTelemetryFilter === badge.id;
                  return (
                    <button
                      key={badge.id}
                      onClick={() =>
                        setActiveTelemetryFilter(isFiltered ? null : badge.id)
                      }
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all ${
                        isFiltered
                          ? "bg-white/15 border-amber-400/60"
                          : "bg-[#191d29] hover:bg-[#202636] border-white/[0.05]"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center">
                        {badge.icon}
                      </div>
                      <span className="text-[10px] font-medium text-zinc-300">
                        {badge.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Add / Edit Circadian Event Modal */}
      <CircadianEventModal
        isOpen={modalOpen}
        initialEvent={editingEvent}
        selectedDate={selectedDate}
        calConnected={calConnected}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
      />
    </div>
  );
}

