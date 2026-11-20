"use client";

import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Palette } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

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
    <div
      className="executive-glass-shell min-h-screen bg-transparent font-sans font-normal flex flex-row overflow-x-hidden transition-colors duration-300"
      style={{ color: "var(--glass-text-primary, var(--text-ink))" }}
    >
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

      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-transparent relative pt-14 lg:pt-0 transition-all duration-300">
        {/* Floating Theme-Adaptive Top Bar */}
        <header
          className="px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-14 lg:top-0 z-30 border-b transition-all duration-300"
          style={{
            backgroundColor: "var(--glass-surface)",
            borderColor: "var(--glass-border)",
            backdropFilter: "blur(var(--glass-blur, 20px)) saturate(165%)",
            WebkitBackdropFilter: "blur(var(--glass-blur, 20px)) saturate(165%)",
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: accentColor === "#f59e0b" ? "var(--color-primary, #4984fd)" : accentColor,
                }}
              />
              <span
                className="px-2 py-0.5 rounded-[6px] text-[12px] font-medium tracking-[-0.13px] border"
                style={{
                  backgroundColor: "var(--glass-surface-elevated)",
                  borderColor: "var(--glass-border)",
                  color: "var(--glass-text-muted)",
                }}
              >
                {eyebrow}
              </span>
              <h1
                className="text-[19px] sm:text-[22px] font-medium tracking-[-0.38px] leading-[1.3] truncate"
                style={{ color: "var(--glass-text-primary)" }}
              >
                {title}
              </h1>
            </div>
            <p
              className="text-[13px] font-normal leading-[1.6] mt-0.5"
              style={{ color: "var(--glass-text-muted)" }}
            >
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {headerActions}
            <button
              type="button"
              onClick={() => setIsAppearanceOpen(true)}
              className="liquid-glass-pill px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.13px] flex items-center gap-1.5 transition-all"
              style={{ color: "var(--glass-text-primary)" }}
              title="Open Liquid Glass & Chromatic Studio"
            >
              <Palette size={14} style={{ color: "var(--theme-grad-start, #4984fd)" }} />
              <span className="hidden sm:inline">Glass Studio</span>
            </button>
          </div>
        </header>

        <main
          className={
            fullBleed
              ? "flex-1 relative min-h-0 bg-transparent"
              : "flex-1 px-4 sm:px-8 py-6 max-w-[1480px] w-full mx-auto space-y-6 pb-20 bg-transparent"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
