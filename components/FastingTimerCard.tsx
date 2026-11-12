"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, Clock, Zap, AlertCircle } from "lucide-react";

export function FastingTimerCard() {
  const [now, setNow] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState("00:00:00");
  const [isFasting, setIsFasting] = useState(false);
  const [nextEventLabel, setNextEventLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const current = new Date();
      setNow(current);

      const hours = current.getHours();
      const minutes = current.getMinutes();
      const seconds = current.getSeconds();
      const totalSecondsToday = hours * 3600 + minutes * 60 + seconds;

      const fastStartSec = 12 * 3600; // 12:00 PM
      const fastEndSec = 18 * 3600;   // 6:00 PM

      const currentlyFasting = totalSecondsToday >= fastStartSec && totalSecondsToday < fastEndSec;
      setIsFasting(currentlyFasting);

      let targetSec = 0;
      if (currentlyFasting) {
        // Countdown until fast ends (6:00 PM)
        targetSec = fastEndSec;
        setNextEventLabel("Feeding Window Opens (6:00 PM)");
      } else if (totalSecondsToday < fastStartSec) {
        // In morning feeding window; countdown until 12:00 PM fast lock
        targetSec = fastStartSec;
        setNextEventLabel("Fast Lock Begins (12:00 PM)");
      } else {
        // In evening feeding window; countdown until tomorrow's 12:00 PM fast lock
        targetSec = 24 * 3600 + fastStartSec;
        setNextEventLabel("Next Fast Lock (Tomorrow 12:00 PM)");
      }

      const diffSec = Math.max(0, targetSec - totalSecondsToday);
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;

      setTimeRemaining(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalMinToday = now.getHours() * 60 + now.getMinutes();
  const currentPercent = ((totalMinToday / (24 * 60)) * 100).toFixed(1);

  return (
    <div className="rounded-3xl bg-[#141418] border border-[#1E1E24] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-5">
      {/* Header & Status Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-2xl ${
              isFasting ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {isFasting ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Circadian Fasting & Feeding Protocol
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              Intermittent Window: 12:00 PM – 6:00 PM Locked
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-colors ${
            isFasting
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isFasting ? "bg-amber-400 animate-pulse" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
            }`}
          />
          <span>{isFasting ? "FASTING LOCKED: 12:00 PM – 6:00 PM" : "FEEDING WINDOW OPEN"}</span>
        </div>
      </div>

      {/* Countdown Clock Display */}
      <div className="p-4 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-mono text-zinc-500 uppercase tracking-wider block">
            Time Until {nextEventLabel}
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-zinc-100">
            {timeRemaining}
          </span>
        </div>

        <div className="text-right text-xs font-mono text-zinc-400">
          <div>Local Clock: {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {isFasting ? "Zero caloric intake • Water, Black Coffee & Salts Only" : "Hit 180g protein & clean hydration"}
          </div>
        </div>
      </div>

      {/* 24-Hour Visual Timeline Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>00:00 (Midnight)</span>
          <span className="text-emerald-400">12:00 PM (Fast Begins)</span>
          <span className="text-emerald-400">18:00 (Fast Ends)</span>
          <span>24:00</span>
        </div>

        <div className="relative w-full h-3 rounded-full bg-[#0A0A0C] border border-[#1E1E24] overflow-hidden flex">
          {/* 00:00 - 12:00: Pre-Fast Feeding Window (50%) */}
          <div
            className="h-full bg-emerald-500/25 border-r border-[#1E1E24]"
            style={{ width: "50%" }}
            title="Pre-Fast Feeding Window (00:00 - 12:00)"
          />
          {/* 12:00 - 18:00: Fasting Locked Window (25%) */}
          <div
            className="h-full bg-amber-500/35 border-r border-[#1E1E24]"
            style={{ width: "25%" }}
            title="FASTING LOCKED (12:00 - 18:00)"
          />
          {/* 18:00 - 24:00: Post-Fast Feeding Window (25%) */}
          <div
            className="h-full bg-emerald-500/25"
            style={{ width: "25%" }}
            title="Post-Fast Feeding Window (18:00 - 24:00)"
          />

          {/* Current Time Indicator Needle */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_white] -translate-x-1/2"
            style={{ left: `${currentPercent}%` }}
            title={`Current Time: ${now.toLocaleTimeString()}`}
          />
        </div>

        <div className="flex items-center justify-between text-[10.5px] font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400/50" />
            Feeding Windows (Pre-12PM & Post-6PM)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400/90">
            <span className="w-2 h-2 rounded-full bg-amber-400/50" />
            Fast Locked (12PM - 6PM)
          </span>
        </div>
      </div>
    </div>
  );
}
