"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Dumbbell,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Moon,
  Footprints,
  Sun,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Zap,
  Sparkles,
  Compass,
  Utensils,
  TrendingUp,
  Users,
  GripVertical,
  SlidersHorizontal,
  Eye,
  EyeOff,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

interface FocusTask {
  id: string;
  title: string;
  completed: boolean;
}

type WidgetId =
  | "daily_focus"
  | "vitals"
  | "calendar"
  | "skills_artifacts"
  | "spheres";

interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "daily_focus", label: "Daily Focus", visible: true },
  { id: "vitals", label: "Physiological Vitals", visible: true },
  { id: "calendar", label: "Calendar & Solar Arc", visible: true },
  { id: "skills_artifacts", label: "Skills & Artifacts", visible: true },
  { id: "spheres", label: "Life Spheres", visible: true },
];

const WIDGET_LAYOUT_KEY = "chairman-home-widgets-v1";

export default function ChairmanHomeDashboard() {
  const { data: session } = useSession();
  const user = session?.user;
  const calConnected = !!(session as any)?.accessToken;

  // Customizable Drag-and-Drop Widget Order
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WIDGET_LAYOUT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((w) => w.id));
          const merged = [...parsed];
          for (const d of DEFAULT_WIDGETS) {
            if (!ids.has(d.id)) merged.push(d);
          }
          setWidgets(merged);
        }
      }
    } catch {}
  }, []);

  const persistWidgets = (next: WidgetConfig[]) => {
    setWidgets(next);
    try {
      localStorage.setItem(WIDGET_LAYOUT_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleWidgetDrop = (targetId: WidgetId) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) {
      setDraggedWidgetId(null);
      return;
    }
    const next = [...widgets];
    const from = next.findIndex((w) => w.id === draggedWidgetId);
    const to = next.findIndex((w) => w.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistWidgets(next);
    setDraggedWidgetId(null);
  };

  const toggleWidget = (id: WidgetId) => {
    persistWidgets(
      widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  // Live Clock & Greeting
  const [currentTime, setCurrentTime] = useState("");
  const [greeting, setGreeting] = useState("Good morning");

  // Google Calendar Events
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);

  // Daily Focus Tasks (Zero dummy data)
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "active" | "completed">("all");

  // Live Health Vitals (Zero dummy data — hydrated from /api/sitrep)
  const [stepsCurrent, setStepsCurrent] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<string>("0h");
  const [waterOz, setWaterOz] = useState<number>(0);
  const [exerciseCompleted, setExerciseCompleted] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${String(h).padStart(2, "0")}${m}`);
      if (h < 12) setGreeting("Good morning");
      else if (h < 18) setGreeting("Good afternoon");
      else setGreeting("Good evening");
    };
    updateTime();
    const id = setInterval(updateTime, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    fetch(`/api/sitrep?date=${todayIso}&limit=7`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const log = data?.todayLog;
        if (!log) return;
        setStepsCurrent(Number(log.total_steps || 0));
        setWaterOz(Number(log.water_oz || 0));
        if (log.sleep_hours != null) setSleepHours(`${log.sleep_hours}h`);
        setExerciseCompleted(Boolean(log.lift_completed || log.cardio_completed));
      })
      .catch(() => {});
  }, []);

  const fetchCalendar = useCallback(async () => {
    if (!calConnected) return;
    setCalLoading(true);
    try {
      const res = await fetch("/api/calendar");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) setCalendarEvents(data.items.slice(0, 5));
      }
    } catch {
    } finally {
      setCalLoading(false);
    }
  }, [calConnected]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks((prev) => [
      { id: `task_${Date.now()}`, title: newTaskInput.trim(), completed: false },
      ...prev,
    ]);
    setNewTaskInput("");
  };

  const filteredTasks = useMemo(() => {
    if (taskFilter === "active") return tasks.filter((t) => !t.completed);
    if (taskFilter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, taskFilter]);

  const firstName = user?.name?.split(" ")[0] || "Diego";

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--glass-surface-elevated)",
    borderColor: "var(--glass-border)",
    boxShadow: "var(--glass-shadow)",
    color: "var(--glass-text-primary)",
  };

  const renderWidget = (w: WidgetConfig) => {
    if (!w.visible) return null;

    const dragProps = {
      draggable: true,
      onDragStart: () => setDraggedWidgetId(w.id),
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        handleWidgetDrop(w.id);
      },
      onDragEnd: () => setDraggedWidgetId(null),
    };

    const wrapClass = `rounded-[14px] border p-5 transition-all ${
      draggedWidgetId === w.id ? "opacity-50 scale-[0.99]" : ""
    }`;

    if (w.id === "daily_focus") {
      return (
        <div key={w.id} {...dragProps} className={`${wrapClass} lg:col-span-2`} style={cardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
              <GripVertical size={15} className="opacity-45" />
              <CheckCircle2 size={16} className="text-[#4984fd]" />
              <h2 className="text-[17px] font-medium">Daily Focus</h2>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-[110px] border" style={{ borderColor: "var(--glass-border)", backgroundColor: "var(--glass-surface)" }}>
              {(["all", "active", "completed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTaskFilter(f)}
                  className="px-3 py-0.5 rounded-[110px] text-[12px] font-medium capitalize transition-all"
                  style={{
                    backgroundColor: taskFilter === f ? "rgba(73, 132, 253, 0.16)" : "transparent",
                    color: taskFilter === f ? "#4984fd" : "var(--glass-text-muted)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2 mt-4">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="Add an objective for today (press Enter)..."
              className="flex-1 px-3 py-2 text-[13px] border focus:outline-none focus:border-[#4984fd]"
              style={{
                borderRadius: "0px",
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
                color: "var(--glass-text-primary)",
              }}
            />
            <button type="submit" className="cluely-cta text-[13px] px-4 py-2 shrink-0">
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {filteredTasks.length === 0 ? (
              <div
                className="py-6 text-center rounded-[10px] border text-[13px]"
                style={{
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                  color: "var(--glass-text-muted)",
                }}
              >
                No objectives added yet. Type above to start today&apos;s queue.
              </div>
            ) : (
              filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className="px-3.5 py-2.5 rounded-[10px] border flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setTasks((prev) =>
                        prev.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x))
                      )
                    }
                    className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                  >
                    {t.completed ? (
                      <CheckCircle2 size={16} className="text-[#4984fd] shrink-0" />
                    ) : (
                      <Circle size={16} className="opacity-50 shrink-0" />
                    )}
                    <span className={`text-[14px] truncate ${t.completed ? "line-through opacity-55" : ""}`}>
                      {t.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                    className="opacity-50 hover:opacity-100 hover:text-rose-500 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (w.id === "vitals") {
      return (
        <div key={w.id} {...dragProps} className={wrapClass} style={cardStyle}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
              <GripVertical size={15} className="opacity-45" />
              <Footprints size={16} className="text-[#10b981]" />
              <h2 className="text-[17px] font-medium">Physiological Vitals</h2>
            </div>
            <Link href="/macro-ops" className="text-[12px] text-[#4984fd] hover:underline inline-flex items-center gap-0.5">
              <span>Nutrition</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Steps", value: stepsCurrent.toLocaleString(), sub: "Target 10,000", icon: <Footprints size={13} /> },
              { label: "Water Intake", value: `${waterOz} oz`, sub: "Target 128 oz", icon: <Utensils size={13} /> },
              { label: "Sleep", value: sleepHours, sub: "Daily rest", icon: <Moon size={13} /> },
              { label: "Training", value: exerciseCompleted ? "Done" : "0", sub: "Strength session", icon: <Dumbbell size={13} /> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3 rounded-[10px] border space-y-1"
                style={{ backgroundColor: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
              >
                <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--glass-text-muted)" }}>
                  <span>{stat.label}</span>
                  <span className="text-[#4984fd]">{stat.icon}</span>
                </div>
                <div className="text-[20px] font-medium tabular-nums">{stat.value}</div>
                <div className="text-[11px]" style={{ color: "var(--glass-text-muted)" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (w.id === "calendar") {
      return (
        <div key={w.id} {...dragProps} className={wrapClass} style={cardStyle}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
              <GripVertical size={15} className="opacity-45" />
              <Sun size={16} className="text-[#f59e0b]" />
              <h2 className="text-[17px] font-medium">Solar Arc &amp; Agenda</h2>
            </div>
            <Link href="/calendar" className="text-[12px] text-[#4984fd] hover:underline inline-flex items-center gap-0.5">
              <span>2400 Dial</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            <div
              className="p-3 rounded-[10px] border flex items-center justify-between"
              style={{ backgroundColor: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
            >
              <div>
                <div className="text-[11px]" style={{ color: "var(--glass-text-muted)" }}>Military Time</div>
                <div className="text-[20px] font-medium tabular-nums">{currentTime || "0000"}</div>
              </div>
              {calConnected ? (
                <button
                  type="button"
                  onClick={fetchCalendar}
                  className="text-[12px] inline-flex items-center gap-1 text-[#4984fd]"
                >
                  <RefreshCw size={12} className={calLoading ? "animate-spin" : ""} />
                  <span>Sync GCal</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="text-[12px] font-medium text-[#4984fd] hover:underline"
                >
                  Connect GCal
                </button>
              )}
            </div>

            {calendarEvents.length > 0 ? (
              <div className="space-y-1.5">
                {calendarEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="px-3 py-2 rounded-[10px] border flex items-center justify-between text-[13px]"
                    style={{ backgroundColor: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                  >
                    <span className="truncate">{ev.summary || "Untitled"}</span>
                    <Calendar size={12} className="text-[#4984fd] shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-center py-2" style={{ color: "var(--glass-text-muted)" }}>
                No upcoming appointments synced yet.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (w.id === "skills_artifacts") {
      return (
        <div key={w.id} {...dragProps} className={`${wrapClass} lg:col-span-2`} style={cardStyle}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
              <GripVertical size={15} className="opacity-45" />
              <Zap size={16} className="text-[#4984fd]" />
              <h2 className="text-[17px] font-medium">Skills &amp; Artifacts Studio</h2>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <Link href="/skills" className="text-[#4984fd] hover:underline">Skills</Link>
              <Link href="/artifacts" className="text-[#4984fd] hover:underline">Artifacts</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/skills"
              className="p-4 rounded-[12px] border flex flex-col justify-between gap-3 hover:border-[#4984fd] transition-all"
              style={{ backgroundColor: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
            >
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#4984fd]" />
                <span className="text-[15px] font-medium">Reusable Skills</span>
              </div>
              <p className="text-[12px]" style={{ color: "var(--glass-text-muted)" }}>
                Triage tasks like me, plan like me, delegate like me, and scope like me.
              </p>
            </Link>

            <Link
              href="/artifacts"
              className="p-4 rounded-[12px] border flex flex-col justify-between gap-3 hover:border-[#4984fd] transition-all"
              style={{ backgroundColor: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#ec4899]" />
                <span className="text-[15px] font-medium">Artifacts Builder</span>
              </div>
              <p className="text-[12px]" style={{ color: "var(--glass-text-muted)" }}>
                Build marketing hubs, reports, websites, dashboards, guides, charts, and slides.
              </p>
            </Link>
          </div>
        </div>
      );
    }

    if (w.id === "spheres") {
      return (
        <div key={w.id} {...dragProps} className={`${wrapClass} lg:col-span-3`} style={cardStyle}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
              <GripVertical size={15} className="opacity-45" />
              <Compass size={16} className="text-[#4984fd]" />
              <h2 className="text-[17px] font-medium">Life Spheres &amp; Operations</h2>
            </div>
            <span className="text-[11px]" style={{ color: "var(--glass-text-muted)" }}>
              Drag any widget header to rearrange
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: "Operations", sub: "Strategy, PMS, Roadmaps & Architecture", href: "/command", icon: <Compass size={15} /> },
              { name: "Health", sub: "Training, Nutrition, Solar Arc & Mindset", href: "/macro-ops", icon: <Utensils size={15} /> },
              { name: "Wealth", sub: "Budget, Caliber Arc & Trend Intelligence", href: "/budget", icon: <TrendingUp size={15} /> },
              { name: "Family", sub: "His & Hers Pods & Family Hub", href: "/family-hub", icon: <Users size={15} /> },
            ].map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="p-4 rounded-[12px] border flex flex-col justify-between gap-2 hover:border-[#4984fd] transition-all"
                style={{ backgroundColor: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium">{s.name}</span>
                  <span className="text-[#4984fd]">{s.icon}</span>
                </div>
                <p className="text-[12px]" style={{ color: "var(--glass-text-muted)" }}>{s.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <ExecutiveModuleShell
      moduleId="MASTER"
      eyebrow="Operations"
      title={`${greeting}, ${firstName}`}
      subtitle="Drag cards to customize your layout or drop sidebar modules into any life sphere"
      accentColor="#4984fd"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomizeOpen((p) => !p)}
            className="liquid-glass-pill px-3 py-1.5 text-[12.5px] font-medium inline-flex items-center gap-1.5"
            style={{ color: "var(--glass-text-primary)" }}
          >
            <SlidersHorizontal size={13} className="text-[#4984fd]" />
            <span>Customize</span>
          </button>
          <Link href="/skills" className="cluely-cta text-[12.5px] px-3.5 py-1.5">
            <Zap size={13} />
            <span>Skills</span>
          </Link>
        </div>
      }
    >
      {/* Optional Customize Bar to Toggle Widgets */}
      {customizeOpen && (
        <div
          className="rounded-[12px] border p-4 flex flex-wrap items-center justify-between gap-3"
          style={cardStyle}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium mr-1" style={{ color: "var(--glass-text-muted)" }}>
              Toggle widgets:
            </span>
            {widgets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => toggleWidget(w.id)}
                className="px-3 py-1 rounded-[110px] border text-[12px] font-medium inline-flex items-center gap-1.5 transition-all"
                style={{
                  backgroundColor: w.visible ? "rgba(73, 132, 253, 0.14)" : "var(--glass-surface)",
                  borderColor: w.visible ? "rgba(73, 132, 253, 0.45)" : "var(--glass-border)",
                  color: "var(--glass-text-primary)",
                }}
              >
                {w.visible ? <Eye size={12} className="text-[#4984fd]" /> : <EyeOff size={12} className="opacity-50" />}
                <span>{w.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => persistWidgets(DEFAULT_WIDGETS)}
            className="text-[12px] text-[#4984fd] hover:underline"
          >
            Reset layout
          </button>
        </div>
      )}

      {/* Draggable 3-Column Executive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {widgets.map((w) => renderWidget(w))}
      </div>
    </ExecutiveModuleShell>
  );
}
