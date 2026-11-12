"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarPlus,
  Check,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  CircadianEventDTO,
  DOMAIN_CONFIG,
  EventDomain,
  MediaTypeEnum,
} from "@/lib/circadianTypes";
import { EventMediaUploader } from "@/components/chairman/circadian/EventMediaUploader";
import {
  dateToMinutes,
  getDurationMinutes,
  getSweepAngleDeg,
  hhmmToMinutes,
  minutesToHHMM,
} from "@/lib/circadianMath";

interface CircadianEventModalProps {
  isOpen: boolean;
  initialEvent: CircadianEventDTO | null;
  selectedDate: string; // YYYY-MM-DD
  calConnected: boolean;
  onClose: () => void;
  onSave: (payload: any, syncGoogleCal: boolean) => Promise<void>;
}

const ACCENT_PALETTE = [
  "#fbbf24", // Solar Gold
  "#f97316", // Vibrant Tangerine
  "#10b981", // Emerald Training
  "#2563eb", // Electric Cobalt
  "#60a5fa", // Dawn Azure
  "#8b5cf6", // Amethyst Pack
  "#ea580c", // Sunset Ember
  "#ec4899", // Magenta Dusk
];

export function CircadianEventModal({
  isOpen,
  initialEvent,
  selectedDate,
  calConnected,
  onClose,
  onSave,
}: CircadianEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<EventDomain>("engineering");
  const [startHHMM, setStartHHMM] = useState("09:00");
  const [endHHMM, setEndHHMM] = useState("11:00");
  const [isRecurring, setIsRecurring] = useState(true);
  const [mediaUrl, setMediaUrl] = useState("/circadian/saas-build.jpg");
  const [mediaType, setMediaType] = useState<MediaTypeEnum>("image");
  const [accentColor, setAccentColor] = useState("#2563eb");
  const [quadrantSlot, setQuadrantSlot] = useState<number | null>(null);
  const [telemetrySource, setTelemetrySource] = useState<string>("clickup");
  const [checklists, setChecklists] = useState<
    Array<{ id?: string; label: string; isCompleted: boolean }>
  >([]);
  const [newCheckLabel, setNewCheckLabel] = useState("");
  const [syncGoogleCal, setSyncGoogleCal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialEvent) {
      setTitle(initialEvent.title);
      setDescription(initialEvent.description || "");
      setDomain(initialEvent.domain);
      setStartHHMM(minutesToHHMM(dateToMinutes(new Date(initialEvent.startTime))));
      setEndHHMM(minutesToHHMM(dateToMinutes(new Date(initialEvent.endTime))));
      setIsRecurring(initialEvent.isRecurring);
      setMediaUrl(initialEvent.mediaUrl);
      setMediaType(initialEvent.mediaType);
      setAccentColor(initialEvent.accentColor || DOMAIN_CONFIG[initialEvent.domain].color);
      setQuadrantSlot(initialEvent.quadrantSlot ?? null);
      setTelemetrySource(initialEvent.telemetrySource || "");
      setChecklists(
        initialEvent.checklists.map((c) => ({
          id: c.id,
          label: c.label,
          isCompleted: c.isCompleted,
        }))
      );
      setSyncGoogleCal(false);
    } else {
      setTitle("");
      setDescription("");
      setDomain("engineering");
      setStartHHMM("10:00");
      setEndHHMM("11:30");
      setIsRecurring(true);
      setMediaUrl("/circadian/saas-build.jpg");
      setMediaType("image");
      setAccentColor("#2563eb");
      setQuadrantSlot(null);
      setTelemetrySource("clickup");
      setChecklists([
        { label: "Primary sprint objective", isCompleted: false },
      ]);
      setSyncGoogleCal(false);
    }
  }, [isOpen, initialEvent]);

  if (!isOpen) return null;

  const sMin = hhmmToMinutes(startHHMM);
  const eMin = hhmmToMinutes(endHHMM);
  const durMin = getDurationMinutes(sMin, eMin);
  const sweepDeg = getSweepAngleDeg(sMin, eMin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const [sh, sm] = startHHMM.split(":").map(Number);
      const [eh, em] = endHHMM.split(":").map(Number);
      const startIso = new Date(y, m - 1, d, sh, sm, 0, 0).toISOString();
      const endDayOffset = eMin <= sMin ? 1 : 0;
      const endIso = new Date(y, m - 1, d + endDayOffset, eh, em, 0, 0).toISOString();

      await onSave(
        {
          id: initialEvent?.id,
          title: title.trim(),
          description: description.trim() || null,
          domain,
          startTime: startIso,
          endTime: endIso,
          isRecurring,
          recurrenceRule: isRecurring ? "FREQ=DAILY" : null,
          mediaUrl,
          mediaType,
          accentColor,
          quadrantSlot,
          telemetrySource: telemetrySource || null,
          checklists,
        },
        syncGoogleCal
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0c0f18] border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-amber-400" />
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase">
                {initialEvent ? "Configure Circadian Block" : "Deploy Circadian Block"}
              </h2>
              <p className="text-[11px] text-zinc-400">
                24-Hour Polar Orbit · Δθ = {sweepDeg.toFixed(1)}° ({(durMin / 60).toFixed(1)}h arc)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title & Domain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                Event Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Garage Gym Workout"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                Circadian Domain
              </label>
              <select
                value={domain}
                onChange={(e) => {
                  const next = e.target.value as EventDomain;
                  setDomain(next);
                  setAccentColor(DOMAIN_CONFIG[next].color);
                }}
                className="w-full rounded-xl bg-[#141826] border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/60"
              >
                {Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Window & Quadrant Slot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                Start (24h)
              </label>
              <input
                type="time"
                value={startHHMM}
                onChange={(e) => setStartHHMM(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-400/60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                End (24h)
              </label>
              <input
                type="time"
                value={endHHMM}
                onChange={(e) => setEndHHMM(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-400/60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                Quadrant Card
              </label>
              <select
                value={quadrantSlot ?? ""}
                onChange={(e) =>
                  setQuadrantSlot(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded-xl bg-[#141826] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">Auto Orbit</option>
                <option value="1">Q1 · Top-Left</option>
                <option value="2">Q2 · Top-Right</option>
                <option value="3">Q3 · Bottom-Left</option>
                <option value="4">Q4 · Bottom-Right</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                Telemetry Link
              </label>
              <select
                value={telemetrySource}
                onChange={(e) => setTelemetrySource(e.target.value)}
                className="w-full rounded-xl bg-[#141826] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">None</option>
                <option value="clickup">ClickUp</option>
                <option value="garmin">Garmin</option>
                <option value="samsung_health">Samsung Health</option>
                <option value="renpho">Renpho</option>
                <option value="plaid">Plaid</option>
                <option value="supabase">Supabase</option>
              </select>
            </div>
          </div>

          {/* Drag-and-Drop Visual Media Uploader + Curated Presets + URL */}
          <EventMediaUploader
            mediaUrl={mediaUrl}
            mediaType={mediaType}
            onChangeMedia={({
              mediaUrl: nextUrl,
              mediaType: nextType,
              accentColor: nextAccent,
            }) => {
              setMediaUrl(nextUrl);
              setMediaType(nextType);
              if (nextAccent) {
                setAccentColor(nextAccent);
              }
            }}
          />

          {/* Accent Color & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                Arc Glow Accent
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {ACCENT_PALETTE.map((hex) => (
                  <button
                    type="button"
                    key={hex}
                    onClick={() => setAccentColor(hex)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      accentColor === hex
                        ? "border-white scale-110"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                Intent / Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Biological & operational intent..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Micro-Checklist Builder */}
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
              Micro-Checklist Protocol
            </label>
            <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto">
              {checklists.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setChecklists((prev) =>
                        prev.map((c, i) =>
                          i === idx ? { ...c, isCompleted: !c.isCompleted } : c
                        )
                      )
                    }
                    className="flex items-center gap-2 text-xs text-left flex-1"
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        item.isCompleted
                          ? "bg-amber-400 border-amber-400 text-black"
                          : "border-zinc-600"
                      }`}
                    >
                      {item.isCompleted && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span
                      className={
                        item.isCompleted ? "line-through text-zinc-500" : "text-zinc-200"
                      }
                    >
                      {item.label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setChecklists((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCheckLabel}
                onChange={(e) => setNewCheckLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!newCheckLabel.trim()) return;
                    setChecklists((prev) => [
                      ...prev,
                      { label: newCheckLabel.trim(), isCompleted: false },
                    ]);
                    setNewCheckLabel("");
                  }
                }}
                placeholder="Add checklist step and press Enter..."
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newCheckLabel.trim()) return;
                  setChecklists((prev) => [
                    ...prev,
                    { label: newCheckLabel.trim(), isCompleted: false },
                  ]);
                  setNewCheckLabel("");
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          {/* Recurrence & Google Calendar Sync Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded accent-amber-400"
                />
                Daily Circadian Anchor (RRULE)
              </label>

              {calConnected && !initialEvent && (
                <label className="flex items-center gap-2 text-xs text-sky-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncGoogleCal}
                    onChange={(e) => setSyncGoogleCal(e.target.checked)}
                    className="rounded accent-sky-400"
                  />
                  <CalendarPlus size={13} /> Mirror to Google Calendar
                </label>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving
                  ? "Syncing..."
                  : initialEvent
                  ? "Save Changes"
                  : "Lock to Orbit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

