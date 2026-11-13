"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Timer,
  Flame,
  Trophy,
  Calculator,
  ChevronDown,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  History,
  Layers,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  Award,
} from "lucide-react";

/* ============================================================================
 * TYPES & EXERCISE LIBRARY
 * ========================================================================== */

export type MuscleGroup = "all" | "chest" | "back" | "shoulders" | "arms" | "legs" | "core";

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscle: "chest" | "back" | "shoulders" | "arms" | "legs" | "core";
  category: "compound" | "isolation";
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  tips: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  prevWeight: number;
  prevReps: number;
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
}

export interface ActiveExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscle: string;
  notes?: string;
  sets: WorkoutSet[];
}

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string;
}

const CANONICAL_EXERCISES: ExerciseDefinition[] = [
  // CHEST
  { id: "incline_db_press", name: "Incline Dumbbell Press", muscle: "chest", category: "compound", equipment: "dumbbell", defaultSets: 4, defaultReps: 10, defaultWeight: 80, tips: "30-degree incline, full stretch at bottom, squeeze upper pec." },
  { id: "barbell_bench_press", name: "Barbell Flat Bench Press", muscle: "chest", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 6, defaultWeight: 225, tips: "Retract scapulae, leg drive, touch lower sternum." },
  { id: "cable_chest_flyes", name: "High-to-Low Cable Flyes", muscle: "chest", category: "isolation", equipment: "cable", defaultSets: 3, defaultReps: 12, defaultWeight: 45, tips: "Slight elbow bend, cross over hands for peak contraction." },

  // BACK
  { id: "barbell_deadlift", name: "Conventional Barbell Deadlift", muscle: "back", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 5, defaultWeight: 365, tips: "Brace lats tight, drive floor away, lock hips with glutes." },
  { id: "barbell_row", name: "Bent-Over Barbell Row", muscle: "back", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 8, defaultWeight: 185, tips: "Hinge at hips, pull bar to navel with elbows driving back." },
  { id: "lat_pulldown", name: "Neutral Grip Lat Pulldown", muscle: "back", category: "isolation", equipment: "cable", defaultSets: 4, defaultReps: 10, defaultWeight: 160, tips: "Depress scapulae first, drive elbows toward back pockets." },

  // SHOULDERS
  { id: "overhead_press", name: "Standing Overhead Press (OHP)", muscle: "shoulders", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 6, defaultWeight: 135, tips: "Squeeze glutes and core, press straight bar path, lock overhead." },
  { id: "lateral_raises", name: "Dumbbell Lateral Raises", muscle: "shoulders", category: "isolation", equipment: "dumbbell", defaultSets: 4, defaultReps: 15, defaultWeight: 30, tips: "Lead with elbows, thumb slightly downward, strict tempo." },

  // ARMS
  { id: "incline_db_curl", name: "Incline Dumbbell Bicep Curl", muscle: "arms", category: "isolation", equipment: "dumbbell", defaultSets: 3, defaultReps: 10, defaultWeight: 35, tips: "Deep stretch on long head of bicep, supinate at top." },
  { id: "cable_tricep_pushdown", name: "Cable Rope Pushdowns", muscle: "arms", category: "isolation", equipment: "cable", defaultSets: 4, defaultReps: 12, defaultWeight: 70, tips: "Flare rope outward at the bottom for lateral head contraction." },

  // LEGS
  { id: "barbell_squat", name: "Barbell Back Squat", muscle: "legs", category: "compound", equipment: "barbell", defaultSets: 5, defaultReps: 5, defaultWeight: 315, tips: "Hit depth below parallel, knees track toes, drive out of the hole." },
  { id: "romanian_deadlift", name: "Romanian Deadlift (RDL)", muscle: "legs", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 8, defaultWeight: 225, tips: "Push hips back, feel intense hamstring stretch, flat back." },
  { id: "leg_press", name: "45-Degree Leg Press", muscle: "legs", category: "compound", equipment: "machine", defaultSets: 4, defaultReps: 10, defaultWeight: 450, tips: "Feet shoulder-width, deep range of motion, do not lock knees." },
];

