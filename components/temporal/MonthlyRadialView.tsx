"use client";

import React, { useMemo } from "react";
import { ConcentricTelemetry, DaySegment, MonthNode } from "@/lib/temporalTypes";

interface MonthlyRadialViewProps {
  year: number;
  monthName: string;
  telemetry: ConcentricTelemetry;
  monthNodes: MonthNode[];
  activeWeekDays: DaySegment[];
  onSelectDate: (dateStr: string) => void;
  onDrillDownDay: (dateStr: string) => void;
}

export function MonthlyRadialView({
  year,
  monthName,
  telemetry,
  monthNodes,
  activeWeekDays,
  onSelectDate,
  onDrillDownDay,
}: MonthlyRadialViewProps) {
  const VB_SIZE = 760;
  const CX = 380;
  const CY = 380;

  // Concentric Radial Radii
  const R_CORE = 104;
  const R_TELEMETRY_HEALTH = 118;
  const R_TELEMETRY_WORK = 128;
  const R_TELEMETRY_SLEEP = 138;
  const R_NODES_TRACK = 168;
  const R_WEEK_INNER = 208;
  const R_WEEK_OUTER = 312;

  // Layout 31 Date Nodes in a 360 circle
  const circularNodes = useMemo(() => {
    const totalDays = monthNodes.length;
    return monthNodes.map((node, i) => {
      // Start from top (-90 deg)
      const angle = ((i / totalDays) * 360 - 90) * (Math.PI / 180);
      const x = CX + R_NODES_TRACK * Math.cos(angle);
      const y = CY + R_NODES_TRACK * Math.sin(angle);
      return {
        ...node,
        x,
        y,
        angle,
      };
    });
  }, [monthNodes]);

  // Layout 7 Active Sprint Day Wedges on the Outer Ring
  const weekArcs = useMemo(() => {
    return activeWeekDays.map((day, idx) => {
      // 7 segments = ~51.4 degrees each
      const spanDeg = 360 / 7;
      const startDeg = idx * spanDeg - 90;
      const endDeg = startDeg + spanDeg - 3; // tiny gap
      const startAngle = (startDeg * Math.PI) / 180;
      const endAngle = (endDeg * Math.PI) / 180;
      const midAngle = (startAngle + endAngle) / 2;

      const x1 = CX + R_WEEK_INNER * Math.cos(startAngle);
      const y1 = CY + R_WEEK_INNER * Math.sin(startAngle);
      const x2 = CX + R_WEEK_OUTER * Math.cos(startAngle);
      const y2 = CY + R_WEEK_OUTER * Math.sin(startAngle);

      const x3 = CX + R_WEEK_OUTER * Math.cos(endAngle);
      const y3 = CY + R_WEEK_OUTER * Math.sin(endAngle);
      const x4 = CX + R_WEEK_INNER * Math.cos(endAngle);
      const y4 = CY + R_WEEK_INNER * Math.sin(endAngle);

      const path = `M ${x1} ${y1} L ${x2} ${y2} A ${R_WEEK_OUTER} ${R_WEEK_OUTER} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${R_WEEK_INNER} ${R_WEEK_INNER} 0 0 0 ${x1} ${y1} Z`;

      const labelRadius = (R_WEEK_INNER + R_WEEK_OUTER) / 2;
      const labelX = CX + labelRadius * Math.cos(midAngle);
      const labelY = CY + labelRadius * Math.sin(midAngle);

      return {
        day,
        path,
        labelX,
        labelY,
        midAngle,
        bbox: {
          x: Math.min(x1, x2, x3, x4),
          y: Math.min(y1, y2, y3, y4),
          width: Math.max(x1, x2, x3, x4) - Math.min(x1, x2, x3, x4),
          height: Math.max(y1, y2, y3, y4) - Math.min(y1, y2, y3, y4),
        },
      };
    });
  }, [activeWeekDays]);

  const cHealth = 2 * Math.PI * R_TELEMETRY_HEALTH;
  const cWork = 2 * Math.PI * R_TELEMETRY_WORK;
  const cSleep = 2 * Math.PI * R_TELEMETRY_SLEEP;

  return (
    <div className="relative w-full flex items-center justify-center select-none">
      <svg
        viewBox={`0 0 ${VB_SIZE} ${VB_SIZE}`}
        className="w-full max-w-[720px] h-auto drop-shadow-2xl"
      >
        <defs>
          <filter id="mNeonGold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="mNeonBlue" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="monthCoreBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#121727" />
            <stop offset="85%" stopColor="#0B0E18" />
            <stop offset="100%" stopColor="#06080F" />
          </radialGradient>

          {weekArcs.map(({ day, path }) => (
            <clipPath key={`clip-m-${day.isoDay}`} id={`clip-m-${day.isoDay}`}>
              <path d={path} />
            </clipPath>
          ))}
        </defs>

        {/* Orbit Guides */}
        <circle cx={CX} cy={CY} r={R_WEEK_OUTER} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={R_WEEK_INNER} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={R_NODES_TRACK} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Outer 7-Day Active Sprint Wedges */}
        <g>
          {weekArcs.map(({ day, path, labelX, labelY, bbox }) => {
            const isToday = day.isActiveToday;
            return (
              <g
                key={day.isoDay}
                onClick={() => onDrillDownDay(day.dateStr)}
                className="cursor-pointer group"
              >
                <g clipPath={`url(#clip-m-${day.isoDay})`}>
                  <image
                    href={day.mediaUrl}
                    x={bbox.x - 20}
                    y={bbox.y - 20}
                    width={bbox.width + 40}
                    height={bbox.height + 40}
                    preserveAspectRatio="xMidYMid slice"
                    opacity={isToday ? 0.9 : 0.45}
                    className="group-hover:opacity-95 transition-opacity"
                  />
                  <rect
                    x={bbox.x - 30}
                    y={bbox.y - 30}
                    width={bbox.width + 60}
                    height={bbox.height + 60}
                    fill={isToday ? "rgba(255, 153, 0, 0.2)" : "rgba(8, 12, 22, 0.65)"}
                  />
                </g>

                <path
                  d={path}
                  fill="none"
                  stroke={day.statusColor}
                  strokeWidth={isToday ? 3.5 : 1.6}
                  filter={isToday ? "url(#mNeonGold)" : undefined}
                />

                {/* Day Header & Number */}
                <text
                  x={labelX}
                  y={labelY - 6}
                  textAnchor="middle"
                  fill={isToday ? "#FFB347" : "#FFFFFF"}
                  fontSize={13}
                  fontWeight={800}
                  letterSpacing="0.06em"
                >
                  {day.dayName}
                </text>
                <text
                  x={labelX}
                  y={labelY + 13}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={17}
                  fontWeight={900}
                >
                  {day.dateNum}
                </text>
              </g>
            );
          })}
        </g>

        {/* Circular Date Node Matrix (1–31) */}
        <g>
          {circularNodes.map((node) => {
            const isToday = node.isToday;
            const rNode = isToday ? 11 : 8.5;
            return (
              <g
                key={node.dayOfMonth}
                onClick={() => onSelectDate(node.dateStr)}
                className="cursor-pointer group"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={rNode}
                  fill={
                    isToday
                      ? "rgba(255, 153, 0, 0.35)"
                      : node.isPast
                      ? "rgba(0, 136, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.05)"
                  }
                  stroke={node.statusColor}
                  strokeWidth={isToday ? 2.5 : 1.2}
                  filter={isToday ? "url(#mNeonGold)" : undefined}
                />
                <text
                  x={node.x}
                  y={node.y + 3.2}
                  textAnchor="middle"
                  fill={isToday ? "#FFFFFF" : node.isPast ? "#60A5FA" : "rgba(255,255,255,0.7)"}
                  fontSize={isToday ? 9.5 : 8}
                  fontWeight={isToday ? 800 : 600}
                >
                  {node.dayOfMonth}
                </text>

                {typeof node.eventsCount === "number" && node.eventsCount > 0 && (
                  <circle
                    cx={node.x}
                    cy={node.y - (isToday ? 15 : 12)}
                    r={2.4}
                    fill={isToday ? "#FFB347" : "#58A6FF"}
                    stroke="#090A0F"
                    strokeWidth={0.8}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* 3 Concentric Biometric Consistency Tracks (Health, Work, Sleep) */}
        <g className="pointer-events-none -rotate-90 origin-center">
          <circle cx={CX} cy={CY} r={R_TELEMETRY_HEALTH} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_HEALTH}
            fill="none"
            stroke="#99FF33"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(telemetry.healthPct / 100) * cHealth} ${cHealth}`}
          />

          <circle cx={CX} cy={CY} r={R_TELEMETRY_WORK} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_WORK}
            fill="none"
            stroke="#FF9900"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(telemetry.workPct / 100) * cWork} ${cWork}`}
          />

          <circle cx={CX} cy={CY} r={R_TELEMETRY_SLEEP} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_SLEEP}
            fill="none"
            stroke="#0088FF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(telemetry.sleepPct / 100) * cSleep} ${cSleep}`}
          />
        </g>

        {/* Central Core Display */}
        <g className="select-none">
          <circle
            cx={CX}
            cy={CY}
            r={R_CORE}
            fill="url(#monthCoreBg)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
            filter="drop-shadow(0 0 25px rgba(0,0,0,0.85))"
          />

          <text
            x={CX}
            y={CY - 14}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={23}
            fontWeight={900}
            letterSpacing="0.04em"
            style={{ filter: "drop-shadow(0 0 10px rgba(226, 241, 255, 0.6))" }}
          >
            {monthName.toUpperCase()} {year}
          </text>

          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            fill="#FFB347"
            fontSize={11}
            fontWeight={700}
            letterSpacing="0.14em"
          >
            WEEKLY & MONTHLY VIEW
          </text>

          {/* Micro Telemetry Legend */}
          <g transform={`translate(${CX - 62}, ${CY + 32})`} className="text-[8.5px] font-mono">
            <text x="0" y="0" fill="#99FF33" fontWeight="700">Health {telemetry.healthPct}%</text>
            <text x="50" y="0" fill="#FF9900" fontWeight="700">Work {telemetry.workPct}%</text>
            <text x="96" y="0" fill="#0088FF" fontWeight="700">Sleep {telemetry.sleepPct}%</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

