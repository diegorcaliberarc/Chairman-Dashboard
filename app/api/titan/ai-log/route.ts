import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

interface AiLogResponse {
  action: "LOG_SET" | "LOG_MULTIPLE_SETS" | "UPDATE_BIOMETRIC" | "START_REST_TIMER" | "UNKNOWN";
  exerciseName?: string;
  matchedExerciseId?: string;
  setNumber?: number;
  weightLbs?: number;
  reps?: number;
  rpe?: number;
  isCompleted?: boolean;
  sets?: Array<{
    setNumber: number;
    weightLbs: number;
    reps: number;
    rpe?: number;
    isCompleted: boolean;
  }>;
  biometricUpdates?: Record<string, number>;
  restSeconds?: number;
  feedbackMessage: string;
}

const CANONICAL_EXERCISES = [
  { id: "incline_bench", name: "Incline Barbell Bench Press", aliases: ["incline bench", "incline barbell", "incline press"] },
  { id: "overhead_press", name: "Dumbbell Overhead Shoulder Press", aliases: ["shoulder press", "overhead press", "db shoulder press", "dumbbell press"] },
  { id: "cable_fly", name: "Dual Cable High-to-Low Chest Fly", aliases: ["cable fly", "cable crossover", "chest fly", "crossover"] },
  { id: "tricep_extension", name: "Overhead Triceps Rope Extension", aliases: ["tricep extension", "rope extension", "tricep pushdown", "triceps"] },
  { id: "barbell_row", name: "Bent-Over Barbell Row", aliases: ["barbell row", "bent over row", "rows"] },
  { id: "lat_pulldown", name: "Lat Pulldown", aliases: ["pulldown", "lat pull", "neutral grip pulldown"] },
  { id: "bicep_curl", name: "Incline Dumbbell Bicep Curl", aliases: ["bicep curl", "dumbbell curl", "curls"] },
  { id: "deadlift", name: "Barbell Deadlift", aliases: ["deadlift", "conventional deadlift"] },
  { id: "squat", name: "Barbell Back Squat", aliases: ["squat", "back squat", "barbell squat"] },
  { id: "leg_press", name: "Leg Press", aliases: ["leg press", "sled press"] },
  { id: "lateral_raise", name: "Dumbbell Lateral Raise", aliases: ["lateral raise", "side raise", "delt raise"] },
];

/**
 * Deterministic NLP Heuristic Parser for high-velocity voice logging
 */
