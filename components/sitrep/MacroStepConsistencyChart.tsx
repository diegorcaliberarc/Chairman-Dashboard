"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { DailySitrepLog } from "@/lib/commandTypes";

interface MacroStepConsistencyChartProps {
  data: DailySitrepLog[];
}

export function MacroStepConsistencyChart({ data }: MacroStepConsistencyChartProps) {
  const chartData = React.useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
      .filter((d) => d.total_steps > 0 || d.protein_g > 0)
      .map((d) => ({
        date: d.log_date.slice(5),
        fullDate: d.log_date,
        steps: d.total_steps,
        miles: d.miles,
        protein: d.protein_g,
        water: d.water_oz,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-zinc-950/40 border border-white/5 text-zinc-400 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 text-lg font-mono">
          🏃
        </div>
        <div className="text-sm font-semibold text-zinc-200">No Habit Consistency Logs</div>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Record daily step counts and protein grams to verify that your execution matches the 10,000 steps and 160g target thresholds.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 12, right: 18, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          {/* Left Axis: Steps */}
          <YAxis
            yAxisId="left"
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          {/* Right Axis: Protein (g) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            unit="g"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-3 bg-zinc-950/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1">
                    <div className="font-mono text-zinc-400 font-semibold">{item.fullDate}</div>
                    <div className="text-cyan-400 font-medium">
                      Steps: <span className="font-bold text-white">{item.steps.toLocaleString()}</span> ({item.miles} mi)
                    </div>
                    <div className="text-indigo-300 font-medium">
                      Protein: <span className="font-bold text-white">{item.protein} g</span>
                    </div>
                    <div className="text-sky-300 font-medium">
                      Water: <span className="font-bold text-white">{item.water} oz</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
          />
          <ReferenceLine
            yAxisId="left"
            y={10000}
            stroke="#06b6d4"
            strokeDasharray="3 3"
            label={{ value: "10k Step Baseline", fill: "#06b6d4", fontSize: 9 }}
          />
          <ReferenceLine
            yAxisId="right"
            y={160}
            stroke="#818cf8"
            strokeDasharray="3 3"
            label={{ value: "160g Protein", fill: "#818cf8", fontSize: 9, position: "insideBottomRight" }}
          />
          <Bar
            yAxisId="left"
            dataKey="steps"
            name="Daily Steps"
            fill="#06b6d4"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            opacity={0.85}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="protein"
            name="Protein (g)"
            stroke="#a855f7"
            strokeWidth={2.4}
            dot={{ r: 3, fill: "#7e22ce", stroke: "#a855f7", strokeWidth: 1.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
