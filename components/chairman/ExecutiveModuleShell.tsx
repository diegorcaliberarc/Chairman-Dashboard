"use client";

import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Palette } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { CluelyFooter } from "@/components/chairman/CluelyFooter";

interface ExecutiveModuleShellProps {
  moduleId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  accentColor?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  fullBleed?: boolean;
}

export function ExecutiveModuleShell({
  moduleId,
  eyebrow,
  title,
  subtitle,
  accentColor = "#4984fd",
  headerActions,
  children,
  fullBleed = false,
}: ExecutiveModuleShellProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const calConnected = !!(session as any)?.accessToken;

  const [activeTab, setActiveTab] = useState(moduleId);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [deepWork, setDeepWork] = useState(false);

  return (
    <div className="executive-glass-shell min-h-screen bg-[#ffffff] text-[#000000] font-sans font-normal flex flex-row overflow-x-hidden transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        calConnected={calConnected}
        onCalToggle={() =>
          calConnected ? signOut({ redirect: false }) : signIn("google")
        }
        isAppearanceOpen={isAppearanceOpen}
        setIsAppearanceOpen={setIsAppearanceOpen}
        user={user}
        deepWork={deepWork}
        setDeepWork={setDeepWork}
        activeTasksCount={0}
        activeSubtasksCount={0}
        tasksLoading={false}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#ffffff] relative pt-14 lg:pt-0 transition-all duration-300">
        {/* Floating Atmospheric Light-First Top Bar */}
        <header
          className="px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-14 lg:top-0 z-30 border-b border-[#d1d6e0] transition-all duration-300"
          style={{
            background:
              "linear-gradient(180deg, rgba(221, 232, 252, 0.55) 0%, rgba(255, 255, 255, 0.88) 100%)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: accentColor === "#f59e0b" ? "#4984fd" : accentColor,
                }}
              />
              <span className="px-2 py-0.5 rounded-[6px] bg-[#dde2ee] text-[#263043] text-[12px] font-medium tracking-[-0.13px]">
                {eyebrow}
              </span>
              <h1 className="text-[19px] sm:text-[22px] font-medium tracking-[-0.38px] leading-[1.3] text-[#000000] truncate">
                {title}
              </h1>
            </div>
            <p className="text-[13px] font-normal leading-[1.6] text-[#6b7280] mt-0.5">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {headerActions}
            <button
              type="button"
              onClick={() => setIsAppearanceOpen(true)}
              className="cluely-pill px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.13px] text-[#374151] hover:text-[#000000] hover:border-[#4984fd]/50 flex items-center gap-1.5 transition-all"
              title="Appearance & Studio Preferences"
            >
              <Palette size={14} className="text-[#4984fd]" />
              <span className="hidden sm:inline">Studio</span>
            </button>
          </div>
        </header>

        <main
          className={
            fullBleed
              ? "flex-1 relative min-h-0 bg-[#ffffff]"
              : "flex-1 px-4 sm:px-8 py-8 max-w-[1440px] w-full mx-auto space-y-8 pb-20 bg-[#ffffff]"
          }
        >
          {children}
        </main>

        {/* Always-Light Cluely Footer (#f9fafb, #6b7280) */}
        <CluelyFooter />
      </div>
    </div>
  );
}
