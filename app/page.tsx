"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import {
  CalendarRange,
  Dumbbell,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ExternalLink,
  Flame,
  Moon,
  Footprints,
  Activity,
  Timer,
  Sun,
  Palette,
  Sparkles,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Clock,
  ShieldCheck,
} from "lucide-react";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
}

interface FocusTask {
  id: string;
  title: string;
  completed: boolean;
  priority: "high" | "normal" | "low";
  timeEstimate?: string;
}

// Zero Dummy Data: Hydrate Focus Tasks from Supabase / empty state
const INITIAL_TASKS: FocusTask[] = [];

/* ============================================================================
 * MAIN EXECUTIVE DASHBOARD COCKPIT
 * ========================================================================== */

export default function ChairmanCockpitPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const calConnected = !!(session as any)?.accessToken;

  const [activeTab, setActiveTab] = useState("MASTER");
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [deepWork, setDeepWork] = useState(false);

  // Live Clock & Greeting
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [greeting, setGreeting] = useState("Good Morning");

  // Google Calendar Events
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);

  // Daily Focus Tasks
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "active" | "completed">("all");

  // Health Vitals (Strictly Steps, Sleep, Exercise)
  const stepsCurrent = 8542;
  const stepsGoal = 10000;
  const stepsMiles = 4.2;
  const stepsKcal = 420;

  const sleepHours = "7h 48m";
  const sleepQuality = 92; // 92%
  const sleepWakeTime = "6:45 AM";

  const exerciseMinutes = 62;
  const exerciseStreakDays = 5;
  const exerciseRoutine = "Push Day Hypertrophy";

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
      const hour = now.getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Google Calendar Events if connected
  const fetchCalendar = useCallback(async () => {
    if (!calConnected) return;
    setCalLoading(true);
    setCalError(null);
    try {
      const res = await fetch("/api/calendar");
      if (!res.ok) {
        throw new Error("Unable to sync Google Calendar");
      }
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setCalendarEvents(data.items.slice(0, 5));
      }
    } catch (err: any) {
      setCalError(err.message || "Failed to load events");
    } finally {
      setCalLoading(false);
    }
  }, [calConnected]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // Task Actions
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: FocusTask = {
      id: `task_${Date.now()}`,
      title: newTaskInput.trim(),
      completed: false,
      priority: "normal",
      timeEstimate: "30m",
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskInput("");
  };

  const filteredTasks = useMemo(() => {
    if (taskFilter === "active") return tasks.filter((t) => !t.completed);
    if (taskFilter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, taskFilter]);

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="executive-glass-shell min-h-screen bg-transparent text-zinc-900 dark:text-zinc-50 flex flex-row overflow-x-hidden transition-colors duration-300">
      {/* Sidebar Navigation */}
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
        activeTasksCount={tasks.filter((t) => !t.completed).length}
        activeSubtasksCount={0}
        tasksLoading={false}
      />

      {/* Main Spacious Eco Cockpit Content */}
      <main className="flex-1 min-w-0 min-h-screen bg-transparent relative pt-14 lg:pt-0 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
          {/* ==================================================================
           * 1. TOP HEADER & GREETING (Inspired by Laid-back Eco Home Vibes)
           * ================================================================ */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  Pristine Executive Cockpit
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                {greeting}, {user?.name?.split(" ")[0] || "Chairman"}!
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
                {currentDate} • <span className="font-mono text-zinc-300 dark:text-zinc-300">{currentTime}</span>
              </p>
            </div>

            {/* Quick Action Capsules */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Google Calendar Sync Pill */}
              <button
                type="button"
                onClick={() => (calConnected ? fetchCalendar() : signIn("google"))}
                className="eco-glass-pill px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold hover:border-amber-400/50 transition-all cursor-pointer"
                title={calConnected ? "Sync Google Calendar" : "Connect Google Calendar"}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    calConnected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 animate-pulse"
                  }`}
                />
                <span className="text-zinc-200">
                  {calConnected ? "Google Calendar Connected" : "Connect Google Calendar"}
                </span>
                <RefreshCw className={`w-3 h-3 text-zinc-400 ${calLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* ==================================================================
           * 2. HEALTH VITALS: STRICTLY STEPS, SLEEP & EXERCISE ONLY
           * ================================================================== */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-zinc-300">
                  Daily Physiological Vitals
                </h2>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                Optimal Recovery Zone
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* VITAL 1: STEPS */}
              <div className="eco-glass-card p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px]">
                    Movement & Cadence
                  </span>
                  <Footprints className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="my-4 flex items-center justify-between">
                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-100 tracking-tight">
                      {stepsCurrent.toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Goal: {stepsGoal.toLocaleString()} steps ({Math.round((stepsCurrent / stepsGoal) * 100)}%)
                    </div>
                  </div>

                  {/* Circular Radial Gauge */}
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/10"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-400"
                        strokeDasharray={`${(stepsCurrent / stepsGoal) * 100}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-mono font-bold text-emerald-300">
                      {Math.round((stepsCurrent / stepsGoal) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>{stepsMiles} Miles Walked</span>
                  <span>{stepsKcal} kcal Burned</span>
                </div>
              </div>

              {/* VITAL 2: SLEEP */}
              <div className="eco-glass-card p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px]">
                    Sleep Architecture
                  </span>
                  <Moon className="w-4 h-4 text-indigo-400" />
                </div>

                <div className="my-4 flex items-center justify-between">
                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-100 tracking-tight">
                      {sleepHours}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Sleep Score: {sleepQuality}% • High Recovery
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-bold">
                    Optimal
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Awake at {sleepWakeTime}</span>
                  <span>1h 45m Deep Sleep</span>
                </div>
              </div>

              {/* VITAL 3: EXERCISE */}
              <div className="eco-glass-card p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px]">
                    Training & Hypertrophy
                  </span>
                  <Dumbbell className="w-4 h-4 text-amber-400" />
                </div>

                <div className="my-4 flex items-center justify-between">
                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-100 tracking-tight">
                      {exerciseMinutes} <span className="text-base text-zinc-400 font-normal">min</span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {exerciseRoutine}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{exerciseStreakDays}d Streak</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">14 Sets Completed</span>
                  <Link
                    href="/workouts"
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-0.5"
                  >
                    <span>Open Workouts</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================================
           * 3. MAIN COCKPIT GRID: WORKOUT ENGINE HERO & CIRCADIAN CALENDAR
           * ================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 7-COL: TODAY'S BODYBUILDING WORKOUT LAUNCHER */}
            <div className="lg:col-span-7 space-y-6">
              <div className="eco-glass-card p-6 sm:p-7 rounded-3xl space-y-5 border border-amber-400/20 shadow-[0_12px_40px_rgba(245,158,11,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-100">
                        Titan Bodybuilding & Workout Engine
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Dedicated strength tracker, progressive overload sets, rest timer & 1RM
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/workouts"
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shadow-lg transition-all"
                  >
                    <span>Launch Workout Tracker</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Workout Preview Routine */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200">
                      Active Split: Push Day (Chest / Shoulders / Triceps)
                    </span>
                    <span className="font-mono text-amber-300">
                      Target Volume: ~16,000 lbs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] text-zinc-500 uppercase">Exercise 1</div>
                      <div className="font-bold text-zinc-200 truncate">Incline DB Press</div>
                      <div className="text-amber-400/90 text-[11px]">4 × 10 (90 lbs)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] text-zinc-500 uppercase">Exercise 2</div>
                      <div className="font-bold text-zinc-200 truncate">Bench Press</div>
                      <div className="text-amber-400/90 text-[11px]">4 × 6 (225 lbs)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] text-zinc-500 uppercase">Exercise 3</div>
                      <div className="font-bold text-zinc-200 truncate">Lateral Raises</div>
                      <div className="text-amber-400/90 text-[11px]">4 × 15 (35 lbs)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] text-zinc-500 uppercase">Exercise 4</div>
                      <div className="font-bold text-zinc-200 truncate">Rope Pushdowns</div>
                      <div className="text-amber-400/90 text-[11px]">3 × 12 (75 lbs)</div>
                    </div>
                  </div>
                </div>

                <div className="flex sm:hidden">
                  <Link
                    href="/workouts"
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold"
                  >
                    <span>Launch Workout Tracker</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* EXECUTIVE DAILY FOCUS TASK CHECKLIST */}
              <div className="eco-glass-card p-6 sm:p-7 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-base font-bold text-zinc-100">
                      Executive Daily Focus
                    </h3>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/5 text-[11px]">
                    {(["all", "active", "completed"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setTaskFilter(f)}
                        className={`px-2.5 py-0.5 rounded-lg capitalize transition-colors ${
                          taskFilter === f
                            ? "bg-white/10 text-white font-semibold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add New Task Input */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an executive objective for today (press Enter)..."
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-100 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Tasks List */}
                <div className="space-y-2 pt-1">
                  {filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        t.completed
                          ? "bg-white/[0.01] border-white/5 opacity-60"
                          : "bg-white/[0.03] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(t.id)}
                          className="focus:outline-none cursor-pointer"
                        >
                          {t.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-500 hover:text-amber-400" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-medium ${
                            t.completed
                              ? "line-through text-zinc-500"
                              : "text-zinc-200"
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {t.timeEstimate && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {t.timeEstimate}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          title="Delete task"
                          className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-zinc-500 text-right font-mono">
                  {completedCount} of {tasks.length} tasks completed
                </div>
              </div>
            </div>

            {/* RIGHT 5-COL: CIRCADIAN SOLAR WHEEL PREVIEW & GOOGLE CALENDAR AGENDA */}
            <div className="lg:col-span-5 space-y-6">
              {/* CIRCADIAN SOLAR ARC PREVIEW CARD */}
              <div className="eco-glass-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-zinc-100 tracking-wide">
                      Circadian Solar Arc
                    </h3>
                  </div>

                  <Link
                    href="/calendar"
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-0.5"
                  >
                    <span>Full 24H Wheel</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Solar Dial Mini Preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-900/20 via-amber-900/10 to-indigo-950/30 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                      Solar Phase
                    </div>
                    <div className="text-base font-extrabold text-zinc-100 mt-0.5">
                      Solar Zenith • Peak Focus
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-1">
                      Sunrise: 6:42 AM • Sunset: 6:18 PM
                    </div>
                  </div>

                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.25)]">
                    <Sun className="w-7 h-7 text-amber-400 animate-spin-slow" />
                  </div>
                </div>
              </div>

              {/* GOOGLE CALENDAR AGENDA FEED */}
              <div className="eco-glass-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-zinc-100 tracking-wide">
                      Upcoming Appointments
                    </h3>
                  </div>

                  {calConnected ? (
                    <button
                      type="button"
                      onClick={fetchCalendar}
                      className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${calLoading ? "animate-spin" : ""}`} />
                      <span>Sync</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => signIn("google")}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Connect GCal
                    </button>
                  )}
                </div>

                {calConnected && calendarEvents.length > 0 ? (
                  <div className="space-y-2.5">
                    {calendarEvents.map((evt) => {
                      const startTime = evt.start?.dateTime
                        ? new Date(evt.start.dateTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "All Day";
                      return (
                        <div
                          key={evt.id}
                          className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-zinc-200 block">
                              {evt.summary || "Untitled Event"}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {startTime}
                            </span>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                        </div>
                      );
                    })}
                  </div>
                ) : calConnected ? (
                  <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                    No scheduled calendar appointments today. Enjoy deep work!
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <p className="text-xs text-zinc-400">
                      Connect your Google Calendar to stream real-time appointments onto your solar dashboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => signIn("google")}
                      className="px-4 py-1.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                    >
                      Connect Google Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Appearance & Themes Modal */}
      {isAppearanceOpen && (
        <AppearanceSettings onClose={() => setIsAppearanceOpen(false)} />
      )}
    </div>
  );
}
