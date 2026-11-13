"use client";

import React, { useMemo } from "react";
import { Plus, Clock } from "lucide-react";

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  category: "work" | "workout" | "personal" | "pms_task" | "google_sync";
  color_hex: string;
}

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  onSelectDate: (dateStr: string) => void;
  onSelectEvent: (event: CalendarEventItem) => void;
  onCreateEvent: (dateStr: string) => void;
}

export function MonthView({
  currentDate,
  events,
  onSelectDate,
  onSelectEvent,
  onCreateEvent,
}: MonthViewProps) {
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Previous month filler
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
      });
    }

    // Next month filler
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const nextDays = totalCells - cells.length;
    for (let d = 1; d <= nextDays; d++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dayNum: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    return cells;
  }, [currentDate]);

  // Index events by dateStr (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    for (const ev of events) {
      const dt = ev.start_time.split("T")[0];
      if (!map[dt]) map[dt] = [];
      map[dt].push(ev);
    }
    return map;
  }, [events]);

  return (
    <div className="w-full rounded-2xl bg-[#090A0F] border border-white/[0.08] overflow-hidden flex flex-col">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 border-b border-white/[0.08] bg-[#111214]">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-[11px] font-mono font-bold tracking-wider text-zinc-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 7-Column Day Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-white/[0.05] bg-[#090A0F]">
        {calendarGrid.map((cell) => {
          const dayEvents = eventsByDate[cell.dateStr] || [];

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[115px] p-2 flex flex-col justify-between group transition-colors cursor-pointer ${
                cell.isCurrentMonth
                  ? "bg-[#090A0F] hover:bg-[#111214]"
                  : "bg-black/40 text-zinc-600 hover:bg-black/60"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    cell.isToday
                      ? "bg-[#0969DA] text-white shadow-[0_0_10px_rgba(9,105,218,0.5)]"
                      : cell.isCurrentMonth
                      ? "text-zinc-200"
                      : "text-zinc-600"
                  }`}
                >
                  {cell.dayNum}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEvent(cell.dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-opacity"
                  title="Add Event"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Event Pills */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(ev);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold truncate flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
                    style={{
                      backgroundColor: `${ev.color_hex}22`,
                      borderColor: `${ev.color_hex}44`,
                      borderWidth: "1px",
                      color: "#E2F1FF",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ev.color_hex }}
                    />
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-[9.5px] font-mono text-zinc-500 pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

