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
  accentColor = "#f59e0b",
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
    <div className="executive-glass-shell min-h-screen bg-transparent text-zinc-900 dark:text-zinc-50 flex flex-row overflow-x-hidden transition-colors duration-300">
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

      <div className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen bg-transparent relative">
        <header
          className="px-6 pt-5 pb-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 transition-all duration-300"
          style={{
            backgroundColor: "var(--glass-surface)",
            backdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
            WebkitBackdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
            borderBottom: "1px solid var(--glass-border)",
            boxShadow:
              "inset 0 1px 0 0 var(--glass-specular), 0 10px 32px -14px rgba(0, 0, 0, 0.16)",
          }}
        >
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 10px ${accentColor}88`,
                }}
              />
              <span
                className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-[0.16em] uppercase border"
                style={{
                  color: accentColor,
                  borderColor: `${accentColor}4D`,
                  backgroundColor: `${accentColor}16`,
                }}
              >
                {eyebrow}
              </span>
              <h1 className="text-sm md:text-base font-bold tracking-[0.14em] uppercase text-zinc-900 dark:text-zinc-100">
                {title}
              </h1>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {headerActions}
            <button
              type="button"
              onClick={() => setIsAppearanceOpen(true)}
              className="liquid-glass-pill px-2.5 py-1.5 rounded-xl text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1.5 transition-all"
              title="Open Liquid Glass & 360° Gradient Studio"
            >
              <Palette
                size={13}
                style={{ color: "var(--theme-grad-start)" }}
              />
              <span className="hidden sm:inline">Glass Studio</span>
            </button>
          </div>
        </header>

        <main
          className={
            fullBleed
              ? "flex-1 relative min-h-0"
              : "flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 pb-24"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
