"use client";

import React from "react";
import { Zap, Dumbbell, ShieldAlert, Sparkles, BatteryCharging } from "lucide-react";

export interface RoutinePreset {
  id: string;
  dayShort: string;
  dayIndex: number; // 0 = Mon, 6 = Sun
  splitTitle: string;
  subtitle: string;
  category: "hypertrophy" | "strength" | "power" | "rest";
  tag: string;
  exercisesCount: number;
  dateStr: string;
  isToday?: boolean;
}

interface WeeklyRoutineRoadmapProps {
  selectedDayIndex: number;
  onSelectDay: (dayIndex: number) => void;
  todayIndex?: number;
}

export const WEEKLY_ROUTINES: RoutinePreset[] = [
  {
    id: "mon_push",
    dayShort: "MON",
    dayIndex: 0,
    splitTitle: "PUSH",
    subtitle: "Chest, Delts & Triceps",
    category: "hypertrophy",
    tag: "⚡ Hypertrophy",
    exercisesCount: 4,
    dateStr: "Nov 16",
    isToday: true,
  },
  {
    id: "tue_pull",
    dayShort: "TUE",
    dayIndex: 1,
    splitTitle: "PULL",
    subtitle: "Back, Rear Delts & Biceps",
    category: "strength",
    tag: "🏋️ Strength & Lats",
    exercisesCount: 4,
    dateStr: "Nov 17",
  },
  {
    id: "wed_rest",
    dayShort: "WED",
    dayIndex: 2,
    splitTitle: "REST",
    subtitle: "Mobility & Sauna Recovery",
    category: "rest",
    tag: "🧘 Active Recovery",
    exercisesCount: 0,
    dateStr: "Nov 18",
  },
  {
    id: "thu_legs",
    dayShort: "THU",
    dayIndex: 3,
    splitTitle: "LEGS",
    subtitle: "Quads, Hamstrings & Calves",
    category: "hypertrophy",
    tag: "⚡ Posterior Chain",
    exercisesCount: 3,
    dateStr: "Nov 19",
  },
  {
    id: "fri_upper",
    dayShort: "FRI",
    dayIndex: 4,
    splitTitle: "UPPER",
    subtitle: "Upper Body Power & Chest",
    category: "power",
    tag: "💥 Power Protocol",
    exercisesCount: 4,
    dateStr: "Nov 20",
  },
  {
    id: "sat_lower",
    dayShort: "SAT",
    dayIndex: 5,
    splitTitle: "LOWER",
    subtitle: "Hams, Glutes & Core Stiff",
    category: "hypertrophy",
    tag: "🥞 Hypertrophy V2",
    exercisesCount: 3,
    dateStr: "Nov 21",
  },
  {
    id: "sun_rest",
    dayShort: "SUN",
    dayIndex: 6,
    splitTitle: "REST",
    subtitle: "Deep Sleep & Carb Reload",
    category: "rest",
    tag: "🔋 System Reset",
    exercisesCount: 0,
    dateStr: "Nov 22",
  },
];

export function WeeklyRoutineRoadmap({
  selectedDayIndex,
  onSelectDay,
  todayIndex = 0,
}: WeeklyRoutineRoadmapProps) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5 select-none">
      {WEEKLY_ROUTINES.map((routine) => {
        const isSelected = selectedDayIndex === routine.dayIndex;
        const isToday = todayIndex === routine.dayIndex;
        const isRest = routine.category === "rest";

        let borderClass = "border border-white/10 hover:border-zinc-500 bg-[#0F131C]";
        let titleColor = "text-white";

        if (isSelected) {
          borderClass = isRest
            ? "border-2 border-cyan-400 bg-gradient-to-b from-cyan-950/40 via-[#0F131C] to-[#0F131C] shadow-[0_0_20px_rgba(0,240,255,0.25)]"
            : "border-2 border-amber-400 bg-gradient-to-b from-amber-500/20 via-[#0F131C] to-[#0F131C] shadow-[0_0_20px_rgba(245,158,11,0.25)]";
          titleColor = isRest ? "text-cyan-300" : "text-amber-400";
        } else if (isRest) {
          borderClass = "border border-white/5 bg-[#0A0D16]/70 opacity-85 hover:opacity-100 hover:border-cyan-500/40";
          titleColor = "text-cyan-400";
        }

        return (
          <div
            key={routine.id}
            onClick={() => onSelectDay(routine.dayIndex)}
            className={`rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] shadow-xl ${borderClass}`}
          >
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-mono font-bold tracking-wider text-zinc-300">
                  {routine.dayShort}
                </span>
                {isToday ? (
                  <span className="bg-amber-400 text-black text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase shadow-sm">
                    TODAY
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-500">
                    {isSelected ? "Active" : isRest ? "Recharge" : "Routine"}
                  </span>
                )}
              </div>

              <div className={`text-lg font-display font-extrabold tracking-wide mt-1 ${titleColor}`}>
                {routine.splitTitle}
              </div>

              <p className="text-xs text-zinc-400 font-medium mt-0.5 line-clamp-1">
                {routine.subtitle}
              </p>

              <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-mono bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-lg text-zinc-300">
                {routine.tag}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-white/10 flex justify-between items-center text-[10px] font-mono">
              <span className="text-zinc-500">{routine.dateStr}</span>
              <span className={isSelected ? "font-bold text-amber-300" : "text-zinc-400"}>
                {routine.exercisesCount > 0 ? `${routine.exercisesCount} Exercises` : "Regen Only"}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