const SPLIT_PRESETS = [
  {
    name: "Push Day Hypertrophy",
    split: "PUSH",
    exercises: ["incline_db_press", "barbell_bench_press", "lateral_raises", "cable_tricep_pushdown"],
    color: "#f59e0b",
  },
  {
    name: "Pull Day Strength & Width",
    split: "PULL",
    exercises: ["barbell_deadlift", "barbell_row", "lat_pulldown", "incline_db_curl"],
    color: "#3b82f6",
  },
  {
    name: "Leg Day Posterior & Quad Power",
    split: "LEGS",
    exercises: ["barbell_squat", "romanian_deadlift", "leg_press"],
    color: "#10b981",
  },
  {
    name: "Upper Body Power Composite",
    split: "UPPER",
    exercises: ["barbell_bench_press", "barbell_row", "overhead_press", "incline_db_curl"],
    color: "#8b5cf6",
  },
  {
    name: "Lower Body & Posterior Arc",
    split: "LOWER",
    exercises: ["barbell_squat", "romanian_deadlift", "leg_press"],
    color: "#ec4899",
  },
];

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WorkoutsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup>("all");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [prVault, setPrVault] = useState<PersonalRecord[]>([]);

  // Active Session Timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(90);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restActive, setRestActive] = useState(false);

  // 1RM Calculator State
  const [calcWeight, setCalcWeight] = useState(225);
  const [calcReps, setCalcReps] = useState(6);

  // Fetch session for selected date from Supabase
  const fetchSession = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/titan/sessions?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        const current = data.sessions && data.sessions[0];
        if (current) {
          setActiveSession(current);
          setIsTimerRunning(current.status === "in_progress");

          // Group sets into activeExercises
          const exMap: Record<string, ActiveExercise> = {};
          if (Array.isArray(current.sets)) {
            for (const s of current.sets) {
              if (!exMap[s.exercise_id]) {
                exMap[s.exercise_id] = {
                  id: `ex_${s.exercise_id}`,
                  exerciseId: s.exercise_id,
                  name: s.exercise_name || "Exercise",
                  muscle: s.muscle_group || "CHEST",
                  sets: [],
                };
              }
              exMap[s.exercise_id].sets.push({
                id: s.id,
                setNumber: s.set_number,
                prevWeight: Number(s.weight_lbs) || 0,
                prevReps: s.reps || 0,
                weight: Number(s.weight_lbs) || 0,
                reps: s.reps || 0,
                rpe: Number(s.rpe) || 8,
                completed: Boolean(s.is_completed),
              });
            }
          }
          setActiveExercises(Object.values(exMap));
        } else {
          setActiveSession(null);
          setActiveExercises([]);
          setIsTimerRunning(false);
          setElapsedSeconds(0);
        }
      }
    } catch (err) {
      console.error("Failed to load workout session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch PR benchmarks from previous sessions
  const fetchPrs = useCallback(async () => {
    try {
      const res = await fetch("/api/titan/sessions");
      if (res.ok) {
        const data = await res.json();
        const allSessions = data.sessions || [];
        const highestByExercise: Record<string, PersonalRecord> = {};

        for (const sess of allSessions) {
          if (Array.isArray(sess.sets)) {
            for (const s of sess.sets) {
              const w = Number(s.weight_lbs) || 0;
              const r = Number(s.reps) || 0;
              if (w > 0 && r > 0 && s.is_completed) {
                const est1RM = r <= 1 ? w : Math.round(w * (1 + r / 30));
                const exName = s.exercise_name || "Movement";
                if (!highestByExercise[exName] || est1RM > highestByExercise[exName].estimated1RM) {
                  highestByExercise[exName] = {
                    exerciseName: exName,
                    weight: w,
                    reps: r,
                    estimated1RM: est1RM,
                    date: sess.scheduled_date || getTodayStr(),
                  };
                }
              }
            }
          }
        }
        setPrVault(Object.values(highestByExercise));
      }
    } catch (err) {
      console.error("Failed to fetch PR benchmarks:", err);
    }
  }, []);

  useEffect(() => {
    fetchSession(selectedDate);
    fetchPrs();
  }, [selectedDate, fetchSession, fetchPrs]);

  // Session elapsed timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Rest countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (restActive && restRemaining !== null && restRemaining > 0) {
      timer = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev === null || prev <= 1) {
            setRestActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [restActive, restRemaining]);

  const startRestTimer = (seconds: number) => {
    setRestSeconds(seconds);
    setRestRemaining(seconds);
    setRestActive(true);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Launch a workout split from presets (Persists to Supabase)
  const handleLaunchSplit = async (preset: typeof SPLIT_PRESETS[0]) => {
    setLoading(true);
    try {
      // 1. Create session
      const sessRes = await fetch("/api/titan/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: selectedDate,
          status: "in_progress",
          notes: preset.name,
        }),
      });
      if (!sessRes.ok) return;
      const { session } = await sessRes.json();

      // 2. Ensure exercises exist in titan_exercises and log sets
      for (const exKey of preset.exercises) {
        const def = CANONICAL_EXERCISES.find((e) => e.id === exKey);
        if (!def) continue;

        // Ensure exercise in database
        const exRes = await fetch("/api/titan/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: def.name,
            muscleGroup: def.muscle,
            equipment: def.equipment,
            defaultSets: def.defaultSets,
            defaultReps: def.defaultReps,
          }),
        });
        const exData = await exRes.json();
        const dbExId = exData.exercise?.id;

        if (dbExId) {
          for (let s = 1; s <= def.defaultSets; s++) {
            await fetch("/api/titan/sets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: session.id,
                exerciseId: dbExId,
                setNumber: s,
                reps: def.defaultReps,
                weightLbs: def.defaultWeight,
                isCompleted: false,
                rpe: 8,
              }),
            });
          }
        }
      }

      await fetchSession(selectedDate);
      setIsTimerRunning(true);
    } finally {
      setLoading(false);
    }
  };

  // Toggle set completion (Persists to Supabase)
  const handleToggleSet = async (exIndex: number, setIndex: number) => {
    const target = activeExercises[exIndex].sets[setIndex];
    const willBeCompleted = !target.completed;

    // Optimistic UI
    setActiveExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[exIndex].sets[setIndex].completed = willBeCompleted;
      return copy;
    });

    if (willBeCompleted) {
      startRestTimer(restSeconds);
    }

    if (target.id && !target.id.startsWith("s_")) {
      await fetch("/api/titan/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          isCompleted: willBeCompleted,
        }),
      });
    }

    // Update volume in session
    if (activeSession?.id) {
      const newVol = activeExercises.reduce((acc, ex) => {
        return acc + ex.sets.reduce((sAcc, s) => {
          const isDone = s.id === target.id ? willBeCompleted : s.completed;
          return isDone ? sAcc + s.weight * s.reps : sAcc;
        }, 0);
      }, 0);

      await fetch("/api/titan/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSession.id,
          totalVolumeLbs: newVol,
        }),
      });
    }
  };

  // Step Weight or Reps
  const handleStepValue = async (
    exIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    delta: number
  ) => {
    const target = activeExercises[exIndex].sets[setIndex];
    const nextVal = Math.max(0, (target[field] || 0) + delta);

    setActiveExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[exIndex].sets[setIndex][field] = nextVal;
      return copy;
    });

    if (target.id && !target.id.startsWith("s_")) {
      await fetch("/api/titan/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          [field === "weight" ? "weightLbs" : "reps"]: nextVal,
        }),
      });
    }
  };

  // Finish session
  const handleFinishSession = async () => {
    if (!activeSession?.id) return;
    await fetch("/api/titan/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: activeSession.id,
        completed: true,
      }),
    });
    setIsTimerRunning(false);
    await fetchSession(selectedDate);
    await fetchPrs();
  };

  // Date Shift Handler
  const shiftDate = (deltaDays: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + deltaDays);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, "0");
    const nd = String(date.getDate()).padStart(2, "0");
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  // Calculated Metrics
  const totalVolumeLbs = useMemo(() => {
    let vol = 0;
    activeExercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          vol += s.weight * s.reps;
        }
      });
    });
    return vol;
  }, [activeExercises]);

  const totalSetsDone = useMemo(() => {
    let count = 0;
    activeExercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) count++;
      });
    });
    return count;
  }, [activeExercises]);

  const totalSetsPlanned = useMemo(() => {
    return activeExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }, [activeExercises]);

  const calculated1RM = useMemo(() => {
    if (calcReps <= 1) return calcWeight;
    return Math.round(calcWeight * (1 + calcReps / 30));
  }, [calcWeight, calcReps]);

  const filteredLibrary = useMemo(() => {
    if (muscleFilter === "all") return CANONICAL_EXERCISES;
    return CANONICAL_EXERCISES.filter((e) => e.muscle === muscleFilter);
  }, [muscleFilter]);

  return (
    <ExecutiveModuleShell
      moduleId="WORKOUTS"
      eyebrow="Hypertrophy & Strength"
      title="Titan Bodybuilding Engine"
      subtitle="Clean Progressive Overload, Set Telemetry & Integrated Rest Timers"
      accentColor="#f59e0b"
      headerActions={
        <div className="flex items-center gap-2">
          {/* Date Stepper */}
          <div className="flex items-center bg-[#111214] border border-[#1A1D24] rounded-xl p-0.5">
            <button
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => setSelectedDate(getTodayStr())}
              className="px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:text-amber-400 transition-colors flex items-center gap-1.5 font-mono"
            >
              <Calendar size={12} className="text-amber-400" />
              {selectedDate}
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Next Day"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Rest Timer Capsule */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">
              Rest: {restRemaining !== null ? `${restRemaining}s` : `${restSeconds}s`}
            </span>
            {restActive ? (
              <button
                type="button"
                onClick={() => setRestActive(false)}
                className="ml-1 text-[10px] text-amber-200 hover:text-white"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startRestTimer(restSeconds)}
                className="ml-1 text-[10px] text-amber-400 hover:text-amber-200 underline"
              >
                Start
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* TELEMETRY HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Duration */}
          <div className="p-5 rounded-2xl bg-[#111214] border border-[#1A1D24] shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Session Duration</span>
              <Timer className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-100">
                {formatTime(elapsedSeconds)}
              </span>
              <button
                type="button"
                onClick={() => setIsTimerRunning((r) => !r)}
                title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors"
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isTimerRunning ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
              <span>{activeSession ? (activeSession.status === "completed" ? "Completed" : "In Progress") : "No Session"}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="p-5 rounded-2xl bg-[#111214] border border-[#1A1D24] shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Total Volume</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-100">
                {totalVolumeLbs.toLocaleString()}
              </span>
              <span className="ml-1 text-xs text-zinc-400 font-medium">lbs</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-400/90 font-mono">
              Progressive Load Telemetry
            </div>
          </div>

          {/* Sets Done */}
          <div className="p-5 rounded-2xl bg-[#111214] border border-[#1A1D24] shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Sets Completed</span>
              <Layers className="w-4 h-4 text-[#58A6FF]" />
            </div>
            <div className="mt-3 flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-100">{totalSetsDone}</span>
              <span className="text-sm text-zinc-500">/ {totalSetsPlanned}</span>
            </div>
            <div className="mt-2 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-300"
                style={{ width: `${totalSetsPlanned ? (totalSetsDone / totalSetsPlanned) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Rest Preset Controller */}
          <div className="p-5 rounded-2xl bg-[#111214] border border-[#1A1D24] shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Rest Intervals</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {[60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => startRestTimer(sec)}
                  className={`flex-1 py-1 rounded-xl text-xs font-mono font-semibold transition-all border ${
                    restSeconds === sec
                      ? "bg-amber-500/25 border-amber-400/60 text-amber-200"
                      : "bg-[#141720] border-[#1A1D24] text-zinc-400 hover:text-white"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <div className="mt-2 text-[10.5px] text-zinc-500 text-center">
              Auto-starts on set completion
            </div>
          </div>
        </div>

        {/* ACTIVE WORKOUT OR ACTIONABLE EMPTY STATE */}
        {activeExercises.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-[#111214] border border-[#1A1D24] text-center shadow-2xl relative overflow-hidden">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-400/10">
                <Dumbbell size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">
                  No Workout Session for {selectedDate}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Launch a structured hypertrophic split or create a custom training session.
                </p>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {SPLIT_PRESETS.map((preset) => (
                  <button
                    key={preset.split}
                    onClick={() => handleLaunchSplit(preset)}
                    className="p-3.5 rounded-xl border border-[#1A1D24] bg-[#141720] hover:border-amber-400/50 hover:bg-[#1A1E29] transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                        {preset.split}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-zinc-500 mt-1">
                      {preset.exercises.length} Exercises · 12+ Sets
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-zinc-100 tracking-wide">
                  Active Routine: {activeSession?.notes || "Workout Split"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFinishSession}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1.5"
                >
                  <Check size={14} /> Finish Workout
                </button>
              </div>
            </div>

            {activeExercises.map((ex, exIndex) => (
              <div
                key={ex.id}
                className="rounded-2xl p-5 sm:p-6 bg-[#111214] border border-[#1A1D24] shadow-xl"
              >
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#1A1D24]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 font-bold text-xs">
                      {exIndex + 1}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                        {ex.name}
                      </h3>
                      <span className="text-[11px] text-amber-400/90 font-medium tracking-wide uppercase">
                        {ex.muscle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sets Table with Steppers */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-zinc-500 border-b border-[#1A1D24]">
                        <th className="pb-2 w-12 text-center">SET</th>
                        <th className="pb-2 w-28 text-center">PREVIOUS</th>
                        <th className="pb-2 w-48 text-center">WEIGHT (LBS)</th>
                        <th className="pb-2 w-40 text-center">REPS</th>
                        <th className="pb-2 w-16 text-center">DONE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1D24]/50">
                      {ex.sets.map((set, setIndex) => (
                        <tr
                          key={set.id}
                          className={`transition-colors ${
                            set.completed ? "bg-emerald-500/5 text-emerald-200" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-2.5 text-center font-bold text-zinc-300">
                            {set.setNumber}
                          </td>
                          <td className="py-2.5 text-center text-zinc-500">
                            {set.prevWeight} lbs × {set.prevReps}
                          </td>
                          <td className="py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#141720] border border-[#1A1D24] rounded-xl px-2 py-1">
                              <button
                                onClick={() => handleStepValue(exIndex, setIndex, "weight", -5)}
                                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-12 text-center font-bold text-zinc-100">{set.weight}</span>
                              <button
                                onClick={() => handleStepValue(exIndex, setIndex, "weight", 5)}
                                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#141720] border border-[#1A1D24] rounded-xl px-2 py-1">
                              <button
                                onClick={() => handleStepValue(exIndex, setIndex, "reps", -1)}
                                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold text-zinc-100">{set.reps}</span>
                              <button
                                onClick={() => handleStepValue(exIndex, setIndex, "reps", 1)}
                                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSet(exIndex, setIndex)}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center mx-auto transition-all ${
                                set.completed
                                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                                  : "border border-zinc-700 hover:border-amber-400 text-transparent"
                              }`}
                            >
                              <Check size={14} strokeWidth={3} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PR VAULT & 1RM ESTIMATOR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PR Vault */}
          <div className="p-6 rounded-2xl bg-[#111214] border border-[#1A1D24] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1D24]">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Personal Record (PR) Vault</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Sovereign Benchmarks
              </span>
            </div>

            {prVault.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                No PR records logged yet. Complete sets to establish your sovereign strength benchmarks.
              </div>
            ) : (
              <div className="space-y-2.5">
                {prVault.map((pr) => (
                  <div
                    key={pr.exerciseName}
                    className="p-3 rounded-xl bg-[#141720] border border-[#1A1D24] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-200">{pr.exerciseName}</div>
                      <div className="text-[10.5px] font-mono text-zinc-500">{pr.date}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-extrabold text-amber-400">{pr.weight} lbs × {pr.reps}</div>
                      <div className="text-[10px] text-zinc-500">Est. 1RM: {pr.estimated1RM} lbs</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1RM Calculator */}
          <div className="p-6 rounded-2xl bg-[#111214] border border-[#1A1D24] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1D24]">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                <Calculator className="w-4 h-4 text-[#58A6FF]" />
                <span>1-Rep Max (1RM) Estimator</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Epley Formula
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-[#1A1D24] font-mono text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                  Reps Completed
                </label>
                <input
                  type="number"
                  value={calcReps}
                  onChange={(e) => setCalcReps(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-[#1A1D24] font-mono text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0969DA]/10 border border-[#0969DA]/30 flex items-center justify-between">
              <span className="text-xs text-zinc-300 font-semibold">
                Estimated 1-Rep Max:
              </span>
              <span className="text-xl font-extrabold font-mono text-[#58A6FF]">
                {calculated1RM} lbs
              </span>
            </div>
          </div>
        </div>
      </div>
    </ExecutiveModuleShell>
  );
}
