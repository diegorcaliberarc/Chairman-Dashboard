"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
} from "lucide-react";

/* ============================================================================
 * TYPES & EXERCISE LIBRARY DATA
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

const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // CHEST
  { id: "incline_db_press", name: "Incline Dumbbell Press", muscle: "chest", category: "compound", equipment: "dumbbell", defaultSets: 4, defaultReps: 10, defaultWeight: 90, tips: "30-degree incline, full stretch at bottom, squeeze upper pec." },
  { id: "barbell_bench_press", name: "Barbell Flat Bench Press", muscle: "chest", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 6, defaultWeight: 225, tips: "Retract scapulae, leg drive, touch lower sternum." },
  { id: "cable_chest_flyes", name: "High-to-Low Cable Flyes", muscle: "chest", category: "isolation", equipment: "cable", defaultSets: 3, defaultReps: 12, defaultWeight: 45, tips: "Slight elbow bend, cross over hands for peak contraction." },
  { id: "chest_dips", name: "Weighted Chest Dips", muscle: "chest", category: "compound", equipment: "bodyweight", defaultSets: 3, defaultReps: 10, defaultWeight: 45, tips: "Lean forward 30 degrees, flare elbows slightly." },

  // BACK
  { id: "barbell_deadlift", name: "Conventional Barbell Deadlift", muscle: "back", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 5, defaultWeight: 365, tips: "Brace lats tight, drive floor away, lock hips with glutes." },
  { id: "barbell_row", name: "Bent-Over Barbell Row", muscle: "back", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 8, defaultWeight: 205, tips: "Hinge at hips, pull bar to navel with elbows driving back." },
  { id: "lat_pulldown", name: "Neutral Grip Lat Pulldown", muscle: "back", category: "isolation", equipment: "cable", defaultSets: 4, defaultReps: 10, defaultWeight: 180, tips: "Depress scapulae first, drive elbows toward back pockets." },
  { id: "seated_cable_row", name: "Seated Cable Row", muscle: "back", category: "compound", equipment: "cable", defaultSets: 3, defaultReps: 12, defaultWeight: 170, tips: "Chest puffed out, don't round lower back, pause at contraction." },

  // SHOULDERS
  { id: "overhead_press", name: "Standing Overhead Press (OHP)", muscle: "shoulders", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 6, defaultWeight: 145, tips: "Squeeze glutes and core, press straight bar path, lock overhead." },
  { id: "lateral_raises", name: "Dumbbell Lateral Raises", muscle: "shoulders", category: "isolation", equipment: "dumbbell", defaultSets: 4, defaultReps: 15, defaultWeight: 35, tips: "Lead with elbows, thumb slightly downward, strict tempo." },
  { id: "face_pulls", name: "Rope Face Pulls", muscle: "shoulders", category: "isolation", equipment: "cable", defaultSets: 3, defaultReps: 15, defaultWeight: 60, tips: "Pull to eye level, externally rotate shoulders at the finish." },

  // ARMS
  { id: "incline_db_curl", name: "Incline Dumbbell Bicep Curl", muscle: "arms", category: "isolation", equipment: "dumbbell", defaultSets: 3, defaultReps: 10, defaultWeight: 40, tips: "Deep stretch on long head of bicep, supinate at top." },
  { id: "barbell_skullcrusher", name: "EZ-Bar Skullcrushers", muscle: "arms", category: "isolation", equipment: "barbell", defaultSets: 3, defaultReps: 12, defaultWeight: 95, tips: "Elbows pinned, lower bar toward forehead or slightly behind crown." },
  { id: "cable_tricep_pushdown", name: "Cable Rope Pushdowns", muscle: "arms", category: "isolation", equipment: "cable", defaultSets: 4, defaultReps: 12, defaultWeight: 75, tips: "Flare rope outward at the bottom for lateral head contraction." },
  { id: "hammer_curls", name: "Standing Dumbbell Hammer Curls", muscle: "arms", category: "isolation", equipment: "dumbbell", defaultSets: 3, defaultReps: 12, defaultWeight: 45, tips: "Targets brachialis and forearms, strict no-swing form." },

  // LEGS
  { id: "barbell_squat", name: "Barbell Back Squat", muscle: "legs", category: "compound", equipment: "barbell", defaultSets: 5, defaultReps: 5, defaultWeight: 315, tips: "Hit depth below parallel, knees track toes, drive out of the hole." },
  { id: "romanian_deadlift", name: "Romanian Deadlift (RDL)", muscle: "legs", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 8, defaultWeight: 245, tips: "Push hips back, feel intense hamstring stretch, flat back." },
  { id: "leg_press", name: "45-Degree Leg Press", muscle: "legs", category: "compound", equipment: "machine", defaultSets: 4, defaultReps: 10, defaultWeight: 540, tips: "Feet shoulder-width, deep range of motion, do not lock knees." },
  { id: "standing_calf_raise", name: "Standing Calf Raises", muscle: "legs", category: "isolation", equipment: "machine", defaultSets: 4, defaultReps: 15, defaultWeight: 180, tips: "2-second stretch at bottom, explode up, pause at peak." },

  // CORE
  { id: "hanging_leg_raise", name: "Hanging Leg Raises", muscle: "core", category: "isolation", equipment: "bodyweight", defaultSets: 3, defaultReps: 15, defaultWeight: 0, tips: "Curl pelvis upward, don't rely on momentum." },
  { id: "ab_wheel_rollout", name: "Kneeling Ab Wheel Rollout", muscle: "core", category: "compound", equipment: "bodyweight", defaultSets: 3, defaultReps: 12, defaultWeight: 0, tips: "Keep posterior pelvic tilt, brace abs like taking a punch." },
];

const INITIAL_ROUTINE: ActiveExercise[] = [
  {
    id: "ex_1",
    exerciseId: "incline_db_press",
    name: "Incline Dumbbell Press",
    muscle: "Chest",
    sets: [
      { id: "s1", setNumber: 1, prevWeight: 85, prevReps: 10, weight: 90, reps: 10, rpe: 8, completed: true },
      { id: "s2", setNumber: 2, prevWeight: 85, prevReps: 10, weight: 90, reps: 9, rpe: 8.5, completed: true },
      { id: "s3", setNumber: 3, prevWeight: 85, prevReps: 8, weight: 90, reps: 8, rpe: 9, completed: false },
      { id: "s4", setNumber: 4, prevWeight: 85, prevReps: 8, weight: 90, reps: 8, rpe: 9.5, completed: false },
    ],
  },
  {
    id: "ex_2",
    exerciseId: "barbell_bench_press",
    name: "Barbell Flat Bench Press",
    muscle: "Chest",
    sets: [
      { id: "s2_1", setNumber: 1, prevWeight: 215, prevReps: 6, weight: 225, reps: 6, rpe: 8, completed: false },
      { id: "s2_2", setNumber: 2, prevWeight: 215, prevReps: 6, weight: 225, reps: 6, rpe: 8.5, completed: false },
      { id: "s2_3", setNumber: 3, prevWeight: 215, prevReps: 5, weight: 225, reps: 5, rpe: 9, completed: false },
    ],
  },
  {
    id: "ex_3",
    exerciseId: "lateral_raises",
    name: "Dumbbell Lateral Raises",
    muscle: "Shoulders",
    sets: [
      { id: "s3_1", setNumber: 1, prevWeight: 30, prevReps: 15, weight: 35, reps: 15, rpe: 8, completed: false },
      { id: "s3_2", setNumber: 2, prevWeight: 30, prevReps: 15, weight: 35, reps: 14, rpe: 8.5, completed: false },
      { id: "s3_3", setNumber: 3, prevWeight: 30, prevReps: 12, weight: 35, reps: 12, rpe: 9, completed: false },
    ],
  },
  {
    id: "ex_4",
    exerciseId: "cable_tricep_pushdown",
    name: "Cable Rope Pushdowns",
    muscle: "Arms",
    sets: [
      { id: "s4_1", setNumber: 1, prevWeight: 70, prevReps: 12, weight: 75, reps: 12, rpe: 8, completed: false },
      { id: "s4_2", setNumber: 2, prevWeight: 70, prevReps: 12, weight: 75, reps: 12, rpe: 8.5, completed: false },
      { id: "s4_3", setNumber: 3, prevWeight: 70, prevReps: 10, weight: 75, reps: 11, rpe: 9, completed: false },
    ],
  },
];

const INITIAL_PRS: PersonalRecord[] = [
  { exerciseName: "Barbell Back Squat", weight: 345, reps: 3, estimated1RM: 379, date: "2026-11-04" },
  { exerciseName: "Barbell Flat Bench Press", weight: 245, reps: 4, estimated1RM: 277, date: "2026-11-08" },
  { exerciseName: "Conventional Barbell Deadlift", weight: 405, reps: 2, estimated1RM: 432, date: "2026-10-28" },
  { exerciseName: "Standing Overhead Press (OHP)", weight: 165, reps: 5, estimated1RM: 192, date: "2026-11-02" },
];

/* ============================================================================
 * MAIN COMPONENT: Bodybuilding Workouts Page
 * ========================================================================== */

