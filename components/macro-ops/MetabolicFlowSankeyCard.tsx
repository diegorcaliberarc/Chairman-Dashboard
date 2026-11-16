"use client";

import React from "react";
import { GitFork, Sparkles } from "lucide-react";

interface MetabolicFlowSankeyCardProps {
  totalCalories?: number;
}

export function MetabolicFlowSankeyCard({
  totalCalories = 1840,
}: MetabolicFlowSankeyCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-surface/80 border border-border backdrop-blur-xl relative overflow-hidden flex flex-col group shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            Metabolic &amp; Nutrient Flow Spectrum
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-background/80 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
          <span className="font-mono text-[10px] text-zinc-100 uppercase font-bold tracking-wider">
            Dynamic Stream // {totalCalories.toLocaleString()} kcal
          </span>
        </div>
      </div>

      {/* Step ribbon matching reference */}
      <div className="grid grid-cols-4 gap-1 py-1.5 px-2 bg-background/80 rounded-lg border border-border mb-2 text-[10px] font-mono font-bold uppercase text-center">
        <div className="text-sky-400 truncate flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          01. INTAKE SOURCE
        </div>
        <div className="text-cyan-400 truncate flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          02. MACRO PARTITION
        </div>
        <div className="text-amber-400 truncate flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          03. CIRCADIAN TIMING
        </div>
        <div className="text-purple-400 truncate flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          04. PHYSIO RESULT
        </div>
      </div>

      {/* SVG Visual Representation of Sankey */}
      <div className="relative w-full h-[280px] rounded-xl bg-zinc-950 border border-border p-1 overflow-hidden select-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 720 280">
          <defs>
            <linearGradient id="flow-salmon-protein" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="flow-salmon-fat" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="flow-avocado-carb" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="flow-avocado-fat" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="flow-wagyu-prot" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="flow-wagyu-carb" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="flow-whey-prot" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="flow-branzino-prot" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="flow-prot-noon" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="flow-prot-pre" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="flow-carb-pre" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="flow-fat-eve" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="flow-noon-syn" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="flow-pre-glyco" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="flow-eve-homeo" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          {/* Level 1 -> Level 2 Streams */}
          <path d="M 120 22 C 180 22, 190 35, 250 35 L 250 56 C 190 56, 180 34, 120 34 Z" fill="url(#flow-salmon-protein)" className="hover:opacity-100 transition-opacity opacity-75" />
          <path d="M 120 34 C 180 34, 190 190, 250 190 L 250 200 C 190 200, 180 42, 120 42 Z" fill="url(#flow-salmon-fat)" className="hover:opacity-100 transition-opacity opacity-60" />
          <path d="M 120 72 C 180 72, 190 115, 250 115 L 250 135 C 190 135, 180 84, 120 84 Z" fill="url(#flow-avocado-carb)" className="hover:opacity-100 transition-opacity opacity-70" />
          <path d="M 120 84 C 180 84, 190 200, 250 200 L 250 212 C 190 212, 180 94, 120 94 Z" fill="url(#flow-avocado-fat)" className="hover:opacity-100 transition-opacity opacity-65" />
          <path d="M 120 126 C 180 126, 190 56, 250 56 L 250 82 C 190 82, 180 144, 120 144 Z" fill="url(#flow-wagyu-prot)" className="hover:opacity-100 transition-opacity opacity-80" />
          <path d="M 120 144 C 180 144, 190 135, 250 135 L 250 156 C 190 156, 180 154, 120 154 Z" fill="url(#flow-wagyu-carb)" className="hover:opacity-100 transition-opacity opacity-75" />
          <path d="M 120 180 C 180 180, 190 82, 250 82 L 250 98 C 190 98, 180 196, 120 196 Z" fill="url(#flow-whey-prot)" className="hover:opacity-100 transition-opacity opacity-85" />
          <path d="M 120 224 C 180 224, 190 98, 250 98 L 250 110 C 190 110, 180 242, 120 242 Z" fill="url(#flow-branzino-prot)" className="hover:opacity-100 transition-opacity opacity-70" />
          <path d="M 120 242 C 180 242, 190 245, 250 245 L 250 260 C 190 260, 180 252, 120 252 Z" fill="#242c48" opacity="0.6" />

          {/* Level 2 -> Level 3 Streams */}
          <path d="M 360 40 C 410 40, 420 45, 470 45 L 470 75 C 420 75, 410 75, 360 75 Z" fill="url(#flow-prot-noon)" className="hover:opacity-100 transition-opacity opacity-75" />
          <path d="M 360 75 C 410 75, 420 118, 470 118 L 470 152 C 420 152, 410 110, 360 110 Z" fill="url(#flow-prot-pre)"></path>
          <path d="M 360 120 C 410 120, 420 152, 470 152 L 470 180 C 420 180, 410 148, 360 148 Z" fill="url(#flow-carb-pre)" className="hover:opacity-100 transition-opacity opacity-70" />
          <path d="M 360 148 C 410 148, 420 215, 470 215 L 470 230 C 420 230, 410 162, 360 162 Z" fill="#849495" opacity="0.4" />
          <path d="M 360 195 C 410 195, 420 230, 470 230 L 470 255 C 420 255, 410 215, 360 215 Z" fill="url(#flow-fat-eve)" className="hover:opacity-100 transition-opacity opacity-70" />

          {/* Level 3 -> Level 4 Streams */}
          <path d="M 570 50 C 605 50, 615 35, 650 35 L 650 62 C 615 62, 605 78, 570 78 Z" fill="url(#flow-noon-syn)" className="hover:opacity-100 transition-opacity opacity-85" />
          <path d="M 570 125 C 605 125, 615 95, 650 95 L 650 135 C 615 135, 605 160, 570 160 Z" fill="url(#flow-pre-glyco)" className="hover:opacity-100 transition-opacity opacity-85" />
          <path d="M 570 160 C 605 160, 615 220, 650 220 L 650 245 C 615 245, 605 180, 570 180 Z" fill="#38bdf8" opacity="0.55" />
          <path d="M 570 220 C 605 220, 615 160, 650 160 L 650 195 C 615 195, 605 255, 570 255 Z" fill="url(#flow-eve-homeo)" className="hover:opacity-100 transition-opacity opacity-80" />

          {/* Level 1 Nodes (Intake Sources) */}
          <g className="cursor-pointer">
            <rect x="18" y="16" width="102" height="30" rx="4" fill="#0D1120" stroke="#06b6d4" strokeWidth="1.5" />
            <rect x="18" y="16" width="4" height="30" rx="2" fill="#06b6d4" />
            <text x="28" y="30" fill="#f8fafc" fontFamily="monospace" fontSize="10" fontWeight="700">WILD SALMON</text>
            <text x="28" y="41" fill="#06b6d4" fontFamily="monospace" fontSize="9">520 KCAL</text>
          </g>
          <g className="cursor-pointer">
            <rect x="18" y="66" width="102" height="30" rx="4" fill="#0D1120" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="18" y="66" width="4" height="30" rx="2" fill="#38bdf8" />
            <text x="28" y="80" fill="#f8fafc" fontFamily="monospace" fontSize="10" fontWeight="700">AVOCADO TARTINE</text>
            <text x="28" y="91" fill="#38bdf8" fontFamily="monospace" fontSize="9">480 KCAL</text>
          </g>
          <g className="cursor-pointer">
            <rect x="18" y="120" width="102" height="36" rx="4" fill="#0D1120" stroke="#f43f5e" strokeWidth="1.5" />
            <rect x="18" y="120" width="4" height="36" rx="2" fill="#f43f5e" />
            <text x="28" y="135" fill="#f8fafc" fontFamily="monospace" fontSize="10" fontWeight="700">WAGYU FLANK</text>
            <text x="28" y="148" fill="#f43f5e" fontFamily="monospace" fontSize="9">690 KCAL • 62P</text>
          </g>
          <g className="cursor-pointer">
            <rect x="18" y="174" width="102" height="28" rx="4" fill="#0D1120" stroke="#06b6d4" strokeWidth="1.5" />
            <rect x="18" y="174" width="4" height="28" rx="2" fill="#06b6d4" />
            <text x="28" y="187" fill="#f8fafc" fontFamily="monospace" fontSize="10" fontWeight="700">WHEY ISOLATE</text>
            <text x="28" y="197" fill="#06b6d4" fontFamily="monospace" fontSize="9">210 KCAL</text>
          </g>
          <g className="cursor-pointer">
            <rect x="18" y="220" width="102" height="34" rx="4" fill="#0D1120" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="18" y="220" width="4" height="34" rx="2" fill="#38bdf8" />
            <text x="28" y="235" fill="#f8fafc" fontFamily="monospace" fontSize="10" fontWeight="700">MED BRANZINO</text>
            <text x="28" y="247" fill="#38bdf8" fontFamily="monospace" fontSize="9">460 KCAL</text>
          </g>

          {/* Level 2 Nodes (Macro Partition) */}
          <g className="cursor-pointer">
            <rect x="250" y="30" width="110" height="78" rx="4" fill="#0D1120" stroke="#06b6d4" strokeWidth="2" />
            <rect x="250" y="30" width="6" height="78" rx="3" fill="#06b6d4" />
            <text x="264" y="52" fill="#06b6d4" fontFamily="monospace" fontSize="11" fontWeight="700">LEUCINE &amp; PROT</text>
            <text x="264" y="70" fill="#ffffff" fontFamily="monospace" fontSize="16" fontWeight="700">168 g</text>
            <text x="264" y="86" fill="#94a3b8" fontFamily="sans-serif" fontSize="9">88% Target Pace</text>
            <text x="264" y="98" fill="#06b6d4" fontFamily="monospace" fontSize="8">2.3g / kg MASS</text>
          </g>
          <g className="cursor-pointer">
            <rect x="250" y="118" width="110" height="48" rx="4" fill="#0D1120" stroke="#a855f7" strokeWidth="1.5" />
            <rect x="250" y="118" width="5" height="48" rx="2" fill="#a855f7" />
            <text x="264" y="136" fill="#a855f7" fontFamily="monospace" fontSize="10" fontWeight="700">GLYCOGEN CARBS</text>
            <text x="264" y="152" fill="#ffffff" fontFamily="monospace" fontSize="14" fontWeight="700">185 g <tspan fill="#94a3b8" fontSize="9">/ 220g</tspan></text>
          </g>
          <g className="cursor-pointer">
            <rect x="250" y="180" width="110" height="42" rx="4" fill="#0D1120" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="250" y="180" width="5" height="42" rx="2" fill="#f59e0b" />
            <text x="264" y="197" fill="#f59e0b" fontFamily="monospace" fontSize="10" fontWeight="700">LIPIDS &amp; FATS</text>
            <text x="264" y="213" fill="#ffffff" fontFamily="monospace" fontSize="13" fontWeight="700">54 g <tspan fill="#94a3b8" fontSize="9">/ 65g</tspan></text>
          </g>
          <g className="cursor-pointer">
            <rect x="250" y="234" width="110" height="28" rx="4" fill="#0D1120" stroke="#2a344f" strokeWidth="1" />
            <rect x="250" y="234" width="4" height="28" rx="2" fill="#38bdf8" />
            <text x="264" y="247" fill="#e0e1f2" fontFamily="monospace" fontSize="9" fontWeight="700">FIBER &amp; MICRO</text>
            <text x="264" y="257" fill="#94a3b8" fontFamily="sans-serif" fontSize="8">32g Prebiotic</text>
          </g>

          {/* Level 3 Nodes (Circadian Timing) */}
          <g className="cursor-pointer">
            <rect x="470" y="38" width="100" height="46" rx="4" fill="#0D1120" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="470" y="38" width="5" height="46" rx="2" fill="#f59e0b" />
            <text x="482" y="55" fill="#f59e0b" fontFamily="monospace" fontSize="10" fontWeight="700">FAST BREAK</text>
            <text x="482" y="69" fill="#ffffff" fontFamily="monospace" fontSize="12" fontWeight="700">12:30 PM</text>
            <text x="482" y="79" fill="#94a3b8" fontFamily="sans-serif" fontSize="8">690 kcal Ingest</text>
          </g>
          <g className="cursor-pointer">
            <rect x="470" y="112" width="100" height="66" rx="4" fill="#0D1120" stroke="#06b6d4" strokeWidth="2" />
            <rect x="470" y="112" width="5" height="66" rx="2" fill="#06b6d4" />
            <text x="482" y="130" fill="#06b6d4" fontFamily="monospace" fontSize="10" fontWeight="700">ANABOLIC PHASE</text>
            <text x="482" y="146" fill="#ffffff" fontFamily="monospace" fontSize="13" fontWeight="700">16:15 PM</text>
            <text x="482" y="159" fill="#94a3b8" fontFamily="sans-serif" fontSize="8">Creatine + Whey</text>
            <text x="482" y="170" fill="#06b6d4" fontFamily="monospace" fontSize="8">MAX ABSORPTION</text>
          </g>
          <g className="cursor-pointer">
            <rect x="470" y="210" width="100" height="48" rx="4" fill="#0D1120" stroke="#c084fc" strokeWidth="1.5" />
            <rect x="470" y="210" width="5" height="48" rx="2" fill="#c084fc" />
            <text x="482" y="228" fill="#c084fc" fontFamily="monospace" fontSize="10" fontWeight="700">RECOVERY SYNC</text>
            <text x="482" y="242" fill="#ffffff" fontFamily="monospace" fontSize="12" fontWeight="700">19:30 PM</text>
            <text x="482" y="252" fill="#94a3b8" fontFamily="sans-serif" fontSize="8">Hormone Matrix</text>
          </g>

          {/* Level 4 Nodes (Physio Results) */}
          <g className="cursor-pointer">
            <rect x="650" y="24" width="60" height="48" rx="4" fill="#0D1120" stroke="#06b6d4" strokeWidth="2" />
            <rect x="650" y="24" width="4" height="48" rx="2" fill="#06b6d4" />
            <text x="658" y="42" fill="#06b6d4" fontFamily="monospace" fontSize="9" fontWeight="700">PROTEIN</text>
            <text x="658" y="53" fill="#ffffff" fontFamily="monospace" fontSize="9" fontWeight="700">SYNTHESIS</text>
            <text x="658" y="65" fill="#06b6d4" fontFamily="monospace" fontSize="8">98% OPT</text>
          </g>
          <g className="cursor-pointer">
            <rect x="650" y="90" width="60" height="50" rx="4" fill="#0D1120" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="650" y="90" width="4" height="50" rx="2" fill="#38bdf8" />
            <text x="658" y="108" fill="#38bdf8" fontFamily="monospace" fontSize="9" fontWeight="700">GLYCOGEN</text>
            <text x="658" y="119" fill="#ffffff" fontFamily="monospace" fontSize="9" fontWeight="700">RELOAD</text>
            <text x="658" y="131" fill="#94a3b8" fontFamily="monospace" fontSize="8">Z4 FED</text>
          </g>
          <g className="cursor-pointer">
            <rect x="650" y="156" width="60" height="46" rx="4" fill="#0D1120" stroke="#c084fc" strokeWidth="1.5" />
            <rect x="650" y="156" width="4" height="46" rx="2" fill="#c084fc" />
            <text x="658" y="174" fill="#c084fc" fontFamily="monospace" fontSize="9" fontWeight="700">CELLULAR</text>
            <text x="658" y="185" fill="#ffffff" fontFamily="monospace" fontSize="9" fontWeight="700">HOMEOSTASIS</text>
            <text x="658" y="196" fill="#c084fc" fontFamily="monospace" fontSize="8">BALANCED</text>
          </g>
          <g className="cursor-pointer">
            <rect x="650" y="218" width="60" height="38" rx="4" fill="#0D1120" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="650" y="218" width="4" height="38" rx="2" fill="#38bdf8" />
            <text x="658" y="234" fill="#38bdf8" fontFamily="monospace" fontSize="9" fontWeight="700">LEAN MASS</text>
            <text x="658" y="246" fill="#ffffff" fontFamily="monospace" fontSize="8" fontWeight="700">PRESERVED</text>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between font-mono text-[10px] text-zinc-400 mt-2 pt-1 border-t border-border">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
            Anabolism Stimulated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Glycogen Replenished
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Lipids Partitioned
          </span>
        </div>
        <span className="text-cyan-400 font-bold tracking-wider uppercase">0.0% Waste Heat Deviation</span>
      </div>
    </div>
  );
}
