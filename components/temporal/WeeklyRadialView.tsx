"use client";

import React, { useMemo } from "react";
import { ConcentricTelemetry, DaySegment } from "@/lib/temporalTypes";

interface WeeklyRadialViewProps {
  weekNumber: number;
  dateSpanLabel: string;
  telemetry: ConcentricTelemetry;
  weekDays: DaySegment[];
  onSelectDay: (dateStr: string) => void;
}

export function WeeklyRadialView({
  weekNumber,
  dateSpanLabel,
  telemetry,
  weekDays,
  onSelectDay,
}: WeeklyRadialViewProps) {
  const VB_SIZE = 760;
  const CX = 380;
  const CY = 380;

  // Concentric Radial Radii
  const R_CORE = 112;
  const R_TRACK_HEALTH = 126;
  const R_TRACK_WORK = 138;
  const R_TRACK_SLEEP = 150;
  const R_ORBIT_INNER = 188;
  const R_ORBIT_OUTER = 308;
  const R_FOCAL_OUTER = 330; // Active today enlarges outward

  const cHealth = 2 * Math.PI * R_TRACK_HEALTH;
  const cWork = 2 * Math.PI * R_TRACK_WORK;
  const cSleep = 2 * Math.PI * R_TRACK_SLEEP;

  // Construct 7 curved orbital segments representing days MON through SUN
  const daySegments = useMemo(() => {
    const totalDays = 7;
    const spanDeg = 360 / totalDays;

    return weekDays.map((day, idx) => {
      const isToday = day.isActiveToday;
      const startDeg = idx * spanDeg - 90;
      const endDeg = startDeg + spanDeg - 3.5;
      const startAngle = (startDeg * Math.PI) / 180;
      const endAngle = (endDeg * Math.PI) / 180;
      const midAngle = (startAngle + endAngle) / 2;

      const outerR = isToday ? R_FOCAL_OUTER : R_ORBIT_OUTER;
      const innerR = R_ORBIT_INNER;

      const x1 = CX + innerR * Math.cos(startAngle);
      const y1 = CY + innerR * Math.sin(startAngle);
      const x2 = CX + outerR * Math.cos(startAngle);
      const y2 = CY + outerR * Math.sin(startAngle);

      const x3 = CX + outerR * Math.cos(endAngle);
      const y3 = CY + outerR * Math.sin(endAngle);
      const x4 = CX + innerR * Math.cos(endAngle);
      const y4 = CY + innerR * Math.sin(endAngle);

      const path = `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`;

      const labelRadius = (innerR + outerR) / 2;
      const labelX = CX + labelRadius * Math.cos(midAngle);
      const labelY = CY + labelRadius * Math.sin(midAngle);

      return {
        day,
        path,
        labelX,
        labelY,
        midAngle,
        isToday,
        bbox: {
          x: Math.min(x1, x2, x3, x4),
          y: Math.min(y1, y2, y3, y4),
          width: Math.max(x1, x2, x3, x4) - Math.min(x1, x2, x3, x4),
          height: Math.max(y1, y2, y3, y4) - Math.min(y1, y2, y3, y4),
        },
      };
    });
  }, [weekDays]);

  return (
    <div className="relative w-full flex items-center justify-center select-none">
      <svg
        viewBox={`0 0 ${VB_SIZE} ${VB_SIZE}`}
        className="w-full max-w-[720px] h-auto drop-shadow-2xl"
      >
        <defs>
          <filter id="wNeonGold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="weekCoreBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#121828" />
            <stop offset="85%" stopColor="#0B0E18" />
            <stop offset="100%" stopColor="#06080F" />
          </radialGradient>

          {daySegments.map(({ day, path }) => (
            <clipPath key={`clip-w-${day.isoDay}`} id={`clip-w-${day.isoDay}`}>
              <path d={path} />
            </clipPath>
          ))}
        </defs>

        {/* Orbit Tracks */}
        <circle cx={CX} cy={CY} r={R_ORBIT_OUTER} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={R_ORBIT_INNER} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* 7 Curved Orbital Day Segments */}
        <g>
          {daySegments.map(({ day, path, labelX, labelY, isToday, bbox }) => {
            return (
              <g
                key={day.isoDay}
                onClick={() => onSelectDay(day.dateStr)}
                className="cursor-pointer group"
              >
                {/* Photo Wedge Background with Clipping */}
                <g clipPath={`url(#clip-w-${day.isoDay})`}>
                  <image
                    href={day.mediaUrl}
                    x={bbox.x - 20}
                    y={bbox.y - 20}
                    width={bbox.width + 40}
                    height={bbox.height + 40}
                    preserveAspectRatio="xMidYMid slice"
                    opacity={isToday ? 0.95 : 0.45}
                    className="group-hover:opacity-95 transition-opacity"
                  />
                  <rect
                    x={bbox.x - 30}
                    y={bbox.y - 30}
                    width={bbox.width + 60}
                    height={bbox.height + 60}
                    fill={isToday ? "rgba(255, 153, 0, 0.22)" : "rgba(8, 12, 22, 0.65)"}
                  />
                </g>

                {/* Glowing Outer Stroke */}
                <path
                  d={path}
                  fill="none"
                  stroke={day.statusColor}
                  strokeWidth={isToday ? 3.8 : 1.8}
                  filter={isToday ? "url(#wNeonGold)" : undefined}
                />

                {/* Day Header & Number */}
                <text
                  x={labelX}
                  y={labelY - 8}
                  textAnchor="middle"
                  fill={isToday ? "#FFB347" : "#FFFFFF"}
                  fontSize={14}
                  fontWeight={800}
                  letterSpacing="0.08em"
                >
                  {day.dayName}
                </text>
                <text
                  x={labelX}
                  y={labelY + 16}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={20}
                  fontWeight={900}
                >
                  {day.dateNum}
                </text>

                {isToday && (
                  <text
                    x={labelX}
                    y={labelY - 26}
                    textAnchor="middle"
                    fill="#FFB347"
                    fontSize={9}
                    fontWeight={800}
                    letterSpacing="0.1em"
                  >
                    ACTIVE TODAY
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Concentric Weekly Progress Tracks */}
        <g className="pointer-events-none -rotate-90 origin-center">
          <circle cx={CX} cy={CY} r={R_TRACK_HEALTH} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.2" />
          <circle
            cx={CX}
            cy={CY}
            r={R_TRACK_HEALTH}
            fill="none"
            stroke="#99FF33"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={`${(telemetry.healthPct / 100) * cHealth} ${cHealth}`}
          />

          <circle cx={CX} cy={CY} r={R_TRACK_WORK} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.2" />
          <circle
            cx={CX}
            cy={CY}
            r={R_TRACK_WORK}
            fill="none"
            stroke="#FF9900"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={`${(telemetry.workPct / 100) * cWork} ${cWork}`}
            filter="url(#wNeonGold)"
          />

          <circle cx={CX} cy={CY} r={R_TRACK_SLEEP} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.2" />
          <circle
            cx={CX}
            cy={CY}
            r={R_TRACK_SLEEP}
            fill="none"
            stroke="#0088FF"
            strokeWidth="3.2"
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
            fill="url(#weekCoreBg)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
            filter="drop-shadow(0 0 25px rgba(0,0,0,0.85))"
          />

          <text
            x={CX}
            y={CY - 14}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={28}
            fontWeight={900}
            letterSpacing="-0.02em"
            style={{ filter: "drop-shadow(0 0 12px rgba(226, 241, 255, 0.65))" }}
          >
            WEEK {weekNumber}
          </text>

          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            fill="#FFB347"
            fontSize={11.5}
            fontWeight={700}
            letterSpacing="0.12em"
          >
            {dateSpanLabel.toUpperCase()}
          </text>

          {/* Micro Telemetry Legend */}
          <g transform={`translate(${CX - 62}, ${CY + 34})`} className="text-[8.5px] font-mono">
            <text x="0" y="0" fill="#99FF33" fontWeight="700">Health {telemetry.healthPct}%</text>
            <text x="50" y="0" fill="#FF9900" fontWeight="700">Work {telemetry.workPct}%</text>
            <text x="96" y="0" fill="#0088FF" fontWeight="700">Sleep {telemetry.sleepPct}%</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

