"use client";

import React, { useState } from "react";
import { CommandAarLog, FailureClassification, LifeDomain } from "@/lib/commandTypes";
import { Search, BookOpen, Filter, Calendar, Tag, AlertTriangle, ShieldAlert } from "lucide-react";

interface AarLessonVaultProps {
  aarLogs: CommandAarLog[];
}

export function AarLessonVault({ aarLogs }: AarLessonVaultProps) {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  const filtered = aarLogs.filter((log) => {
    if (domainFilter !== "all" && log.domain !== domainFilter) return false;
    if (classFilter !== "all" && log.failure_classification !== classFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchText = `${log.what_happened} ${log.what_went_wrong} ${log.root_cause} ${log.lessons_learned} ${log.actionable_fix}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Search & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Search root causes, lessons learned, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-white text-xs placeholder-zinc-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Domain Filter */}
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">All Domains</option>
            <option value="health">Health</option>
            <option value="wealth">Wealth</option>
            <option value="relationships">Relationships</option>
            <option value="happiness">Happiness</option>
          </select>

          {/* Classification Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">All Failures</option>
            <option value="planning">Planning</option>
            <option value="execution">Execution</option>
            <option value="adversity">Adversity</option>
            <option value="drift">Drift</option>
            <option value="unforeseen">Unforeseen</option>
          </select>
        </div>
      </div>

      {/* AAR Entries Cards */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-zinc-950/40 border border-white/5 rounded-2xl space-y-2">
          <BookOpen size={24} className="mx-auto text-zinc-600" />
          <div className="text-xs font-bold text-zinc-300">No AAR Lessons Logged</div>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto font-sans">
            Conduct your Sunday Review Wizard above to audit weekly outcomes, isolate root causes, and deposit permanent operational principles into this Lesson Vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-white/20 transition"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">
                      {log.domain}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      Week of {log.week_start_date}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {log.failure_classification}
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                      {log.audited_grade}
                    </span>
                  </div>
                </div>

                {/* Root Cause & What Happened */}
                <div className="space-y-1.5 font-sans">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      Root Cause
                    </span>
                    <p className="text-xs font-semibold text-zinc-200">{log.root_cause}</p>
                  </div>

                  {log.what_went_wrong && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2">
                      {log.what_went_wrong}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom: Permanent Lesson & Actionable Fix */}
              <div className="pt-2.5 border-t border-white/5 space-y-1.5 bg-black/20 -mx-4 -mb-4 p-4 rounded-b-2xl">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block">
                    Permanent Principle
                  </span>
                  <p className="text-xs text-zinc-300 font-sans italic">
                    &ldquo;{log.lessons_learned}&rdquo;
                  </p>
                </div>

                {log.actionable_fix && (
                  <div className="text-[10px] text-zinc-400 font-sans pt-1">
                    <span className="text-amber-400 font-bold font-mono uppercase">Fix:</span>{" "}
                    {log.actionable_fix}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
