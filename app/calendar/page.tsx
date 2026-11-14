"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Columns3,
  CalendarDays,
  ListOrdered,
  Grid,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MonthView, CalendarEventItem } from "@/components/calendar/MonthView";
import { DayView } from "@/components/calendar/DayView";
import { FourDayView } from "@/components/calendar/FourDayView";
import { YearView } from "@/components/calendar/YearView";
import { ScheduleView } from "@/components/calendar/ScheduleView";
import { MiniMonthCalendar } from "@/components/calendar/MiniMonthCalendar";
import { CalendarQuickPopover } from "@/components/calendar/CalendarQuickPopover";
import { CalendarEventModal } from "@/components/calendar/CalendarEventModal";

type CalendarViewMode = "day" | "four_day" | "month" | "year" | "schedule";

export default function SovereignCalendarPage() {
  // Navigation Date & View States
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [isMiniDrawerOpen, setIsMiniDrawerOpen] = useState(true);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Events & Loading
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"connected" | "disconnected">("connected");

  // Filter Visibility
  const [visibleCalendars, setVisibleCalendars] = useState<Record<string, boolean>>({
    work: true,
    workout: true,
    personal: true,
    pms_task: true,
    google_sync: true,
  });

  // Modals & Popovers
  const [quickPopoverEvent, setQuickPopoverEvent] = useState<CalendarEventItem | null>(null);
  const [fullEditorEvent, setFullEditorEvent] = useState<CalendarEventItem | null>(null);
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
  const [editorInitialDate, setEditorInitialDate] = useState<string>("");
  const [editorInitialTime, setEditorInitialTime] = useState<string>("09:00");

  // Load Events from /api/calendar-events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar-events", { cache: "no-store" });
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        const mapped: CalendarEventItem[] = data.events.map((ev: any) => ({
          id: ev.id,
          title: ev.title,
          description: ev.description,
          start_time: ev.start_time,
          end_time: ev.end_time,
          all_day: ev.all_day,
          category: ev.category || "work",
          color_hex: ev.color_hex || "#3B82F6",
        }));
        setEvents(mapped);
      }
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Keyboard Shortcuts (D, X, M, Y, A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "d") setViewMode("day");
      if (key === "x") setViewMode("four_day");
      if (key === "m") setViewMode("month");
      if (key === "y") setViewMode("year");
      if (key === "a") setViewMode("schedule");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered Events based on My Calendars toggles
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => visibleCalendars[ev.category] !== false);
  }, [events, visibleCalendars]);

  // Steppers Navigation
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() - 1);
    else if (viewMode === "four_day") next.setDate(next.getDate() - 4);
    else if (viewMode === "month") next.setMonth(next.getMonth() - 1);
    else if (viewMode === "year") next.setFullYear(next.getFullYear() - 1);
    else next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() + 1);
    else if (viewMode === "four_day") next.setDate(next.getDate() + 4);
    else if (viewMode === "month") next.setMonth(next.getMonth() + 1);
    else if (viewMode === "year") next.setFullYear(next.getFullYear() + 1);
    else next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Label for Top Toolbar
  const toolbarDateLabel = useMemo(() => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (viewMode === "four_day") {
      const end = new Date(currentDate);
      end.setDate(end.getDate() + 3);
      return `${currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} – ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    if (viewMode === "year") {
      return String(currentDate.getFullYear());
    }
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate, viewMode]);

  // Quick Popover & Full Editor Triggers
  const handleSelectEvent = (event: CalendarEventItem) => {
    setQuickPopoverEvent(event);
  };

  const handleOpenCreateAtDate = (dateStr: string, timeStr = "09:00") => {
    setEditorInitialDate(dateStr);
    setEditorInitialTime(timeStr);
    setFullEditorEvent(null);
    setIsFullEditorOpen(true);
  };

  const handleEditFull = (event: CalendarEventItem) => {
    setQuickPopoverEvent(null);
    setFullEditorEvent(event);
    setIsFullEditorOpen(true);
  };

  // Quick Save Event
  const handleQuickSave = async (eventId: string, patch: Partial<CalendarEventItem>) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, ...patch } : ev))
    );
    await fetch(`/api/calendar-events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  // Full Save Event
  const handleFullSave = async (eventData: Partial<CalendarEventItem>) => {
    if (fullEditorEvent) {
      // Update
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === fullEditorEvent.id ? { ...ev, ...eventData } : ev
        )
      );
      await fetch(`/api/calendar-events/${fullEditorEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
    } else {
      // Create
      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (data.event) {
        setEvents((prev) => [...prev, data.event]);
      }
    }
    setIsFullEditorOpen(false);
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    await fetch(`/api/calendar-events/${eventId}`, {
      method: "DELETE",
    });
  };

  // Manual Trigger for Google Calendar Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/integrations/google-calendar/sync", { method: "POST" });
      await loadEvents();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090A0F] font-sans text-zinc-100 select-none">
      {/* Chairman Dashboard Sidebar */}
      <Sidebar />

      {/* Main Calendar View Area */}
      <div className="flex-1 flex flex-col h-full bg-[#0D0F17] overflow-hidden">
        {/* TOP TOOLBAR: 56px Height */}
        <header className="h-14 px-4 border-b border-[#1E222D] flex items-center justify-between bg-[#11131C] z-20">
          {/* Left: Drawer Toggle & Date Stepper */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMiniDrawerOpen((prev) => !prev)}
              title="Toggle Mini-Month Sidebar"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Today Button */}
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-lg border border-[#262B3D] text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#1C2030] transition shadow-sm"
            >
              Today
            </button>

            {/* Stepper Chevrons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month / Year Label */}
            <h1 className="text-base font-bold text-white tracking-tight">
              {toolbarDateLabel}
            </h1>
          </div>

          {/* Right: Sync Status & View Switcher & Create Button */}
          <div className="flex items-center gap-3">
            {/* Google Sync Status Pill */}
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141724] border border-[#222738] hover:border-blue-500/50 text-xs transition"
              title="Click to trigger instant Google Calendar sync"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-blue-400 ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
              <span className="text-[11px] font-medium text-zinc-300">
                {isSyncing ? "Syncing..." : "Synced with Google Calendar"}
              </span>
            </button>

            {/* View Switcher Dropdown (Day D, 4-Days X, Month M, Year Y, Schedule A) */}
            <div className="relative">
              <button
                onClick={() => setShowViewDropdown((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141724] border border-[#222738] text-xs font-semibold text-zinc-200 hover:text-white transition shadow-sm"
              >
                <span className="capitalize">
                  {viewMode === "four_day"
                    ? "4 Days (X)"
                    : `${viewMode} (${viewMode.charAt(0).toUpperCase()})`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {showViewDropdown && (
                <div className="absolute right-0 top-10 w-44 bg-[#141724] border border-[#282E42] rounded-xl shadow-2xl py-1.5 z-50 text-xs text-zinc-200">
                  <button
                    onClick={() => {
                      setViewMode("day");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                      viewMode === "day" ? "text-blue-400 font-semibold" : ""
                    }`}
                  >
                    <span>Day</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                      D
                    </kbd>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode("four_day");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                      viewMode === "four_day" ? "text-blue-400 font-semibold" : ""
                    }`}
                  >
                    <span>4 Days</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                      X
                    </kbd>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode("month");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                      viewMode === "month" ? "text-blue-400 font-semibold" : ""
                    }`}
                  >
                    <span>Month</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                      M
                    </kbd>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode("year");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                      viewMode === "year" ? "text-blue-400 font-semibold" : ""
                    }`}
                  >
                    <span>Year</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                      Y
                    </kbd>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode("schedule");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[#202538] flex items-center justify-between ${
                      viewMode === "schedule" ? "text-blue-400 font-semibold" : ""
                    }`}
                  >
                    <span>Schedule</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F17] text-[10px] text-zinc-400">
                      A
                    </kbd>
                  </button>
                </div>
              )}
            </div>

            {/* + Create Button */}
            <button
              onClick={() => handleOpenCreateAtDate(new Date().toISOString().split("T")[0])}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
          </div>
        </header>

        {/* Body Container: Collapsible Mini-Drawer (256px) + Calendar Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsible Mini-Month Drawer */}
          {isMiniDrawerOpen && (
            <MiniMonthCalendar
              currentDate={currentDate}
              onSelectDate={(d) => setCurrentDate(d)}
              visibleCalendars={visibleCalendars}
              onToggleCalendar={(key) =>
                setVisibleCalendars((prev) => ({
                  ...prev,
                  [key]: prev[key] === false ? true : false,
                }))
              }
            />
          )}

          {/* Main 5-Mode Calendar Canvas */}
          <main className="flex-1 overflow-hidden p-4">
            {viewMode === "month" && (
              <MonthView
                currentDate={currentDate}
                events={filteredEvents}
                onSelectDate={(dStr) => {
                  setCurrentDate(new Date(dStr));
                  setViewMode("day");
                }}
                onSelectEvent={handleSelectEvent}
                onCreateEvent={(dStr) => handleOpenCreateAtDate(dStr)}
              />
            )}

            {viewMode === "day" && (
              <DayView
                currentDate={currentDate}
                events={filteredEvents}
                onSelectEvent={handleSelectEvent}
                onCreateEvent={(tStr) =>
                  handleOpenCreateAtDate(currentDate.toISOString().split("T")[0], tStr)
                }
              />
            )}

            {viewMode === "four_day" && (
              <FourDayView
                currentDate={currentDate}
                events={filteredEvents}
                onSelectEvent={handleSelectEvent}
                onCreateEvent={(dStr, tStr) => handleOpenCreateAtDate(dStr, tStr)}
              />
            )}

            {viewMode === "year" && (
              <YearView
                currentDate={currentDate}
                events={filteredEvents}
                onSelectDate={(d) => {
                  setCurrentDate(d);
                  setViewMode("day");
                }}
              />
            )}

            {viewMode === "schedule" && (
              <ScheduleView
                events={filteredEvents}
                onSelectEvent={handleSelectEvent}
                onCreateEvent={(dStr) => handleOpenCreateAtDate(dStr)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Quick Popover Card (420px Width) */}
      <CalendarQuickPopover
        event={quickPopoverEvent}
        isOpen={!!quickPopoverEvent}
        onClose={() => setQuickPopoverEvent(null)}
        onEditFull={handleEditFull}
        onSaveQuick={handleQuickSave}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* Full Event Editor Modal */}
      <CalendarEventModal
        isOpen={isFullEditorOpen}
        onClose={() => setIsFullEditorOpen(false)}
        event={fullEditorEvent}
        initialDate={editorInitialDate}
        initialTime={editorInitialTime}
        onSave={handleFullSave}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
