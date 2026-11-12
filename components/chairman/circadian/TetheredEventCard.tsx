"use client";

import React, { useState } from "react";
import {
  Check,
  Clock,
  Edit3,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { CircadianEventDTO, DOMAIN_CONFIG } from "@/lib/circadianTypes";
import { minutesTo12Hour } from "@/lib/circadianMath";

export interface TetheredEventCardProps {
  event: CircadianEventDTO;
  startMin: number;
  endMin: number;
  durMin: number;
  timelapseColor: string;
  mode: "inspector" | "quadrant";
  quadrantSlot?: number;
  positionClassName?: string;
  topPercent?: number;
  isHighlighted?: boolean;
  onHoverChange?: (eventId: string | null) => void;
  onToggleChecklist: (
    eventId: string,
    checklistId: string,
    nextVal: boolean
  ) => void;
  onAddChecklist?: (eventId: string, label: string) => void;
  onEdit: (event: CircadianEventDTO) => void;
  onDelete?: (eventId: string) => void;
  onClose?: () => void;
}

export function TetheredEventCard({
  event,
  startMin,
  endMin,
  durMin,
  timelapseColor,
  mode,
  quadrantSlot = 1,
  positionClassName = "",
  topPercent,
  isHighlighted = false,
  onHoverChange,
  onToggleChecklist,
  onAddChecklist,
  onEdit,
  onDelete,
  onClose,
}: TetheredEventCardProps) {
  const [quickItemText, setQuickItemText] = useState("");
  const color = timelapseColor || event.accentColor;

  if (mode === "quadrant") {
    const slotLabel =
      quadrantSlot === 1
        ? "EARLY MORNING"
        : quadrantSlot === 2
        ? "MIDDAY / AFTERNOON"
        : quadrantSlot === 3
        ? "REST & PREP"
        : "EVENING / DUSK";

    return (
      <div
        onMouseEnter={() => onHoverChange?.(event.id)}
        onMouseLeave={() => onHoverChange?.(null)}
        onClick={() => onEdit(event)}
        className={`hidden xl:flex flex-col absolute z-20 w-[232px] rounded-2xl bg-[#0b0e17]/90 backdrop-blur-xl border transition-all duration-300 cursor-pointer overflow-hidden ${positionClassName} ${
          isHighlighted
            ? "scale-[1.03] shadow-[0_14px_40px_rgba(0,0,0,0.85)]"
            : "shadow-[0_10px_28px_rgba(0,0,0,0.6)] opacity-95"
        }`}
        style={{
          borderColor: isHighlighted ? color : "rgba(255,255,255,0.12)",
        }}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
          {event.mediaType === "video_loop" ? (
            <video
              src={event.mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={event.mediaUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e17] via-black/15 to-transparent" />
          <span
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-black/70 border"
            style={{ color, borderColor: `${color}55` }}
          >
            {slotLabel}
          </span>
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-zinc-200">
            {Math.round((durMin / 60) * 10) / 10}h
          </span>
          <div className="absolute bottom-1.5 left-2.5 right-2.5">
            <div
              className="text-[9.5px] font-mono font-bold uppercase"
              style={{ color }}
            >
              {minutesTo12Hour(startMin)} |{" "}
              {DOMAIN_CONFIG[event.domain].shortLabel}
            </div>
            <div className="text-xs font-bold text-white truncate">
              {event.title}
            </div>
          </div>
        </div>

        <div
          className="p-2.5 space-y-1"
          onClick={(e) => e.stopPropagation()}
        >
          {event.checklists.slice(0, 2).map((chk) => (
            <button
              key={chk.id}
              onClick={() =>
                onToggleChecklist(event.id, chk.id, !chk.isCompleted)
              }
              className="w-full flex items-center gap-2 text-left py-0.5 px-1 rounded hover:bg-white/5 transition-colors"
            >
              <span
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                  chk.isCompleted
                    ? "bg-amber-400 border-amber-400 text-black"
                    : "border-zinc-600"
                }`}
              >
                {chk.isCompleted && <Check size={9} strokeWidth={3} />}
              </span>
              <span
                className={`text-[10.5px] truncate ${
                  chk.isCompleted
                    ? "line-through text-zinc-500"
                    : "text-zinc-300"
                }`}
              >
                {chk.label}
              </span>
            </button>
          ))}
          <div className="flex items-center justify-between pt-1 text-[9px] text-zinc-500">
            <span className="flex items-center gap-1">
              <Sparkles size={9} style={{ color }} />
              {event.telemetrySource
                ? event.telemetrySource.replace("_", " ").toUpperCase()
                : "CIRCADIAN LOCK"}
            </span>
            <button
              onClick={() => onEdit(event)}
              className="text-zinc-400 hover:text-white underline"
            >
              Configure
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute z-30 w-[262px] rounded-2xl bg-[#0b0e17]/95 backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.75)] overflow-hidden animate-fade-in ${positionClassName}`}
      style={{
        top: topPercent !== undefined ? `${topPercent}%` : undefined,
        borderColor: `${event.accentColor}66`,
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
        {event.mediaType === "video_loop" ? (
          <video
            src={event.mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={event.mediaUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e17] via-transparent to-black/30" />

        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase backdrop-blur-md border"
            style={{
              backgroundColor: "rgba(9,13,22,0.75)",
              color: event.accentColor,
              borderColor: `${event.accentColor}55`,
            }}
          >
            {DOMAIN_CONFIG[event.domain].shortLabel}
          </span>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={() => onEdit(event)}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-zinc-200 transition-colors"
            title="Edit Block"
          >
            <Edit3 size={12} />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-red-950/80 text-zinc-300 hover:text-red-400 transition-colors"
              title="Delete Block"
            >
              <Trash2 size={12} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-zinc-200 transition-colors"
              title="Close"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="absolute bottom-2 left-3 right-3">
          <div className="text-[10px] font-mono font-semibold text-amber-300/95">
            {minutesTo12Hour(startMin)} — {minutesTo12Hour(endMin)}
          </div>
          <h4 className="text-sm font-bold text-white leading-tight truncate">
            {event.title}
          </h4>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {event.description && (
          <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {event.checklists.map((chk) => (
            <button
              key={chk.id}
              onClick={() =>
                onToggleChecklist(event.id, chk.id, !chk.isCompleted)
              }
              className="w-full flex items-center gap-2 text-left py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                  chk.isCompleted
                    ? "bg-amber-400 border-amber-400 text-black"
                    : "border-zinc-600 bg-transparent"
                }`}
              >
                {chk.isCompleted && <Check size={11} strokeWidth={3} />}
              </span>
              <span
                className={`text-[11px] leading-snug ${
                  chk.isCompleted
                    ? "line-through text-zinc-500"
                    : "text-zinc-200"
                }`}
              >
                {chk.label}
              </span>
            </button>
          ))}
        </div>

        {onAddChecklist && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quickItemText.trim()) return;
              onAddChecklist(event.id, quickItemText.trim());
              setQuickItemText("");
            }}
            className="flex items-center gap-1.5 pt-1 border-t border-white/10"
          >
            <input
              type="text"
              value={quickItemText}
              onChange={(e) => setQuickItemText(e.target.value)}
              placeholder="Add micro-step..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200"
            >
              <Plus size={12} />
            </button>
          </form>
        )}

        <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1 font-mono">
            <Clock size={11} />
            {Math.round((durMin / 60) * 10) / 10}h block
          </span>
          {event.telemetrySource && (
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-wider text-[9px] text-zinc-300">
              {event.telemetrySource.replace("_", " ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
