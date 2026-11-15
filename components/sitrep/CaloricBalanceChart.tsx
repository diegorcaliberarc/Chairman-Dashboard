"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { DailySitrepLog } from "@/lib/commandTypes";

interface CaloricBalanceChartProps {
  data: DailySitrepLog[];
}

export function CaloricBalanceChart({ data }: CaloricBalanceChartProps) {
  const chartData = React.useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
      .filter((d) => d.calories_eaten > 0 || d.kcal_burned > 0)
      .map((d) => ({
        date: d.log_date.slice(5),
        fullDate: d.log_date,
        eaten: d.calories_eaten,
        burned: d.kcal_burned,
        deficit: d.kcal_deficit,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-zinc-950/40 border border-white/5 text-zinc-400 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 text-lg font-mono">
          🔥
        </div>
        <div className="text-sm font-semibold text-zinc-200">No Caloric Energy Data Recorded</div>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Log calories eaten and total expenditure in your daily SITREP to visualize your energy balance and deficit margin.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 18, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            unit=" kcal"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const isHealthyDeficit = item.deficit >= 350;
                return (
                  <div className="p-3 bg-zinc-950/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1">
                    <div className="font-mono text-zinc-400 font-semibold">{item.fullDate}</div>
                    <div className="text-rose-400 font-medium">
                      Calories In: <span className="font-bold text-white">{item.eaten.toLocaleString()} kcal</span>
                    </div>
                    <div className="text-amber-400 font-medium">
                      Kcal Burned: <span className="font-bold text-white">{item.burned.toLocaleString()} kcal</span>
                    </div>
                    <div className={isHealthyDeficit ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                      Net Deficit: {item.deficit > 0 ? `+${item.deficit.toLocaleString()}` : item.deficit.toLocaleString()} kcal
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
            y={2000}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeDasharray="3 3"
            label={{ value: "2000 Cal Base", fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
          />
          <Bar
            dataKey="eaten"
            name="Calories Eaten"
            fill="#f43f5e"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="burned"
            name="Kcal Burned"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
