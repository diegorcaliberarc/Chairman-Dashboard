"use client";

import React, { useMemo } from "react";
import { CalendarEventItem } from "./MonthView";

interface FourDayViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  onSelectEvent: (event: CalendarEventItem) => void;
  onCreateEvent: (dateStr: string, timeStr: string) => void;
}

export function FourDayView({
  currentDate,
  events,
  onSelectEvent,
  onCreateEvent,
}: FourDayViewProps) {
  // Generate 4 consecutive days starting from currentDate
  const days = useMemo(() => {
    const list: { date: Date; dateStr: string; dayLabel: string; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    for (let i = 0; i < 4; i++) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().split("T")[0];
      list.push({
        date: d,
        dateStr: dStr,
        dayLabel: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
        isToday: dStr === todayStr,
      });
    }
    return list;
  }, [currentDate]);

  // 24 hours (48px per hour)
  const hours = useMemo(() => {
    const arr = [];
    for (let h = 0; h < 24; h++) {
      const timeStr = `${String(h).padStart(2, "0")}:00`;
      arr.push({ hour: h, timeStr });
    }
    return arr;
  }, []);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex flex-col h-full bg-[#0D0F17] border border-[#1E222D] rounded-xl overflow-hidden select-none">
      {/* Top Header of the 4 Days */}
      <div className="h-12 border-b border-[#1E222D] grid grid-cols-12 bg-[#11131C] text-xs font-semibold text-zinc-300">
        <div className="col-span-1 border-r border-[#1E222D] flex items-center justify-center text-[10px] text-zinc-500 uppercase">
          GMT-7
        </div>
        <div className="col-span-11 grid grid-cols-4 divide-x divide-[#1E222D]">
          {days.map((d) => (
            <div
              key={d.dateStr}
              className={`flex items-center justify-center gap-1.5 ${
                d.isToday ? "bg-blue-600/10 text-blue-400 font-bold" : ""
              }`}
            >
              <span>{d.dayLabel}</span>
              {d.isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 24-Hour Grid Scroll Area (48px per hour) */}
      <div className="flex-1 overflow-y-auto grid grid-cols-12 relative">
        {/* Left Hour Markers (48px high each) */}
        <div className="col-span-1 border-r border-[#1E222D] divide-y divide-[#181B26] text-[10px] text-zinc-500 text-right pr-2">
          {hours.map((h) => (
            <div key={h.hour} className="h-12 flex items-start justify-end pt-1">
              <span>{h.timeStr}</span>
            </div>
          ))}
        </div>

        {/* 4 Day Columns (48px per hour) */}
        <div className="col-span-11 grid grid-cols-4 divide-x divide-[#1E222D] relative">
          {days.map((d) => {
            const dayEvents = events.filter((ev) => ev.start_time.split("T")[0] === d.dateStr);

            return (
              <div key={d.dateStr} className="relative divide-y divide-[#181B26]">
                {hours.map((h) => (
                  <div
                    key={h.hour}
                    onClick={() => onCreateEvent(d.dateStr, h.timeStr)}
                    className="h-12 hover:bg-[#141624] transition cursor-pointer"
                  />
                ))}

                {/* Red Current Time Line if Today */}
                {d.isToday && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                    style={{ top: `${(currentMinutes / 60) * 48}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  </div>
                )}

                {/* Day Events Positioned Absolutely */}
                {dayEvents.map((ev) => {
                  const s = new Date(ev.start_time);
                  const e = new Date(ev.end_time);
                  const startMins = s.getHours() * 60 + s.getMinutes();
                  const endMins = e.getHours() * 60 + e.getMinutes();
                  const durationMins = Math.max(endMins - startMins, 25);
                  const topPx = (startMins / 60) * 48;
                  const heightPx = (durationMins / 60) * 48;

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        backgroundColor: `${ev.color_hex}25`,
                        borderLeft: `3px solid ${ev.color_hex}`,
                      }}
                      className="absolute left-1 right-1 rounded p-1.5 cursor-pointer z-10 overflow-hidden shadow-sm hover:brightness-110 transition flex flex-col justify-start"
                    >
                      <span className="text-[11px] font-semibold text-white truncate">
                        {ev.title}
                      </span>
                      <span className="text-[9px] text-zinc-300">
                        {s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
