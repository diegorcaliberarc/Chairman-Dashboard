"use client";

import React, { useMemo } from "react";
import { CalendarEventItem } from "./MonthView";

interface FourDayViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  onSelectEvent: (event: CalendarEventItem) => void;
  onCreateEvent: (dateStr: string, timeStr: string) => void;
}

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

function computeColumnLayout(dayEvents: CalendarEventItem[], hourHeight: number) {
  const items = dayEvents.map((ev) => {
    const sDate = new Date(ev.start_time);
    const eDate = new Date(ev.end_time);
    const startMin = sDate.getHours() * 60 + sDate.getMinutes();
    let endMin = eDate.getHours() * 60 + eDate.getMinutes();
    if (endMin <= startMin) endMin = Math.min(1440, startMin + 30);
    const duration = Math.max(25, endMin - startMin);

    return {
      ev,
      sDate,
      eDate,
      startMin,
      endMin: startMin + duration,
      duration,
      col: 0,
      totalCols: 1,
    };
  });

  items.sort((a, b) => a.startMin - b.startMin || b.duration - a.duration);

  const clusters: (typeof items)[] = [];
  let curCluster: typeof items = [];
  let curClusterEnd = -1;

  for (const item of items) {
    if (curCluster.length === 0) {
      curCluster.push(item);
      curClusterEnd = item.endMin;
    } else if (item.startMin < curClusterEnd) {
      curCluster.push(item);
      curClusterEnd = Math.max(curClusterEnd, item.endMin);
    } else {
      clusters.push(curCluster);
      curCluster = [item];
      curClusterEnd = item.endMin;
    }
  }
  if (curCluster.length > 0) {
    clusters.push(curCluster);
  }

  for (const cluster of clusters) {
    const colEnds: number[] = [];
    for (const item of cluster) {
      let placedCol = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= item.startMin) {
          placedCol = c;
          colEnds[c] = item.endMin;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = colEnds.length;
        colEnds.push(item.endMin);
      }
      item.col = placedCol;
    }
    const totalCols = Math.max(1, colEnds.length);
    for (const item of cluster) {
      item.totalCols = totalCols;
    }
  }

  return items.map((item) => {
    const topPx = (item.startMin / 60) * hourHeight;
    const heightPx = (item.duration / 60) * hourHeight;
    const leftPct = (item.col / item.totalCols) * 100;
    const widthPct = (1 / item.totalCols) * 100;

    return {
      ...item,
      topPx,
      heightPx,
      leftPct,
      widthPct,
    };
  });
}

export function FourDayView({
  currentDate,
  events,
  onSelectEvent,
  onCreateEvent,
}: FourDayViewProps) {
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Denver";

  // Generate 4 consecutive days starting from currentDate
  const days = useMemo(() => {
    const list: { date: Date; dateStr: string; dayLabel: string; isToday: boolean }[] = [];
    const todayStr = getLocalDateString(new Date(), tz);

    for (let i = 0; i < 4; i++) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + i);
      const dStr = getLocalDateString(d, tz);
      list.push({
        date: d,
        dateStr: dStr,
        dayLabel: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
        isToday: dStr === todayStr,
      });
    }
    return list;
  }, [currentDate, tz]);

  // 24 hours (52px per hour)
  const HOUR_HEIGHT = 52;
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
    <div className="flex flex-col h-[780px] bg-[#0D0F17] border border-[#1E222D] rounded-xl overflow-hidden select-none">
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

      {/* 24-Hour Grid Scroll Area */}
      <div className="flex-1 overflow-y-auto grid grid-cols-12 relative scrollbar-thin scrollbar-thumb-zinc-800">
        {/* Left Hour Markers */}
        <div className="col-span-1 border-r border-[#1E222D] divide-y divide-[#181B26] text-[10px] text-zinc-500 text-right pr-2">
          {hours.map((h) => (
            <div key={h.hour} style={{ height: `${HOUR_HEIGHT}px` }} className="flex items-start justify-end pt-1">
              <span>{h.timeStr}</span>
            </div>
          ))}
        </div>

        {/* 4 Day Columns */}
        <div className="col-span-11 grid grid-cols-4 divide-x divide-[#1E222D] relative">
          {days.map((d) => {
            const dayEvents = events.filter((ev) => getLocalDateString(new Date(ev.start_time), tz) === d.dateStr);
            const positioned = computeColumnLayout(dayEvents, HOUR_HEIGHT);

            return (
              <div key={d.dateStr} className="relative divide-y divide-[#181B26]">
                {hours.map((h) => (
                  <div
                    key={h.hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    onClick={() => onCreateEvent(d.dateStr, h.timeStr)}
                    className="hover:bg-[#141624] transition cursor-pointer"
                  />
                ))}

                {/* Red Current Time Line if Today */}
                {d.isToday && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                    style={{ top: `${(currentMinutes / 60) * HOUR_HEIGHT}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  </div>
                )}

                {/* Day Events Positioned Side-by-Side Without Occlusion */}
                {positioned.map((item) => {
                  const { ev, sDate, topPx, heightPx, leftPct, widthPct } = item;

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
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        backgroundColor: `${ev.color_hex || "#3B82F6"}25`,
                        borderLeft: `3px solid ${ev.color_hex || "#3B82F6"}`,
                      }}
                      className="absolute rounded p-1.5 cursor-pointer z-10 overflow-hidden shadow-sm hover:brightness-125 transition flex flex-col justify-start"
                    >
                      <span className="text-[10.5px] font-semibold text-white truncate">
                        {ev.title}
                      </span>
                      <span className="text-[9px] text-zinc-300 font-mono">
                        {sDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
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
