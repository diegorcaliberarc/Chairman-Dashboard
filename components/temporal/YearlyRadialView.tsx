"use client";

import React, { useMemo } from "react";
import { ConcentricTelemetry, SeasonCard } from "@/lib/temporalTypes";

interface YearlyRadialViewProps {
  selectedYear: number;
  activeMonth: number; // 0..11
  telemetry: ConcentricTelemetry;
  seasons: SeasonCard[];
  onSelectMonth: (monthIndex: number) => void;
  onSelectSeason: (seasonId: string) => void;
}

export function YearlyRadialView({
  selectedYear,
  activeMonth,
  telemetry,
  seasons,
  onSelectMonth,
  onSelectSeason,
}: YearlyRadialViewProps) {
  const VB_SIZE = 760;
  const CX = 380;
  const CY = 380;

  // Concentric Radial Radii
  const R_CORE = 104;
  const R_TELEMETRY_HEALTH = 120;
  const R_TELEMETRY_WORK = 132;
  const R_TELEMETRY_SLEEP = 144;
  const R_MONTH_INNER = 162;
  const R_MONTH_OUTER = 208;
  const R_SEASON_INNER = 224;
  const R_SEASON_OUTER = 320;

  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];

  // 12 Months Arcs (30 degrees each)
  const monthArcs = useMemo(() => {
    return monthNames.map((name, i) => {
      const startAngle = (i * 30 - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * 30 - 90) * (Math.PI / 180);
      const midAngle = ((startAngle + endAngle) / 2);

      const x1 = CX + R_MONTH_INNER * Math.cos(startAngle);
      const y1 = CY + R_MONTH_INNER * Math.sin(startAngle);
      const x2 = CX + R_MONTH_OUTER * Math.cos(startAngle);
      const y2 = CY + R_MONTH_OUTER * Math.sin(startAngle);

      const x3 = CX + R_MONTH_OUTER * Math.cos(endAngle);
      const y3 = CY + R_MONTH_OUTER * Math.sin(endAngle);
      const x4 = CX + R_MONTH_INNER * Math.cos(endAngle);
      const y4 = CY + R_MONTH_INNER * Math.sin(endAngle);

      const labelRadius = (R_MONTH_INNER + R_MONTH_OUTER) / 2;
      const labelX = CX + labelRadius * Math.cos(midAngle);
      const labelY = CY + labelRadius * Math.sin(midAngle);

      const path = `M ${x1} ${y1} L ${x2} ${y2} A ${R_MONTH_OUTER} ${R_MONTH_OUTER} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${R_MONTH_INNER} ${R_MONTH_INNER} 0 0 0 ${x1} ${y1} Z`;

      const isCurrent = i === activeMonth;
      const isPast = i < activeMonth;

      return {
        name,
        monthIndex: i,
        path,
        labelX,
        labelY,
        midAngle,
        isCurrent,
        isPast,
      };
    });
  }, [activeMonth]);

  // 4 Seasonal Quadrants (90 degrees each)
  const seasonArcs = useMemo(() => {
    return seasons.map((season, idx) => {
      // Winter (Dec, Jan, Feb): -120 to -30
      // Spring (Mar, Apr, May): -30 to 60
      // Summer (Jun, Jul, Aug): 60 to 150
      // Fall (Sep, Oct, Nov): 150 to 240
      const startDeg = -120 + idx * 90;
      const endDeg = startDeg + 86; // small gap
      const startAngle = (startDeg * Math.PI) / 180;
      const endAngle = (endDeg * Math.PI) / 180;
      const midAngle = (startAngle + endAngle) / 2;

      const x1 = CX + R_SEASON_INNER * Math.cos(startAngle);
      const y1 = CY + R_SEASON_INNER * Math.sin(startAngle);
      const x2 = CX + R_SEASON_OUTER * Math.cos(startAngle);
      const y2 = CY + R_SEASON_OUTER * Math.sin(startAngle);

      const x3 = CX + R_SEASON_OUTER * Math.cos(endAngle);
      const y3 = CY + R_SEASON_OUTER * Math.sin(endAngle);
      const x4 = CX + R_SEASON_INNER * Math.cos(endAngle);
      const y4 = CY + R_SEASON_INNER * Math.sin(endAngle);

      const path = `M ${x1} ${y1} L ${x2} ${y2} A ${R_SEASON_OUTER} ${R_SEASON_OUTER} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${R_SEASON_INNER} ${R_SEASON_INNER} 0 0 0 ${x1} ${y1} Z`;

      const labelRadius = R_SEASON_OUTER + 16;
      const labelX = CX + labelRadius * Math.cos(midAngle);
      const labelY = CY + labelRadius * Math.sin(midAngle);

      return {
        season,
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
  }, [seasons]);

  // Telemetry Arc lengths
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
          <filter id="neonGoldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neonBlueGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="yearCoreBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#111625" />
            <stop offset="85%" stopColor="#0B0E17" />
            <stop offset="100%" stopColor="#070910" />
          </radialGradient>

          {seasonArcs.map(({ season, path }) => (
            <clipPath key={`clip-${season.id}`} id={`season-clip-${season.id}`}>
              <path d={path} />
            </clipPath>
          ))}
        </defs>

        {/* Outer Background Subtle Guides */}
        <circle cx={CX} cy={CY} r={R_SEASON_OUTER} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={R_MONTH_OUTER} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={R_MONTH_INNER} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* 4 Outer Seasonal Quadrant Wedges */}
        <g>
          {seasonArcs.map(({ season, path, labelX, labelY, midAngle, bbox }) => {
            const isFocal = season.isActiveCurrent;
            const cosM = Math.cos(midAngle);
            const anchor = Math.abs(cosM) < 0.2 ? "middle" : cosM > 0 ? "start" : "end";

            return (
              <g
                key={season.id}
                onClick={() => onSelectSeason(season.id)}
                className="cursor-pointer group transition-all"
              >
                {/* Photo Wedge Background with Clipping */}
                <g clipPath={`url(#season-clip-${season.id})`}>
                  <image
                    href={season.mediaUrl}
                    x={bbox.x - 30}
                    y={bbox.y - 30}
                    width={bbox.width + 60}
                    height={bbox.height + 60}
                    preserveAspectRatio="xMidYMid slice"
                    opacity={isFocal ? 0.85 : 0.45}
                    className="group-hover:opacity-90 transition-opacity duration-300"
                  />
                  {/* Glassmorphic Gradient Overlay */}
                  <rect
                    x={bbox.x - 40}
                    y={bbox.y - 40}
                    width={bbox.width + 80}
                    height={bbox.height + 80}
                    fill={
                      isFocal
                        ? "rgba(255, 153, 0, 0.18)"
                        : "rgba(10, 14, 26, 0.65)"
                    }
                  />
                </g>

                {/* Glowing Outer Stroke */}
                <path
                  d={path}
                  fill="none"
                  stroke={season.accentColor}
                  strokeWidth={isFocal ? 3.5 : 1.8}
                  filter={isFocal ? "url(#neonGoldGlow)" : undefined}
                  className="transition-all"
                />

                {/* Outer Season Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  fill={isFocal ? "#FFB347" : "#FFFFFF"}
                  fontSize={13}
                  fontWeight={800}
                  letterSpacing="0.08em"
                  className="drop-shadow-md"
                >
                  {season.title}
                </text>
                <text
                  x={labelX}
                  y={labelY + 14}
                  textAnchor={anchor}
                  fill="rgba(226, 241, 255, 0.7)"
                  fontSize={9.5}
                  fontWeight={600}
                >
                  {season.subtitle}
                </text>
              </g>
            );
          })}
        </g>

        {/* 12-Month Ring */}
        <g>
          {monthArcs.map((m) => {
            const isTodayMonth = m.isCurrent;
            return (
              <g
                key={m.name}
                onClick={() => onSelectMonth(m.monthIndex)}
                className="cursor-pointer group"
              >
                <path
                  d={m.path}
                  fill={
                    isTodayMonth
                      ? "rgba(255, 153, 0, 0.28)"
                      : m.isPast
                      ? "rgba(0, 136, 255, 0.12)"
                      : "rgba(255, 255, 255, 0.03)"
                  }
                  stroke={
                    isTodayMonth
                      ? "#FF9900"
                      : m.isPast
                      ? "rgba(0, 136, 255, 0.4)"
                      : "rgba(255, 255, 255, 0.1)"
                  }
                  strokeWidth={isTodayMonth ? 2.5 : 1}
                  filter={isTodayMonth ? "url(#neonGoldGlow)" : undefined}
                  className="group-hover:fill-white/10 transition-colors"
                />
                <text
                  x={m.labelX}
                  y={m.labelY + 3.5}
                  textAnchor="middle"
                  fill={isTodayMonth ? "#FFD074" : m.isPast ? "#60A5FA" : "rgba(255,255,255,0.65)"}
                  fontSize={isTodayMonth ? 10.5 : 9}
                  fontWeight={isTodayMonth ? 800 : 600}
                  letterSpacing="0.06em"
                >
                  {m.name}
                </text>
                {isTodayMonth && (
                  <circle
                    cx={m.labelX}
                    cy={m.labelY - 11}
                    r={2.8}
                    fill="#FF9900"
                    filter="url(#neonGoldGlow)"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Concentric Macro Telemetry Tracking Rings (Health, Work, Sleep) */}
        <g className="pointer-events-none -rotate-90 origin-center">
          {/* Health Ring (Emerald / Gold) */}
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_HEALTH}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3.2"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_HEALTH}
            fill="none"
            stroke="#99FF33"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={`${(telemetry.healthPct / 100) * cHealth} ${cHealth}`}
            filter="url(#neonGoldGlow)"
          />

          {/* Work Ring (Amber-Gold / Cyan) */}
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_WORK}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3.2"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_WORK}
            fill="none"
            stroke="#FF9900"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={`${(telemetry.workPct / 100) * cWork} ${cWork}`}
          />

          {/* Sleep Ring (Purple / Blue) */}
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_SLEEP}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3.2"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_TELEMETRY_SLEEP}
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
            fill="url(#yearCoreBg)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
            filter="drop-shadow(0 0 25px rgba(0,0,0,0.8))"
          />

          {/* Year Title */}
          <text
            x={CX}
            y={CY - 16}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={36}
            fontWeight={900}
            letterSpacing="-0.03em"
            style={{
              filter: "drop-shadow(0 0 12px rgba(226, 241, 255, 0.65))",
            }}
          >
            {selectedYear}
          </text>

          {/* Subtitle */}
          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            fill="#FFB347"
            fontSize={11.5}
            fontWeight={700}
            letterSpacing="0.14em"
          >
            YEARLY VIEW / 12 MONTHS
          </text>

          {/* Micro Telemetry Legend in Core */}
          <g transform={`translate(${CX - 60}, ${CY + 32})`} className="text-[8.5px] font-mono">
            <text x="0" y="0" fill="#99FF33" fontWeight="700">Health {telemetry.healthPct}%</text>
            <text x="50" y="0" fill="#FF9900" fontWeight="700">Work {telemetry.workPct}%</text>
            <text x="96" y="0" fill="#0088FF" fontWeight="700">Sleep {telemetry.sleepPct}%</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

