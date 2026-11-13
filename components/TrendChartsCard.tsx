"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingDown, Activity, Dumbbell, Calendar, Flame } from "lucide-react";

export interface TrendDataPoint {
  date: string;
  displayDate: string;
  weight: number | null;
  movingAvg: number | null;
  targetWeight: number;
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  steps: number;
}

interface TrendChartsCardProps {
  trends: TrendDataPoint[];
  selectedRange: "7D" | "30D" | "All";
  onRangeChange: (r: "7D" | "30D" | "All") => void;
}

export function TrendChartsCard({
  trends,
  selectedRange,
  onRangeChange,
}: TrendChartsCardProps) {
  const [activeChart, setActiveChart] = useState<"weight" | "calories" | "protein">("weight");

  return (
    <div className="rounded-3xl bg-[#141418] border border-[#1E1E24] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-5">
      {/* Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E24]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Performance & Body Composition Trends
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              7-Day Moving Average toward 155.0 lbs • Calorie & Protein Adherence
            </p>
          </div>
        </div>

        {/* Timeframe & Chart Selector Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-[#0A0A0C] p-1 rounded-2xl border border-[#1E1E24] text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveChart("weight")}
              className={`px-3 py-1 rounded-xl transition-all ${
                activeChart === "weight"
                  ? "bg-[#1E1E24] text-emerald-400 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Weight & 7D MA
            </button>
            <button
              type="button"
              onClick={() => setActiveChart("calories")}
              className={`px-3 py-1 rounded-xl transition-all ${
                activeChart === "calories"
                  ? "bg-[#1E1E24] text-amber-400 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Calories vs Target
            </button>
            <button
              type="button"
              onClick={() => setActiveChart("protein")}
              className={`px-3 py-1 rounded-xl transition-all ${
                activeChart === "protein"
                  ? "bg-[#1E1E24] text-cyan-400 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Protein Floor
            </button>
          </div>

          {/* Timeframe Filter (7D, 30D, All) */}
          <div className="flex items-center gap-1 bg-[#0A0A0C] p-1 rounded-2xl border border-[#1E1E24] text-xs font-mono">
            {(["7D", "30D", "All"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  selectedRange === r
                    ? "bg-[#1E1E24] text-zinc-100 font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[280px] w-full pt-2">
        {/* CHART 1: Weight & 7-Day Moving Average */}
        {activeChart === "weight" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#71717a"
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
              />
              <YAxis
                domain={["dataMin - 2", "dataMax + 2"]}
                stroke="#71717a"
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0C",
                  borderColor: "#1E1E24",
                  borderRadius: "16px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <ReferenceLine
                y={155.0}
                label={{ value: "155.0 Target Goal", fill: "#10b981", fontSize: 10, position: "top" }}
                stroke="#10b981"
                strokeDasharray="4 4"
              />
              {/* Daily Weight (Thin dashed line) */}
              <Line
                type="monotone"
                dataKey="weight"
                name="Daily Scale Weight"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={{ r: 2, fill: "#94a3b8" }}
              />
              {/* 7-Day Moving Average (Thick solid line) */}
              <Line
                type="monotone"
                dataKey="movingAvg"
                name="7-Day Moving Avg"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* CHART 2: Calorie Adherence vs 1,700 kcal */}
        {activeChart === "calories" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#71717a"
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
              />
              <YAxis
                domain={[0, 2400]}
                stroke="#71717a"
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0C",
                  borderColor: "#1E1E24",
                  borderRadius: "16px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <ReferenceLine
                y={1700}
                label={{ value: "1,700 kcal Ceiling", fill: "#f59e0b", fontSize: 10, position: "top" }}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Bar
                dataKey="calories"
                name="Total Calories (kcal)"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* CHART 3: Protein Floor Consistency vs 180g */}
        {activeChart === "protein" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#71717a"
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
              />
              <YAxis
                domain={[0, 240]}
                stroke="#71717a"
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0C",
                  borderColor: "#1E1E24",
                  borderRadius: "16px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <ReferenceLine
                y={180}
                label={{ value: "180g Protein Floor", fill: "#10b981", fontSize: 10, position: "top" }}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Bar
                dataKey="protein"
                name="Protein (grams)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between text-[10.5px] font-mono text-zinc-500 pt-1">
        <span>Goal target: 155.0 lbs recomp</span>
        <span>Automatic trend rendering (no manual spreadsheet entry)</span>
      </div>
    </div>
  );
}

