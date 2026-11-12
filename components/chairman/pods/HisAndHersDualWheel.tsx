"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Heart,
  Lock,
  Sparkles,
  Sun,
  Unlock,
} from "lucide-react";

export interface DualWheelConsent {
  id: string;
  share_calendar_events: boolean;
  share_calendar_details: boolean;
}

interface CircadianSlot {
  id: string;
  startHour: number;
  endHour: number;
  title: string;
  notes: string;
  color: string;
}

const HIS_SCHEDULE: CircadianSlot[] = [
  {
    id: "h1",
    startHour: 22.5,
    endHour: 6.0,
    title: "Restorative Sleep",
    notes: "Cool 67°F Sanctuary",
    color: "#1e293b",
  },
  {
    id: "h2",
    startHour: 6.0,
    endHour: 7.25,
    title: "Dawn Walk & Espresso",
    notes: "Shared morning ritual + canine pack",
    color: "#14b8a6",
  },
  {
    id: "h3",
    startHour: 7.25,
    endHour: 9.5,
    title: "Caliber Arc Futures (NY Open)",
    notes: "MNQ Orderflow Execution",
    color: "#f59e0b",
  },
  {
    id: "h4",
    startHour: 9.5,
    endHour: 16.5,
    title: "Sovereign Deep Work Sprint",
    notes: "Pristine Designs Living OS",
    color: "#3b82f6",
  },
  {
    id: "h5",
    startHour: 16.5,
    endHour: 18.0,
    title: "Garage Gym Hypertrophy",
    notes: "Strength & Zone 2",
    color: "#ef4444",
  },
  {
    id: "h6",
    startHour: 18.0,
    endHour: 21.0,
    title: "Evening Sanctuary & Dinner",
    notes: "Shared couple & family window",
    color: "#ec4899",
  },
];

const HERS_SCHEDULE: CircadianSlot[] = [
  {
    id: "p1",
    startHour: 22.25,
    endHour: 6.0,
    title: "Restorative Sleep",
    notes: "8h Circadian Recovery",
    color: "#1e293b",
  },
  {
    id: "p2",
    startHour: 6.0,
    endHour: 7.25,
    title: "Morning Matcha & Pack Walk",
    notes: "Synchronized morning patio window",
    color: "#14b8a6",
  },
  {
    id: "p3",
    startHour: 8.0,
    endHour: 9.25,
    title: "Reformer Pilates & Mobility",
    notes: "Private studio session",
    color: "#a855f7",
  },
  {
    id: "p4",
    startHour: 9.5,
    endHour: 15.5,
    title: "Creative Direction & Client Reviews",
    notes: "Brand studio deep work",
    color: "#ec4899",
  },
  {
    id: "p5",
    startHour: 15.5,
    endHour: 17.5,
    title: "Estate Errands & Holistic Prep",
    notes: "Organic market & household logistics",
    color: "#f97316",
  },
  {
    id: "p6",
    startHour: 18.0,
    endHour: 21.0,
    title: "Shared Dinner & Sunset Walk",
    notes: "Protected His & Hers quality time",
    color: "#10b981",
  },
];

const OVERLAP_FREE_WINDOWS = [
  {
    startHour: 6.0,
    endHour: 7.25,
    label: "Dawn Espresso & Pack Stroll (1h 15m Overlap)",
  },
  {
    startHour: 18.0,
    endHour: 21.0,
    label: "Evening Sanctuary, Dinner & Sunset (3h 00m Overlap)",
  },
];

