"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface MiniMonthCalendarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  visibleCalendars: Record<string, boolean>;
  onToggleCalendar: (calKey: string) => void;
}

const CALENDAR_LIST = [
  { key: "work", label: "Work & Deep Focus", color: "#3B82F6" },
  { key: "workout", label: "Titan Workout Split", color: "#F59E0B" },
  { key: "personal", label: "Personal & Family", color: "#10B981" },
  { key: "pms_task", label: "Sovereign PMS", color: "#8B5CF6" },
  { key: "google_sync", label: "Google Calendar", color: "#EC4899" },
];

export function MiniMonthCalendar({
  currentDate,
  onSelectDate,
  visibleCalendars,
  onToggleCalendar,
}: MiniMonthCalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handlePrevMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() - 1);
    onSelectDate(next);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    onSelectDate(next);
  };

  const daysGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDaysCount = new Date(year, month, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

    // Prev month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDaysCount - i;
      days.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month - 1, d),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        isCurrentMonth: true,
        date: new Date(year, month, d),
      });
    }

    // Remaining slots to 35 or 42
    const total = Math.ceil(days.length / 7) * 7;
    const remaining = total - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month + 1, d),
      });
    }

    return days;
  }, [year, month]);

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDateStr = currentDate.toISOString().split("T")[0];

  return (
    <div className="w-[256px] min-w-[256px] h-full bg-[#11131C] border-r border-[#1E222D] flex flex-col p-4 select-none overflow-y-auto space-y-6">
      {/* Mini Month Navigator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-100">{monthLabel}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-zinc-500">
          <span>S</span>
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
        </div>

        {/* Mini Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {daysGrid.map((item, idx) => {
            const itemStr = item.date.toISOString().split("T")[0];
            const isSelected = itemStr === selectedDateStr;
            const isToday = itemStr === todayStr;

            return (
              <button
                key={idx}
                onClick={() => onSelectDate(item.date)}
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] font-medium transition ${
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30"
                    : isToday
                    ? "border border-blue-400 text-blue-400"
                    : item.isCurrentMonth
                    ? "text-zinc-200 hover:bg-[#1A1D2A]"
                    : "text-zinc-600 hover:bg-[#181B26]"
                }`}
              >
                {item.day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[#1E222D]" />

      {/* My Calendars Filter Toggles */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
          My Calendars
        </span>

        <div className="space-y-1.5">
          {CALENDAR_LIST.map((cal) => {
            const isVisible = visibleCalendars[cal.key] !== false;

            return (
              <div
                key={cal.key}
                onClick={() => onToggleCalendar(cal.key)}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#181B26] cursor-pointer text-xs transition"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center transition"
                    style={{
                      backgroundColor: isVisible ? cal.color : "transparent",
                      borderColor: cal.color,
                    }}
                  >
                    {isVisible && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className={isVisible ? "text-zinc-200" : "text-zinc-500"}>
                    {cal.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
