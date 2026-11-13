"use client";

import React, { useMemo } from "react";
import { Clock } from "lucide-react";
import { CalendarEventItem } from "./MonthView";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  onSelectDate: (dateStr: string) => void;
  onSelectEvent: (event: CalendarEventItem) => void;
  onCreateEvent: (dateStr: string, timeStr?: string) => void;
}

export function WeekView({
  currentDate,
  events,
  onSelectDate,
  onSelectEvent,
  onCreateEvent,
}: WeekViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Compute 7 days of the week containing currentDate
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayIndex = curr.getDay(); // 0 is Sun
    const firstDay = new Date(curr);
    firstDay.setDate(curr.getDate() - dayIndex);

    const days = [];
    const todayStr = new Date().toISOString().split("T")[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDay);
      d.setDate(firstDay.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

      days.push({
        date: d,
        dateStr,
        dayName,
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [currentDate]);

  // Map events to dates
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    for (const ev of events) {
      const dt = ev.start_time.split("T")[0];
      if (!map[dt]) map[dt] = [];
      map[dt].push(ev);
    }
    return map;
  }, [events]);

  const HOUR_HEIGHT = 60; // 60px per hour => 1px per minute

  return (
    <div className="flex flex-col h-[750px] bg-[#090A0F] border border-[#1A1D24] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header Row: 7 Days */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#1A1D24] bg-[#111214]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="py-3 text-center text-[10px] font-mono text-zinc-500 border-r border-[#1A1D24]">
          TIME
        </div>
        {weekDays.map((col) => (
          <div
            key={col.dateStr}
            onClick={() => onSelectDate(col.dateStr)}
            className={`py-2.5 px-2 text-center border-r border-[#1A1D24] last:border-r-0 cursor-pointer transition-colors ${
              col.isToday
                ? "bg-[#0969DA]/10"
                : "hover:bg-white/[0.02]"
            }`}
          >
            <div className={`text-[10px] font-semibold tracking-wider ${col.isToday ? "text-[#58A6FF]" : "text-zinc-400"}`}>
              {col.dayName}
            </div>
            <div
              className={`inline-flex items-center justify-center w-7 h-7 mt-0.5 rounded-full text-xs font-bold transition-all ${
                col.isToday
                  ? "bg-[#0969DA] text-white shadow-md shadow-[#0969DA]/40 ring-2 ring-[#58A6FF]/40"
                  : "text-zinc-200"
              }`}
            >
              {col.dayNum}
            </div>
          </div>
        ))}
      </div>

      {/* 24-Hour Scrollable Grid */}
      <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="relative grid grid-cols-[60px_repeat(7,1fr)] min-w-[700px]">
          {/* Time Gutter */}
          <div className="border-r border-[#1A1D24] bg-[#0E1015]/60 select-none">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-[#1A1D24]/40 pr-2 pt-1 text-right font-mono text-[10px] text-zinc-500"
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 7 Columns for Days */}
          {weekDays.map((col) => {
            const dayEvents = eventsByDate[col.dateStr] || [];

            return (
              <div
                key={col.dateStr}
                className="relative border-r border-[#1A1D24] last:border-r-0 hover:bg-white/[0.01] transition-colors"
                style={{ height: `${24 * HOUR_HEIGHT}px` }}
              >
                {/* Hourly Horizontal Background Lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    onClick={() => onCreateEvent(col.dateStr, `${String(h).padStart(2, "0")}:00`)}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-[#1A1D24]/40 hover:bg-[#0969DA]/5 cursor-pointer transition-colors"
                  />
                ))}

                {/* Current Time Indicator Red Line */}
                {col.isToday && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                    style={{ top: `${currentMinutes}px` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1 ring-2 ring-rose-400/50 shadow-md shadow-rose-500/50" />
                    <div className="flex-1 border-t-2 border-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  </div>
                )}

                {/* Render Events */}
                {dayEvents.map((ev) => {
                  const sDate = new Date(ev.start_time);
                  const eDate = new Date(ev.end_time);
                  const startMin = sDate.getHours() * 60 + sDate.getMinutes();
                  const endMin = eDate.getHours() * 60 + eDate.getMinutes();
                  const duration = Math.max(25, endMin - startMin);

                  const topPx = startMin;
                  const heightPx = duration;

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
                        borderColor: `${ev.color_hex || "#0969DA"}60`,
                        backgroundColor: `${ev.color_hex || "#0969DA"}22`,
                      }}
                      className="absolute inset-x-1 rounded-lg border p-1.5 cursor-pointer hover:brightness-125 transition-all overflow-hidden shadow-lg backdrop-blur-sm group z-10"
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: ev.color_hex || "#0969DA" }}
                        />
                        <span className="text-[11px] font-bold text-zinc-100 truncate group-hover:text-white">
                          {ev.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] font-mono text-zinc-400 mt-0.5">
                        <Clock size={10} className="shrink-0" />
                        <span>
                          {String(sDate.getHours()).padStart(2, "0")}:{String(sDate.getMinutes()).padStart(2, "0")} - {String(eDate.getHours()).padStart(2, "0")}:{String(eDate.getMinutes()).padStart(2, "0")}
                        </span>
                      </div>
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

