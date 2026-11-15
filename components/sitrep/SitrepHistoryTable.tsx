"use client";

import React, { useState } from "react";
import { DailySitrepLog } from "@/lib/commandTypes";
import { Download, Trash2, Edit3, Check, X, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

interface SitrepHistoryTableProps {
  data: DailySitrepLog[];
  onRefresh: () => void;
  onEditItem?: (item: DailySitrepLog) => void;
}

export function SitrepHistoryTable({ data, onRefresh, onEditItem }: SitrepHistoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const exportCsv = () => {
    if (data.length === 0) return;
    const headers = [
      "Date",
      "Morning Weight (lbs)",
      "7D Moving Avg (lbs)",
      "Steps",
      "Miles",
      "Calories Eaten",
      "Kcal Burned",
      "Net Deficit",
      "Protein (g)",
      "Water (oz)",
      "Sleep (hrs)",
      "Grade",
      "Notes",
    ];

    const rows = data.map((d) => [
      d.log_date,
      d.morning_weight_lbs ?? "",
      d.moving_avg_7d_lbs ?? "",
      d.total_steps,
      d.miles,
      d.calories_eaten,
      d.kcal_burned,
      d.kcal_deficit,
      d.protein_g,
      d.water_oz,
      d.sleep_hours ?? "",
      d.sitrep_grade.toUpperCase(),
      `"${(d.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_sitrep_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SITREP entry?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sitrep?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeletingId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-950/40 border border-white/5 rounded-2xl">
        <p className="text-sm text-zinc-400">No historical records in `daily_sitrep_logs`.</p>
        <p className="text-xs text-zinc-500 mt-1">
          Your telemetry table will populate automatically as daily morning entries and evening debriefs are submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Recorded Telemetry Log ({data.length} entries)
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition"
          title="Export CSV"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-950/50 backdrop-blur-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900/40 text-zinc-400 font-mono text-[11px]">
              <th className="py-2.5 px-3 font-semibold">Date</th>
              <th className="py-2.5 px-3 font-semibold">Weight</th>
              <th className="py-2.5 px-3 font-semibold">7D Avg</th>
              <th className="py-2.5 px-3 font-semibold">Deficit</th>
              <th className="py-2.5 px-3 font-semibold">Steps / Mi</th>
              <th className="py-2.5 px-3 font-semibold">Protein</th>
              <th className="py-2.5 px-3 font-semibold">Water</th>
              <th className="py-2.5 px-3 font-semibold">Grade</th>
              <th className="py-2.5 px-3 font-semibold">Notes</th>
              <th className="py-2.5 px-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-zinc-300">
            {data.map((row) => {
              const isPass = row.sitrep_grade === "pass";
              const isPartial = row.sitrep_grade === "partial";
              const isDeficitPositive = row.kcal_deficit >= 350;

              return (
                <tr key={row.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-2 px-3 font-medium text-zinc-200 whitespace-nowrap">
                    {row.log_date}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-sky-300">
                    {row.morning_weight_lbs ? `${row.morning_weight_lbs} lbs` : "—"}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-amber-300">
                    {row.moving_avg_7d_lbs ? `${row.moving_avg_7d_lbs} lbs` : "—"}
                  </td>
                  <td className={`py-2 px-3 whitespace-nowrap font-bold ${
                    isDeficitPositive ? "text-emerald-400" : row.kcal_deficit > 0 ? "text-amber-400" : "text-rose-400"
                  }`}>
                    {row.kcal_deficit > 0 ? `+${row.kcal_deficit}` : row.kcal_deficit} kcal
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-zinc-300">
                    {row.total_steps.toLocaleString()} ({row.miles} mi)
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-indigo-300">
                    {row.protein_g}g
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-cyan-300">
                    {row.water_oz} oz
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPass
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : isPartial
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {isPass ? (
                        <CheckCircle2 size={10} />
                      ) : isPartial ? (
                        <AlertTriangle size={10} />
                      ) : (
                        <ShieldAlert size={10} />
                      )}
                      {row.sitrep_grade}
                    </span>
                  </td>
                  <td className="py-2 px-3 max-w-[140px] truncate text-zinc-400 text-[11px] font-sans">
                    {row.notes || "—"}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(row)}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition"
                          title="Edit"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
