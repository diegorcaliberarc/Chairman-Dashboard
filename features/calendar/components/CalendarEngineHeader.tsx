"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Orbit,
  Plus,
  RefreshCw,
} from "lucide-react";
import { DayMode, HorizonLevel } from "@/lib/temporalTypes";
import { HorizonNavigationControl } from "@/components/temporal/HorizonNavigationControl";

export type CalendarEngineMode = "solar" | "google";
export type GoogleCalendarViewMode = "day" | "four_day" | "month" | "year" | "schedule";

interface CalendarEngineHeaderProps {
  engineMode: CalendarEngineMode;
  onSelectEngineMode: (mode: CalendarEngineMode) => void;
  selectedDate: string;
  googleDateLabel: string;
  googleViewMode: GoogleCalendarViewMode;
  onSelectGoogleViewMode: (view: GoogleCalendarViewMode) => void;
  onToggleMiniDrawer: () => void;
  onToday: () => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  activeHorizon: HorizonLevel;
  onSelectHorizon: (horizon: HorizonLevel) => void;
  dayMode: DayMode;
  onSelectDayMode: (mode: DayMode) => void;
  onAddSolarBlock: () => void;
  onCreateGoogleEvent: () => void;
  isSyncingGCal: boolean;
  onTriggerSync: () => void;
}

const GOOGLE_VIEW_OPTIONS: Array<{
  id: GoogleCalendarViewMode;
  label: string;
  shortcut: string;
}> = [
  { id: "day", label: "Day", shortcut: "D" },
  { id: "four_day", label: "4 Days", shortcut: "X" },
  { id: "month", label: "Month", shortcut: "M" },
  { id: "year", label: "Year", shortcut: "Y" },
  { id: "schedule", label: "Schedule", shortcut: "A" },
];

export function CalendarEngineHeader({
  engineMode,
  onSelectEngineMode,
  selectedDate,
  googleDateLabel,
  googleViewMode,
  onSelectGoogleViewMode,
  onToggleMiniDrawer,
  onToday,
  onPrevDate,
  onNextDate,
  activeHorizon,
  onSelectHorizon,
  dayMode,
  onSelectDayMode,
  onAddSolarBlock,
  onCreateGoogleEvent,
  isSyncingGCal,
  onTriggerSync,
}: CalendarEngineHeaderProps) {
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  return (
    <header
      className="min-h-14 py-2 px-4 sm:px-5 border-b flex flex-wrap items-center justify-between gap-y-2 gap-x-3 z-20 sticky top-0 backdrop-blur-xl transition-colors"
      style={{
        backgroundColor: "var(--glass-surface)",
        borderColor: "var(--glass-border)",
      }}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <div
          className="flex items-center border rounded-xl p-1 shrink-0"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
          }}
        >
          <button
            type="button"
            data-testid="calendar-engine-solar"
            onClick={() => onSelectEngineMode("solar")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              engineMode === "solar"
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 shadow-sm"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Circadian Solar Arc</span>
          </button>

          <button
            type="button"
            data-testid="calendar-engine-google"
            onClick={() => onSelectEngineMode("google")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              engineMode === "google"
                ? "bg-[#4984fd]/20 text-[#4984fd] border border-[#4984fd]/40 shadow-sm"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#4984fd] shrink-0" />
            <span>Google Calendar Grid</span>
          </button>
        </div>

        <span
          data-testid="calendar-active-date"
          data-active-date={selectedDate}
          className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-mono whitespace-nowrap shrink-0"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
            color: "var(--glass-text-muted)",
          }}
        >
          {selectedDate}
        </span>

        {engineMode === "google" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMiniDrawer}
              title="Toggle Mini-Month Sidebar"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              type="button"
              data-testid="calendar-today-btn"
              onClick={onToday}
              className="px-3 py-1 rounded-lg border border-[#262B3D] text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#1C2030] transition"
            >
              Today
            </button>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                data-testid="calendar-prev-btn"
                onClick={onPrevDate}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-testid="calendar-next-btn"
                onClick={onNextDate}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-sm font-bold text-white tracking-tight ml-1">
              {googleDateLabel}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {engineMode === "solar" ? (
          <div className="flex items-center gap-3">
            <HorizonNavigationControl
              activeHorizon={activeHorizon}
              onSelectHorizon={onSelectHorizon}
              dayMode={dayMode}
              onSelectDayMode={onSelectDayMode}
            />

            <button
              type="button"
              data-testid="calendar-add-solar-block-btn"
              onClick={onAddSolarBlock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold tracking-wider uppercase whitespace-nowrap shrink-0 shadow-[0_0_20px_rgba(251,191,36,0.28)] hover:brightness-110 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Block</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="calendar-sync-gcal-btn"
              onClick={onTriggerSync}
              disabled={isSyncingGCal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141724] border border-[#222738] hover:border-blue-500/50 text-xs transition"
              title="Click to trigger instant Google Calendar sync"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-blue-400 ${isSyncingGCal ? "animate-spin" : ""}`}
              />
              <span className="text-[11px] font-medium text-zinc-300">
                {isSyncingGCal ? "Syncing..." : "Synced with Google Calendar"}
              </span>
            </button>

            <div className="relative">
              <button
                type="button"
                data-testid="calendar-google-view-dropdown"
                onClick={() => setShowViewDropdown((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141724] border border-[#222738] text-xs font-semibold text-zinc-200 hover:text-white transition shadow-sm"
              >
                <span className="capitalize">
                  {googleViewMode === "four_day"
                    ? "4 Days (X)"
                    : `${googleViewMode} (${googleViewMode.charAt(0).toUpperCase()})`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {showViewDropdown && (
                <div className="absolute right-0 top-10 w-44 bg-[#141724] border border-[#282E42] rounded-xl shadow-2xl py-1.5 z-50 text-xs text-zinc-200">
                  {GOOGLE_VIEW_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`calendar-google-view-${opt.id}`}
                      onClick={() => {
                        onSelectGoogleViewMode(opt.id);
                        setShowViewDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                        googleViewMode === opt.id ? "text-blue-400 font-semibold" : ""
                      }`}
                    >
                      <span>{opt.label}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                        {opt.shortcut}
                      </kbd>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              data-testid="calendar-create-google-event-btn"
              onClick={onCreateGoogleEvent}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