function hourToDeg(h: number): number {
  return ((h / 24) * 360 + 180) % 360;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPaths(
  cx: number,
  cy: number,
  r: number,
  startHour: number,
  endHour: number
): string[] {
  const segs: Array<[number, number]> =
    endHour < startHour
      ? [
          [startHour, 24],
          [0, endHour],
        ]
      : [[startHour, endHour]];

  return segs.map(([s, e]) => {
    const span = Math.min(23.98, Math.max(0.1, e - s));
    const p1 = polar(cx, cy, r, hourToDeg(s));
    const p2 = polar(cx, cy, r, hourToDeg(s + span));
    const large = span > 12 ? 1 : 0;
    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(
      2
    )} ${p2.y.toFixed(2)}`;
  });
}

function fmtHours(s: number, e: number) {
  const f = (n: number) => {
    const hh = Math.floor(((n % 24) + 24) % 24);
    const mm = Math.round((n - Math.floor(n)) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  return `${f(s)}–${f(e)}`;
}

interface HisAndHersDualWheelProps {
  partnerConsent: DualWheelConsent | null;
  onQuickTogglePartnerDetails: (nextVal: boolean) => Promise<void>;
  onOpenConsentModal: () => void;
}

export function HisAndHersDualWheel({
  partnerConsent,
  onQuickTogglePartnerDetails,
  onOpenConsentModal,
}: HisAndHersDualWheelProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [hoveredInfo, setHoveredInfo] = useState<{
    owner: string;
    title: string;
    window: string;
    notes: string;
    redacted: boolean;
  } | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const solarHour = useMemo(
    () => now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600,
    [now]
  );

  const shareEvents = partnerConsent?.share_calendar_events ?? true;
  const shareDetails = partnerConsent?.share_calendar_details ?? false;

  const resolvedHersSlots = useMemo(() => {
    if (!shareEvents) return [];
    return HERS_SCHEDULE.map((slot) => {
      if (!shareDetails) {
        return {
          ...slot,
          title: "Busy",
          notes: "Redacted via pod_consent_grants (share_calendar_details = false)",
          color: "#64748b", // Anonymous slate grey arc!
        };
      }
      return slot;
    });
  }, [shareEvents, shareDetails]);

  const handleToggleDetails = async () => {
    setToggling(true);
    try {
      await onQuickTogglePartnerDetails(!shareDetails);
    } finally {
      setToggling(false);
    }
  };

  const renderSideDial = (
    label: string,
    accent: string,
    slots: CircadianSlot[],
    isRedactedMode: boolean,
    eventsHidden: boolean
  ) => {
    const size = 210;
    const cx = size / 2;
    const cy = size / 2;
    const r = 78;
    const needle = polar(cx, cy, r + 8, hourToDeg(solarHour));

    return (
      <div className="rounded-2xl border border-white/[0.08] bg-black/35 p-4 flex flex-col items-center gap-3">
        <div className="w-full flex items-center justify-between">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: accent }}
          >
            {label}
          </span>
          {eventsHidden ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9.5px] font-bold flex items-center gap-1">
              <Lock size={10} /> Hidden
            </span>
          ) : isRedactedMode ? (
            <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/40 text-[9.5px] font-bold flex items-center gap-1">
              <EyeOff size={10} /> Busy-Only Redacted
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-bold flex items-center gap-1">
              <Eye size={10} /> Full Details Shared
            </span>
          )}
        </div>

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="rgba(9,11,17,0.9)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={14}
          />
          {slots.map((sl) =>
            arcPaths(cx, cy, r, sl.startHour, sl.endHour).map((d, idx) => (
              <path
                key={`${sl.id}_${idx}`}
                d={d}
                fill="none"
                stroke={sl.color}
                strokeWidth={14}
                strokeDasharray={isRedactedMode ? "5 2" : undefined}
                className="cursor-pointer transition-opacity hover:opacity-100"
                opacity={0.88}
                onMouseEnter={() =>
                  setHoveredInfo({
                    owner: label,
                    title: sl.title,
                    window: fmtHours(sl.startHour, sl.endHour),
                    notes: sl.notes,
                    redacted: isRedactedMode,
                  })
                }
                onMouseLeave={() => setHoveredInfo(null)}
              />
            ))
          )}
          {[12, 18, 0, 6].map((h) => {
            const p = polar(cx, cy, r - 21, hourToDeg(h));
            return (
              <text
                key={h}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-zinc-500 text-[8.5px] font-mono font-bold"
              >
                {String(h).padStart(2, "0")}
              </text>
            );
          })}
          <line
            x1={cx}
            y1={cy}
            x2={needle.x}
            y2={needle.y}
            stroke="#fbbf24"
            strokeWidth={2}
          />
          <circle cx={needle.x} cy={needle.y} r={3.5} fill="#fbbf24" />
          <circle cx={cx} cy={cy} r={4} fill={accent} />
        </svg>

        <div className="w-full space-y-1 max-h-28 overflow-y-auto pr-1">
          {eventsHidden ? (
            <div className="text-[11px] text-zinc-500 text-center py-3">
              Partner disabled calendar event sharing (`share_calendar_events = false`).
            </div>
          ) : (
            slots.slice(1).map((sl) => (
              <div
                key={sl.id}
                className="flex items-center justify-between text-[10.5px] px-2 py-1 rounded bg-white/[0.025] border border-white/[0.05]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: sl.color }}
                  />
                  <span
                    className={
                      isRedactedMode
                        ? "italic text-slate-400 font-mono"
                        : "text-zinc-200 truncate"
                    }
                  >
                    {sl.title}
                  </span>
                </div>
                <span className="font-mono text-zinc-500 shrink-0 ml-2">
                  {fmtHours(sl.startHour, sl.endHour)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Central Concentric Overlap Ring
  const cSize = 276;
  const cCx = cSize / 2;
  const cCy = cSize / 2;
  const rHis = 108;
  const rHers = 82;
  const rOverlap = 58;
  const cNeedle = polar(cCx, cCy, rHis + 12, hourToDeg(solarHour));

  return (
    <div className="rounded-2xl border border-pink-500/25 bg-gradient-to-b from-[#111320] to-[#0a0d15] p-5 space-y-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-pink-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              &ldquo;His &amp; Hers&rdquo; Synchronized 24-Hour Circadian Dials
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Side-by-side individual rhythms + central concentric free-time overlap detector with live Zero-Trust field redaction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {partnerConsent && (
            <button
              onClick={handleToggleDetails}
              disabled={toggling}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                shareDetails
                  ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                  : "bg-slate-500/20 border-slate-400/40 text-slate-200"
              }`}
            >
              {shareDetails ? <Unlock size={13} /> : <Lock size={13} />}
              Partner Event Details: {shareDetails ? "VISIBLE" : 'REDACTED ("Busy")'}
            </button>
          )}
          <button
            onClick={onOpenConsentModal}
            className="px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/35 text-pink-200 text-xs font-semibold"
          >
            Granular Consent Matrix
          </button>
        </div>
      </div>

      {/* 3-Panel Synchronized Layout: His Side Dial | Concentric Overlap Ring | Hers Side Dial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {renderSideDial(
          "Diego (His • Outer Ring)",
          "#3b82f6",
          HIS_SCHEDULE,
          false,
          false
        )}

        {/* Center Concentric Dual Ring + Free-Time Overlap */}
        <div className="rounded-2xl border border-amber-500/25 bg-black/40 p-4 flex flex-col items-center gap-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
            <Sparkles size={13} /> Concentric Overlap Sync
          </div>

          <svg width={cSize} height={cSize} viewBox={`0 0 ${cSize} ${cSize}`}>
            {/* Outer Ring: His */}
            <circle
              cx={cCx}
              cy={cCy}
              r={rHis}
              fill="none"
              stroke="rgba(59,130,246,0.12)"
              strokeWidth={16}
            />
            {HIS_SCHEDULE.map((sl) =>
              arcPaths(cCx, cCy, rHis, sl.startHour, sl.endHour).map((d, i) => (
                <path
                  key={`chis_${sl.id}_${i}`}
                  d={d}
                  fill="none"
                  stroke={sl.color}
                  strokeWidth={16}
                  opacity={0.9}
                />
              ))
            )}

            {/* Middle Ring: Hers (Live Redacted when share_calendar_details = false) */}
            <circle
              cx={cCx}
              cy={cCy}
              r={rHers}
              fill="none"
              stroke="rgba(236,72,153,0.12)"
              strokeWidth={16}
            />
            {resolvedHersSlots.map((sl) =>
              arcPaths(cCx, cCy, rHers, sl.startHour, sl.endHour).map((d, i) => (
                <path
                  key={`chers_${sl.id}_${i}`}
                  d={d}
                  fill="none"
                  stroke={sl.color}
                  strokeWidth={16}
                  strokeDasharray={!shareDetails ? "6 2.5" : undefined}
                  opacity={0.9}
                />
              ))
            )}

            {/* Inner Ring: Shared Free-Time Quality Overlap Windows */}
            <circle
              cx={cCx}
              cy={cCy}
              r={rOverlap}
              fill="rgba(9,11,17,0.95)"
              stroke="rgba(16,185,129,0.15)"
              strokeWidth={10}
            />
            {OVERLAP_FREE_WINDOWS.map((ow, idx) =>
              arcPaths(cCx, cCy, rOverlap, ow.startHour, ow.endHour).map(
                (d, i) => (
                  <path
                    key={`cov_${idx}_${i}`}
                    d={d}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={10}
                  />
                )
              )
            )}

            {/* Live Solar Needle */}
            <line
              x1={cCx}
              y1={cCy}
              x2={cNeedle.x}
              y2={cNeedle.y}
              stroke="#fbbf24"
              strokeWidth={2.2}
            />
            <circle cx={cNeedle.x} cy={cNeedle.y} r={4.5} fill="#fbbf24" />
            <text
              x={cCx}
              y={cCy - 4}
              textAnchor="middle"
              className="fill-emerald-300 text-[9px] font-bold uppercase tracking-widest"
            >
              4h 15m
            </text>
            <text
              x={cCx}
              y={cCy + 9}
              textAnchor="middle"
              className="fill-zinc-400 text-[8.5px] font-mono"
            >
              FREE SYNC
            </text>
          </svg>

          <div className="w-full space-y-1.5">
            {OVERLAP_FREE_WINDOWS.map((ow) => (
              <div
                key={ow.label}
                className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 text-[10.5px] text-emerald-200 flex items-center justify-between"
              >
                <span className="truncate">{ow.label}</span>
                <Sun size={11} className="text-emerald-400 shrink-0 ml-1" />
              </div>
            ))}
          </div>
        </div>

        {renderSideDial(
          "Elena (Hers • Inner Ring)",
          "#ec4899",
          resolvedHersSlots,
          !shareDetails,
          !shareEvents
        )}
      </div>

      {/* Live Hover / Redaction Proof Readout */}
      <div className="rounded-xl border border-white/[0.07] bg-black/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {hoveredInfo ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{hoveredInfo.owner}:</span>
            <span className="font-mono text-amber-300">{hoveredInfo.window}</span>
            <span
              className={
                hoveredInfo.redacted
                  ? "px-2 py-0.5 rounded bg-slate-600/30 text-slate-200 font-mono"
                  : "text-emerald-300 font-semibold"
              }
            >
              {hoveredInfo.title}
            </span>
            <span className="text-zinc-400">— {hoveredInfo.notes}</span>
          </div>
        ) : (
          <div className="text-zinc-400 text-[11px]">
            Hover any circadian arc above to inspect Zero-Trust consent payload. Toggle{" "}
            <span className="text-pink-300 font-semibold">Partner Event Details</span>{" "}
            to verify anonymous grey <code className="text-slate-300">&quot;Busy&quot;</code> masking vs. named schedule blocks.
          </div>
        )}
      </div>
    </div>
  );
}
