"use client";

import React, { useMemo } from "react";
import { CalendarEventItem } from "./MonthView";

interface YearViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  onSelectDate: (date: Date) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

function getLocalDateString(d: Date, tz = "America/Denver"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  } catch {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
}

export function YearView({ currentDate, events, onSelectDate }: YearViewProps) {
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Denver";
  const year = currentDate.getFullYear();
  const todayStr = getLocalDateString(new Date(), tz);

  // Map events count by local dateStr "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      const dStr = getLocalDateString(new Date(ev.start_time), tz);
      map.set(dStr, (map.get(dStr) || 0) + 1);
    }
    return map;
  }, [events, tz]);

  return (
    <div className="h-full overflow-y-auto p-4 select-none">
      <div className="grid grid-cols-4 gap-4">
        {MONTH_NAMES.map((monthName, monthIdx) => {
          const firstDay = new Date(year, monthIdx, 1).getDay();
          const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
          const cells = [];

          // Empty prefix slots
          for (let i = 0; i < firstDay; i++) {
            cells.push(null);
          }
          // Month days
          for (let d = 1; d <= daysInMonth; d++) {
            cells.push(d);
          }

          return (
            <div
              key={monthName}
              className="p-3 bg-[#11131C] border border-[#1E222D] rounded-xl flex flex-col space-y-2 hover:border-[#2B3144] transition"
            >
              <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                {monthName}
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-[9px] font-semibold text-zinc-500">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-[10px]">
                {cells.map((dayNum, idx) => {
                  if (!dayNum) {
                    return <div key={idx} className="w-5 h-5" />;
                  }

                  const dStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const isToday = dStr === todayStr;
                  const hasEvents = (eventsByDate.get(dStr) || 0) > 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectDate(new Date(year, monthIdx, dayNum))}
                      className={`w-5 h-5 mx-auto rounded-full flex flex-col items-center justify-center transition relative ${
                        isToday
                          ? "bg-blue-600 text-white font-bold"
                          : "text-zinc-300 hover:bg-[#1E2232] hover:text-white"
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasEvents && !isToday && (
                        <span className="w-1 h-1 rounded-full bg-blue-400 absolute bottom-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
