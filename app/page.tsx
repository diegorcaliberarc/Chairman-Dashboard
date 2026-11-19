"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import { CluelyFooter } from "@/components/chairman/CluelyFooter";
import {
  Dumbbell,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Flame,
  Moon,
  Footprints,
  Sun,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  ShieldCheck,
  Mic,
  GitBranch,
  Compass,
  Utensils,
  TrendingUp,
  Users,
  Lock,
} from "lucide-react";

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

  // Daily Focus Tasks (Zero dummy data)
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "active" | "completed">("all");

  // Health Vitals (Zero dummy data — hydrated live from /api/sitrep)
  const [stepsCurrent, setStepsCurrent] = useState<number>(0);
  const stepsGoal = 10000;
  const [stepsMiles, setStepsMiles] = useState<number>(0);
  const [stepsKcal, setStepsKcal] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<string>("0h");
  const [sleepQuality, setSleepQuality] = useState<number>(0);
  const [exerciseCompleted, setExerciseCompleted] = useState<boolean>(false);

  useEffect(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    fetch(`/api/sitrep?date=${todayIso}&limit=7`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const log = data?.todayLog;
        if (!log) return;
        setStepsCurrent(Number(log.total_steps || 0));
        setStepsMiles(Number(log.miles || 0));
        setStepsKcal(Number(log.kcal_burned || 0));
        if (log.sleep_hours != null) setSleepHours(`${log.sleep_hours}h`);
        if (log.recovery_score != null) setSleepQuality(Number(log.recovery_score));
        setExerciseCompleted(Boolean(log.lift_completed || log.cardio_completed));
      })
      .catch(() => {});
  }, []);

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
      if (hour < 12) setGreeting("Good morning");
      else if (hour < 18) setGreeting("Good afternoon");
      else setGreeting("Good evening");
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
      if (!res.ok) throw new Error("Unable to sync Google Calendar");
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
  const firstName = user?.name?.split(" ")[0] || "Diego";

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#000000] font-sans font-normal flex flex-row overflow-x-hidden">
      {/* Persistent Collapsible Sidebar */}
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

      {/* Main Content Flow */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#ffffff] pt-14 lg:pt-0">
        {/* ==================================================================
         * 1. ATMOSPHERIC HERO + TRANSPARENT FLOATING TOP NAVIGATION
         * ================================================================ */}
        <section className="cluely-hero-bg relative w-full pb-20 lg:pb-28">
          {/* Transparent Floating Top Bar */}
          <nav className="max-w-6xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between gap-4">
            {/* Left Wordmark */}
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4984fd]" />
              <span className="cluely-nav-text text-[#000000]">
                Chairman
              </span>
            </div>

            {/* Centered Navigation Links */}
            <div className="hidden md:flex items-center gap-7 text-[#374151]">
              <Link href="/command" className="cluely-nav-text hover:text-[#000000] transition-colors">
                Command
              </Link>
              <Link href="/macro-ops" className="cluely-nav-text hover:text-[#000000] transition-colors">
                Macro Ops
              </Link>
              <Link href="/workouts" className="cluely-nav-text hover:text-[#000000] transition-colors">
                Workouts
              </Link>
              <Link href="/calendar" className="cluely-nav-text hover:text-[#000000] transition-colors">
                Solar Arc
              </Link>
              <Link href="/roadmaps" className="cluely-nav-text hover:text-[#000000] transition-colors">
                Roadmaps
              </Link>
            </div>

            {/* Right CTA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (calConnected ? fetchCalendar() : signIn("google"))}
                className="hidden sm:inline-flex cluely-pill px-3.5 py-1.5 items-center gap-2 text-[13px] font-medium text-[#263043] hover:text-[#000000] transition-colors"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    calConnected ? "bg-[#4984fd]" : "bg-[#8c929d]"
                  }`}
                />
                <span>{calConnected ? "Calendar synced" : "Sync calendar"}</span>
                <RefreshCw className={`w-3 h-3 text-[#6b7280] ${calLoading ? "animate-spin" : ""}`} />
              </button>

              <Link href="/command" className="cluely-cta text-[14px] px-4 py-2">
                <span>Open Command</span>
              </Link>
            </div>
          </nav>

          {/* Centered Hero Column */}
          <div className="max-w-4xl mx-auto px-6 pt-12 sm:pt-16 pb-12 text-center space-y-6">
            {/* Live Time Pill Badge (110px radius) */}
            <div className="inline-flex items-center gap-2.5 cluely-pill px-4 py-1.5 text-[13px] font-medium text-[#263043]">
              <span className="w-2 h-2 rounded-full bg-[#4984fd]" />
              <span>{currentDate || "Executive Telemetry"}</span>
              {currentTime && (
                <>
                  <span className="text-[#8c929d]">·</span>
                  <span className="tabular-nums text-[#000000]">{currentTime}</span>
                </>
              )}
            </div>

            {/* Strictly EB Garamond 500 Hero Display H1 */}
            <h1 className="cluely-hero-h1 text-[48px] sm:text-[64px] lg:text-[80px] text-[#000000]">
              {greeting}, {firstName}.
            </h1>

            <p className="max-w-xl mx-auto text-[18px] sm:text-[19px] font-normal leading-[1.5] tracking-[-0.2px] text-[#374151]">
              One calm operating surface for physiological vitals, daily focus, circadian rhythm, and strategic execution.
            </p>

            {/* Primary CTA + Secondary Action */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/macro-ops" className="cluely-cta">
                <span>Log Fuel &amp; Hydration</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link href="/roadmaps" className="cluely-btn-secondary">
                <span>Synthesis Roadmap</span>
              </Link>
            </div>
          </div>

          {/* Glassy Product-Mockup Card Underneath (Atmospheric Blue Glow) */}
          <div className="max-w-4xl mx-auto px-6">
            <div className="cluely-mockup-card p-6 sm:p-8 space-y-6">
              {/* Mockup Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#d1d6e0]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#4984fd]" />
                  <div>
                    <div className="cluely-subhead text-[#000000]">
                      Executive Daily Focus
                    </div>
                    <p className="text-[13px] text-[#6b7280]">
                      Capture high-leverage objectives directly into today&apos;s execution queue.
                    </p>
                  </div>
                </div>

                {/* Pill Filter Bar (110px) */}
                <div className="inline-flex items-center gap-1 p-1 rounded-[110px] bg-[#dde2ee]/70 border border-[#d1d6e0]">
                  {(["all", "active", "completed"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTaskFilter(f)}
                      className={`px-3.5 py-1 rounded-[110px] text-[13px] font-medium capitalize transition-all ${
                        taskFilter === f
                          ? "bg-[#ffffff] text-[#000000] shadow-sm"
                          : "text-[#5e616e] hover:text-[#000000]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strictly Square 0px Input Form */}
              <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Add an executive objective for today (press Enter)..."
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  className="cluely-input flex-1"
                />
                <button type="submit" className="cluely-cta shrink-0">
                  <Plus className="w-4 h-4" />
                  <span>Add objective</span>
                </button>
              </form>

              {/* Tasks List */}
              {filteredTasks.length > 0 ? (
                <div className="divide-y divide-[#d1d6e0] border-t border-b border-[#d1d6e0]">
                  {filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className="py-3.5 flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(t.id)}
                          className="shrink-0 text-[#4984fd] focus:outline-none"
                        >
                          {t.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-[#4984fd]" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#8c929d] hover:text-[#4984fd] transition-colors" />
                          )}
                        </button>
                        <span
                          className={`text-[15px] font-normal truncate ${
                            t.completed ? "line-through text-[#8c929d]" : "text-[#000000]"
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {t.timeEstimate && (
                          <span className="cluely-chip">{t.timeEstimate}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          title="Delete task"
                          className="text-[#8c929d] hover:text-[#000000] p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-[#f9fafb] border border-[#d1d6e0] rounded-[12px]">
                  <p className="text-[14px] text-[#6b7280]">
                    Your queue is clear. Add an objective above to begin today&apos;s sprint.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[13px] text-[#6b7280]">
                <span>{completedCount} of {tasks.length} objectives completed</span>
                {calError && <span className="text-[#374151]">{calError}</span>}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
         * 2. SPACIOUS WHITE SECTION: 3-COLUMN PHYSIOLOGICAL VITALS
         * ================================================================ */}
        <section className="w-full bg-[#ffffff] py-20 border-t border-[#d1d6e0]/60">
          <div className="max-w-6xl mx-auto px-6 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="cluely-chip">Physiological Telemetry</span>
                <h2 className="cluely-h2 text-[#000000]">
                  Daily physiological vitals
                </h2>
              </div>
              <p className="text-[14px] text-[#6b7280] max-w-sm">
                Movement cadence, restorative sleep architecture, and active hypertrophy volume in one clean view.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* VITAL 1: STEPS */}
              <div className="cluely-card p-6 flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <span className="cluely-chip">Movement &amp; Cadence</span>
                  <Footprints className="w-4 h-4 text-[#4984fd]" />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[36px] font-medium tracking-[-0.8px] leading-none tabular-nums text-[#000000]">
                      {stepsCurrent.toLocaleString()}
                    </div>
                    <div className="text-[13px] text-[#6b7280] mt-2">
                      Goal: {stepsGoal.toLocaleString()} steps ({Math.round((stepsCurrent / stepsGoal) * 100)}%)
                    </div>
                  </div>

                  {/* Minimal Blue Progress Ring */}
                  <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <path
                        stroke="#dde2ee"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke="#4984fd"
                        strokeDasharray={`${(stepsCurrent / stepsGoal) * 100}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[12px] font-medium tabular-nums text-[#000000]">
                      {Math.round((stepsCurrent / stepsGoal) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#d1d6e0] flex items-center justify-between text-[13px] text-[#6b7280] tabular-nums">
                  <span>{stepsMiles} miles walked</span>
                  <span>{stepsKcal} kcal burned</span>
                </div>
              </div>

              {/* VITAL 2: SLEEP */}
              <div className="cluely-card p-6 flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <span className="cluely-chip">Sleep Architecture</span>
                  <Moon className="w-4 h-4 text-[#4984fd]" />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[36px] font-medium tracking-[-0.8px] leading-none tabular-nums text-[#000000]">
                      {sleepHours}
                    </div>
                    <div className="text-[13px] text-[#6b7280] mt-2">
                      Sleep score: {sleepQuality}% · High recovery
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-[110px] bg-[#dde2ee] text-[#263043] text-[12px] font-medium">
                    {sleepQuality > 0 ? "Synced" : "Pending"}
                  </span>
                </div>

                <div className="pt-4 border-t border-[#d1d6e0] flex items-center justify-between text-[13px] text-[#6b7280] tabular-nums">
                  <span>{sleepQuality > 0 ? `Recovery ${sleepQuality}%` : "Awaiting sleep log"}</span>
                  <Link href="/macro-ops" className="text-[#4984fd] hover:underline font-medium">
                    Log sleep
                  </Link>
                </div>
              </div>

              {/* VITAL 3: EXERCISE */}
              <div className="cluely-card p-6 flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <span className="cluely-chip">Strength &amp; Training</span>
                  <Dumbbell className="w-4 h-4 text-[#4984fd]" />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[36px] font-medium tracking-[-0.8px] leading-none tabular-nums text-[#000000]">
                      {exerciseCompleted ? "Done" : "0"}{" "}
                      <span className="text-[16px] text-[#6b7280] font-normal">
                        {exerciseCompleted ? "today" : "sessions"}
                      </span>
                    </div>
                    <div className="text-[13px] text-[#6b7280] mt-2">
                      {exerciseCompleted ? "Training completed today" : "No workout logged today"}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[110px] bg-[#dde2ee] text-[#263043] text-[12px] font-medium tabular-nums">
                    <Flame className="w-3.5 h-3.5 text-[#4984fd]" />
                    <span>{exerciseCompleted ? "Active" : "Ready"}</span>
                  </span>
                </div>

                <div className="pt-4 border-t border-[#d1d6e0] flex items-center justify-between text-[13px]">
                  <span className="text-[#6b7280] tabular-nums">Live training log</span>
                  <Link
                    href="/workouts"
                    className="text-[#4984fd] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <span>Open training</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
         * 3. SPACIOUS WHITE 2-COLUMN SPLIT: TRAINING + SOLAR & GCAL
         * ================================================================ */}
        <section className="w-full bg-[#ffffff] py-16">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7-Col: Strength & Training Launcher */}
            <div className="lg:col-span-7 cluely-card p-7 flex flex-col justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="cluely-chip">Health &amp; Performance</span>
                  <h2 className="cluely-h2 text-[#000000] pt-1">
                    Strength &amp; Training
                  </h2>
                  <p className="text-[14px] text-[#6b7280]">
                    Progressive overload logs, voice set capture, and integrated rest timers.
                  </p>
                </div>

                <Link href="/workouts" className="cluely-cta shrink-0">
                  <span>Start session</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="p-6 rounded-[12px] bg-[#f9fafb] border border-[#d1d6e0] text-center space-y-2">
                <p className="text-[14px] font-medium text-[#000000]">
                  No active sets logged yet today
                </p>
                <p className="text-[13px] text-[#6b7280]">
                  Open Strength &amp; Training to start a session or dictate sets by voice.
                </p>
              </div>
            </div>

            {/* Right 5-Col: Circadian Solar Arc + Google Calendar Agenda */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Circadian Solar Arc Card */}
              <div className="cluely-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#4984fd]" />
                    <h3 className="cluely-subhead text-[#000000]">Circadian Solar Arc</h3>
                  </div>
                  <Link
                    href="/calendar"
                    className="text-[13px] font-medium text-[#4984fd] hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>24H wheel</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-4 rounded-[12px] bg-[#dde2ee]/55 border border-[#d1d6e0] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[12px] font-medium text-[#4984fd]">Solar Phase</div>
                    <div className="text-[17px] font-medium tracking-[-0.3px] text-[#000000] mt-0.5">
                      Solar Zenith · Peak Focus
                    </div>
                    <div className="text-[12px] text-[#6b7280] mt-1 tabular-nums">
                      Sunrise 6:42 AM · Sunset 6:18 PM
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#ffffff] border border-[#d1d6e0] flex items-center justify-center shrink-0">
                    <Sun className="w-5 h-5 text-[#4984fd]" />
                  </div>
                </div>
              </div>

              {/* Upcoming Appointments Feed */}
              <div className="cluely-card p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#4984fd]" />
                    <h3 className="cluely-subhead text-[#000000]">Upcoming Appointments</h3>
                  </div>
                  {calConnected ? (
                    <button
                      type="button"
                      onClick={fetchCalendar}
                      className="text-[13px] text-[#6b7280] hover:text-[#000000] inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${calLoading ? "animate-spin" : ""}`} />
                      <span>Sync</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => signIn("google")}
                      className="text-[13px] font-medium text-[#4984fd] hover:underline"
                    >
                      Connect GCal
                    </button>
                  )}
                </div>

                {calConnected && calendarEvents.length > 0 ? (
                  <div className="divide-y divide-[#d1d6e0]">
                    {calendarEvents.map((evt) => {
                      const startTime = evt.start?.dateTime
                        ? new Date(evt.start.dateTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "All Day";
                      return (
                        <div key={evt.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[14px] font-medium text-[#000000] block truncate">
                              {evt.summary || "Untitled Event"}
                            </span>
                            <span className="text-[12px] text-[#6b7280] tabular-nums">
                              {startTime}
                            </span>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-[#4984fd] shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : calConnected ? (
                  <div className="py-6 text-center text-[13px] text-[#6b7280]">
                    No scheduled appointments today. Enjoy uninterrupted deep work.
                  </div>
                ) : (
                  <div className="p-5 text-center rounded-[12px] bg-[#f9fafb] border border-[#d1d6e0] space-y-3">
                    <p className="text-[13px] text-[#6b7280]">
                      Connect Google Calendar to stream live appointments directly onto your circadian timeline.
                    </p>
                    <button
                      type="button"
                      onClick={() => signIn("google")}
                      className="cluely-cta text-[14px] px-4 py-2"
                    >
                      Connect Google Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
         * 4. SINGLE DARK INDIGO GLASSMORPHIC HIGHLIGHT SECTION (TRUST/CONTROL)
         * ================================================================ */}
        <section className="w-full bg-[#ffffff] py-12 px-6">
          <div className="max-w-6xl mx-auto cluely-dark-section p-8 sm:p-12 lg:p-14 space-y-10">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[110px] bg-white/10 border border-white/15 text-[12px] font-medium text-[#edeef2]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4984fd]" />
                <span>Sovereign Architecture &amp; Control</span>
              </span>
              <h2 className="cluely-h2 text-[#edeef2] sm:text-[34px]">
                Built for calm authority, zero noise, and live telemetry.
              </h2>
              <p className="text-[15px] leading-[1.6] text-[#b2b3ba]">
                Every module writes directly to your authenticated PostgreSQL database with real-time voice capture and zero placeholder data.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: <Mic className="w-5 h-5 text-[#4984fd]" />,
                  title: "Voice-First Logging",
                  desc: "Dictate meals, hydration, and sets naturally—parsed into structured macros instantly.",
                },
                {
                  icon: <GitBranch className="w-5 h-5 text-[#4984fd]" />,
                  title: "Synthesis Roadmaps",
                  desc: "Converging multi-branch DAGs with Done-For-You, Done-With-You, and DIY co-pilot modes.",
                },
                {
                  icon: <Lock className="w-5 h-5 text-[#4984fd]" />,
                  title: "Zero Dummy Data",
                  desc: "Clean empty-state vessels and strict live Supabase / Postgres persistence across every route.",
                },
                {
                  icon: <Compass className="w-5 h-5 text-[#4984fd]" />,
                  title: "Circadian Alignment",
                  desc: "24-hour solar arc wheel synced directly with your Google Calendar and fasting windows.",
                },
              ].map((item) => (
                <div key={item.title} className="cluely-dark-glass-card p-6 space-y-3">
                  <div className="w-9 h-9 rounded-[10px] bg-white/10 border border-white/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="cluely-subhead text-[#edeef2]">{item.title}</h3>
                  <p className="text-[13px] leading-[1.6] text-[#b2b3ba]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================================
         * 5. SPACIOUS WHITE 4-COLUMN LIFE PILLARS GRID
         * ================================================================ */}
        <section className="w-full bg-[#ffffff] py-20">
          <div className="max-w-6xl mx-auto px-6 space-y-10">
            <div className="space-y-2 max-w-xl">
              <span className="cluely-chip">Executive Spheres</span>
              <h2 className="cluely-h2 text-[#000000]">
                Navigate every pillar in one click
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  pillar: "Health",
                  title: "Macro Ops & Water",
                  desc: "Voice food logger, USDA macro curves, and Gengar incremental hydration vessel.",
                  href: "/macro-ops",
                  icon: <Utensils className="w-4 h-4 text-[#4984fd]" />,
                },
                {
                  pillar: "Wealth",
                  title: "Caliber Arc & Budget",
                  desc: "Futures execution telemetry, 12-month cashflow ledger, and wealth tracking.",
                  href: "/caliber-arc",
                  icon: <TrendingUp className="w-4 h-4 text-[#4984fd]" />,
                },
                {
                  pillar: "Relate & Family",
                  title: "Family Hub & Pods",
                  desc: "Shared household accountability, His & Hers dual wheels, and pet care schedules.",
                  href: "/family-hub",
                  icon: <Users className="w-4 h-4 text-[#4984fd]" />,
                },
                {
                  pillar: "Strategy",
                  title: "Command & Topology",
                  desc: "North Star target cascades, FRAGO / PACE dossiers, and Mermaid architecture maps.",
                  href: "/command",
                  icon: <Compass className="w-4 h-4 text-[#4984fd]" />,
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="cluely-card p-6 flex flex-col justify-between gap-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="cluely-chip">{card.pillar}</span>
                      {card.icon}
                    </div>
                    <h3 className="cluely-subhead text-[#000000] group-hover:text-[#4984fd] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[13px] leading-[1.6] text-[#6b7280]">
                      {card.desc}
                    </p>
                  </div>
                  <span className="text-[13px] font-medium text-[#4984fd] inline-flex items-center gap-1">
                    <span>Open module</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================================
         * 6. PRE-FOOTER CLOUD CTA BAND (#f9fafb)
         * ================================================================ */}
        <section className="cluely-cloud-band w-full py-20 border-t border-[#d1d6e0]">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-5">
            <h2 className="cluely-h2 text-[#000000] sm:text-[36px]">
              Ready to synthesize your next milestone?
            </h2>
            <p className="text-[15px] leading-[1.6] text-[#5e616e] max-w-lg mx-auto">
              Switch between Master, Health, Wealth, and Custom Projects in the converging Synthesis Roadmap.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href="/roadmaps" className="cluely-cta">
                <span>Launch Synthesis Roadmap</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link href="/org-chart" className="cluely-btn-secondary">
                <span>View Topology Map</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ==================================================================
         * 7. ALWAYS-LIGHT CLUELY FOOTER (#f9fafb, #6b7280)
         * ================================================================ */}
        <CluelyFooter />
      </div>

      {/* Appearance & Studio Modal */}
      {isAppearanceOpen && (
        <AppearanceSettings onClose={() => setIsAppearanceOpen(false)} />
      )}
    </div>
  );
}
