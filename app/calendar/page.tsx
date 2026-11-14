"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Activity,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  HeartPulse,
  Highlighter,
  Layers,
  ListOrdered,
  MoreHorizontal,
  Orbit,
  Plus,
  Radar,
  RefreshCw,
  Shuffle,
  UserCheck,
  Wallet,
  Zap,
  Grid,
  Clock,
  Menu,
  Sparkles,
  ExternalLink,
  Sliders,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

// Traditional / Google Calendar Components
import { MonthView, CalendarEventItem } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { FourDayView } from "@/components/calendar/FourDayView";
import { YearView } from "@/components/calendar/YearView";
import { ScheduleView } from "@/components/calendar/ScheduleView";
import { MiniMonthCalendar } from "@/components/calendar/MiniMonthCalendar";
import { CalendarQuickPopover } from "@/components/calendar/CalendarQuickPopover";
import { CalendarEventModal as TraditionalEventModal } from "@/components/calendar/CalendarEventModal";

// Circadian & Temporal Horizon Components
import {
  CircadianDialStage,
  CircadianRadarLayerDTO,
  RadarLayerKey,
} from "@/components/circadian/CircadianDialStage";
import { CalendarOpsCommandDeck } from "@/components/circadian/CalendarOpsCommandDeck";
import { CircadianEventModal } from "@/components/circadian/CircadianEventModal";
import { buildDefaultCircadianEvents } from "@/lib/circadianDefaults";
import {
  CURATED_BLOCK_PALETTE,
  CalendarHabitDTO,
  CalendarHighlightSpanDTO,
  CircadianEventDTO,
  DOMAIN_CONFIG,
  SubtaskListStyle,
  WorkPaySummaryDTO,
  WorkShiftConfigDTO,
  YearlyAppointmentDTO,
  formatSubtaskMarker,
} from "@/lib/circadianTypes";
import {
  dateToMinutes,
  getCircadianPhase,
  getDurationMinutes,
  minutesToHHMM,
} from "@/lib/circadianMath";
import { HorizonLevel, DayMode } from "@/lib/temporalTypes";
import {
  getWeekDays,
  getMonthNodes,
  getSeasonCards,
  EL_PASO_TACTICAL_WAYPOINTS,
  EL_PASO_ROUTE_LEGS,
} from "@/lib/temporalData";
import { HorizonNavigationControl } from "@/components/temporal/HorizonNavigationControl";
import { WeeklyRadialView } from "@/components/temporal/WeeklyRadialView";
import { MonthlyRadialView } from "@/components/temporal/MonthlyRadialView";
import { YearlyRadialView } from "@/components/temporal/YearlyRadialView";
import { GeospatialTacticalMap } from "@/components/temporal/GeospatialTacticalMap";

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

function buildGoToWorkShowcaseEvent(baseDateStr?: string): CircadianEventDTO {
  const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();
  return {
    id: "default-go-to-work",
    title: "Go to Work",
    description:
      "07:00–08:00 opening shift block with Roman-numeral execution subtasks.",
    startTime: new Date(y, m, d, 7, 0, 0).toISOString(),
    endTime: new Date(y, m, d, 8, 0, 0).toISOString(),
    domain: "engineering",
    accentColor: "#f59e0b",
    isRecurring: true,
    recurrenceRule: "FREQ=DAILY",
    mediaUrl: "/circadian/saas-build.jpg",
    mediaType: "image",
    mediaAspectRatio: "16:9",
    checklists: [
      { id: "gtw-chk-1", label: "Inspect dispatch queue & active tickets", isCompleted: true, sortOrder: 0 },
      { id: "gtw-chk-2", label: "Verify telemetry pipelines & edge monitors", isCompleted: true, sortOrder: 1 },
      { id: "gtw-chk-3", label: "Conduct team standup & allocate blockers", isCompleted: false, sortOrder: 2 },
      { id: "gtw-chk-4", label: "Finalize morning roadmap commitment", isCompleted: false, sortOrder: 3 },
    ],
  };
}

function ensureGoToWorkInEvents(
  list: CircadianEventDTO[],
  dateStr?: string
): CircadianEventDTO[] {
  const hasWork = list.some((e) =>
    e.title.toLowerCase().includes("go to work")
  );
  if (hasWork) return list;
  return [buildGoToWorkShowcaseEvent(dateStr), ...list];
}

export default function UnifiedMasterCalendarPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const calConnected = !!(session as any)?.accessToken;

  // Master Engine Mode Switcher: "solar" (Circadian Arc) vs "google" (Google Calendar Grid)
  const [engineMode, setEngineMode] = useState<"solar" | "google">("solar");

  // Google Calendar Engine Views: "day" | "four_day" | "month" | "year" | "schedule"
  const [googleViewMode, setGoogleViewMode] = useState<"day" | "four_day" | "month" | "year" | "schedule">("month");
  const [isMiniDrawerOpen, setIsMiniDrawerOpen] = useState(true);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Date & Real-Time Solar Orbit states
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toLocalDateInputValue(new Date())
  );
  const [currentDateObj, setCurrentDateObj] = useState<Date>(new Date());
  const [liveMinutes, setLiveMinutes] = useState<number>(() =>
    dateToMinutes(new Date(), true)
  );
  const [scrubbedMinutes, setScrubbedMinutes] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"solar" | "quadrants">("solar");

  // Multi-Horizon Temporal State: DAY (SOLAR / 3D MAP), WEEK, MONTH, YEAR
  const [activeHorizon, setActiveHorizon] = useState<HorizonLevel>("DAY");
  const [dayMode, setDayMode] = useState<DayMode>("SOLAR_WHEEL");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeMonthIndex, setActiveMonthIndex] = useState<number>(10); // Nov (0-indexed)

  // Circadian events, Chairman tasks, KPIs & Modal state
  const [events, setEvents] = useState<CircadianEventDTO[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CircadianEventDTO | null>(null);

  // Google Calendar Popovers & Modals
  const [quickPopoverEvent, setQuickPopoverEvent] = useState<CalendarEventItem | null>(null);
  const [fullEditorEvent, setFullEditorEvent] = useState<CalendarEventItem | null>(null);
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
  const [editorInitialDate, setEditorInitialDate] = useState<string>("");
  const [editorInitialTime, setEditorInitialTime] = useState<string>("09:00");
  const [isSyncingGCal, setIsSyncingGCal] = useState(false);

  // Filter Visibility
  const [visibleCalendars, setVisibleCalendars] = useState<Record<string, boolean>>({
    work: true,
    workout: true,
    personal: true,
    pms_task: true,
    google_sync: true,
  });

  // Nested Subtasks Style & Agenda Expansion state
  const [globalSubtaskStyle, setGlobalSubtaskStyle] = useState<SubtaskListStyle>("roman");
  const [subtaskStylesById, setSubtaskStylesById] = useState<Record<string, SubtaskListStyle>>({});
  const [expandedAgendaIds, setExpandedAgendaIds] = useState<Record<string, boolean>>({
    "default-go-to-work": true,
  });

  // Calendar Operations State (Habits, Highlight Spans, Work Shifts, Year Appointments)
  const [habits, setHabits] = useState<CalendarHabitDTO[]>([]);
  const [highlightSpans, setHighlightSpans] = useState<CalendarHighlightSpanDTO[]>([
    {
      id: "seed-span-shift",
      label: "07:00 – 15:00 Deep Shift Window",
      spanType: "hours",
      startMinute: 420,
      endMinute: 900,
      color: "#38bdf8",
      opacity: 0.2,
      isActive: true,
    },
  ]);
  const [shiftConfig, setShiftConfig] = useState<WorkShiftConfigDTO>({
    roleLabel: "Primary Operations & Engineering Shift",
    payPerShift: 320,
    hourlyRate: 40,
    hoursPerShift: 8,
    totalScheduledDays: 22,
    shiftsPerWeek: 5,
  });
  const [paySummary, setPaySummary] = useState<WorkPaySummaryDTO>({
    payRate: 320,
    daysWorked: 16,
    totalScheduledDays: 22,
    workedPct: 72.7,
    todayLogged: true,
    dailyShifts: 1,
    dailyPay: 320,
    dailyExpense: 24.5,
    weeklyShifts: 5,
    weeklyPay: 1600,
    weeklyTargetPay: 1600,
    biWeeklyShifts: 10,
    biWeeklyPay: 3200,
    biWeeklyTargetPay: 3200,
    monthlyShifts: 16,
    monthlyPay: 5120,
    monthlyActualPaid: 5180,
    scheduledMonthlyTotal: 7040,
    monthlyExpenseTotal: 302,
  });
  const [appointments, setAppointments] = useState<YearlyAppointmentDTO[]>([]);
  const [busyOpsAction, setBusyOpsAction] = useState<string | null>(null);

  const [tasks, setTasks] = useState<DbTaskLite[]>([]);
  const [healthScore, setHealthScore] = useState<number>(92);

  // Circadian Weather-Radar Layer states
  const [radarLayers, setRadarLayers] = useState<CircadianRadarLayerDTO[]>([]);
  const [activeRadarTypes, setActiveRadarTypes] = useState<RadarLayerKey[]>([]);

  // Real-Time Solar Beacon ticker
  useEffect(() => {
    const tick = () => setLiveMinutes(dateToMinutes(new Date(), true));
    tick();
    const timer = setInterval(tick, 5000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts for Google Calendar view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "d") {
        setEngineMode("google");
        setGoogleViewMode("day");
      }
      if (key === "x") {
        setEngineMode("google");
        setGoogleViewMode("four_day");
      }
      if (key === "m") {
        setEngineMode("google");
        setGoogleViewMode("month");
      }
      if (key === "y") {
        setEngineMode("google");
        setGoogleViewMode("year");
      }
      if (key === "a") {
        setEngineMode("google");
        setGoogleViewMode("schedule");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync selectedDate with currentDateObj
  useEffect(() => {
    const dStr = toLocalDateInputValue(currentDateObj);
    if (dStr !== selectedDate) {
      setSelectedDate(dStr);
    }
  }, [currentDateObj, selectedDate]);

  // Load Circadian Events for selected date
  const fetchCircadianEvents = useCallback(async (dateStr: string) => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/circadian?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events) && data.events.length > 0) {
          const list = ensureGoToWorkInEvents(data.events, dateStr);
          setEvents(list);
          const gtw = list.find((e) =>
            e.title.toLowerCase().includes("go to work")
          );
          if (gtw) {
            setExpandedAgendaIds((prev) => ({ ...prev, [gtw.id]: true }));
          }
        } else {
          setEvents(
            ensureGoToWorkInEvents(buildDefaultCircadianEvents(dateStr), dateStr)
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch circadian events:", err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Load Calendar Ops Data
  const applyCalendarOpsData = useCallback((data: any) => {
    if (Array.isArray(data.habits)) setHabits(data.habits);
    if (Array.isArray(data.highlightSpans)) setHighlightSpans(data.highlightSpans);
    if (data.shiftConfig) setShiftConfig(data.shiftConfig);
    if (data.paySummary) setPaySummary(data.paySummary);
    if (Array.isArray(data.appointments)) setAppointments(data.appointments);
  }, []);

  const fetchCalendarOps = useCallback(
    async (dateStr: string) => {
      try {
        const year = dateStr.slice(0, 4);
        const res = await fetch(
          `/api/calendar-ops?date=${dateStr}&year=${year}`
        );
        if (res.ok) {
          const data = await res.json();
          applyCalendarOpsData(data);
        }
      } catch (err) {
        console.error("Failed to fetch calendar-ops:", err);
      }
    },
    [applyCalendarOpsData]
  );

  useEffect(() => {
    fetchCalendarOps(selectedDate).finally(() => {
      fetchCircadianEvents(selectedDate);
    });
  }, [selectedDate, fetchCalendarOps, fetchCircadianEvents]);

  // Fetch Radar Layers
  const fetchRadarLayers = useCallback(async (dateStr: string) => {
    try {
      const res = await fetch(`/api/circadian/radar?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.layers)) {
          setRadarLayers(data.layers);
        }
      }
    } catch (err) {
      console.error("Failed to fetch circadian radar layers:", err);
    }
  }, []);

  useEffect(() => {
    fetchRadarLayers(selectedDate);
  }, [selectedDate, fetchRadarLayers]);

  // Load Chairman Dashboard Tasks & Health KPIs
  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => (r.ok ? r.json() : { tasks: [] }))
      .then((d) => {
        if (Array.isArray(d.tasks)) setTasks(d.tasks);
      })
      .catch(() => {});

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

  // Mutations
  const postCalendarOps = async (payload: Record<string, any>) => {
    const res = await fetch("/api/calendar-ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        year: selectedDate.slice(0, 4),
        ...payload,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      applyCalendarOpsData(data);
      return data;
    }
    return null;
  };

  const handleToggleChecklist = async (eventId: string, checklistId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          checklists: e.checklists.map((c) =>
            c.id === checklistId ? { ...c, isCompleted: !c.isCompleted } : c
          ),
        };
      })
    );
    await postCalendarOps({
      action: "toggle_checklist",
      eventId,
      checklistId,
    });
  };

  const handleAddChecklist = async (eventId: string, label: string) => {
    const res = await postCalendarOps({
      action: "add_checklist",
      eventId,
      label,
    });
    if (res?.checklist) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, checklists: [...e.checklists, res.checklist] }
            : e
        )
      );
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/circadian?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  };

  const handleSaveCircadianEvent = async (payload: any, syncGoogleCal: boolean) => {
    const isEdit = Boolean(
      payload.id && !String(payload.id).startsWith("default-")
    );
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch("/api/circadian", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await fetchCircadianEvents(selectedDate);
    }
    setModalOpen(false);
  };

  const handleLogHabit = async (habitId: string, opts: { delta?: number; value?: number }) => {
    await postCalendarOps({
      action: "log_habit",
      habitId,
      ...opts,
    });
  };

  const effectiveMinutes =
    scrubbedMinutes !== null ? scrubbedMinutes : liveMinutes;

  // Traditional Event Mapping
  const calendarEventItems = useMemo<CalendarEventItem[]>(() => {
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description || undefined,
      start_time: e.startTime,
      end_time: e.endTime,
      category: ((e.domain as string) === "engineering"
        ? "work"
        : (e.domain as string) === "physical_training"
        ? "workout"
        : "personal") as any,
      color_hex: e.accentColor || "#3B82F6",
    }));
  }, [events]);

  const filteredCalendarEventItems = useMemo(() => {
    return calendarEventItems.filter(
      (ev) => visibleCalendars[ev.category] !== false
    );
  }, [calendarEventItems, visibleCalendars]);

  // Traditional Quick Save & Full Save
  const handleQuickSave = async (
    eventId: string,
    patch: Partial<CalendarEventItem>
  ) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              title: patch.title || ev.title,
              accentColor: patch.color_hex || ev.accentColor,
            }
          : ev
      )
    );
    await fetch(`/api/calendar-events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: eventId,
        title: patch.title,
        colorHex: patch.color_hex,
      }),
    });
    await fetchCircadianEvents(selectedDate);
  };

  const handleFullSave = async (eventData: Partial<CalendarEventItem>) => {
    if (fullEditorEvent) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === fullEditorEvent.id
            ? {
                ...ev,
                title: eventData.title || ev.title,
                description: eventData.description || ev.description,
                startTime: eventData.start_time || ev.startTime,
                endTime: eventData.end_time || ev.endTime,
                accentColor: eventData.color_hex || ev.accentColor,
              }
            : ev
        )
      );
      await fetch(`/api/calendar-events/${fullEditorEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: fullEditorEvent.id,
          title: eventData.title,
          description: eventData.description,
          startTime: eventData.start_time,
          endTime: eventData.end_time,
          colorHex: eventData.color_hex,
          category: eventData.category,
        }),
      });
      await fetchCircadianEvents(selectedDate);
    } else {
      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          startTime: eventData.start_time,
          endTime: eventData.end_time,
          colorHex: eventData.color_hex,
          category: eventData.category,
        }),
      });
      const data = await res.json();
      if (data.event) {
        if (calConnected) {
          fetch("/api/calendar/google-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "push_event", event: eventData }),
          }).catch(() => {});
        }
        await fetchCircadianEvents(selectedDate);
      }
    }
    setIsFullEditorOpen(false);
  };

  const handleDeleteTraditionalEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/calendar-events/${id}`, {
      method: "DELETE",
    });
    await fetch(`/api/circadian?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await fetchCircadianEvents(selectedDate);
  };

  const handleTriggerSync = async () => {
    setIsSyncingGCal(true);
    try {
      const res = await fetch("/api/calendar/google-sync", { method: "POST" });
      const data = await res.json();
      if (data.connected === false && !calConnected) {
        signIn("google");
        return;
      }
      await fetchCircadianEvents(selectedDate);
    } catch (err) {
      console.error("GCal sync error:", err);
    } finally {
      setIsSyncingGCal(false);
    }
  };

  // Telemetry Rollup & Metrics
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

  const currentWeekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return getWeekDays(new Date(y, m - 1, d));
  }, [selectedDate]);

  const currentMonthNodes = useMemo(() => {
    return getMonthNodes(selectedYear, activeMonthIndex);
  }, [selectedYear, activeMonthIndex]);

  const seasonalCards = useMemo(() => {
    return getSeasonCards();
  }, []);

  const concentricTelemetry = useMemo(() => {
    return {
      healthPct: Math.min(100, Math.round(healthScore)),
      workPct: Math.min(100, Math.round(paySummary.workedPct)),
      sleepPct: 92,
    };
  }, [healthScore, paySummary.workedPct]);

  const activeTasksCount = tasks.filter(
    (t) => !t.parentId && t.status !== "DONE" && t.status !== "ARCHIVED"
  ).length;
  const activeSubtasksCount = tasks.filter(
    (t) => t.parentId && t.status !== "DONE" && t.status !== "ARCHIVED"
  ).length;

  // Steppers for Google Engine
  const handlePrevDate = () => {
    const next = new Date(currentDateObj);
    if (googleViewMode === "day") next.setDate(next.getDate() - 1);
    else if (googleViewMode === "four_day") next.setDate(next.getDate() - 4);
    else if (googleViewMode === "month") next.setMonth(next.getMonth() - 1);
    else if (googleViewMode === "year") next.setFullYear(next.getFullYear() - 1);
    else next.setDate(next.getDate() - 7);
    setCurrentDateObj(next);
  };

  const handleNextDate = () => {
    const next = new Date(currentDateObj);
    if (googleViewMode === "day") next.setDate(next.getDate() + 1);
    else if (googleViewMode === "four_day") next.setDate(next.getDate() + 4);
    else if (googleViewMode === "month") next.setMonth(next.getMonth() + 1);
    else if (googleViewMode === "year") next.setFullYear(next.getFullYear() + 1);
    else next.setDate(next.getDate() + 7);
    setCurrentDateObj(next);
  };

  const googleDateLabel = useMemo(() => {
    if (googleViewMode === "day") {
      return currentDateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (googleViewMode === "four_day") {
      const end = new Date(currentDateObj);
      end.setDate(end.getDate() + 3);
      return `${currentDateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} – ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    if (googleViewMode === "year") {
      return String(currentDateObj.getFullYear());
    }
    return currentDateObj.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDateObj, googleViewMode]);

  const renderOpsDeck = () => (
    <CalendarOpsCommandDeck
      selectedDate={selectedDate}
      onSelectDate={(d) => setSelectedDate(d)}
      events={events}
      selectedEventId={selectedEventId}
      onSelectEvent={setSelectedEventId}
      pendingTasksCount={activeTasksCount + activeSubtasksCount}
      habits={habits}
      highlightSpans={highlightSpans}
      shiftConfig={shiftConfig}
      paySummary={paySummary}
      appointments={appointments}
      busyAction={busyOpsAction}
      onAutoBatchTasks={async () => {
        await postCalendarOps({ action: "auto_batch_tasks" });
        await fetchCircadianEvents(selectedDate);
      }}
      onRandomizeColors={async () => {
        const shuffled = [...CURATED_BLOCK_PALETTE].sort(() => Math.random() - 0.5);
        setEvents((prev) =>
          prev.map((ev, idx) => ({
            ...ev,
            accentColor: shuffled[idx % shuffled.length].hex,
          }))
        );
        await postCalendarOps({ action: "randomize_colors" });
      }}
      onRecolorEvent={async (evId, hex) => {
        setEvents((prev) =>
          prev.map((ev) => (ev.id === evId ? { ...ev, accentColor: hex } : ev))
        );
        await postCalendarOps({ action: "recolor_event", eventId: evId, accentColor: hex });
      }}
      onLogHabit={handleLogHabit}
      onCreateHabit={async (payload) => {
        await postCalendarOps({ action: "create_habit", ...payload });
      }}
      onDeleteHabit={async (habitId) => {
        setHabits((prev) => prev.filter((h) => h.id !== habitId));
        await postCalendarOps({ action: "delete_habit", habitId });
      }}
      onCreateHighlightSpan={async (payload) => {
        await postCalendarOps({ action: "create_highlight_span", ...payload });
      }}
      onToggleHighlightSpan={async (spanId, isActive) => {
        setHighlightSpans((prev) =>
          prev.map((s) => (s.id === spanId ? { ...s, isActive } : s))
        );
        await postCalendarOps({ action: "toggle_highlight_span", spanId, isActive });
      }}
      onDeleteHighlightSpan={async (spanId) => {
        setHighlightSpans((prev) => prev.filter((s) => s.id !== spanId));
        await postCalendarOps({ action: "delete_highlight_span", spanId });
      }}
      onUpdateShiftConfig={async (cfg) => {
        await postCalendarOps({ action: "update_shift_config", ...cfg });
      }}
      onToggleTodayShift={async () => {
        setBusyOpsAction("toggle_shift");
        try {
          await postCalendarOps({ action: "toggle_today_shift" });
        } finally {
          setBusyOpsAction(null);
        }
      }}
      onCreateAppointment={async (payload) => {
        await postCalendarOps({ action: "create_appointment", appointment: payload });
      }}
      onUpdateAppointment={async (id, patch) => {
        await postCalendarOps({ action: "update_appointment", appointmentId: id, patch });
      }}
      onDeleteAppointment={async (id) => {
        await postCalendarOps({ action: "delete_appointment", appointmentId: id });
      }}
    />
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090A0F] font-sans text-zinc-100 select-none">
      {/* Chairman Dashboard Sidebar */}
      <Sidebar
        activeTab="CALENDAR_HABITS"
        setActiveTab={() => {}}
        calConnected={calConnected}
        onCalToggle={async () => {
          if (!calConnected) {
            signIn("google");
          } else {
            setIsSyncingGCal(true);
            try {
              await fetch("/api/calendar/google-sync", { method: "POST" });
              await fetchCircadianEvents(selectedDate);
            } finally {
              setIsSyncingGCal(false);
            }
          }
        }}
        user={user}
        activeTasksCount={tasks.filter((t) => t.status !== "DONE").length}
        activeSubtasksCount={0}
      />

      {/* Main Calendar View Area */}
      <div className="flex-1 flex flex-col h-full bg-[#0D0F17] overflow-hidden">
        {/* TOP TOOLBAR: Unified Engine Controls */}
        <header className="h-14 px-5 border-b border-[#1E222D] flex items-center justify-between bg-[#11131C] z-20">
          {/* Left: Engine Mode Segmented Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#090A0F] border border-[#222738] rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setEngineMode("solar")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  engineMode === "solar"
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Orbit className="w-3.5 h-3.5 text-amber-400" />
                <span>Circadian Solar Arc</span>
              </button>

              <button
                onClick={() => setEngineMode("google")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  engineMode === "google"
                    ? "bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Calendar Grid</span>
              </button>
            </div>

            {/* In Google Mode: Drawer toggle, Today button & Date stepper */}
            {engineMode === "google" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMiniDrawerOpen((prev) => !prev)}
                  title="Toggle Mini-Month Sidebar"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentDateObj(new Date())}
                  className="px-3 py-1 rounded-lg border border-[#262B3D] text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#1C2030] transition"
                >
                  Today
                </button>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handlePrevDate}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextDate}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-sm font-bold text-white tracking-tight ml-1">
                  {googleDateLabel}
                </span>
              </div>
            )}
          </div>

          {/* Right Controls: Horizon Buttons or Google View Dropdown */}
          <div className="flex items-center gap-3">
            {engineMode === "solar" ? (
              /* Circadian Solar Horizon Navigation Control */
              <div className="flex items-center gap-3">
                <HorizonNavigationControl
                  activeHorizon={activeHorizon}
                  onSelectHorizon={setActiveHorizon}
                  dayMode={dayMode}
                  onSelectDayMode={setDayMode}
                />

                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.28)] hover:brightness-110 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Block</span>
                </button>
              </div>
            ) : (
              /* Google Calendar Mode Controls */
              <div className="flex items-center gap-3">
                {/* Sync Badge */}
                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncingGCal}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141724] border border-[#222738] hover:border-blue-500/50 text-xs transition"
                  title="Click to trigger instant Google Calendar sync"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-blue-400 ${
                      isSyncingGCal ? "animate-spin" : ""
                    }`}
                  />
                  <span className="text-[11px] font-medium text-zinc-300">
                    {isSyncingGCal ? "Syncing..." : "Synced with Google Calendar"}
                  </span>
                </button>

                {/* 5-Mode View Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowViewDropdown((prev) => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141724] border border-[#222738] text-xs font-semibold text-zinc-200 hover:text-white transition shadow-sm"
                  >
                    <span className="capitalize">
                      {googleViewMode === "four_day"
                        ? "4 Days (X)"
                        : `${googleViewMode} (${googleViewMode.charAt(0).toUpperCase()})`}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {showViewDropdown && (
                    <div className="absolute right-0 top-10 w-44 bg-[#141724] border border-[#282E42] rounded-xl shadow-2xl py-1.5 z-50 text-xs text-zinc-200">
                      <button
                        onClick={() => {
                          setGoogleViewMode("day");
                          setShowViewDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                          googleViewMode === "day" ? "text-blue-400 font-semibold" : ""
                        }`}
                      >
                        <span>Day</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                          D
                        </kbd>
                      </button>

                      <button
                        onClick={() => {
                          setGoogleViewMode("four_day");
                          setShowViewDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                          googleViewMode === "four_day" ? "text-blue-400 font-semibold" : ""
                        }`}
                      >
                        <span>4 Days</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                          X
                        </kbd>
                      </button>

                      <button
                        onClick={() => {
                          setGoogleViewMode("month");
                          setShowViewDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                          googleViewMode === "month" ? "text-blue-400 font-semibold" : ""
                        }`}
                      >
                        <span>Month</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                          M
                        </kbd>
                      </button>

                      <button
                        onClick={() => {
                          setGoogleViewMode("year");
                          setShowViewDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                          googleViewMode === "year" ? "text-blue-400 font-semibold" : ""
                        }`}
                      >
                        <span>Year</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                          Y
                        </kbd>
                      </button>

                      <button
                        onClick={() => {
                          setGoogleViewMode("schedule");
                          setShowViewDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                          googleViewMode === "schedule" ? "text-blue-400 font-semibold" : ""
                        }`}
                      >
                        <span>Schedule</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                          A
                        </kbd>
                      </button>
                    </div>
                  )}
                </div>

                {/* + Create Button */}
                <button
                  onClick={() => {
                    setEditorInitialDate(selectedDate);
                    setEditorInitialTime("09:00");
                    setFullEditorEvent(null);
                    setIsFullEditorOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* WORKSPACE ENGINE BODY */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {engineMode === "solar" ? (
            /* ========================================================================= */
            /* 1. CIRCADIAN SOLAR ARC & TEMPORAL HORIZON ENGINE                          */
            /* ========================================================================= */
            <div className="p-5 space-y-6">
              <div className="flex flex-col xl:flex-row gap-5">
                {/* Center Celestial Stage */}
                <div className="relative flex-1 flex flex-col items-center justify-center min-h-[580px] bg-[#0E111A] rounded-2xl border border-white/[0.06] p-4 shadow-2xl">
                {/* DAY Horizon (Solar Wheel OR 3D Geospatial Map) */}
                {activeHorizon === "DAY" && dayMode === "SOLAR_WHEEL" && (
                  <CircadianDialStage
                    events={events}
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
                    radarLayers={radarLayers}
                    activeRadarTypes={activeRadarTypes}
                    habits={habits}
                    highlightSpans={highlightSpans}
                    selectedDate={selectedDate}
                    subtaskStylesById={subtaskStylesById}
                    onToggleSubtaskStyle={(evId: string) =>
                      setSubtaskStylesById((prev) => ({
                        ...prev,
                        [evId]: prev[evId] === "bullets" ? "roman" : "bullets",
                      }))
                    }
                    onQuickIncrementHabit={(habitId, delta) =>
                      handleLogHabit(habitId, { delta })
                    }
                  />
                )}

                {activeHorizon === "DAY" && dayMode === "GEOSPATIAL_3D" && (
                  <GeospatialTacticalMap
                    waypoints={EL_PASO_TACTICAL_WAYPOINTS}
                    routeLegs={EL_PASO_ROUTE_LEGS}
                    scrubbedMinutes={effectiveMinutes}
                    onScrubMinutes={(mins) => setScrubbedMinutes(mins)}
                    isLiveTime={scrubbedMinutes === null}
                    onResetLive={() => setScrubbedMinutes(null)}
                  />
                )}

                {/* WEEK Horizon */}
                {activeHorizon === "WEEK" && (
                  <WeeklyRadialView
                    weekNumber={46}
                    dateSpanLabel="NOV 09 - 15"
                    telemetry={concentricTelemetry}
                    weekDays={currentWeekDays}
                    onSelectDay={(dateStr) => {
                      setSelectedDate(dateStr);
                      setCurrentDateObj(new Date(dateStr + "T12:00:00Z"));
                      setActiveHorizon("DAY");
                    }}
                  />
                )}

                {/* MONTH Horizon */}
                {activeHorizon === "MONTH" && (
                  <MonthlyRadialView
                    year={selectedYear}
                    monthName="November"
                    telemetry={concentricTelemetry}
                    monthNodes={currentMonthNodes}
                    activeWeekDays={currentWeekDays}
                    onSelectDate={(dateStr) => {
                      setSelectedDate(dateStr);
                      setCurrentDateObj(new Date(dateStr + "T12:00:00Z"));
                      setActiveHorizon("DAY");
                    }}
                    onDrillDownDay={(dateStr) => {
                      setSelectedDate(dateStr);
                      setCurrentDateObj(new Date(dateStr + "T12:00:00Z"));
                      setActiveHorizon("DAY");
                    }}
                  />
                )}

                {/* YEAR Horizon */}
                {activeHorizon === "YEAR" && (
                  <YearlyRadialView
                    selectedYear={selectedYear}
                    activeMonth={activeMonthIndex}
                    telemetry={concentricTelemetry}
                    seasons={seasonalCards}
                    onSelectMonth={(mIdx) => {
                      setActiveMonthIndex(mIdx);
                      setActiveHorizon("MONTH");
                    }}
                    onSelectSeason={() => {
                      setActiveHorizon("MONTH");
                    }}
                  />
                )}

                {/* Bottom-Left Micro-Statistics Card */}
                <div className="xl:absolute xl:left-4 xl:bottom-4 z-20 w-full xl:w-[270px] rounded-2xl bg-[#12151e]/90 backdrop-blur-xl border border-white/[0.08] p-4 shadow-2xl space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    <span>MICRO-STATISTICS</span>
                    {loadingEvents && <RefreshCw className="w-3 h-3 animate-spin text-zinc-500" />}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-2xl font-bold text-white tracking-tight leading-none font-mono">
                        {telemetryVelocity.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">Real-Time</div>
                    </div>
                    <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <HeartPulse className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">Health</div>
                        <div className="text-[11px] font-bold text-amber-400">{healthScore}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Executive Rail: Daily Focus + Agenda + Integration Badges */}
              <aside className="w-full xl:w-[380px] shrink-0 flex flex-col gap-4">
                <div className="flex-1 rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 flex flex-col gap-5 shadow-2xl">
                  {/* DAILY FOCUS */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-100">
                        DAILY FOCUS
                      </h2>
                      <button
                        onClick={() => {
                          setEditingEvent(null);
                          setModalOpen(true);
                        }}
                        className="text-zinc-400 hover:text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 mb-3">
                      Quick task cards ({paySummary.daysWorked}/{paySummary.totalScheduledDays} shifts logged)
                    </p>

                    <div className="space-y-2.5">
                      {events
                        .filter((ev) => ev.domain !== "logistics")
                        .slice(0, 2)
                        .map((ev) => {
                          const isSelected = selectedEventId === ev.id;
                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEventId(isSelected ? null : ev.id)}
                              className={`rounded-xl bg-[#191d29] hover:bg-[#1e2332] border p-3 cursor-pointer transition ${
                                isSelected ? "border-amber-400/50" : "border-white/[0.06]"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: ev.accentColor || "#f59e0b" }}
                                />
                                <span className="text-xs font-bold text-white truncate">
                                  {ev.title}
                                </span>
                              </div>
                              {ev.description && (
                                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1 pl-5">
                                  {ev.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* AGENDA */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-100">
                        AGENDA
                      </h2>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {events.length} BLOCKS
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {events.map((ev) => {
                        const s = new Date(ev.startTime);
                        const isSelected = selectedEventId === ev.id;

                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEventId(isSelected ? null : ev.id)}
                            className={`p-3 rounded-xl bg-[#161925] border transition cursor-pointer ${
                              isSelected
                                ? "border-blue-500/50 bg-[#1D2132]"
                                : "border-white/[0.06] hover:bg-[#1A1E2C]"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: ev.accentColor || "#3B82F6" }}
                                />
                                <span className="font-semibold text-zinc-100 truncate">
                                  {ev.title}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-zinc-400 flex-shrink-0">
                                {s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            {/* Subtask Checklists */}
                            {ev.checklists.length > 0 && (
                              <div className="mt-2 pl-4 space-y-1 border-l border-white/10">
                                {ev.checklists.slice(0, 3).map((c, cIdx) => (
                                  <div
                                    key={c.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleChecklist(ev.id, c.id);
                                    }}
                                    className="flex items-center gap-2 text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                                  >
                                    <span className="font-mono text-[10px] text-amber-400/80">
                                      {formatSubtaskMarker(cIdx, globalSubtaskStyle)}
                                    </span>
                                    <span className={c.isCompleted ? "line-through text-zinc-500" : ""}>
                                      {c.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* INTEGRATION BADGES */}
                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 mb-2 block">
                      INTEGRATION BADGES
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold">
                      <div className="p-2 rounded-lg bg-[#161925] border border-white/[0.06] text-purple-400">
                        ClickUp
                      </div>
                      <div className="p-2 rounded-lg bg-[#161925] border border-white/[0.06] text-emerald-400">
                        Plaid
                      </div>
                      <div className="p-2 rounded-lg bg-[#161925] border border-white/[0.06] text-sky-400">
                        Garmin
                      </div>
                      <div className="p-2 rounded-lg bg-[#161925] border border-white/[0.06] text-amber-400">
                        Supabase
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            {/* Bottom Utility/Analytics Cards Deck (Full-width responsive CSS grid across ALL views) */}
            <div className="w-full max-w-[1600px] mx-auto pb-8">
              {renderOpsDeck()}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. GOOGLE CALENDAR 5-MODE ENGINE                                          */
          /* ========================================================================= */
          <div className="flex flex-col min-h-full">
            <div className="flex-1 flex overflow-hidden min-h-[640px]">
              {/* Collapsible Mini-Month Drawer (256px) */}
              <div
                className={`transition-all duration-300 ease-in-out shrink-0 ${
                  isMiniDrawerOpen
                    ? "w-[256px] min-w-[256px] opacity-100"
                    : "w-0 min-w-0 overflow-hidden p-0 border-0 opacity-0 pointer-events-none"
                }`}
              >
                <MiniMonthCalendar
                  currentDate={currentDateObj}
                  onSelectDate={(d) => setCurrentDateObj(d)}
                  visibleCalendars={visibleCalendars}
                  onToggleCalendar={(key) =>
                    setVisibleCalendars((prev) => ({
                      ...prev,
                      [key]: prev[key] === false ? true : false,
                    }))
                  }
                />
              </div>

              {/* 5-Mode Google Calendar Canvas */}
              <main className="flex-1 overflow-hidden p-4">
                {googleViewMode === "month" && (
                  <MonthView
                    currentDate={currentDateObj}
                    events={filteredCalendarEventItems}
                    onSelectDate={(dStr) => {
                      setCurrentDateObj(new Date(dStr + "T12:00:00Z"));
                      setGoogleViewMode("day");
                    }}
                    onSelectEvent={(ev) => setQuickPopoverEvent(ev)}
                    onCreateEvent={(dStr) => {
                      setEditorInitialDate(dStr);
                      setEditorInitialTime("09:00");
                      setFullEditorEvent(null);
                      setIsFullEditorOpen(true);
                    }}
                  />
                )}

                {googleViewMode === "day" && (
                  <DayView
                    currentDate={currentDateObj}
                    events={filteredCalendarEventItems}
                    onSelectEvent={(ev) => setQuickPopoverEvent(ev)}
                    onCreateEvent={(tStr) => {
                      setEditorInitialDate(toLocalDateInputValue(currentDateObj));
                      setEditorInitialTime(tStr);
                      setFullEditorEvent(null);
                      setIsFullEditorOpen(true);
                    }}
                  />
                )}

                {googleViewMode === "four_day" && (
                  <FourDayView
                    currentDate={currentDateObj}
                    events={filteredCalendarEventItems}
                    onSelectEvent={(ev) => setQuickPopoverEvent(ev)}
                    onCreateEvent={(dStr, tStr) => {
                      setEditorInitialDate(dStr);
                      setEditorInitialTime(tStr);
                      setFullEditorEvent(null);
                      setIsFullEditorOpen(true);
                    }}
                  />
                )}

                {googleViewMode === "year" && (
                  <YearView
                    currentDate={currentDateObj}
                    events={filteredCalendarEventItems}
                    onSelectDate={(d) => {
                      setCurrentDateObj(d);
                      setGoogleViewMode("day");
                    }}
                  />
                )}

                {googleViewMode === "schedule" && (
                  <ScheduleView
                    events={filteredCalendarEventItems}
                    onSelectEvent={(ev) => setQuickPopoverEvent(ev)}
                    onCreateEvent={(dStr) => {
                      setEditorInitialDate(dStr);
                      setEditorInitialTime("09:00");
                      setFullEditorEvent(null);
                      setIsFullEditorOpen(true);
                    }}
                  />
                )}
              </main>
            </div>

            {/* Bottom Utility/Analytics Cards Deck */}
            <div className="w-full max-w-[1600px] mx-auto px-6 pb-8">
              {renderOpsDeck()}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Quick Popover Card (420px Width) */}
      <CalendarQuickPopover
        event={quickPopoverEvent}
        isOpen={!!quickPopoverEvent}
        onClose={() => setQuickPopoverEvent(null)}
        onEditFull={(ev) => {
          setQuickPopoverEvent(null);
          setFullEditorEvent(ev);
          setIsFullEditorOpen(true);
        }}
        onSaveQuick={handleQuickSave}
        onDeleteEvent={handleDeleteTraditionalEvent}
      />

      {/* Traditional Event Modal */}
      <TraditionalEventModal
        isOpen={isFullEditorOpen}
        onClose={() => setIsFullEditorOpen(false)}
        event={fullEditorEvent}
        initialDate={editorInitialDate}
        initialTime={editorInitialTime}
        onSave={handleFullSave}
        onDelete={handleDeleteTraditionalEvent}
      />

      {/* Circadian Event Modal */}
      <CircadianEventModal
        isOpen={modalOpen}
        initialEvent={editingEvent}
        selectedDate={selectedDate}
        calConnected={calConnected}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveCircadianEvent}
      />
    </div>
  );
}
