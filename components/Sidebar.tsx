import { Bot, Brain, CalendarDays, Palette } from "lucide-react";
import { UserAccountModal } from "./UserAccountModal";
import { useState } from "react";
import { AppearanceSettings } from "./AppearanceSettings";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  calConnected: boolean;
  onCalToggle: () => void;
  appearanceOpen: boolean;
  setAppearanceOpen: (open: boolean) => void;
  user: any;
  deepWork: boolean;
  setDeepWork: (val: boolean | ((p: boolean) => boolean)) => void;
  novaOpen: boolean;
  setNovaOpen: (val: boolean | ((p: boolean) => boolean)) => void;
}

export function Sidebar({
  activeTab, setActiveTab, calConnected, onCalToggle, 
  appearanceOpen, setAppearanceOpen, user,
  deepWork, setDeepWork, novaOpen, setNovaOpen
}: SidebarProps) {
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const TABS = [
    { id: "MASTER", label: "MASTER VIEW" },
    { id: "BUSINESS", label: "BUSINESS" },
    { id: "PERSONAL", label: "PERSONAL" },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-white/80 dark:bg-black/60 backdrop-blur-xl border-r border-zinc-200/50 dark:border-white/10 z-50">
        
        {/* Navigation Tabs (Top) */}
        <div className="flex flex-col gap-2 p-4 mt-8 flex-1">
          <div className="text-[10px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mb-2 px-2">Navigation</div>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center w-full px-4 py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${
                  isActive 
                    ? "bg-[rgba(var(--theme-grad-start-rgb),0.1)] text-[color:var(--theme-grad-start)] border border-[color:var(--theme-grad-start)]/30" 
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
                }`}
                style={isActive ? { borderColor: "rgba(179,136,235,0.3)" } : {}}
              >
                {tab.label}
              </button>
            );
          })}

          <div className="text-[10px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mt-8 mb-2 px-2">Systems</div>
          
          <button
            onClick={() => setDeepWork((p) => !p)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${
              deepWork 
                ? "bg-blue-500/10 text-[color:var(--theme-grad-start)] border border-blue-500/30" 
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Brain size={16} />
            DEEP WORK
          </button>
          
          <button
            onClick={() => setNovaOpen((p) => !p)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${
              novaOpen 
                ? "bg-[rgba(var(--theme-grad-start-rgb),0.1)] text-[color:var(--theme-grad-start)] border border-[color:var(--theme-grad-start)]/30" 
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Bot size={16} />
            NOVA CORE
          </button>
        </div>

        {/* Bottom / Footer (Discord Style) */}
        <div className="mt-auto p-4 border-t border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
          <div className="flex items-center justify-between gap-2">
            
            {/* User Profile (Discord bottom-left style) */}
            <button 
              onClick={() => setAccountModalOpen(true)}
              className="flex items-center gap-3 flex-1 p-2 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors text-left"
            >
              {user?.image ? (
                <img src={user.image} alt="User" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                  {(user?.name ?? "C")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user?.name?.split(" ")[0] ?? "Chairman"}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Online</div>
              </div>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={onCalToggle}
                className={`p-2 rounded-lg transition-colors ${calConnected ? "text-[color:var(--theme-grad-start)] bg-[rgba(var(--theme-grad-start-rgb),0.1)]" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10"}`}
                title={calConnected ? "Cal Live" : "Connect Calendar"}
              >
                <CalendarDays size={16} />
              </button>
              
              <button
                onClick={() => setAppearanceOpen(true)}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors"
                title="Appearance Settings"
              >
                <Palette size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {accountModalOpen && (
        <UserAccountModal user={user || {}} onClose={() => setAccountModalOpen(false)} />
      )}
    </>
  );
}
