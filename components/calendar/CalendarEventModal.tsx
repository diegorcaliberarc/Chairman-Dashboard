"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, Tag, Trash2, Check, Sparkles } from "lucide-react";
import { CalendarEventItem } from "./MonthView";

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEventItem | null;
  initialDate?: string;
  initialTime?: string;
  onSave: (eventData: Partial<CalendarEventItem>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  { value: "work", label: "Work & Deep Focus", color: "#0969DA" },
  { value: "workout", label: "Titan Workout Split", color: "#F59E0B" },
  { value: "personal", label: "Personal & Family", color: "#10B981" },
  { value: "pms_task", label: "PMS Task Commitment", color: "#8B5CF6" },
  { value: "google_sync", label: "Google Calendar Sync", color: "#EC4899" },
];

export function CalendarEventModal({
  isOpen,
  onClose,
  event,
  initialDate,
  initialTime,
  onSave,
  onDelete,
}: CalendarEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [category, setCategory] = useState<CalendarEventItem["category"]>("work");
  const [colorHex, setColorHex] = useState("#0969DA");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      const s = new Date(event.start_time);
      const e = new Date(event.end_time);
      setDateStr(event.start_time.split("T")[0]);
      setStartTime(
        `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`
      );
      setEndTime(
        `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`
      );
      setCategory(event.category || "work");
      setColorHex(event.color_hex || "#0969DA");
    } else {
      const today = initialDate || new Date().toISOString().split("T")[0];
      const start = initialTime || "09:00";
      const [h, m] = start.split(":").map(Number);
      const endH = (h + 1) % 24;
      const end = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      setTitle("");
      setDescription("");
      setDateStr(today);
      setStartTime(start);
      setEndTime(end);
      setCategory("work");
      setColorHex("#0969DA");
    }
  }, [event, isOpen, initialDate, initialTime]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateStr) return;

    setIsSaving(true);
    try {
      const start_time = new Date(`${dateStr}T${startTime}:00`).toISOString();
      const end_time = new Date(`${dateStr}T${endTime}:00`).toISOString();

      await onSave({
        id: event?.id,
        title,
        description,
        start_time,
        end_time,
        category,
        color_hex: colorHex,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0E1015] border border-[#1A1D24] rounded-2xl shadow-2xl p-6 text-zinc-100 overflow-hidden">
        {/* Glow Header */}
        <div
          className="absolute -top-16 -left-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: colorHex }}
        />

        <div className="flex items-center justify-between pb-4 border-b border-[#1A1D24]">
          <h2 className="text-base font-bold tracking-wide flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colorHex }}
            />
            {event ? "Edit Calendar Event" : "Create New Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q4 Engineering Architecture Review"
              className="w-full px-3.5 py-2 rounded-xl bg-[#141720] border border-[#1A1D24] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#0969DA] focus:ring-1 focus:ring-[#0969DA] transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-[#1A1D24] text-xs text-zinc-100 focus:outline-none focus:border-[#0969DA]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-[#1A1D24] text-xs text-zinc-100 focus:outline-none focus:border-[#0969DA]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-[#1A1D24] text-xs text-zinc-100 focus:outline-none focus:border-[#0969DA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value as any);
                    setColorHex(cat.color);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-left transition-all ${
                    category === cat.value
                      ? "border-white/30 bg-white/10 text-white shadow-md font-semibold"
                      : "border-[#1A1D24] bg-[#141720]/70 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Description & Operational Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add agenda, requirements, or location notes..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#141720] border border-[#1A1D24] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#0969DA] resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#1A1D24]">
            {event && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#0969DA] hover:bg-[#0854ad] text-white text-xs font-bold tracking-wide uppercase transition-all shadow-md shadow-[#0969DA]/30 flex items-center gap-1.5"
              >
                <Check size={14} />
                {isSaving ? "Saving..." : event ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

