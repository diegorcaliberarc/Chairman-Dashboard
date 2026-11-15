"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts";
import { DailySitrepLog } from "@/lib/commandTypes";

interface WeightTrajectoryChartProps {
  data: DailySitrepLog[];
  targetWeightLbs?: number;
}

export function WeightTrajectoryChart({
  data,
  targetWeightLbs = 155.0,
}: WeightTrajectoryChartProps) {
  // Sort ascending by date for chronological time-series
  const chartData = React.useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
      .filter((d) => d.morning_weight_lbs !== null)
      .map((d) => ({
        date: d.log_date.slice(5), // "MM-DD"
        fullDate: d.log_date,
        weight: d.morning_weight_lbs,
        movingAvg: d.moving_avg_7d_lbs ?? d.morning_weight_lbs,
        target: targetWeightLbs,
      }));
  }, [data, targetWeightLbs]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-zinc-950/40 border border-white/5 text-zinc-400 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 text-lg font-mono">
          ⚖️
        </div>
        <div className="text-sm font-semibold text-zinc-200">No Weight Telemetry Recorded</div>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Log your morning scale weight in the Daily Entry Form above to begin plotting your 7-day moving average against the 155.0 lbs target line.
        </p>
      </div>
    );
  }

  // Calculate dynamic Y domain
  const weights = chartData.map((d) => d.weight as number);
  const minW = Math.floor(Math.min(...weights, targetWeightLbs) - 2);
  const maxW = Math.ceil(Math.max(...weights, targetWeightLbs) + 2);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 18, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            domain={[minW, maxW]}
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            unit=" lbs"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-3 bg-zinc-950/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1">
                    <div className="font-mono text-zinc-400 font-semibold">{item.fullDate}</div>
                    <div className="text-sky-300 font-medium">
                      Daily Scale: <span className="font-bold text-white">{item.weight} lbs</span>
                    </div>
                    <div className="text-amber-300 font-medium">
                      7-Day Moving Avg: <span className="font-bold text-white">{item.movingAvg} lbs</span>
                    </div>
                    <div className="text-emerald-400 font-medium">
                      Target Line: <span className="font-bold text-white">{targetWeightLbs} lbs</span>
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
          {/* Target Weight Reference Line */}
          <ReferenceLine
            y={targetWeightLbs}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeWidth={1.8}
            label={{
              value: `Target ${targetWeightLbs} lbs`,
              fill: "#10b981",
              fontSize: 10,
              position: "insideTopLeft",
            }}
          />
          {/* Daily Scale Weight Line */}
          <Line
            type="monotone"
            dataKey="weight"
            name="Daily Weight"
            stroke="#38bdf8"
            strokeWidth={1.8}
            dot={{ r: 3, fill: "#0284c7", stroke: "#38bdf8", strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: "#38bdf8" }}
          />
          {/* 7-Day Moving Average Glowing Line */}
          <Line
            type="monotone"
            dataKey="movingAvg"
            name="7-Day Moving Avg"
            stroke="#f59e0b"
            strokeWidth={2.8}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
