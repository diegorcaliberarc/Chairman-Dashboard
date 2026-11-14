"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Inbox,
  FileText,
  LayoutDashboard,
  Layers,
  Video,
  Clock,
  Settings,
  ChevronLeft,
} from "lucide-react";

interface PmsSidebarRailProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export function PmsSidebarRail({
  activeSection,
  onSelectSection,
}: PmsSidebarRailProps) {
  const railItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/" },
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "docs", label: "Docs", icon: FileText },
    { id: "dashboards", label: "Dashboards", icon: LayoutDashboard },
    { id: "whiteboards", label: "Whiteboards", icon: Layers },
    { id: "clips", label: "Clips", icon: Video },
    { id: "timesheets", label: "Timesheets", icon: Clock },
  ];

  return (
    <aside className="w-[56px] min-w-[56px] h-full bg-[#0D0F17] border-r border-[#1E222D] flex flex-col items-center py-3 select-none z-20">
      {/* Return to Dashboard */}
      <Link
        href="/"
        title="Return to Chairman Dashboard"
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 hover:text-white hover:border-blue-400 transition mb-4 shadow-lg shadow-blue-500/10"
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      {/* Primary Rail Actions */}
      <div className="flex-1 flex flex-col items-center space-y-2 w-full px-2">
        {railItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const content = (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-[#1A1D28]"
              }`}
            >
              <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              {/* Tooltip */}
              <span className="absolute left-[62px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#181B26] text-zinc-100 text-[11px] font-medium rounded-md shadow-xl border border-[#2B3042] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </span>
            </button>
          );

          return item.href ? (
            <Link key={item.id} href={item.href}>
              {content}
            </Link>
          ) : (
            content
          );
        })}
      </div>

      {/* Bottom Settings Button */}
      <div className="w-full px-2 pt-2 border-t border-[#1E222D]">
        <button
          onClick={() => onSelectSection("settings")}
          title="PMS Workspace Settings"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
            activeSection === "settings"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-[#1A1D28]"
          }`}
        >
          <Settings className="w-4 h-4 transition-transform group-hover:rotate-45" />
          <span className="absolute left-[62px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#181B26] text-zinc-100 text-[11px] font-medium rounded-md shadow-xl border border-[#2B3042] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Settings
          </span>
        </button>
      </div>
    </aside>
  );
}
