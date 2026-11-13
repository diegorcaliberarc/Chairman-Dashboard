"use client";

import React from "react";
import { HorizonLevel, DayMode } from "@/lib/temporalTypes";
import {
  Calendar,
  Compass,
  Layers,
  Orbit,
  MapPin,
  CalendarDays,
  CalendarRange,
  ChevronRight,
} from "lucide-react";

interface HorizonNavigationControlProps {
  activeHorizon: HorizonLevel;
  onSelectHorizon: (h: HorizonLevel) => void;
  dayMode: DayMode;
  onSelectDayMode: (m: DayMode) => void;
}

export function HorizonNavigationControl({
  activeHorizon,
  onSelectHorizon,
  dayMode,
  onSelectDayMode,
}: HorizonNavigationControlProps) {
  const horizons: { id: HorizonLevel; label: string; icon: React.ReactNode }[] = [
    { id: "DAY", label: "DAY", icon: <Orbit size={13} /> },
    { id: "WEEK", label: "WEEK", icon: <CalendarDays size={13} /> },
    { id: "MONTH", label: "MONTH", icon: <CalendarRange size={13} /> },
    { id: "YEAR", label: "YEAR", icon: <Calendar size={13} /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 4-Tier Horizon Selector */}
      <div className="flex items-center bg-[#101422] border border-white/10 rounded-2xl p-1 shadow-lg">
        {horizons.map((h) => {
          const isActive = activeHorizon === h.id;
          return (
            <button
              key={h.id}
              onClick={() => onSelectHorizon(h.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all ${
                isActive
                  ? "bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.35)] scale-[1.02]"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {h.icon}
              <span>{h.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dual Mode Switch for Day Horizon: Solar Wheel vs 3D Map */}
      {activeHorizon === "DAY" && (
        <div className="flex items-center bg-[#101422] border border-white/10 rounded-2xl p-1 shadow-lg">
          <button
            onClick={() => onSelectDayMode("SOLAR_WHEEL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              dayMode === "SOLAR_WHEEL"
                ? "bg-white/15 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Orbit size={13} className="text-amber-400" />
            <span>Solar Wheel</span>
          </button>

          <button
            onClick={() => onSelectDayMode("GEOSPATIAL_3D")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              dayMode === "GEOSPATIAL_3D"
                ? "bg-sky-500/20 text-sky-200 shadow-sm border border-sky-400/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Compass size={13} className="text-sky-400" />
            <span>3D Tactical Map</span>
          </button>
        </div>
      )}
    </div>
  );
}

