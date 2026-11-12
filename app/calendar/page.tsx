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
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
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
    domain: "engineering",
    startTime: new Date(y, m, d, 7, 0, 0, 0).toISOString(),
    endTime: new Date(y, m, d, 8, 20, 0, 0).toISOString(),
    isRecurring: true,
    recurrenceRule: "FREQ=DAILY",
    mediaUrl: "/circadian/saas-build.jpg",
    mediaType: "image",
    mediaAspectRatio: "16:9",
    accentColor: "#38bdf8",
    telemetrySource: "clickup",
    subtaskStyle: "roman",
    dailyMoneyUsed: 24.5,
    anticipatedPay: 320,
    actualPay: 340,
    checklists: [
      {
        id: "chk-gtw-1",
        label: "Morning shift briefing & system check (07:00–07:15)",
        isCompleted: true,
        sortOrder: 0,
      },
      {
        id: "chk-gtw-2",
        label: "Equipment & dispatch queue sync (07:15–07:35)",
        isCompleted: true,
        sortOrder: 1,
      },
      {
        id: "chk-gtw-3",
        label: "Priority ticket triage (07:35–07:50)",
        isCompleted: false,
        sortOrder: 2,
      },
      {
        id: "chk-gtw-4",
        label: "Lock 08:00 deep execution block (07:50–08:00)",
        isCompleted: false,
        sortOrder: 3,
      },
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
    ensureGoToWorkInEvents(buildDefaultCircadianEvents())
  );
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CircadianEventDTO | null>(
    null
  );

  // Nested Subtasks Style & Agenda Expansion state
  const [globalSubtaskStyle, setGlobalSubtaskStyle] =
    useState<SubtaskListStyle>("roman");
  const [subtaskStylesById, setSubtaskStylesById] = useState<
    Record<string, SubtaskListStyle>
  >({});
  const [expandedAgendaIds, setExpandedAgendaIds] = useState<
    Record<string, boolean>
  >({ "default-go-to-work": true });
  const [agendaSubtaskDrafts, setAgendaSubtaskDrafts] = useState<
    Record<string, string>
  >({});

  // Calendar Operations State (Habits, Highlight Spans, Work Shifts, Year Appointments)
  const [habits, setHabits] = useState<CalendarHabitDTO[]>([
    {
      id: "seed-walk",
      title: "Weight-Loss Daily Walk",
      subtitle: "3.5 miles · Fat-burn full 360° ring closure",
      unit: "steps",
      targetValue: 10000,
      currentValue: 7500,
      pct: 75,
      ringColor: "#10b981",
      iconName: "footprints",
      sortOrder: 0,
    },
    {
      id: "seed-water",
      title: "Hydration Protocol",
      subtitle: "Electrolyte + spring water daily intake",
      unit: "oz",
      targetValue: 100,
      currentValue: 80,
      pct: 80,
      ringColor: "#38bdf8",
      iconName: "droplets",
      sortOrder: 1,
    },
    {
      id: "seed-focus",
      title: "Deep Focus Hours",
      subtitle: "Zero-distraction architectural build time",
      unit: "hrs",
      targetValue: 4,
      currentValue: 3,
      pct: 75,
      ringColor: "#f59e0b",
      iconName: "zap",
      sortOrder: 2,
    },
  ]);
  const [highlightSpans, setHighlightSpans] = useState<
    CalendarHighlightSpanDTO[]
  >([
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
  const [opsBannerMsg, setOpsBannerMsg] = useState<string | null>(null);

  const [tasks, setTasks] = useState<DbTaskLite[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(false);
  const [healthScore, setHealthScore] = useState<number>(92);
  const [activeTelemetryFilter, setActiveTelemetryFilter] = useState<
    string | null
  >(null);
  const [syncingGCal, setSyncingGCal] = useState<boolean>(false);

  // Section 18: Circadian Weather-Radar Layer states
  const [radarLayers, setRadarLayers] = useState<CircadianRadarLayerDTO[]>([]);
  const [activeRadarTypes, setActiveRadarTypes] = useState<RadarLayerKey[]>([]);
  const [recalibratingRadar, setRecalibratingRadar] = useState<boolean>(false);

  // Real-Time Solar Beacon ticker
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
          const list = ensureGoToWorkInEvents(data.events, dateStr);
          setEvents(list);
          // Auto-expand Go to Work block so 07:00–08:00 Roman subtasks are visible right away
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

  // Load Calendar Ops (Habits, Highlight Spans, Work Shifts, Year Appointments)
  const applyCalendarOpsData = useCallback((data: any) => {
    if (Array.isArray(data.habits)) setHabits(data.habits);
    if (Array.isArray(data.highlightSpans))
      setHighlightSpans(data.highlightSpans);
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
    // Fetch calendar-ops first (which also seeds Go to Work if needed), then circadian events
    fetchCalendarOps(selectedDate).finally(() => {
      fetchCircadianEvents(selectedDate);
    });
  }, [selectedDate, fetchCalendarOps, fetchCircadianEvents]);

  // Section 18: Fetch 96-point Circadian Radar Curves
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

  const toggleRadarLayer = (layerType: RadarLayerKey) => {
    setActiveRadarTypes((prev) =>
      prev.includes(layerType)
        ? prev.filter((t) => t !== layerType)
        : [...prev, layerType]
    );
  };

  const handleRecalibrateRadar = async () => {
    setRecalibratingRadar(true);
    try {
      const res = await fetch("/api/circadian/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recalibrate",
          date: selectedDate,
          events,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.layers)) {
          setRadarLayers(data.layers);
        }
      }
    } catch (err) {
      console.error("Failed to recalibrate radar:", err);
    } finally {
      setRecalibratingRadar(false);
    }
  };

  // Load Chairman Dashboard Tasks & Health KPIs
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

  // Calendar Ops Mutation Helpers
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

  const handleAutoBatchTasks = async () => {
    setBusyOpsAction("auto_batch");
    try {
      const data = await postCalendarOps({ action: "auto_batch_tasks" });
      await fetchCircadianEvents(selectedDate);
      const count = data?.batchedBlocksCreated ?? 3;
      setOpsBannerMsg(
        `Auto-batched pending tasks into ${count} focused calendar blocks on ${selectedDate}.`
      );
      setTimeout(() => setOpsBannerMsg(null), 5000);
    } finally {
      setBusyOpsAction(null);
    }
  };

  const handleRandomizeColors = async () => {
    setBusyOpsAction("randomize_colors");
    // Immediate optimistic curated shuffle on UI so dial & agenda update instantaneously
    const shuffled = [...CURATED_BLOCK_PALETTE].sort(() => Math.random() - 0.5);
    setEvents((prev) =>
      prev.map((ev, idx) => ({
        ...ev,
        accentColor: shuffled[idx % shuffled.length].hex,
      }))
    );
    try {
      const data = await postCalendarOps({ action: "randomize_colors" });
      if (data?.colorMap) {
        setEvents((prev) =>
          prev.map((ev) =>
            data.colorMap[ev.id]
              ? { ...ev, accentColor: data.colorMap[ev.id] }
              : ev
          )
        );
      }
      setOpsBannerMsg("Randomized harmonious block colors across Solar Dial & Agenda.");
      setTimeout(() => setOpsBannerMsg(null), 4000);
    } finally {
      setBusyOpsAction(null);
    }
  };

  const handleRecolorEvent = async (eventId: string, hex: string) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, accentColor: hex } : ev))
    );
    await postCalendarOps({
      action: "recolor_event",
      eventId,
      accentColor: hex,
    });
  };

  const handleLogHabit = async (
    habitId: string,
    opts: { delta?: number; value?: number }
  ) => {
    // Optimistic 360° ring update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const nextVal =
          typeof opts.value === "number"
            ? Math.max(0, opts.value)
            : Math.max(0, h.currentValue + (opts.delta ?? 0));
        const pct = Math.min(
          100,
          Math.round((nextVal / Math.max(0.01, h.targetValue)) * 1000) / 10
        );
        return { ...h, currentValue: nextVal, pct };
      })
    );
    await postCalendarOps({
      action: "log_habit",
      habitId,
      ...opts,
    });
  };

  const handleToggleSubtaskStyleForEvent = (eventId: string) => {
    setSubtaskStylesById((prev) => {
      const current = prev[eventId] ?? globalSubtaskStyle;
      return {
        ...prev,
        [eventId]: current === "roman" ? "bullets" : "roman",
      };
    });
  };

  const handleToggleGlobalSubtaskStyle = () => {
    const next: SubtaskListStyle =
      globalSubtaskStyle === "roman" ? "bullets" : "roman";
    setGlobalSubtaskStyle(next);
    setSubtaskStylesById({});
  };

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

  // Quick-add checklist item inside dial inspector or Agenda nested subtasks
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

    if (!eventId.startsWith("default-") && !eventId.startsWith("local-")) {
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
    } else {
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

  // Active Multi-Day Highlight Spans covering selectedDate
  const activeMultiDaySpans = useMemo(() => {
    return highlightSpans.filter((sp) => {
      if (!sp.isActive || sp.spanType !== "multi_day") return false;
      if (sp.startDate && selectedDate < sp.startDate) return false;
      if (sp.endDate && selectedDate > sp.endDate) return false;
      return true;
    });
  }, [highlightSpans, selectedDate]);

  // Sorted Agenda items enriched with matching day appointment financial telemetry
  const sortedAgenda = useMemo(() => {
    const dayAppts = appointments.filter(
      (a) => a.appointmentDate === selectedDate
    );
    return [...events]
      .map((ev) => {
        const sMin = dateToMinutes(new Date(ev.startTime));
        const eMin = dateToMinutes(new Date(ev.endTime));
        const totalChecks = ev.checklists.length;
        const doneChecks = ev.checklists.filter((c) => c.isCompleted).length;
        const isPast = eMin > sMin && effectiveMinutes >= eMin;
        const isComplete =
          (totalChecks > 0 && doneChecks === totalChecks) || isPast;

        const matchedAppt = dayAppts.find((a) =>
          a.title
            .toLowerCase()
            .includes(ev.title.toLowerCase().slice(0, 10))
        );

        return {
          event: ev,
          sMin,
          eMin,
          doneChecks,
          totalChecks,
          isComplete,
          anticipatedPay:
            matchedAppt?.anticipatedPay ?? ev.anticipatedPay ?? 0,
          actualPay: matchedAppt?.actualPay ?? ev.actualPay ?? 0,
          dailyMoneyUsed:
            matchedAppt?.dailyMoneyUsed ?? ev.dailyMoneyUsed ?? 0,
        };
      })
      .sort((a, b) => a.sMin - b.sMin);
  }, [events, effectiveMinutes, appointments, selectedDate]);

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
    () =>
      tasks.filter((t) => !t.parentId && t.status !== "ARCHIVED").slice(0, 3),
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

  const primaryWalkHabit = habits[0];

  return (
    <div className="executive-glass-shell min-h-screen text-zinc-900 dark:text-white flex flex-row overflow-x-hidden">
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
      <div className="flex-1 ml-0 lg:ml-[26rem] min-w-0 flex flex-col min-h-screen pt-14 lg:pt-0 transition-all duration-300">
        {/* Top Control Header */}
        <header className="px-4 sm:px-6 pt-4 pb-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/50 dark:border-white/[0.08] liquid-glass-panel sticky top-14 lg:top-0 z-30">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: currentPhase.pillColor }}
                />
                <h1 className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-zinc-100">
                  Circadian Solar Arc
                </h1>
                <span
                  className="px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-widest uppercase border"
                  style={{
                    color: currentPhase.pillColor,
                    borderColor: `${currentPhase.pillColor}44`,
                    backgroundColor: `${currentPhase.pillColor}14`,
                  }}
                >
                  {currentPhase.name}
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-400 mt-0.5 hidden sm:block">
                {currentPhase.subtitle}
              </p>
            </div>
          </div>

          {/* Date Controls + View Switcher + Add Block */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Stepper */}
            <div className="flex items-center bg-[#12151f] border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => shiftDate(-1)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() =>
                  setSelectedDate(toLocalDateInputValue(new Date()))
                }
                className="px-2.5 py-0.5 text-xs font-semibold text-zinc-200 hover:text-amber-300 transition-colors flex items-center gap-1.5"
              >
                <CalendarIcon size={12} className="text-amber-400" />
                {formattedSelectedDate}
              </button>
              <button
                onClick={() => shiftDate(1)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Next Day"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Solar Wedges vs Quadrants Mode */}
            <div className="flex items-center bg-[#12151f] border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode("solar")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  viewMode === "quadrants"
                    ? "bg-white/10 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Layers size={13} className="text-sky-400" />
                Quadrants
              </button>
            </div>

            {/* New Circadian Block Button */}
            <button
              onClick={() => {
                setEditingEvent(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.28)] hover:brightness-110 transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Block
            </button>
          </div>
        </header>

        {/* Multi-Day Active Highlight Banner + Ops Notification Toast */}
        {(activeMultiDaySpans.length > 0 || opsBannerMsg) && (
          <div className="px-6 pt-3 flex flex-wrap items-center gap-2">
            {activeMultiDaySpans.map((sp) => (
              <div
                key={`md-banner-${sp.id}`}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium"
                style={{
                  backgroundColor: `${sp.color}16`,
                  borderColor: `${sp.color}55`,
                  color: "#f8fafc",
                }}
              >
                <Highlighter size={13} style={{ color: sp.color }} />
                <span className="font-bold uppercase tracking-wider text-[10.5px]">
                  Active Multi-Day Highlight:
                </span>
                <span>{sp.label}</span>
                <span className="font-mono text-[10.5px] text-zinc-300">
                  ({sp.startDate} → {sp.endDate} ·{" "}
                  {minutesToHHMM(sp.startMinute)}–{minutesToHHMM(sp.endMinute)})
                </span>
              </div>
            ))}

            {opsBannerMsg && (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-medium">
                {opsBannerMsg}
              </div>
            )}
          </div>
        )}

        {/* Main Workspace Split: Center Celestial Dial + Right Executive Rail */}
        <div className="flex flex-col xl:flex-row gap-5 px-6 py-4 items-stretch">
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
              radarLayers={radarLayers}
              activeRadarTypes={activeRadarTypes}
              habits={habits}
              highlightSpans={highlightSpans}
              selectedDate={selectedDate}
              subtaskStylesById={subtaskStylesById}
              onToggleSubtaskStyle={handleToggleSubtaskStyleForEvent}
              onQuickIncrementHabit={(habitId, delta) =>
                handleLogHabit(habitId, { delta })
              }
            />

            {/* Bottom-Left Floating Card: MICRO-STATISTICS + 360° Walk Ring Quick Readout */}
            <div className="xl:absolute xl:left-1 xl:bottom-2 z-20 w-full xl:w-[288px] rounded-2xl bg-[#12151e]/90 backdrop-blur-xl border border-white/[0.08] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.6)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-400">
                  MICRO-STATISTICS
                </span>
                {loadingEvents && (
                  <RefreshCw size={11} className="animate-spin text-zinc-500" />
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
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

            {/* Domain Color Legend Pill Bar */}
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

          {/* RIGHT EXECUTIVE RAIL: DAILY FOCUS + NESTED ROMAN/BULLET AGENDA + INTEGRATION BADGES */}
          <aside className="w-full xl:w-[376px] shrink-0 flex flex-col gap-4">
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
                  Quick task cards & shift status ({paySummary.daysWorked}/
                  {paySummary.totalScheduledDays} days worked)
                </p>

                <div className="space-y-2.5">
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
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: ev.accentColor }}
                            />
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
                              className="flex items-center gap-2 mt-2 pl-0.5"
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

              {/* AGENDA SECTION WITH NESTED ROMAN NUMERAL (I, II, III, IV) / BULLET (•) SUBTASKS */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold tracking-[0.12em] uppercase text-zinc-100">
                      AGENDA & SUBTASKS
                    </h2>
                    <button
                      type="button"
                      onClick={handleToggleGlobalSubtaskStyle}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-[9.5px] font-mono font-bold text-amber-300 transition-colors"
                      title="Toggle all nested subtasks between Roman Numerals (I, II, III, IV) and Bullets (•)"
                    >
                      <ListOrdered size={10} />
                      {globalSubtaskStyle === "roman" ? "I, II, III" : "Bullets •"}
                    </button>
                  </div>

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

                <div className="relative space-y-2.5 overflow-y-auto max-h-[430px] pr-1">
                  <div className="pointer-events-none absolute left-[9px] top-3 bottom-3 w-px bg-white/10" />

                  {sortedAgenda.map(
                    ({
                      event,
                      sMin,
                      eMin,
                      doneChecks,
                      totalChecks,
                      isComplete,
                      anticipatedPay,
                      actualPay,
                      dailyMoneyUsed,
                    }) => {
                      const isSelected = selectedEventId === event.id;
                      const isExpanded =
                        Boolean(expandedAgendaIds[event.id]) || isSelected;
                      const styleMode =
                        subtaskStylesById[event.id] ??
                        event.subtaskStyle ??
                        globalSubtaskStyle;
                      const hh = String(Math.floor(sMin / 60)).padStart(2, "0");
                      const mm = String(Math.floor(sMin % 60)).padStart(2, "0");
                      const ehh = String(Math.floor(eMin / 60)).padStart(2, "0");
                      const emm = String(Math.floor(eMin % 60)).padStart(2, "0");
                      const isWorkBlock = event.title
                        .toLowerCase()
                        .includes("go to work");

                      return (
                        <div
                          key={`agenda-${event.id}`}
                          className={`relative rounded-xl border transition-all p-2 ${
                            isSelected
                              ? "bg-white/[0.07] border-white/20"
                              : "bg-[#161a26]/75 hover:bg-[#191e2c] border-white/[0.05]"
                          }`}
                        >
                          {/* Parent Time Block Header */}
                          <div
                            onClick={() => {
                              setSelectedEventId(isSelected ? null : event.id);
                              setExpandedAgendaIds((p) => ({
                                ...p,
                                [event.id]: !isExpanded,
                              }));
                            }}
                            className="flex items-start gap-2.5 cursor-pointer"
                          >
                            <span
                              className={`relative z-10 mt-0.5 w-[19px] h-[19px] rounded-full flex items-center justify-center border shrink-0 transition-all ${
                                isComplete
                                  ? "border-transparent text-black shadow-sm"
                                  : "bg-[#12151e] text-zinc-300"
                              }`}
                              style={{
                                backgroundColor: isComplete
                                  ? event.accentColor || "#fbbf24"
                                  : undefined,
                                borderColor: !isComplete
                                  ? event.accentColor || "#52525b"
                                  : undefined,
                              }}
                            >
                              <Check size={10} strokeWidth={3} />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="text-xs font-semibold text-zinc-100 truncate">
                                  <span
                                    className="font-mono mr-1.5"
                                    style={{
                                      color: event.accentColor || "#e4e4e7",
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {hh}:{mm}
                                  </span>
                                  {event.title}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSubtaskStyleForEvent(
                                        event.id
                                      );
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/12 text-[9px] font-mono text-amber-300"
                                    title="Switch Roman Numerals / Bullets for this block"
                                  >
                                    {styleMode === "roman" ? "I·II" : "•"}
                                  </button>
                                  <ChevronDown
                                    size={12}
                                    className={`text-zinc-400 transition-transform ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-zinc-400 mt-0.5">
                                <span className="font-mono">
                                  {hh}:{mm}–{ehh}:{emm}
                                </span>
                                <span>·</span>
                                <span>
                                  {doneChecks}/{totalChecks} subtasks
                                </span>
                                {(actualPay > 0 || anticipatedPay > 0) && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[9.5px]">
                                    ${actualPay || anticipatedPay}
                                  </span>
                                )}
                                {dailyMoneyUsed > 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-300 font-mono text-[9.5px]">
                                    -${dailyMoneyUsed}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Nested Subtasks Underneath Calendar Block (Roman I, II, III, IV or Bullets •) */}
                          {isExpanded && (
                            <div className="mt-2 ml-6 pl-2.5 border-l border-white/10 space-y-1">
                              {isWorkBlock && (
                                <div className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-sky-300 pb-0.5">
                                  07:00 – 08:00 Nested Opening Protocol:
                                </div>
                              )}
                              {event.checklists.map((chk, idx) => (
                                <button
                                  key={chk.id}
                                  type="button"
                                  onClick={() =>
                                    handleToggleChecklist(
                                      event.id,
                                      chk.id,
                                      !chk.isCompleted
                                    )
                                  }
                                  className="w-full flex items-start gap-1.5 text-left py-0.5 px-1 rounded hover:bg-white/[0.05] transition-colors"
                                >
                                  <span
                                    className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                                      chk.isCompleted
                                        ? "bg-amber-400 border-amber-400 text-black"
                                        : "border-zinc-600"
                                    }`}
                                  >
                                    {chk.isCompleted && (
                                      <Check size={9} strokeWidth={3} />
                                    )}
                                  </span>
                                  <span className="text-[10.5px] font-mono font-bold text-amber-300 shrink-0 min-w-[20px]">
                                    {formatSubtaskMarker(idx, styleMode)}
                                  </span>
                                  <span
                                    className={`text-[11px] leading-snug ${
                                      chk.isCompleted
                                        ? "line-through text-zinc-500"
                                        : "text-zinc-200"
                                    }`}
                                  >
                                    {chk.label}
                                  </span>
                                </button>
                              ))}

                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const txt = (
                                    agendaSubtaskDrafts[event.id] || ""
                                  ).trim();
                                  if (!txt) return;
                                  handleAddChecklist(event.id, txt);
                                  setAgendaSubtaskDrafts((p) => ({
                                    ...p,
                                    [event.id]: "",
                                  }));
                                }}
                                className="flex items-center gap-1 pt-1"
                              >
                                <input
                                  type="text"
                                  value={agendaSubtaskDrafts[event.id] || ""}
                                  onChange={(e) =>
                                    setAgendaSubtaskDrafts((p) => ({
                                      ...p,
                                      [event.id]: e.target.value,
                                    }))
                                  }
                                  placeholder={`+ Add ${
                                    styleMode === "roman"
                                      ? "Roman (I, II...)"
                                      : "bullet"
                                  } subtask`}
                                  className="flex-1 bg-black/35 border border-white/10 rounded px-2 py-0.5 text-[10.5px] text-white placeholder:text-zinc-500"
                                />
                                <button
                                  type="submit"
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-[10px] font-semibold text-zinc-200"
                                >
                                  +
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* INTEGRATION BADGES Glass Card */}
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
                        <polygon points="12,5 20,19 4,19" fill="#38bdf8" />
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

        {/* Lower Integrated Command Deck: Batching, Color Studio, Highlights, 360° Habit Rings, Shift×Pay Calculator & Full-Year Appointments */}
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
          onAutoBatchTasks={handleAutoBatchTasks}
          onRandomizeColors={handleRandomizeColors}
          onRecolorEvent={handleRecolorEvent}
          onLogHabit={handleLogHabit}
          onCreateHabit={async (payload) => {
            await postCalendarOps({ action: "create_habit", ...payload });
          }}
          onDeleteHabit={async (habitId) => {
            setHabits((prev) => prev.filter((h) => h.id !== habitId));
            await postCalendarOps({ action: "delete_habit", habitId });
          }}
          onCreateHighlightSpan={async (payload) => {
            await postCalendarOps({
              action: "create_highlight_span",
              ...payload,
            });
          }}
          onToggleHighlightSpan={async (spanId, isActive) => {
            setHighlightSpans((prev) =>
              prev.map((s) => (s.id === spanId ? { ...s, isActive } : s))
            );
            await postCalendarOps({
              action: "toggle_highlight_span",
              spanId,
              isActive,
            });
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
            await postCalendarOps({ action: "create_appointment", ...payload });
          }}
          onUpdateAppointment={async (id, patch) => {
            setAppointments((prev) =>
              prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
            );
            await postCalendarOps({
              action: "update_appointment",
              id,
              ...patch,
            });
          }}
          onDeleteAppointment={async (id) => {
            setAppointments((prev) => prev.filter((a) => a.id !== id));
            await postCalendarOps({ action: "delete_appointment", id });
          }}
        />
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
