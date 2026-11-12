"use client";

import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
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
    <div className="min-h-screen bg-[#090b11] text-white flex flex-row overflow-x-hidden">
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

      <div className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_35%_15%,_#111827_0%,_#090b11_68%)]">
        <header className="px-6 pt-5 pb-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] bg-[#090b11]/70 backdrop-blur-xl sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: accentColor }}
              />
              <span
                className="px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-[0.16em] uppercase border"
                style={{
                  color: accentColor,
                  borderColor: `${accentColor}44`,
                  backgroundColor: `${accentColor}14`,
                }}
              >
                {eyebrow}
              </span>
              <h1 className="text-sm md:text-base font-bold tracking-[0.14em] uppercase text-zinc-100">
                {title}
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>
          </div>

          {headerActions && (
            <div className="flex flex-wrap items-center gap-2.5">
              {headerActions}
            </div>
          )}
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

