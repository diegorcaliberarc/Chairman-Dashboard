"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Dumbbell,
  Play,
  Pause,
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
  Calendar as CalendarIcon,
  Check,
  Award,
  Wrench,
  Gauge,
  Repeat,
  Target,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";

/* ============================================================================
 * TYPES & CANONICAL EXERCISE LIBRARY
 * ========================================================================== */

type MuscleGroup = "all" | "chest" | "back" | "shoulders" | "arms" | "legs" | "core";

interface ExerciseDefinition {
  id: string;
  name: string;
  muscle: "chest" | "back" | "shoulders" | "arms" | "legs" | "core";
  category: "compound" | "isolation";
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  tips: string;
  image?: string;
}

interface WorkoutSet {
  id: string;
  setNumber: number;
  prevWeight: number;
  prevReps: number;
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
}

interface ActiveExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscle: string;
  notes?: string;
  sets: WorkoutSet[];
}

interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string;
}

interface SplitPreset {
  name: string;
  split: string;
  dayOfWeek: number; // 1 = Mon, 2 = Tue, etc.
  dayLabel: string;
  color: string;
  image: string;
  exercises: string[];
  equipmentNeeded: { name: string; detail: string; category: "barbell" | "dumbbell" | "machine" | "gear" }[];
  intensity: string;
  setRange: string;
  repRange: string;
  restInterval: string;
  tempoProtocol: string;
  progressionTarget: string;
}

const CANONICAL_EXERCISES: ExerciseDefinition[] = [
  // CHEST
  { id: "incline_db_press", name: "Incline Dumbbell Press", muscle: "chest", category: "compound", equipment: "dumbbell", defaultSets: 4, defaultReps: 10, defaultWeight: 80, tips: "30-degree incline, full stretch at bottom, squeeze upper pec.", image: "/workouts/push_day.jpg" },
  { id: "barbell_bench_press", name: "Barbell Flat Bench Press", muscle: "chest", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 6, defaultWeight: 225, tips: "Retract scapulae, leg drive, touch lower sternum.", image: "/workouts/push_day.jpg" },
  { id: "cable_chest_flyes", name: "High-to-Low Cable Flyes", muscle: "chest", category: "isolation", equipment: "cable", defaultSets: 3, defaultReps: 12, defaultWeight: 45, tips: "Slight elbow bend, cross over hands for peak contraction.", image: "/workouts/push_day.jpg" },

  // BACK
  { id: "barbell_deadlift", name: "Conventional Barbell Deadlift", muscle: "back", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 5, defaultWeight: 365, tips: "Brace lats tight, drive floor away, lock hips with glutes.", image: "/workouts/pull_day.jpg" },
  { id: "barbell_row", name: "Bent-Over Barbell Row", muscle: "back", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 8, defaultWeight: 185, tips: "Hinge at hips, pull bar to navel with elbows driving back.", image: "/workouts/pull_day.jpg" },
  { id: "lat_pulldown", name: "Neutral Grip Lat Pulldown", muscle: "back", category: "isolation", equipment: "cable", defaultSets: 4, defaultReps: 10, defaultWeight: 160, tips: "Depress scapulae first, drive elbows toward back pockets.", image: "/workouts/pull_day.jpg" },

  // SHOULDERS
  { id: "overhead_press", name: "Standing Overhead Press (OHP)", muscle: "shoulders", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 6, defaultWeight: 135, tips: "Squeeze glutes and core, press straight bar path, lock overhead.", image: "/workouts/upper_body.jpg" },
  { id: "lateral_raises", name: "Dumbbell Lateral Raises", muscle: "shoulders", category: "isolation", equipment: "dumbbell", defaultSets: 4, defaultReps: 15, defaultWeight: 30, tips: "Lead with elbows, thumb slightly downward, strict tempo.", image: "/workouts/upper_body.jpg" },

  // ARMS
  { id: "incline_db_curl", name: "Incline Dumbbell Bicep Curl", muscle: "arms", category: "isolation", equipment: "dumbbell", defaultSets: 3, defaultReps: 10, defaultWeight: 35, tips: "Deep stretch on long head of bicep, supinate at top.", image: "/workouts/pull_day.jpg" },
  { id: "cable_tricep_pushdown", name: "Cable Rope Pushdowns", muscle: "arms", category: "isolation", equipment: "cable", defaultSets: 4, defaultReps: 12, defaultWeight: 70, tips: "Flare rope outward at the bottom for lateral head contraction.", image: "/workouts/push_day.jpg" },

  // LEGS
  { id: "barbell_squat", name: "Barbell Back Squat", muscle: "legs", category: "compound", equipment: "barbell", defaultSets: 5, defaultReps: 5, defaultWeight: 315, tips: "Hit depth below parallel, knees track toes, drive out of the hole.", image: "/workouts/legs_day.jpg" },
  { id: "romanian_deadlift", name: "Romanian Deadlift (RDL)", muscle: "legs", category: "compound", equipment: "barbell", defaultSets: 4, defaultReps: 8, defaultWeight: 225, tips: "Push hips back, feel intense hamstring stretch, flat back.", image: "/workouts/lower_body.jpg" },
  { id: "leg_press", name: "45-Degree Leg Press", muscle: "legs", category: "compound", equipment: "machine", defaultSets: 4, defaultReps: 10, defaultWeight: 450, tips: "Feet shoulder-width, deep range of motion, do not lock knees.", image: "/workouts/legs_day.jpg" },
];

