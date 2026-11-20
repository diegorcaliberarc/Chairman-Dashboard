"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { WorkoutConsistencyHeatmap } from "@/components/titan/WorkoutConsistencyHeatmap";
import { WeeklyRoutineRoadmap, WEEKLY_ROUTINES } from "@/components/titan/WeeklyRoutineRoadmap";
import { TitanKpiScorecard } from "@/components/titan/TitanKpiScorecard";
import { ExerciseDeck, SessionExercise, ExerciseSetItem } from "@/components/titan/ExerciseDeck";
import { BiometricSilhouetteHUD, BiometricDimensions } from "@/components/titan/BiometricSilhouetteHUD";
import { AiVoiceLoggerDock } from "@/components/titan/AiVoiceLoggerDock";
import { Timer, RotateCcw, BarChart3, LayoutDashboard, Calendar as CalendarIcon, Flame } from "lucide-react";

/* ============================================================================
 * ZERO-DATA DEFAULT TEMPLATES
 * Every set begins blank (weightLbs: "", reps: "", rpe: "", isCompleted: false)
 * Volume starts at 0 lbs and Completed Sets starts at 0.
 * ========================================================================== */

function createBlankSets(count: number = 4): ExerciseSetItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `set-${Date.now()}-${i + 1}`,
    setNumber: i + 1,
    prevWeight: 0,
    prevReps: 0,
    weightLbs: "",
    reps: "",
    rpe: "",
    isCompleted: false,
  }));
}