export default function WorkoutsPage() {
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>(INITIAL_ROUTINE);
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup>("all");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [prVault, setPrVault] = useState<PersonalRecord[]>(INITIAL_PRS);

  // Active Session Timer
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(2540); // ~42m in session

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(90);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restActive, setRestActive] = useState(false);

  // 1RM Calculator State
  const [calcWeight, setCalcWeight] = useState(225);
  const [calcReps, setCalcReps] = useState(6);

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

  // Toggle set completion
  const handleToggleSet = (exIndex: number, setIndex: number) => {
    setActiveExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as ActiveExercise[];
      const target = copy[exIndex].sets[setIndex];
      const willBeCompleted = !target.completed;
      target.completed = willBeCompleted;

      // When set is completed, auto-trigger rest timer!
      if (willBeCompleted) {
        startRestTimer(restSeconds);
      }
      return copy;
    });
  };

  // Update set weight / reps / rpe
  const handleUpdateSet = (exIndex: number, setIndex: number, field: keyof WorkoutSet, value: number) => {
    setActiveExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as ActiveExercise[];
      (copy[exIndex].sets[setIndex] as any)[field] = value;
      return copy;
    });
  };

  // Add set to exercise
  const handleAddSet = (exIndex: number) => {
    setActiveExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as ActiveExercise[];
      const ex = copy[exIndex];
      const lastSet = ex.sets[ex.sets.length - 1];
      const nextNumber = ex.sets.length + 1;
      ex.sets.push({
        id: `s_${Date.now()}_${nextNumber}`,
        setNumber: nextNumber,
        prevWeight: lastSet ? lastSet.weight : 100,
        prevReps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 100,
        reps: lastSet ? lastSet.reps : 10,
        rpe: 8,
        completed: false,
      });
      return copy;
    });
  };

  // Remove set
  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    setActiveExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as ActiveExercise[];
      copy[exIndex].sets.splice(setIndex, 1);
      // Renumber
      copy[exIndex].sets.forEach((s, idx) => {
        s.setNumber = idx + 1;
      });
      return copy;
    });
  };

  // Add exercise from library
  const handleAddExerciseFromLibrary = (def: ExerciseDefinition) => {
    const newEx: ActiveExercise = {
      id: `ex_${Date.now()}`,
      exerciseId: def.id,
      name: def.name,
      muscle: def.muscle.toUpperCase(),
      notes: def.tips,
      sets: Array.from({ length: def.defaultSets }).map((_, idx) => ({
        id: `s_${Date.now()}_${idx + 1}`,
        setNumber: idx + 1,
        prevWeight: def.defaultWeight,
        prevReps: def.defaultReps,
        weight: def.defaultWeight,
        reps: def.defaultReps,
        rpe: 8,
        completed: false,
      })),
    };
    setActiveExercises((prev) => [...prev, newEx]);
    setLibraryOpen(false);
  };

  // Remove entire exercise
  const handleRemoveExercise = (exIndex: number) => {
    setActiveExercises((prev) => prev.filter((_, idx) => idx !== exIndex));
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

  // Epley 1RM formula
  const calculated1RM = useMemo(() => {
    if (calcReps <= 1) return calcWeight;
    return Math.round(calcWeight * (1 + calcReps / 30));
  }, [calcWeight, calcReps]);

  const filteredLibrary = useMemo(() => {
    if (muscleFilter === "all") return EXERCISE_LIBRARY;
    return EXERCISE_LIBRARY.filter((e) => e.muscle === muscleFilter);
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
          {/* Rest Timer Capsule */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono">
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

          {/* Add Exercise Trigger */}
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Exercise</span>
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* ====================================================================
         * 1. TOP TELEMETRY HUD (Clean Bedah Glassmorphism)
         * ================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Elapsed Session Time */}
          <div className="eco-glass-card p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Session Duration</span>
              <Timer className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-zinc-100">
                {formatTime(elapsedSeconds)}
              </span>
              <button
                type="button"
                onClick={() => setIsTimerRunning((r) => !r)}
                title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors"
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Push Session Active</span>
            </div>
          </div>

          {/* Volume Lifted */}
          <div className="eco-glass-card p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Volume Completed</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-zinc-100">
                {totalVolumeLbs.toLocaleString()}
              </span>
              <span className="ml-1 text-xs text-zinc-400 font-medium">lbs</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-300/80">
              +1,420 lbs vs. last push day
            </div>
          </div>

          {/* Sets Progress */}
          <div className="eco-glass-card p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Sets Logged</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-100">{totalSetsDone}</span>
              <span className="text-sm text-zinc-400">/ {totalSetsPlanned}</span>
            </div>
            <div className="mt-2 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-300"
                style={{ width: `${totalSetsPlanned ? (totalSetsDone / totalSetsPlanned) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Rest Preset Controller */}
          <div className="eco-glass-card p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Rest Intervals</span>
              <Zap className="w-4 h-4 text-yellow-400" />
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
                      : "bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <div className="mt-2 text-[10.5px] text-zinc-400 text-center">
              Auto-starts on set completion
            </div>
          </div>
        </div>

        {/* ====================================================================
         * 2. ACTIVE EXERCISES LOG (Sets, Reps, Weight & RPE)
         * ================================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-zinc-100 tracking-wide">
                Active Workout: Push Day Hypertrophy
              </h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {activeExercises.length} Movements Loaded
            </span>
          </div>

          {activeExercises.map((ex, exIndex) => (
            <div
              key={ex.id}
              className="eco-glass-card rounded-3xl p-5 sm:p-6 transition-all border border-white/10 hover:border-white/20"
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 font-bold text-xs">
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

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exIndex)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-zinc-200 border border-white/10 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>Add Set</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIndex)}
                    title="Remove Exercise"
                    className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/5 pb-2">
                      <th className="py-2 px-2">Set</th>
                      <th className="py-2 px-2">Previous</th>
                      <th className="py-2 px-2">Lbs</th>
                      <th className="py-2 px-2">Reps</th>
                      <th className="py-2 px-2">RPE</th>
                      <th className="py-2 px-2 text-center">Done</th>
                      <th className="py-2 px-1 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ex.sets.map((set, setIndex) => (
                      <tr
                        key={set.id}
                        className={`transition-colors ${
                          set.completed ? "bg-amber-500/[0.04]" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* Set Number */}
                        <td className="py-2.5 px-2 font-bold text-zinc-300">
                          {set.setNumber}
                        </td>

                        {/* Previous Record */}
                        <td className="py-2.5 px-2 text-zinc-500">
                          {set.prevWeight} lbs × {set.prevReps}
                        </td>

                        {/* Weight Input */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              handleUpdateSet(exIndex, setIndex, "weight", Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-zinc-100 font-bold focus:outline-none focus:border-amber-400/60"
                          />
                        </td>

                        {/* Reps Input */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSet(exIndex, setIndex, "reps", Number(e.target.value))
                            }
                            className="w-14 px-2 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-zinc-100 font-bold focus:outline-none focus:border-amber-400/60"
                          />
                        </td>

                        {/* RPE Input */}
                        <td className="py-2.5 px-2">
                          <select
                            value={set.rpe}
                            onChange={(e) =>
                              handleUpdateSet(exIndex, setIndex, "rpe", Number(e.target.value))
                            }
                            className="px-2 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-zinc-300 focus:outline-none focus:border-amber-400/60"
                          >
                            <option value={7}>7 (Warm)</option>
                            <option value={8}>8 (2 RIR)</option>
                            <option value={8.5}>8.5 (1-2 RIR)</option>
                            <option value={9}>9 (1 RIR)</option>
                            <option value={9.5}>9.5 (Hard)</option>
                            <option value={10}>10 (Failure)</option>
                          </select>
                        </td>

                        {/* Completion Checkmark */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSet(exIndex, setIndex)}
                            className="focus:outline-none inline-flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                          >
                            {set.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-600 hover:text-amber-400" />
                            )}
                          </button>
                        </td>

                        {/* Remove Set */}
                        <td className="py-2.5 px-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIndex, setIndex)}
                            title="Remove Set"
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
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

        {/* ====================================================================
         * 3. BOTTOM CARDS: 1RM CALCULATOR & PR VAULT (HALL OF FAME)
         * ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* 1RM Interactive Calculator */}
          <div className="eco-glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-zinc-100 tracking-wide">
                Hypertrophy 1RM Calculator (Epley Formula)
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Calculates your estimated 1-Rep Max based on working sets to calibrate progressive overload.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Lifted Weight (lbs)
                </label>
                <input
                  type="number"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-2xl bg-white/[0.05] border border-white/10 text-zinc-100 font-mono font-bold text-base focus:outline-none focus:border-amber-400/60"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Reps Completed
                </label>
                <input
                  type="number"
                  value={calcReps}
                  onChange={(e) => setCalcReps(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-2xl bg-white/[0.05] border border-white/10 text-zinc-100 font-mono font-bold text-base focus:outline-none focus:border-amber-400/60"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-300 font-medium block">
                  Estimated 1-Rep Max
                </span>
                <span className="text-3xl font-extrabold font-mono text-amber-200">
                  {calculated1RM} <span className="text-xs font-normal">lbs</span>
                </span>
              </div>
              <div className="text-right text-[11px] font-mono text-zinc-400 space-y-0.5">
                <div>90%: {Math.round(calculated1RM * 0.9)} lbs</div>
                <div>80%: {Math.round(calculated1RM * 0.8)} lbs</div>
                <div>70%: {Math.round(calculated1RM * 0.7)} lbs</div>
              </div>
            </div>
          </div>

          {/* PR Hall of Fame */}
          <div className="eco-glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-zinc-100 tracking-wide">
                  Personal Records (PR Vault)
                </h3>
              </div>
              <span className="text-[11px] text-amber-400 font-mono font-semibold">
                Verified Records
              </span>
            </div>

            <div className="space-y-2.5">
              {prVault.map((pr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">
                      {pr.exerciseName}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Set: {pr.weight} lbs × {pr.reps} reps • {pr.date}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold font-mono text-amber-300 block">
                      {pr.estimated1RM} lbs
                    </span>
                    <span className="text-[9.5px] text-zinc-500 font-mono">1RM Est</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ====================================================================
         * 4. EXERCISE LIBRARY MODAL
         * ================================================================== */}
        {libraryOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="eco-glass-card w-full max-w-2xl max-h-[85vh] rounded-3xl p-6 flex flex-col space-y-4 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-zinc-100">
                    Exercise Library
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLibraryOpen(false)}
                  className="px-2.5 py-1 rounded-full text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              {/* Muscle Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(["all", "chest", "back", "shoulders", "arms", "legs", "core"] as MuscleGroup[]).map(
                  (m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMuscleFilter(m)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all border ${
                        muscleFilter === m
                          ? "bg-amber-500/25 border-amber-400 text-amber-200"
                          : "bg-white/[0.03] border-white/5 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {m}
                    </button>
                  )
                )}
              </div>

              {/* Exercises List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredLibrary.map((def) => (
                  <div
                    key={def.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-400/40 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-200 transition-colors">
                          {def.name}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono uppercase">
                          {def.equipment}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                        {def.tips}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddExerciseFromLibrary(def)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ExecutiveModuleShell>
  );
}