const SPLIT_PRESETS: SplitPreset[] = [
  {
    name: "Push Day Hypertrophy",
    split: "PUSH",
    dayOfWeek: 1, // Monday
    dayLabel: "MON",
    color: "#F59E0B",
    image: "/workouts/push_day.jpg",
    exercises: ["incline_db_press", "barbell_bench_press", "lateral_raises", "cable_tricep_pushdown"],
    equipmentNeeded: [
      { name: "Olympic Barbell & Bumper Plates", detail: "45 lb Bar + 45/25/10 lb plates", category: "barbell" },
      { name: "Adjustable Incline Bench", detail: "Set locked at 30° incline", category: "machine" },
      { name: "Heavy Hex Dumbbells", detail: "Pairs: 70 lbs, 80 lbs, 85 lbs", category: "dumbbell" },
      { name: "Dual Cable Crossover Stack", detail: "Rope & single D-handles attached", category: "machine" },
      { name: "Support Gear & Liquid Chalk", detail: "Heavy stiff wrist wraps & chalk", category: "gear" },
    ],
    intensity: "RPE 8.5–9.5 · 80–85% 1RM",
    setRange: "14–16 Working Sets",
    repRange: "6–8 Reps (Compounds) · 10–15 (Isolations)",
    restInterval: "90s–120s Compounds · 60s Isolations",
    tempoProtocol: "3-0-1-0 (3s Eccentric · Explosive 1s Concentric)",
    progressionTarget: "+5 lbs or +1 rep on Incline Dumbbell Press",
  },
  {
    name: "Pull Day Strength & Width",
    split: "PULL",
    dayOfWeek: 2, // Tuesday
    dayLabel: "TUE",
    color: "#3B82F6",
    image: "/workouts/pull_day.jpg",
    exercises: ["barbell_deadlift", "barbell_row", "lat_pulldown", "incline_db_curl"],
    equipmentNeeded: [
      { name: "Olympic Barbell & Deadlift Platform", detail: "Deadlift bar & rubber flooring", category: "barbell" },
      { name: "Lat Pulldown Station", detail: "Neutral grip mag-grip attachment", category: "machine" },
      { name: "Medium-Heavy Dumbbells", detail: "Pairs: 35 lbs & 40 lbs for curls", category: "dumbbell" },
      { name: "Weightlifting Belt & Figure-8 Straps", detail: "4-inch leather support belt", category: "gear" },
    ],
    intensity: "RPE 8.0–9.0 · High Mechanical Tension",
    setRange: "15–18 Working Sets",
    repRange: "5–8 Reps (Deadlift/Row) · 10–12 (Lats/Arms)",
    restInterval: "120s–150s Deadlifts · 75s Lat Pulldowns",
    tempoProtocol: "2-1-1-1 (1s Isometric Peak Lat Contraction)",
    progressionTarget: "Barbell Deadlift +10 lbs volume load",
  },
  {
    name: "Rest & Active Metabolic Protocol",
    split: "REST",
    dayOfWeek: 3, // Wednesday
    dayLabel: "WED",
    color: "#10B981",
    image: "/workouts/rest_day.jpg",
    exercises: [],
    equipmentNeeded: [
      { name: "Foam Roller & Lacrosse Mobility Ball", detail: "Thoracic spine & IT band release", category: "gear" },
      { name: "Dual Husky Leashes & Harness", detail: "3.5 mile outdoor metabolic walk", category: "gear" },
      { name: "100oz Hydration Bottle & Electrolytes", detail: "Himalayan pink salt + magnesium", category: "gear" },
      { name: "Infrared Contrast & Sauna", detail: "Parasympathetic nervous recovery", category: "machine" },
    ],
    intensity: "RPE 1–3 · Active Recovery (Zone 1 Cardio)",
    setRange: "0 Resistance Sets (Full Autonomic Rest)",
    repRange: "8,000–12,000 Steps / 45m Outdoor Walk",
    restInterval: "Full Musculoskeletal Recovery Window",
    tempoProtocol: "Slow Nasal Breathing & Myofascial Release",
    progressionTarget: "100% HRV recovery + fascial mobility",
  },
  {
    name: "Leg Day Posterior & Quad Power",
    split: "LEGS",
    dayOfWeek: 4, // Thursday
    dayLabel: "THU",
    color: "#F59E0B",
    image: "/workouts/legs_day.jpg",
    exercises: ["barbell_squat", "romanian_deadlift", "leg_press"],
    equipmentNeeded: [
      { name: "Power Squat Rack & Barbell", detail: "Safety pins set at parallel depth", category: "barbell" },
      { name: "45-Degree Sled Leg Press", detail: "Loaded with 45 lb Olympic plates", category: "machine" },
      { name: "Romanian Deadlift Barbell", detail: "Overhand grip / straps ready", category: "barbell" },
      { name: "7mm Neoprene Knee Sleeves", detail: "Joint warmth & compression", category: "gear" },
    ],
    intensity: "RPE 8.5–9.5 · High Neurological Drive",
    setRange: "16–18 Working Sets",
    repRange: "5–6 Reps (Back Squat) · 8–10 (RDL) · 10–12 (Press)",
    restInterval: "150s–180s Back Squat · 90s Leg Press",
    tempoProtocol: "3-1-1-0 (Deep below parallel, strict pause)",
    progressionTarget: "Back Squat +5 lbs or +1 rep on top set",
  },
  {
    name: "Upper Body Power Composite",
    split: "UPPER",
    dayOfWeek: 5, // Friday
    dayLabel: "FRI",
    color: "#8B5CF6",
    image: "/workouts/upper_body.jpg",
    exercises: ["barbell_bench_press", "barbell_row", "overhead_press", "incline_db_curl"],
    equipmentNeeded: [
      { name: "Flat Olympic Bench Press Station", detail: "Standard 45 lb competition bar", category: "barbell" },
      { name: "Standing OHP Station", detail: "Overhead press clearance & collars", category: "barbell" },
      { name: "Dumbbell Rack (35–85 lbs)", detail: "Heavy compound accessories", category: "dumbbell" },
      { name: "Dual Cable Station", detail: "Rope & straight bar attachments", category: "machine" },
    ],
    intensity: "RPE 8.5 · Power-Building Overload",
    setRange: "16 Working Sets",
    repRange: "6–8 Reps (Compounds) · 8–12 (Accessories)",
    restInterval: "90s–120s between working sets",
    tempoProtocol: "2-0-1-0 Controlled Explosive",
    progressionTarget: "Standing OHP +5 lbs baseline lift",
  },
  {
    name: "Lower Body & Posterior Arc",
    split: "LOWER",
    dayOfWeek: 6, // Saturday
    dayLabel: "SAT",
    color: "#EC4899",
    image: "/workouts/lower_body.jpg",
    exercises: ["barbell_squat", "romanian_deadlift", "leg_press"],
    equipmentNeeded: [
      { name: "Olympic Barbell & Bumpers", detail: "RDL & glute-hamstring loading", category: "barbell" },
      { name: "Leg Press & Extension Machine", detail: "Vastus lateralis metabolic burn", category: "machine" },
      { name: "Flat-Sole Lifting Shoes", detail: "Stable heel-drive platform", category: "gear" },
    ],
    intensity: "RPE 8.0–9.0 · Posterior Hypertrophy",
    setRange: "14–16 Working Sets",
    repRange: "8–12 Reps (RDL) · 12–15 Reps (Isolation)",
    restInterval: "90s between working sets",
    tempoProtocol: "3-0-1-0 Controlled Hamstring Stretch",
    progressionTarget: "Hamstring stretch depth & isometric hold",
  },
  {
    name: "Sunday Sovereign Reset & Mobility",
    split: "REST",
    dayOfWeek: 0, // Sunday
    dayLabel: "SUN",
    color: "#10B981",
    image: "/workouts/rest_day.jpg",
    exercises: [],
    equipmentNeeded: [
      { name: "Mobility Mat & Yoga Blocks", detail: "Hip flexor & thoracic mobilization", category: "gear" },
      { name: "Husky Pack Harnesses", detail: "Morning sun outdoor metabolic walk", category: "gear" },
      { name: "High-Protein Recovery Prep", detail: "200g+ weekly nutritional staging", category: "gear" },
    ],
    intensity: "RPE 1 · Complete Autonomic Restoration",
    setRange: "0 Sets · Joint & Tendon Deload",
    repRange: "Full Physical Readiness & Sunday Audit",
    restInterval: "24-Hour Central Nervous System Reset",
    tempoProtocol: "Parasympathetic Activation",
    progressionTarget: "Zero systemic fatigue entering Monday Push",
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

  // Selected Day Preset Lookup
  const selectedDayPreset = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const dow = dt.getDay(); // 0 = Sun, 1 = Mon ...
    const match = SPLIT_PRESETS.find((p) => p.dayOfWeek === dow);
    return match || SPLIT_PRESETS[0];
  }, [selectedDate]);

  // Generate 7-Day Horizontal Roadmap Calendar (Monday -> Sunday)
  const roadmapDays = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const curr = new Date(y, m - 1, d);
    const dayOfWeek = curr.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() + mondayOffset);

    const days = [];
    const todayStr = getTodayStr();

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dy = dayDate.getFullYear();
      const dm = String(dayDate.getMonth() + 1).padStart(2, "0");
      const dd = String(dayDate.getDate()).padStart(2, "0");
      const dateStr = `${dy}-${dm}-${dd}`;

      const dow = dayDate.getDay();
      const preset = SPLIT_PRESETS.find((p) => p.dayOfWeek === dow) || SPLIT_PRESETS[0];

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${monthNames[dayDate.getMonth()]} ${dayDate.getDate()}`;

      days.push({
        dateStr,
        dayLabel: preset.dayLabel,
        formattedDate,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        preset,
      });
    }
    return days;
  }, [selectedDate]);

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
  const handleLaunchSplit = async (preset: SplitPreset) => {
    if (preset.exercises.length === 0) return; // Rest day
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

  // Toggle set completion
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

  return (
    <ExecutiveModuleShell
      moduleId="WORKOUTS"
      eyebrow="Hypertrophy & Strength"
      title="Titan Bodybuilding Engine"
      subtitle="Clean Progressive Overload, Set Telemetry & Integrated Rest Timers"
      accentColor="#f59e0b"
      headerActions={
        <div className="flex items-center gap-2">
          {/* Compact Date Stepper */}
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
              <CalendarIcon size={12} className="text-amber-400" />
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

          {/* Quick Active Rest Capsule */}
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
      <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-4">
        {/* ====================================================================
         * 1. HORIZONTAL WORKOUT ROADMAP CALENDAR (LEFT TO RIGHT)
         * ==================================================================== */}
        <div className="rounded-2xl bg-[#0E1017]/95 border border-white/10 p-3 sm:p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <CalendarIcon size={14} className="text-amber-400" />
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-200">
                Weekly Hypertrophy Roadmap (Left to Right)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Click any day to load scheduled routine & gear
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {roadmapDays.map((day) => {
              const isSelected = day.isSelected;
              const isRest = day.preset.split === "REST";
              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  style={{
                    borderColor: isSelected ? day.preset.color : "rgba(255,255,255,0.08)",
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-150 relative overflow-hidden group flex flex-col justify-between min-h-[92px] ${
                    isSelected
                      ? "bg-white/[0.08] ring-2 ring-amber-400/50 shadow-lg scale-[1.02]"
                      : "bg-[#141720]/80 hover:bg-[#1A1E29] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-zinc-400 group-hover:text-white">
                      {day.dayLabel}
                    </span>
                    {day.isToday && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        TODAY
                      </span>
                    )}
                  </div>

                  <div className="my-1">
                    <div
                      className="text-xs font-bold leading-tight line-clamp-1"
                      style={{ color: isSelected ? "#FFFFFF" : day.preset.color }}
                    >
                      {day.preset.split}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 line-clamp-1 mt-0.5">
                      {isRest ? "Mobility / Recovery" : day.preset.name.replace("Day", "")}
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-zinc-500 flex items-center justify-between pt-1 border-t border-white/[0.06]">
                    <span>{day.formattedDate}</span>
                    <span className="text-[9px] opacity-70">
                      {isRest ? "REST" : `${day.preset.exercises.length} ex`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ====================================================================
         * 2. COMPACT EXECUTIVE TELEMETRY HUD (Duration, Volume, Sets, Rest)
         * ==================================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#0E1017]/95 border border-white/10 backdrop-blur-xl shadow-xl">
          {/* Duration */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
              <Timer size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 truncate">
                Session Duration
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black font-mono text-zinc-100">
                  {formatTime(elapsedSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((r) => !r)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors"
                  title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
                >
                  {isTimerRunning ? <Pause size={11} /> : <Play size={11} />}
                </button>
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
            <div className="w-8 h-8 rounded-lg bg-orange-400/10 border border-orange-400/25 flex items-center justify-center text-orange-400 shrink-0">
              <Flame size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 truncate">
                Total Volume
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-zinc-100">
                {totalVolumeLbs.toLocaleString()} <span className="text-xs font-normal text-zinc-400">lbs</span>
              </div>
            </div>
          </div>

          {/* Sets Done */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
            <div className="w-8 h-8 rounded-lg bg-sky-400/10 border border-sky-400/25 flex items-center justify-center text-sky-400 shrink-0">
              <Layers size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 truncate">
                Sets Done
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black font-mono text-zinc-100">
                  {totalSetsDone} <span className="text-xs text-zinc-500 font-normal">/ {totalSetsPlanned}</span>
                </span>
                <div className="flex-1 max-w-[70px] bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
                    style={{ width: `${totalSetsPlanned ? (totalSetsDone / totalSetsPlanned) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rest Preset Controller */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
            <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                <span>Rest Interval</span>
                {restActive && (
                  <span className="text-emerald-400 font-bold font-mono animate-pulse">
                    {restRemaining}s
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {[60, 90, 120, 180].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => startRestTimer(sec)}
                    className={`flex-1 py-0.5 rounded text-[11px] font-mono font-semibold transition-all border ${
                      restSeconds === sec
                        ? "bg-amber-500/25 border-amber-400/60 text-amber-200"
                        : "bg-[#141720] border-[#1A1D24] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
         * 3. WORKOUT HERO BANNER WITH REAL PICTURES & SPLIT DETAILS
         * ==================================================================== */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0E1017]">
          {/* Background Workout Image with Cinematic Gradient */}
          <div className="absolute inset-0 z-0">
            <img
              src={selectedDayPreset.image}
              alt={selectedDayPreset.name}
              className="w-full h-full object-cover object-center opacity-30 filter brightness-90 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090C] via-[#08090C]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border"
                  style={{
                    backgroundColor: `${selectedDayPreset.color}20`,
                    borderColor: `${selectedDayPreset.color}50`,
                    color: selectedDayPreset.color,
                  }}
                >
                  {selectedDayPreset.split} PROTOCOL · {selectedDayPreset.dayLabel}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Target Date: {selectedDate}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {selectedDayPreset.name}
              </h2>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {selectedDayPreset.progressionTarget}
              </p>
            </div>

            {/* Launch / Finish Routine CTA */}
            <div className="flex items-center gap-2.5 shrink-0">
              {activeExercises.length === 0 ? (
                selectedDayPreset.split !== "REST" ? (
                  <button
                    onClick={() => handleLaunchSplit(selectedDayPreset)}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
                  >
                    <Play size={14} className="fill-black" />
                    <span>Launch Scheduled Routine</span>
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
                    <ShieldCheck size={15} />
                    <span>Autonomic Recovery Active</span>
                  </div>
                )
              ) : (
                <button
                  onClick={handleFinishSession}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
                >
                  <CheckCheck size={16} />
                  <span>Complete & Archive Workout</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================================
         * 4. TWO-COLUMN STRATEGIC MATRIX:
         *    LEFT: Equipment Needed
         *    RIGHT: Intensity, Set Range & Rep Range Parameters
         * ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ── LEFT SIDE: EQUIPMENT NEEDED ─────────────────────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1017]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Wrench size={15} className="text-amber-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-100">
                  Equipment Needed (Left Area)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {selectedDayPreset.equipmentNeeded.length} Items Required
              </span>
            </div>

            <div className="space-y-2">
              {selectedDayPreset.equipmentNeeded.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#141720]/80 border border-white/[0.06] hover:border-amber-400/30 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-200">{item.name}</div>
                      <div className="text-[10.5px] font-mono text-zinc-400">{item.detail}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT SIDE: INTENSITY, SET & REP PARAMETERS ─────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1017]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Gauge size={15} className="text-sky-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-100">
                  Intensity, Sets & Reps (Right Area)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-sky-400 font-semibold">
                Sovereign Protocol
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Intensity */}
              <div className="p-3 rounded-xl bg-[#141720]/80 border border-white/[0.06]">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={12} className="text-orange-400" />
                  <span>Target Intensity</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 mt-1">
                  {selectedDayPreset.intensity}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Heavy mechanical tension</div>
              </div>

              {/* Set Range */}
              <div className="p-3 rounded-xl bg-[#141720]/80 border border-white/[0.06]">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={12} className="text-sky-400" />
                  <span>Set Range</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 mt-1">
                  {selectedDayPreset.setRange}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Working sets across lifts</div>
              </div>

              {/* Rep Range */}
              <div className="p-3 rounded-xl bg-[#141720]/80 border border-white/[0.06]">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Repeat size={12} className="text-emerald-400" />
                  <span>Rep Range</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 mt-1">
                  {selectedDayPreset.repRange}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Compound vs Isolation</div>
              </div>

              {/* Rest Protocol */}
              <div className="p-3 rounded-xl bg-[#141720]/80 border border-white/[0.06]">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer size={12} className="text-amber-400" />
                  <span>Rest Protocol</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 mt-1">
                  {selectedDayPreset.restInterval}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{selectedDayPreset.tempoProtocol}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
         * 5. ACTIVE WORKOUT EXERCISES & LIVE SET LOGGER
         * ==================================================================== */}
        {activeExercises.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-zinc-100 tracking-wide">
                  Active Execution: {activeSession?.notes || selectedDayPreset.name}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {activeExercises.length} Movements Scheduled
              </span>
            </div>

            {activeExercises.map((ex, exIndex) => (
              <div
                key={ex.id}
                className="rounded-2xl p-4 sm:p-5 bg-[#0E1017]/95 border border-white/10 shadow-xl"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 font-bold text-xs">
                      {exIndex + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{ex.name}</h4>
                      <span className="text-[10px] text-amber-400 font-mono font-medium tracking-wide uppercase">
                        {ex.muscle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sets Table with Steppers */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-zinc-500 border-b border-white/[0.06]">
                        <th className="pb-2 w-12 text-center">SET</th>
                        <th className="pb-2 w-28 text-center">PREVIOUS</th>
                        <th className="pb-2 w-48 text-center">WEIGHT (LBS)</th>
                        <th className="pb-2 w-40 text-center">REPS</th>
                        <th className="pb-2 w-16 text-center">DONE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {ex.sets.map((set, setIndex) => (
                        <tr
                          key={set.id}
                          className={`transition-colors ${
                            set.completed ? "bg-emerald-500/5 text-emerald-200" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-2 text-center font-bold text-zinc-300">
                            {set.setNumber}
                          </td>
                          <td className="py-2 text-center text-zinc-500">
                            {set.prevWeight} lbs × {set.prevReps}
                          </td>
                          <td className="py-2 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#141720] border border-white/10 rounded-xl px-2 py-0.5">
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
                          <td className="py-2 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#141720] border border-white/10 rounded-xl px-2 py-0.5">
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
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSet(exIndex, setIndex)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                set.completed
                                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                                  : "border border-zinc-700 hover:border-amber-400 text-transparent"
                              }`}
                            >
                              <Check size={13} strokeWidth={3} />
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

        {/* ====================================================================
         * 6. PR VAULT & 1RM ESTIMATOR
         * ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PR Vault */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1017]/95 border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs font-mono">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Personal Record (PR) Vault</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Sovereign Benchmarks
              </span>
            </div>

            {prVault.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs font-mono">
                No PR records logged yet. Complete sets to establish your sovereign strength benchmarks.
              </div>
            ) : (
              <div className="space-y-2">
                {prVault.map((pr) => (
                  <div
                    key={pr.exerciseName}
                    className="p-2.5 rounded-xl bg-[#141720]/80 border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-200">{pr.exerciseName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{pr.date}</div>
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
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1017]/95 border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs font-mono">
                <Calculator className="w-4 h-4 text-[#58A6FF]" />
                <span>1-Rep Max (1RM) Estimator</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Epley Formula
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141720] border border-white/10 font-mono text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                  Reps Completed
                </label>
                <input
                  type="number"
                  value={calcReps}
                  onChange={(e) => setCalcReps(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141720] border border-white/10 font-mono text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0969DA]/10 border border-[#0969DA]/30 flex items-center justify-between">
              <span className="text-xs text-zinc-300 font-semibold">
                Estimated 1-Rep Max:
              </span>
              <span className="text-lg font-black font-mono text-[#58A6FF]">
                {calculated1RM} lbs
              </span>
            </div>
          </div>
        </div>
      </div>
    </ExecutiveModuleShell>
  );
}
