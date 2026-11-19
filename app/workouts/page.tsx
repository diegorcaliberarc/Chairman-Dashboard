"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { TitanWorkoutHeader } from "@/components/titan/TitanWorkoutHeader";
import { WorkoutConsistencyHeatmap } from "@/components/titan/WorkoutConsistencyHeatmap";
import { WeeklyRoutineRoadmap, WEEKLY_ROUTINES } from "@/components/titan/WeeklyRoutineRoadmap";
import { TitanKpiScorecard } from "@/components/titan/TitanKpiScorecard";
import { ExerciseDeck, SessionExercise, ExerciseSetItem } from "@/components/titan/ExerciseDeck";
import { BiometricSilhouetteHUD, BiometricDimensions } from "@/components/titan/BiometricSilhouetteHUD";
import { AiVoiceLoggerDock } from "@/components/titan/AiVoiceLoggerDock";
import { Sparkles, RefreshCw, Plus, CheckCircle2 } from "lucide-react";

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

  return (
    <ExecutiveModuleShell
      moduleId="WORKOUTS"
      eyebrow="Health & Performance"
      title="Strength & Training"
      subtitle="Progressive overload, voice set logging, and integrated rest timers"
      accentColor="#f59e0b"
    >
      <div className="min-h-screen bg-[#070A12] text-white flex flex-col selection:bg-amber-500 selection:text-black">
        {/* 1. Header with Rest Timer, Voice Trigger & Glass Studio */}
        <TitanWorkoutHeader
          currentDate={currentDateFormatted}
          onPrevDate={handlePrevDate}
          onNextDate={handleNextDate}
          activeRoutineName={`${currentRoutine.dayShort} • ${currentRoutine.splitTitle}`}
          isListening={isListening}
          onToggleVoice={handleToggleVoice}
          restSeconds={restSeconds}
          isRestActive={isRestActive}
          onStartRest={(secs) => {
            if (secs) setRestSeconds(secs);
            setIsRestActive(true);
          }}
          onPauseRest={() => setIsRestActive(false)}
          onResetRest={() => {
            setIsRestActive(false);
            setRestSeconds(90);
          }}
          onToggleGlassStudio={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("toggle-glass-studio"));
            }
          }}
        />

        {/* 2. Main Body Container */}
        <main className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-40">
          {/* Consistency Heatmap Matrix (12 months x 7 days) */}
          <WorkoutConsistencyHeatmap
            completedDates={completedDates}
            currentDate={currentDateIso}
          />

          {/* Weekly Routine Roadmap (MON - SUN) */}
          <WeeklyRoutineRoadmap
            selectedDayIndex={selectedDayIndex}
            onSelectDay={(idx) => setSelectedDayIndex(idx)}
            todayIndex={new Date().getDay() === 0 ? 6 : new Date().getDay() - 1}
          />

          {/* KPI Scorecard Strip: Volume, Sets, Tonnage, Stimulus */}
          <TitanKpiScorecard
            sessionVolumeLbs={kpiStats.sessionVolumeLbs}
            completedSets={kpiStats.completedSets}
            totalSets={kpiStats.totalSets}
            weeklyTonnageLbs={kpiStats.weeklyTonnageLbs}
            hypertrophyScore={kpiStats.hypertrophyScore}
          />

          {/* 12-Column Responsive Layout: Exercise Deck (8 cols) + Biometric Silhouette HUD (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Exercise Cards & Set Logging Table */}
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

            {/* Right 4 Cols: Frontal Biometric Silhouette Dimension Scanner */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <BiometricSilhouetteHUD
                measurements={measurements}
                onUpdateMeasurement={handleUpdateMeasurement}
                onQuickNaturalInput={handleQuickNaturalInput}
              />
            </div>
          </div>
        </main>

        {/* 3. Sticky Bottom AI Voice Logger & Manual Rapid Dock */}
        <AiVoiceLoggerDock
          exercises={currentExercises}
          isListening={isListening}
          onToggleVoice={handleToggleVoice}
          onProcessInput={handleProcessInput}
          onManualLogSet={handleManualLogSet}
          lastFeedbackMessage={lastFeedbackMessage}
        />
      </div>
    </ExecutiveModuleShell>
  );
}