const DEFAULT_SPLIT_EXERCISES: Record<number, SessionExercise[]> = {
  // 0: MON - PUSH (Chest, Delts & Triceps)
  0: [
    {
      id: "ex_incline_smith",
      exerciseNumber: 1,
      name: "Incline Smith Press",
      muscle: "Chest (Upper Clavicular)",
      equipment: "Smith Machine",
      targetProtocol: "Pyramid Overload • 3 RIR",
      targetWeightLbs: 0,
      image: "/workouts/incline_bench.jpg",
      tips: "Set bench angle to 30 degrees. Keep scapula retracted and touch upper clavicle.",
      sets: createBlankSets(4),
    },
    {
      id: "ex_db_shoulder_press",
      exerciseNumber: 2,
      name: "Seated DB Shoulder Press",
      muscle: "Front / Lateral Deltoids",
      equipment: "Dumbbells",
      targetProtocol: "Hypertrophy Tempo 3-0-1-0",
      targetWeightLbs: 0,
      image: "/workouts/dumbbell_press.jpg",
      tips: "Flare elbows slightly inward at 45 degrees. Avoid locking out at the peak.",
      sets: createBlankSets(3),
    },
    {
      id: "ex_cable_crossover",
      exerciseNumber: 3,
      name: "Low-to-High Cable Fly",
      muscle: "Chest (Sternal Head)",
      equipment: "Dual Cables",
      targetProtocol: "Peak Contraction • 2s Hold",
      targetWeightLbs: 0,
      image: "/workouts/cable_fly.jpg",
      tips: "Lead with the elbows, squeeze hard at top center, 3-second negative eccentric.",
      sets: createBlankSets(3),
    },
  ],
  // 1: TUE - PULL (Back, Rear Delts & Biceps)
  1: [
    {
      id: "ex_lat_pulldown",
      exerciseNumber: 1,
      name: "Neutral Grip Lat Pulldown",
      muscle: "Latissimus Dorsi",
      equipment: "Cable Machine",
      targetProtocol: "Full Stretch • 4x10",
      targetWeightLbs: 0,
      image: "/workouts/incline_bench.jpg",
      tips: "Depress scapula before initiating the pull. Pull to mid-chest.",
      sets: createBlankSets(4),
    },
    {
      id: "ex_chest_supported_row",
      exerciseNumber: 2,
      name: "Chest Supported T-Bar Row",
      muscle: "Rhomboids & Mid-Traps",
      equipment: "T-Bar Machine",
      targetProtocol: "Progressive Overload",
      targetWeightLbs: 0,
      image: "/workouts/dumbbell_press.jpg",
      tips: "Maintain neutral spine against pad. Drive elbows straight back.",
      sets: createBlankSets(4),
    },
    {
      id: "ex_incline_bicep_curl",
      exerciseNumber: 3,
      name: "Incline Dumbbell Bicep Curl",
      muscle: "Biceps (Long Head)",
      equipment: "Dumbbells",
      targetProtocol: "Max Stretch Hypertrophy",
      targetWeightLbs: 0,
      image: "/workouts/cable_fly.jpg",
      tips: "Let arms hang directly vertical. Supinate wrist at peak contraction.",
      sets: createBlankSets(3),
    },
  ],
  // 2: WED - REST & RECHARGE
  2: [
    {
      id: "ex_mobility_flow",
      exerciseNumber: 1,
      name: "Active Recovery & Dynamic Mobility",
      muscle: "Full Body Fascia",
      equipment: "Foam Roller & Bands",
      targetProtocol: "Circadian Regeneration",
      targetWeightLbs: 0,
      image: "/workouts/incline_bench.jpg",
      tips: "Zone 2 brisk walk or foam rolling. Focus on deep diaphragmatic breathing.",
      sets: createBlankSets(2),
    },
  ],
  // 3: THU - LEGS (Quads, Hamstrings & Calves)
  3: [
    {
      id: "ex_hack_squat",
      exerciseNumber: 1,
      name: "Hack Squat / Pendulum Squat",
      muscle: "Quadriceps VMO",
      equipment: "Hack Squat Machine",
      targetProtocol: "Full Knee Flexion • 4x8-10",
      targetWeightLbs: 0,
      image: "/workouts/incline_bench.jpg",
      tips: "Place feet mid-platform. Descend until calves meet hamstrings.",
      sets: createBlankSets(4),
    },
    {
      id: "ex_romanian_deadlift",
      exerciseNumber: 2,
      name: "Dumbbell Romanian Deadlift",
      muscle: "Hamstrings & Glutes",
      equipment: "Dumbbells",
      targetProtocol: "Eccentric Control 3-1-1",
      targetWeightLbs: 0,
      image: "/workouts/dumbbell_press.jpg",
      tips: "Hinge at the hips with soft knees until feeling intense hamstring stretch.",
      sets: createBlankSets(4),
    },
    {
      id: "ex_standing_calf_raise",
      exerciseNumber: 3,
      name: "Standing Machine Calf Raise",
      muscle: "Gastrocnemius",
      equipment: "Calf Machine",
      targetProtocol: "Dead Stop Stretch 2s",
      targetWeightLbs: 0,
      image: "/workouts/cable_fly.jpg",
      tips: "Pause for 2 full seconds in deep dorsiflexion before exploding upward.",
      sets: createBlankSets(4),
    },
  ],
  // 4: FRI - UPPER BODY (Power & Density)
  4: [
    {
      id: "ex_barbell_bench",
      exerciseNumber: 1,
      name: "Barbell Flat Bench Press",
      muscle: "Chest & Triceps",
      equipment: "Olympic Barbell",
      targetProtocol: "Strength Pyramids",
      targetWeightLbs: 0,
      image: "/workouts/incline_bench.jpg",
      tips: "Plant feet firmly on floor. Touch sternum with pause, drive up with leg drive.",
      sets: createBlankSets(4),
    },
    {
      id: "ex_weighted_pullup",
      exerciseNumber: 2,
      name: "Overhand Weighted Pull-Up",
      muscle: "Upper Lats & Teres Major",
      equipment: "Dip Belt / Pull-Up Bar",
      targetProtocol: "Power Hypertrophy",
      targetWeightLbs: 0,
      image: "/workouts/dumbbell_press.jpg",
      tips: "Full extension at the bottom. Pull chin completely over bar.",
      sets: createBlankSets(3),
    },
  ],
  // 5: SAT - ARMS & SHOULDERS
  5: [
    {
      id: "ex_cable_lateral_raise",
      exerciseNumber: 1,
      name: "Behind-The-Back Cable Lateral Raise",
      muscle: "Lateral Deltoids",
      equipment: "Low Cable",
      targetProtocol: "Constant Tension • 4x15",
      targetWeightLbs: 0,
      image: "/workouts/cable_fly.jpg",
      tips: "Keep wrist in line with forearm. Raise to 90 degrees shoulder height.",
      sets: createBlankSets(4),
    },
    {
      id: "ex_skull_crusher",
      exerciseNumber: 2,
      name: "EZ-Bar Skull Crusher",
      muscle: "Triceps (Long Head)",
      equipment: "EZ Curl Bar",
      targetProtocol: "Triceps Overload • 3x12",
      targetWeightLbs: 0,
      image: "/workouts/dumbbell_press.jpg",
      tips: "Angle elbows slightly behind the crown of head for constant tension.",
      sets: createBlankSets(3),
    },
  ],
  // 6: SUN - POSTURE & CORE
  6: [
    {
      id: "ex_hanging_leg_raise",
      exerciseNumber: 1,
      name: "Hanging Leg / Knee Raise",
      muscle: "Rectus Abdominis & Deep Core",
      equipment: "Pull-Up Bar",
      targetProtocol: "Posterior Pelvic Tilt",
      targetWeightLbs: 0,
      image: "/workouts/incline_bench.jpg",
      tips: "Roll pelvis upward toward ribs rather than swinging hip flexors.",
      sets: createBlankSets(3),
    },
  ],
};

