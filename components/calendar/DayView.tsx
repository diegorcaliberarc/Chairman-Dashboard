"use client";

import React, { useMemo } from "react";
import { Clock, Plus, Tag } from "lucide-react";
import { CalendarEventItem } from "./MonthView";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  onSelectEvent: (event: CalendarEventItem) => void;
  onCreateEvent: (timeStr: string) => void;
}

export function DayView({
  currentDate,
  events,
  onSelectEvent,
  onCreateEvent,
}: DayViewProps) {
  const intervals = useMemo(() => {
    // 48 intervals of 30 mins each
    const list = [];
    for (let i = 0; i < 48; i++) {
      const h = Math.floor(i / 2);
      const m = (i % 2) * 30;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      list.push({ index: i, hour: h, minute: m, timeStr });
    }
    return list;
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currDateStr = currentDate.toISOString().split("T")[0];
  const isToday = currDateStr === todayStr;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Filter events belonging to current date
  const dayEvents = useMemo(() => {
    return events.filter((ev) => ev.start_time.split("T")[0] === currDateStr);
  }, [events, currDateStr]);

  const INTERVAL_HEIGHT = 38; // 38px per 30 minutes => 1.266px per minute

  return (
    <div className="flex flex-col h-[750px] bg-[#090A0F] border border-[#1A1D24] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Day Header Banner */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1D24] bg-[#111214]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0969DA]/15 border border-[#0969DA]/30 flex items-center justify-center text-[#58A6FF] font-bold text-lg">
            {currentDate.getDate()}
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
              {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
            </h2>
            <p className="text-xs text-zinc-400">
              {currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          {dayEvents.length} {dayEvents.length === 1 ? "Event" : "Events"} Scheduled
        </div>
      </div>

      {/* 24-Hour (30-min interval) Timeline */}
      <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="relative min-w-[500px]">
          {/* Time Rows */}
          {intervals.map((slot) => {
            const isHourMark = slot.minute === 0;

            return (
              <div
                key={slot.timeStr}
                onClick={() => onCreateEvent(slot.timeStr)}
                style={{ height: `${INTERVAL_HEIGHT}px` }}
                className={`group flex items-center border-b border-[#1A1D24]/40 hover:bg-[#0969DA]/5 cursor-pointer transition-colors ${
                  isHourMark ? "bg-[#0E1015]/40" : ""
                }`}
              >
                {/* Time label */}
                <div className="w-20 pl-4 pr-3 shrink-0 text-right font-mono text-[11px] text-zinc-500 border-r border-[#1A1D24]">
                  {isHourMark ? slot.timeStr : ""}
                </div>

                {/* Hover Quick Add indicator */}
                <div className="flex-1 px-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] text-[#58A6FF] font-medium flex items-center gap-1.5">
                    <Plus size={12} /> Add event at {slot.timeStr}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Current Time Indicator Red Line */}
          {isToday && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${(currentMinutes / 30) * INTERVAL_HEIGHT}px` }}
            >
              <div className="w-20 pl-2 text-right">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-white shadow-md">
                  {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
                </span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1 ring-2 ring-rose-400/50 shadow-md shadow-rose-500/50" />
              <div className="flex-1 border-t-2 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            </div>
          )}

          {/* Absolute Overlaid Event Blocks */}
          <div className="absolute top-0 bottom-0 left-20 right-4 pointer-events-none">
            {dayEvents.map((ev) => {
              const sDate = new Date(ev.start_time);
              const eDate = new Date(ev.end_time);
              const startMin = sDate.getHours() * 60 + sDate.getMinutes();
              const endMin = eDate.getHours() * 60 + eDate.getMinutes();
              const duration = Math.max(30, endMin - startMin);

              const topPx = (startMin / 30) * INTERVAL_HEIGHT;
              const heightPx = (duration / 30) * INTERVAL_HEIGHT;

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
                  className="pointer-events-auto absolute inset-x-2 rounded-xl border p-3 cursor-pointer hover:brightness-125 transition-all overflow-hidden shadow-xl backdrop-blur-md group z-10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ev.color_hex || "#0969DA" }}
                        />
                        <h3 className="text-xs font-bold text-zinc-100 truncate group-hover:text-white">
                          {ev.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider bg-black/40 border border-white/10 text-zinc-300">
                        {ev.category}
                      </span>
                    </div>

                    {ev.description && (
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-2">
                    <Clock size={11} className="text-[#58A6FF]" />
                    <span>
                      {String(sDate.getHours()).padStart(2, "0")}:{String(sDate.getMinutes()).padStart(2, "0")} - {String(eDate.getHours()).padStart(2, "0")}:{String(eDate.getMinutes()).padStart(2, "0")}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span>{duration}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

