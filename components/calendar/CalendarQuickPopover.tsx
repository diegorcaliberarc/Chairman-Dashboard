"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Trash2, Clock, Calendar, Check } from "lucide-react";
import { CalendarEventItem } from "./MonthView";

interface CalendarQuickPopoverProps {
  event: CalendarEventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEditFull: (event: CalendarEventItem) => void;
  onSaveQuick: (eventId: string, patch: Partial<CalendarEventItem>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

const COLOR_SWATCHES = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

export function CalendarQuickPopover({
  event,
  isOpen,
  onClose,
  onEditFull,
  onSaveQuick,
  onDeleteEvent,
}: CalendarQuickPopoverProps) {
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [quickTitle, setQuickTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setSelectedColor(event.color_hex || "#3B82F6");
      setQuickTitle(event.title || "");
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveQuick(event.id, {
        title: quickTitle.trim() || event.title,
        color_hex: selectedColor,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await onDeleteEvent(event.id);
    onClose();
  };

  const formatTimeRange = () => {
    try {
      const s = new Date(event.start_time);
      const e = new Date(event.end_time);
      const dateStr = s.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const startTimeStr = s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const endTimeStr = e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      return `${dateStr} • ${startTimeStr} – ${endTimeStr}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* 420px Quick Popover Card */}
      <div className="w-[420px] bg-[#12141E] border border-[#222738] rounded-2xl shadow-2xl p-4 text-zinc-100 relative space-y-4">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2333]">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
              {event.category.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditFull(event)}
              title="Full Editor"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2333] transition"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete Event"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2333] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="w-full text-lg font-semibold bg-transparent border-b border-transparent hover:border-[#222738] focus:border-blue-500 focus:outline-none py-1 text-white transition placeholder-zinc-500"
            placeholder="Event Title..."
          />
        </div>

        {/* Time Range Information */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{formatTimeRange()}</span>
        </div>

        {/* Description Snippet if present */}
        {event.description && (
          <p className="text-xs text-zinc-300 line-clamp-3 bg-[#0D0F17] p-2.5 rounded-xl border border-[#1E2333]">
            {event.description}
          </p>
        )}

        {/* Color Swatch Selector (20px Circles) */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-2">
            Event Color
          </label>
          <div className="flex items-center gap-2">
            {COLOR_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setSelectedColor(hex)}
                style={{ backgroundColor: hex }}
                className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${
                  selectedColor === hex
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#12141E] scale-110"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                {selectedColor === hex && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* 36px Full-Width Save CTA Button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