function getTodayFormatted(): string {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  return d.toLocaleDateString("en-US", options);
}

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function TitanWorkoutsPage() {
  // 0. View Mode: Dashboard vs Trends & Charts
  const [activeTab, setActiveTab] = useState<"dashboard" | "trends">("dashboard");

  // 1. Navigation & Day selection
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const day = new Date().getDay(); // 0 is Sun, 1 is Mon
    return day === 0 ? 6 : day - 1; // Map to 0 = Mon, ..., 6 = Sun
  });
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>(getTodayFormatted());
  const [currentDateIso, setCurrentDateIso] = useState<string>(getTodayIso());

  // 2. Workout Routines State
  const [routinesState, setRoutinesState] = useState<Record<number, SessionExercise[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("titan_workout_routines_v2");
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to restore routines from storage", err);
      }
    }
    return DEFAULT_SPLIT_EXERCISES;
  });

  // Current exercises for active day
  const currentExercises = useMemo(() => {
    return routinesState[selectedDayIndex] || DEFAULT_SPLIT_EXERCISES[selectedDayIndex] || [];
  }, [routinesState, selectedDayIndex]);

  // 3. Biometric Measurements State (Zero data initial state)
  const [measurements, setMeasurements] = useState<BiometricDimensions>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("titan_biometric_dimensions");
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to load biometrics", err);
      }
    }
    return {
      neck: 0,
      shoulders: 0,
      chest: 0,
      biceps: 0,
      waist: 0,
      hips: 0,
      thighs: 0,
      calves: 0,
    };
  });

  // 4. Completed History Matrix State
  const [completedDates, setCompletedDates] = useState<
    Record<string, { volumeLbs: number; sets: number }>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("titan_completed_history");
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to load completed dates", err);
      }
    }
    return {};
  });

  // 5. Rest Timer State with Audio Chime
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play synthesized chime on 0
  const playTimerChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35); // A4
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio autoplay policy
    }
  }, []);

  useEffect(() => {
    if (isRestActive && restSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRestActive(false);
            playTimerChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRestActive, restSeconds, playTimerChime]);

  // 6. Speech Recognition & Voice Logger
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastFeedbackMessage, setLastFeedbackMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // 7. Calculate Live KPI Scorecard metrics
  const kpiStats = useMemo(() => {
    let sessionVolumeLbs = 0;
    let completedSets = 0;
    let totalSets = 0;

    for (const ex of currentExercises) {
      for (const s of ex.sets) {
        totalSets++;
        if (s.isCompleted) {
          completedSets++;
          const w = typeof s.weightLbs === "number" ? s.weightLbs : parseFloat(String(s.weightLbs)) || 0;
          const r = typeof s.reps === "number" ? s.reps : parseInt(String(s.reps), 10) || 0;
          sessionVolumeLbs += w * r;
        }
      }
    }

    return {
      sessionVolumeLbs,
      completedSets,
      totalSets,
      weeklyTonnageLbs: sessionVolumeLbs, // Dynamically driven by user inputs
      hypertrophyScore: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    };
  }, [currentExercises]);

  // Persist completed history for current date
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("titan_workout_routines_v2", JSON.stringify(routinesState));
        localStorage.setItem("titan_biometric_dimensions", JSON.stringify(measurements));
      } catch (err) {
        // Storage quota
      }
    }

    // Update completedDates map
    if (kpiStats.completedSets > 0) {
      setCompletedDates((prev) => {
        const next = {
          ...prev,
          [currentDateIso]: {
            volumeLbs: kpiStats.sessionVolumeLbs,
            sets: kpiStats.completedSets,
          },
        };
        try {
          localStorage.setItem("titan_completed_history", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [routinesState, measurements, kpiStats, currentDateIso]);

  // --- Handlers for Exercise Set Updates ---
  const handleUpdateSet = useCallback(
    (exerciseId: string, setIndex: number, field: keyof ExerciseSetItem, value: any) => {
      setRoutinesState((prev) => {
        const dayExs = [...(prev[selectedDayIndex] || [])];
        const exIdx = dayExs.findIndex((e) => e.id === exerciseId);
        if (exIdx === -1) return prev;

        const updatedEx = { ...dayExs[exIdx] };
        const updatedSets = [...updatedEx.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          [field]: value,
        };
        updatedEx.sets = updatedSets;
        dayExs[exIdx] = updatedEx;

        return {
          ...prev,
          [selectedDayIndex]: dayExs,
        };
      });
    },
    [selectedDayIndex]
  );

  const handleToggleSetComplete = useCallback(
    (exerciseId: string, setIndex: number) => {
      setRoutinesState((prev) => {
        const dayExs = [...(prev[selectedDayIndex] || [])];
        const exIdx = dayExs.findIndex((e) => e.id === exerciseId);
        if (exIdx === -1) return prev;

        const updatedEx = { ...dayExs[exIdx] };
        const updatedSets = [...updatedEx.sets];
        const currentComplete = updatedSets[setIndex].isCompleted;
        const newComplete = !currentComplete;

        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          isCompleted: newComplete,
        };
        updatedEx.sets = updatedSets;
        dayExs[exIdx] = updatedEx;

        // If completed just now, start rest timer automatically!
        if (newComplete) {
          setRestSeconds(90);
          setIsRestActive(true);
        }

        return {
          ...prev,
          [selectedDayIndex]: dayExs,
        };
      });
    },
    [selectedDayIndex]
  );

  const handleAddSet = useCallback(
    (exerciseId: string) => {
      setRoutinesState((prev) => {
        const dayExs = [...(prev[selectedDayIndex] || [])];
        const exIdx = dayExs.findIndex((e) => e.id === exerciseId);
        if (exIdx === -1) return prev;

        const updatedEx = { ...dayExs[exIdx] };
        const newSetNum = updatedEx.sets.length + 1;
        const lastSet = updatedEx.sets[updatedEx.sets.length - 1];

        const newSet: ExerciseSetItem = {
          id: `set-${Date.now()}-${newSetNum}`,
          setNumber: newSetNum,
          prevWeight: typeof lastSet?.weightLbs === "number" ? lastSet.weightLbs : 0,
          prevReps: typeof lastSet?.reps === "number" ? lastSet.reps : 0,
          weightLbs: "",
          reps: "",
          rpe: "",
          isCompleted: false,
        };

        updatedEx.sets = [...updatedEx.sets, newSet];
        dayExs[exIdx] = updatedEx;

        return {
          ...prev,
          [selectedDayIndex]: dayExs,
        };
      });
    },
    [selectedDayIndex]
  );

  const handleRemoveSet = useCallback(
    (exerciseId: string, setIndex: number) => {
      setRoutinesState((prev) => {
        const dayExs = [...(prev[selectedDayIndex] || [])];
        const exIdx = dayExs.findIndex((e) => e.id === exerciseId);
        if (exIdx === -1) return prev;

        const updatedEx = { ...dayExs[exIdx] };
        const updatedSets = updatedEx.sets.filter((_, idx) => idx !== setIndex);
        // Re-index set numbers
        updatedEx.sets = updatedSets.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        dayExs[exIdx] = updatedEx;

        return {
          ...prev,
          [selectedDayIndex]: dayExs,
        };
      });
    },
    [selectedDayIndex]
  );

  const handleAddExercise = useCallback(() => {
    const name = window.prompt("Enter new exercise name:");
    if (!name || !name.trim()) return;

    setRoutinesState((prev) => {
      const dayExs = [...(prev[selectedDayIndex] || [])];
      const newEx: SessionExercise = {
        id: `custom_ex_${Date.now()}`,
        exerciseNumber: dayExs.length + 1,
        name: name.trim(),
        muscle: "Target Muscle",
        equipment: "Barbell / Dumbbell",
        targetProtocol: "Clean Overload",
        targetWeightLbs: 0,
        image: "/workouts/incline_bench.jpg",
        tips: "Focus on mind-muscle connection and controlled tempo.",
        sets: createBlankSets(3),
      };

      return {
        ...prev,
        [selectedDayIndex]: [...dayExs, newEx],
      };
    });
  }, [selectedDayIndex]);

  // --- Biometric Handlers ---
  const handleUpdateMeasurement = useCallback(
    (part: keyof BiometricDimensions, value: number) => {
      setMeasurements((prev) => ({
        ...prev,
        [part]: value,
      }));
      setLastFeedbackMessage(`Updated ${part} dimension to ${value} inches.`);
      setTimeout(() => setLastFeedbackMessage(null), 4000);
    },
    []
  );

  const handleQuickNaturalInput = useCallback(
    (text: string) => {
      // Natural language measurement parser
      const lower = text.toLowerCase();
      const parts: (keyof BiometricDimensions)[] = [
        "neck",
        "shoulders",
        "chest",
        "biceps",
        "waist",
        "hips",
        "thighs",
        "calves",
      ];
      let updatedCount = 0;

      for (const p of parts) {
        if (lower.includes(p)) {
          const match = lower.match(new RegExp(`${p}\\s*[:=]?\\s*([0-9]+(?:\\.[0-9]+)?)`));
          if (match && match[1]) {
            const val = parseFloat(match[1]);
            handleUpdateMeasurement(p, val);
            updatedCount++;
          }
        }
      }

      if (updatedCount === 0) {
        setLastFeedbackMessage(`Processed: "${text}"`);
        setTimeout(() => setLastFeedbackMessage(null), 4000);
      }
    },
    [handleUpdateMeasurement]
  );

  // --- Manual Log Set from Bottom Strip ---
  const handleManualLogSet = useCallback(
    (exerciseId: string, weight: number, reps: number, rpe: number) => {
      setRoutinesState((prev) => {
        const dayExs = [...(prev[selectedDayIndex] || [])];
        const exIdx = dayExs.findIndex((e) => e.id === exerciseId);
        if (exIdx === -1) return prev;

        const updatedEx = { ...dayExs[exIdx] };
        const sets = [...updatedEx.sets];

        // Find first incomplete set or add new set
        const incompleteIdx = sets.findIndex((s) => !s.isCompleted);
        if (incompleteIdx !== -1) {
          sets[incompleteIdx] = {
            ...sets[incompleteIdx],
            weightLbs: weight,
            reps: reps,
            rpe: rpe || 9,
            isCompleted: true,
          };
        } else {
          sets.push({
            id: `set-${Date.now()}-${sets.length + 1}`,
            setNumber: sets.length + 1,
            prevWeight: weight,
            prevReps: reps,
            weightLbs: weight,
            reps: reps,
            rpe: rpe || 9,
            isCompleted: true,
          });
        }

        updatedEx.sets = sets;
        dayExs[exIdx] = updatedEx;

        return {
          ...prev,
          [selectedDayIndex]: dayExs,
        };
      });

      // Auto start 90s rest timer
      setRestSeconds(90);
      setIsRestActive(true);
      setLastFeedbackMessage(`Logged ${weight} lbs x ${reps} reps (@ RPE ${rpe})! Rest timer started.`);
      setTimeout(() => setLastFeedbackMessage(null), 4000);
    },
    [selectedDayIndex]
  );

  // --- AI Voice / Text NLP Processor ---
  const handleProcessInput = useCallback(
    async (input: string) => {
      if (!input || !input.trim()) return;

      try {
        const res = await fetch("/api/titan/ai-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: input,
            currentExercises: currentExercises.map((e) => ({ id: e.id, name: e.name })),
          }),
        });

        if (!res.ok) throw new Error("API call failed");
        const data = await res.json();
        const action = data.action;

        if (action.type === "log_set" && action.payload) {
          const { exerciseId, exerciseName, weightLbs, reps, rpe, setsCount } = action.payload;

          setRoutinesState((prev) => {
            const dayExs = [...(prev[selectedDayIndex] || [])];
            let targetEx = dayExs.find(
              (e) =>
                (exerciseId && e.id === exerciseId) ||
                (exerciseName && e.name.toLowerCase().includes(exerciseName.toLowerCase()))
            );

            // If not found, add as new exercise
            if (!targetEx) {
              targetEx = {
                id: `ex_${Date.now()}`,
                exerciseNumber: dayExs.length + 1,
                name: exerciseName || "AI Logged Exercise",
                muscle: "Target Group",
                equipment: "Free Weight",
                targetProtocol: "Progressive Overload",
                targetWeightLbs: weightLbs || 0,
                image: "/workouts/incline_bench.jpg",
                tips: "Clean execution.",
                sets: [],
              };
              dayExs.push(targetEx);
            }

            const updatedSets = [...targetEx.sets];
            const numSetsToAdd = setsCount || 1;

            for (let i = 0; i < numSetsToAdd; i++) {
              const openIdx = updatedSets.findIndex((s) => !s.isCompleted);
              if (openIdx !== -1) {
                updatedSets[openIdx] = {
                  ...updatedSets[openIdx],
                  weightLbs: weightLbs || updatedSets[openIdx].weightLbs || 0,
                  reps: reps || updatedSets[openIdx].reps || 10,
                  rpe: rpe || updatedSets[openIdx].rpe || 9,
                  isCompleted: true,
                };
              } else {
                updatedSets.push({
                  id: `set-${Date.now()}-${updatedSets.length + 1}`,
                  setNumber: updatedSets.length + 1,
                  prevWeight: weightLbs || 0,
                  prevReps: reps || 0,
                  weightLbs: weightLbs || 0,
                  reps: reps || 10,
                  rpe: rpe || 9,
                  isCompleted: true,
                });
              }
            }

            targetEx.sets = updatedSets;
            return {
              ...prev,
              [selectedDayIndex]: dayExs,
            };
          });

          // Start rest timer
          setRestSeconds(90);
          setIsRestActive(true);
          setLastFeedbackMessage(
            data.message ||
              `Logged ${setsCount || 1} set(s) for ${exerciseName || "exercise"}: ${weightLbs} lbs x ${reps} reps!`
          );
        } else if (action.type === "update_measurement" && action.payload) {
          const { part, value } = action.payload;
          if (part && typeof value === "number") {
            handleUpdateMeasurement(part, value);
          }
        } else if (action.type === "start_timer" && action.payload?.seconds) {
          setRestSeconds(action.payload.seconds);
          setIsRestActive(true);
          setLastFeedbackMessage(`Rest timer set to ${action.payload.seconds} seconds.`);
        } else {
          setLastFeedbackMessage(data.message || `Processed: "${input}"`);
        }
      } catch (err) {
        console.error("AI logging error:", err);
        // Fallback natural language set parsing
        handleQuickNaturalInput(input);
      } finally {
        setTimeout(() => setLastFeedbackMessage(null), 5000);
      }
    },
    [currentExercises, selectedDayIndex, handleUpdateMeasurement, handleQuickNaturalInput]
  );

  // Toggle Speech Recognition
  const handleToggleVoice = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. You can type commands in the text box.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleProcessInput(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [isListening, handleProcessInput]);

  // Date switching handlers
  const handlePrevDate = () => {
    setSelectedDayIndex((prev) => (prev === 0 ? 6 : prev - 1));
  };

  const handleNextDate = () => {
    setSelectedDayIndex((prev) => (prev === 6 ? 0 : prev + 1));
  };

  const currentRoutine = WEEKLY_ROUTINES[selectedDayIndex] || WEEKLY_ROUTINES[0];

  const formatRestTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Sorted daily log entries for Trends & Charts tab
  const loggedHistoryEntries = useMemo(() => {
    return Object.entries(completedDates)
      .map(([date, info]) => ({ date, ...info }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [completedDates]);

  const maxLoggedVol = useMemo(
    () => Math.max(1, ...loggedHistoryEntries.map((e) => e.volumeLbs)),
    [loggedHistoryEntries]
  );

  return (
    <ExecutiveModuleShell
      moduleId="WORKOUTS"
      eyebrow="Health & Performance"
      title="Strength & Training"
      subtitle="Progressive overload, voice set logging, and integrated rest timers"
      accentColor="#f59e0b"
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Dashboard / Trends & Charts Tab Toggle */}
          <div
            className="flex items-center p-1 rounded-xl text-xs font-mono border"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
            }}
          >
            <button
              data-testid="workouts-tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === "dashboard"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <LayoutDashboard size={13} />
              <span>Dashboard</span>
            </button>
            <button
              data-testid="workouts-tab-trends"
              onClick={() => setActiveTab("trends")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === "trends"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 size={13} />
              <span>Trends &amp; Charts</span>
            </button>
          </div>

          {/* Compact Date & Split Navigator */}
          <div
            className="flex items-center rounded-xl border px-2 py-1 text-xs font-mono"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
              color: "var(--glass-text-primary)",
            }}
          >
            <button
              onClick={handlePrevDate}
              className="px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
              title="Previous Day"
            >
              ‹
            </button>
            <span className="mx-1.5 flex items-center gap-1.5 text-[11px] font-medium">
              <CalendarIcon size={12} className="text-amber-500" />
              <span>{currentDateFormatted} · {currentRoutine.dayShort}</span>
            </span>
            <button
              onClick={handleNextDate}
              className="px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
              title="Next Day"
            >
              ›
            </button>
          </div>

          {/* Compact Rest Timer Pill */}
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/35 text-amber-600 dark:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Timer size={13} className={isRestActive ? "animate-spin text-amber-500" : ""} />
            <span>{formatRestTime(restSeconds)}</span>
            {isRestActive ? (
              <button
                onClick={() => setIsRestActive(false)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-[10px] px-2 py-0.5 rounded transition"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={() => {
                  setRestSeconds(90);
                  setIsRestActive(true);
                }}
                className="bg-amber-500 text-zinc-950 font-medium text-[10px] px-2 py-0.5 rounded hover:bg-amber-400 transition"
              >
                Start
              </button>
            )}
            <button
              onClick={() => {
                setIsRestActive(false);
                setRestSeconds(90);
              }}
              className="opacity-70 hover:opacity-100 transition"
              title="Reset Rest Timer"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      }
    >
      <div className="w-full space-y-6 pb-16">
        {/* 1. AI Real-Time Voice Logger & Manual Rapid Dock — Moved to TOP */}
        <AiVoiceLoggerDock
          exercises={currentExercises}
          isListening={isListening}
          onToggleVoice={handleToggleVoice}
          onProcessInput={handleProcessInput}
          onManualLogSet={handleManualLogSet}
          lastFeedbackMessage={lastFeedbackMessage}
        />

        {activeTab === "dashboard" ? (
          <>
            {/* 2. Consistency Heatmap Matrix (Full 52 weeks Jan–Dec) */}
            <WorkoutConsistencyHeatmap
              completedDates={completedDates}
              currentDate={currentDateIso}
            />

            {/* 3. Weekly Routine Roadmap (MON - SUN) */}
            <WeeklyRoutineRoadmap
              selectedDayIndex={selectedDayIndex}
              onSelectDay={(idx) => setSelectedDayIndex(idx)}
              todayIndex={new Date().getDay() === 0 ? 6 : new Date().getDay() - 1}
            />

            {/* 4. KPI Scorecard Strip: Volume, Sets, Tonnage, Stimulus */}
            <TitanKpiScorecard
              sessionVolumeLbs={kpiStats.sessionVolumeLbs}
              completedSets={kpiStats.completedSets}
              totalSets={kpiStats.totalSets}
              weeklyTonnageLbs={kpiStats.weeklyTonnageLbs}
              hypertrophyScore={kpiStats.hypertrophyScore}
            />

            {/* 5. 12-Column Responsive Layout: Exercise Deck (8 cols) + Biometric Silhouette HUD (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <ExerciseDeck
                  exercises={currentExercises}
                  onUpdateSet={handleUpdateSet}
                  onToggleSetComplete={handleToggleSetComplete}
                  onAddSet={handleAddSet}
                  onRemoveSet={handleRemoveSet}
                  onAddExercise={handleAddExercise}
                />
              </div>

              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <BiometricSilhouetteHUD
                  measurements={measurements}
                  onUpdateMeasurement={handleUpdateMeasurement}
                  onQuickNaturalInput={handleQuickNaturalInput}
                />
              </div>
            </div>
          </>
        ) : (
          /* TRENDS & CHARTS + DAILY LOGGED UPDATES TAB */
          <div className="space-y-6">
            <WorkoutConsistencyHeatmap
              completedDates={completedDates}
              currentDate={currentDateIso}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volume Progression Bar Chart */}
              <div
                className="rounded-2xl border p-5 space-y-4"
                style={{
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-amber-500" />
                    <h3 className="text-sm font-medium" style={{ color: "var(--glass-text-primary)" }}>
                      Session Volume Progression (lbs)
                    </h3>
                  </div>
                  <span className="text-xs font-mono" style={{ color: "var(--glass-text-muted)" }}>
                    {loggedHistoryEntries.length} logged days
                  </span>
                </div>

                {loggedHistoryEntries.length === 0 ? (
                  <div
                    className="py-12 text-center text-xs font-mono rounded-xl border border-dashed"
                    style={{
                      borderColor: "var(--glass-border)",
                      color: "var(--glass-text-muted)",
                    }}
                  >
                    No sets logged yet. Speak or log your first set above to populate your volume chart.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {loggedHistoryEntries.slice(0, 14).map((entry) => {
                      const pct = Math.max(8, Math.round((entry.volumeLbs / maxLoggedVol) * 100));
                      return (
                        <div key={entry.date} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span style={{ color: "var(--glass-text-primary)" }}>{entry.date}</span>
                            <span className="text-amber-500">
                              {entry.volumeLbs.toLocaleString()} lbs · {entry.sets} sets
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Daily Logged Updates Feed */}
              <div
                className="rounded-2xl border p-5 space-y-4"
                style={{
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-medium" style={{ color: "var(--glass-text-primary)" }}>
                      Daily Logged Updates
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-500">
                    Today: {kpiStats.completedSets} sets · {kpiStats.sessionVolumeLbs.toLocaleString()} lbs
                  </span>
                </div>

                {loggedHistoryEntries.length === 0 ? (
                  <div
                    className="py-12 text-center text-xs font-mono rounded-xl border border-dashed"
                    style={{
                      borderColor: "var(--glass-border)",
                      color: "var(--glass-text-muted)",
                    }}
                  >
                    Your daily training log updates will appear here automatically as you complete sets.
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--glass-border)" }}>
                    {loggedHistoryEntries.map((entry) => (
                      <div key={entry.date} className="py-2.5 flex items-center justify-between text-xs font-mono">
                        <div>
                          <div className="font-medium" style={{ color: "var(--glass-text-primary)" }}>
                            {entry.date}
                          </div>
                          <div className="text-[11px]" style={{ color: "var(--glass-text-muted)" }}>
                            Completed {entry.sets} working set{entry.sets === 1 ? "" : "s"}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {entry.volumeLbs.toLocaleString()} lbs
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ExecutiveModuleShell>
  );
}
