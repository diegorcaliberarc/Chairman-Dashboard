"use client";

import React, { useMemo } from "react";
import { Clock, Calendar, Tag, ChevronRight } from "lucide-react";
import { CalendarEventItem } from "./MonthView";

interface ScheduleViewProps {
  events: CalendarEventItem[];
  onSelectEvent: (event: CalendarEventItem) => void;
  onCreateEvent: (dateStr: string) => void;
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

export function ScheduleView({ events, onSelectEvent, onCreateEvent }: ScheduleViewProps) {
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Denver";

  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, [events]);

  // Group events by local date string
  const groupedEvents = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const ev of sortedEvents) {
      const dStr = getLocalDateString(new Date(ev.start_time), tz);
      const arr = map.get(dStr) || [];
      arr.push(ev);
      map.set(dStr, arr);
    }
    return Array.from(map.entries()).map(([dateStr, items]) => ({
      dateStr,
      dateLabel: new Date(items[0].start_time).toLocaleDateString("en-US", {
        timeZone: tz,
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      items,
    }));
  }, [sortedEvents, tz]);

  if (groupedEvents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
        <Calendar className="w-12 h-12 mb-3 opacity-30" />
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">No Scheduled Events</h3>
        <p className="text-xs max-w-sm">
          No calendar events or mission milestones found. Create an event to begin scheduling your execution horizon.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-6 select-none">
      {groupedEvents.map((group) => (
        <div key={group.dateStr} className="space-y-3">
          {/* Date Header */}
          <div className="sticky top-0 bg-[#0D0F17]/90 backdrop-blur-sm py-1.5 border-b border-[#1E222D] flex items-center justify-between z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {group.dateLabel}
            </span>
            <button
              onClick={() => onCreateEvent(group.dateStr)}
              className="text-[11px] text-zinc-500 hover:text-white transition"
            >
              + Add Event
            </button>
          </div>

          {/* Events for this Date */}
          <div className="space-y-2">
            {group.items.map((ev) => {
              const s = new Date(ev.start_time);
              const e = new Date(ev.end_time);
              const timeRange = `${s.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })} – ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="p-3.5 bg-[#11131C] border border-[#1E222D] hover:border-blue-500/50 hover:bg-[#151825] rounded-xl flex items-center justify-between cursor-pointer transition shadow-sm group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.color_hex }}
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-blue-300 transition truncate">
                        {ev.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {timeRange}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{ev.category.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