function deterministicParse(text: string): AiLogResponse {
  const lower = text.toLowerCase().trim();

  // 1. Check for rest timer command
  const timerMatch = lower.match(/(?:start\s+)?(?:rest\s+)?timer\s+(?:for\s+)?(\d+)\s*(s|sec|seconds?|m|min|minutes?)/i) ||
    lower.match(/rest\s+(?:for\s+)?(\d+)\s*(s|sec|seconds?|m|min|minutes?)/i);
  if (timerMatch) {
    let secs = parseInt(timerMatch[1], 10);
    const unit = timerMatch[2].toLowerCase();
    if (unit.startsWith("m")) secs *= 60;
    return {
      action: "START_REST_TIMER",
      restSeconds: secs,
      feedbackMessage: `Rest timer started for ${secs} seconds.`,
    };
  }

  // 2. Check for biometric measurement update
  const bioMatch = lower.match(/(?:update|set|log)\s+(chest|shoulders?|biceps?|waist|neck|hips?|thighs?|calves)\s+(?:to\s+)?(\d+(?:\.\d+)?)\s*(?:in|inches|cm)?/i) ||
    lower.match(/(chest|shoulders?|biceps?|waist|neck|hips?|thighs?|calves)\s+(?:to\s+)?(\d+(?:\.\d+)?)\s*(?:in|inches|cm)/i);
  if (bioMatch) {
    const key = bioMatch[1].toLowerCase().replace(/s$/, ""); // normalize shoulder, bicep, hip, thigh
    const val = parseFloat(bioMatch[2]);
    const normalizedKey = key === "bicep" ? "biceps" : key;
    return {
      action: "UPDATE_BIOMETRIC",
      biometricUpdates: { [normalizedKey]: val },
      feedbackMessage: `Updated ${normalizedKey} measurement to ${val} in.`,
    };
  }

  // 3. Match exercise name
  let matchedEx = CANONICAL_EXERCISES[0]; // default to current active
  for (const ex of CANONICAL_EXERCISES) {
    if (lower.includes(ex.name.toLowerCase()) || ex.aliases.some((a) => lower.includes(a))) {
      matchedEx = ex;
      break;
    }
  }

  // 4. Extract weight (e.g. 225 lbs, 225, 80s)
  let weight = 0;
  const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kilos?|kg)/i) ||
    lower.match(/(\d{2,3})s?\b/);
  if (weightMatch) {
    weight = parseFloat(weightMatch[1]);
  }

  // 5. Extract reps (e.g. 8 reps, for 8, x 8)
  let reps = 0;
  const repsMatch = lower.match(/(?:for|x|times)\s*(\d{1,2})\s*(?:reps?)?/i) ||
    lower.match(/(\d{1,2})\s*reps?\b/i);
  if (repsMatch) {
    reps = parseInt(repsMatch[1], 10);
  } else if (!weightMatch) {
    // Check pattern like "225 8" or "225 for 8"
    const pairMatch = lower.match(/(\d{2,3})\s+(?:for\s+)?(\d{1,2})/);
    if (pairMatch) {
      weight = parseFloat(pairMatch[1]);
      reps = parseInt(pairMatch[2], 10);
    }
  }

  // 6. Extract RPE (e.g. RPE 9, rate 8.5)
  let rpe = 8.5;
  const rpeMatch = lower.match(/rpe\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(?:felt\s+like|rated?|effort)\s*(?:an?)?\s*(\d+(?:\.\d+)?)/i);
  if (rpeMatch) {
    rpe = parseFloat(rpeMatch[1]);
  }

  // 7. Check for multiple sets e.g. "4 sets of 225 for 8"
  const multiSetMatch = lower.match(/(\d+)\s*sets?(?:\s+of)?/i);
  if (multiSetMatch && weight > 0 && reps > 0) {
    const setCount = parseInt(multiSetMatch[1], 10);
    const sets = Array.from({ length: setCount }, (_, i) => ({
      setNumber: i + 1,
      weightLbs: weight,
      reps: reps,
      rpe: rpe,
      isCompleted: true,
    }));
    return {
      action: "LOG_MULTIPLE_SETS",
      exerciseName: matchedEx.name,
      matchedExerciseId: matchedEx.id,
      sets,
      weightLbs: weight,
      reps: reps,
      rpe: rpe,
      restSeconds: 90,
      feedbackMessage: `Logged ${setCount} sets of ${matchedEx.name} at ${weight} lbs × ${reps} reps.`,
    };
  }

  if (weight > 0 || reps > 0) {
    return {
      action: "LOG_SET",
      exerciseName: matchedEx.name,
      matchedExerciseId: matchedEx.id,
      weightLbs: weight || 135,
      reps: reps || 8,
      rpe: rpe,
      isCompleted: true,
      restSeconds: 90,
      feedbackMessage: `Logged ${matchedEx.name}: ${weight || 135} lbs × ${reps || 8} reps @ RPE ${rpe}. Rest timer started (90s).`,
    };
  }

  return {
    action: "UNKNOWN",
    feedbackMessage: `Recognized: "${text}". Please specify weight and reps (e.g., 'Incline bench 225 for 8 reps').`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, activeExerciseName } = body;

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json({ error: "Missing input speech or text" }, { status: 400 });
    }

    const trimmed = input.trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    // Try Gemini API if key is available
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are the AI Voice Telemetry Engine for Titan Bodybuilding OS.
Analyze the user's workout speech or text log: "${trimmed}".
Currently active exercise context: "${activeExerciseName || "Incline Barbell Bench Press"}".

Return a strictly valid JSON object matching this schema:
{
  "action": "LOG_SET" | "LOG_MULTIPLE_SETS" | "UPDATE_BIOMETRIC" | "START_REST_TIMER" | "UNKNOWN",
  "exerciseName": string (e.g. "Incline Barbell Bench Press", "Dumbbell Overhead Shoulder Press", "Dual Cable High-to-Low Chest Fly"),
  "weightLbs": number (e.g. 225),
  "reps": number (e.g. 8),
  "rpe": number (e.g. 9.0),
  "setNumber": number (optional, e.g. 1),
  "sets": array of { "setNumber": number, "weightLbs": number, "reps": number, "rpe": number, "isCompleted": boolean } (if multiple sets),
  "biometricUpdates": object of { "chest"?: number, "shoulders"?: number, "biceps"?: number, "waist"?: number, "neck"?: number, "hips"?: number, "thighs"?: number, "calves"?: number },
  "restSeconds": number (default 90 if set logged),
  "feedbackMessage": string (crisp military confirmation message)
}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const textOutput = response.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          return NextResponse.json({ success: true, ...parsed, source: "gemini" });
        }
      } catch (geminiErr) {
        console.warn("Gemini voice parse fallback:", geminiErr);
      }
    }

    // High-speed deterministic fallback
    const result = deterministicParse(trimmed);
    return NextResponse.json({ success: true, ...result, source: "deterministic" });
  } catch (err: any) {
    console.error("AI log error:", err);
    return NextResponse.json({ error: err.message || "Failed to process voice log" }, { status: 500 });
  }
}
