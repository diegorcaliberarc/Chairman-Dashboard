"use client";

import React from "react";
import Link from "next/link";

export function CluelyFooter() {
  return (
    <footer className="w-full bg-[#f9fafb] border-t border-[#d1d6e0] text-[#6b7280] font-sans font-normal">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-[#d1d6e0]">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4984fd]" />
              <span className="text-[16px] font-medium tracking-[-0.13px] text-[#000000]">
                Chairman Dashboard
              </span>
            </div>
            <p className="text-[13px] leading-[1.6] text-[#6b7280] max-w-[240px]">
              Atmospheric executive operating system for health, wealth, circadian rhythm, and strategic roadmaps.
            </p>
          </div>

          {/* Core Modules */}
          <div className="space-y-2.5">
            <div className="text-[12px] font-medium tracking-[-0.13px] text-[#000000]">
              Command
            </div>
            <ul className="space-y-2 text-[13px] leading-[1.6]">
              <li>
                <Link href="/command" className="hover:text-[#000000] transition-colors">
                  Command Center
                </Link>
              </li>
              <li>
                <Link href="/roadmaps" className="hover:text-[#000000] transition-colors">
                  Synthesis Roadmap
                </Link>
              </li>
              <li>
                <Link href="/org-chart" className="hover:text-[#000000] transition-colors">
                  Topology Map
                </Link>
              </li>
              <li>
                <Link href="/pms" className="hover:text-[#000000] transition-colors">
                  Sovereign PMS
                </Link>
              </li>
            </ul>
          </div>

          {/* Health & Rhythm */}
          <div className="space-y-2.5">
            <div className="text-[12px] font-medium tracking-[-0.13px] text-[#000000]">
              Vitality
            </div>
            <ul className="space-y-2 text-[13px] leading-[1.6]">
              <li>
                <Link href="/macro-ops" className="hover:text-[#000000] transition-colors">
                  Macro Ops
                </Link>
              </li>
              <li>
                <Link href="/workouts" className="hover:text-[#000000] transition-colors">
                  Titan Workouts
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="hover:text-[#000000] transition-colors">
                  Circadian Solar Arc
                </Link>
              </li>
              <li>
                <Link href="/mindset" className="hover:text-[#000000] transition-colors">
                  Mindset Counsel
                </Link>
              </li>
            </ul>
          </div>

          {/* Wealth & Systems */}
          <div className="space-y-2.5">
            <div className="text-[12px] font-medium tracking-[-0.13px] text-[#000000]">
              Portfolio
            </div>
            <ul className="space-y-2 text-[13px] leading-[1.6]">
              <li>
                <Link href="/caliber-arc" className="hover:text-[#000000] transition-colors">
                  Caliber Arc
                </Link>
              </li>
              <li>
                <Link href="/budget" className="hover:text-[#000000] transition-colors">
                  12M Budget Ledger
                </Link>
              </li>
              <li>
                <Link href="/family-hub" className="hover:text-[#000000] transition-colors">
                  Family Hub
                </Link>
              </li>
              <li>
                <Link href="/vault" className="hover:text-[#000000] transition-colors">
                  Knowledge Vault
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] leading-[1.6] text-[#71717a]">
          <span>© {new Date().getFullYear()} Pristine Designs · Chairman Dashboard. All systems operational.</span>
          <div className="flex items-center gap-5">
            <Link href="/integrations" className="hover:text-[#000000] transition-colors">
              Integrations
            </Link>
            <Link href="/kpis" className="hover:text-[#000000] transition-colors">
              KPI Scorecard
            </Link>
            <Link href="/education" className="hover:text-[#000000] transition-colors">
              Academy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
