import { X, CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";

export function MissionControlModal({
  tasks, subtasksMap, onClose, onToggle
}: {
  tasks: any[];
  subtasksMap: Record<string, any[]>;
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-white/5 dark:bg-black/40 border border-zinc-200/20 dark:border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200/20 dark:border-white/10">
          <h2 className="text-2xl font-serif tracking-wider text-zinc-900 dark:text-white bg-theme-gradient bg-clip-text text-transparent">
            MISSION CONTROL
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2" style={{ scrollbarWidth: "thin" }}>
          {tasks.map(task => {
            const subs = subtasksMap[task.id] || [];
            return (
              <div key={task.id} className="bg-white/5 dark:bg-black/20 border border-zinc-200/20 dark:border-white/5 rounded-xl p-4 flex flex-col gap-3 hover:bg-zinc-100/50 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <button onClick={() => onToggle(task.id)} className="text-[color:var(--theme-grad-start)] hover:scale-110 transition-transform">
                    {task.status === "DONE" ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <span className={`text-base font-medium flex-1 ${task.status === "DONE" ? "text-zinc-500 line-through" : "text-zinc-900 dark:text-white"}`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] tracking-widest uppercase text-[color:var(--theme-grad-start)] px-2 py-1 bg-[rgba(var(--theme-grad-start-rgb),0.1)] rounded-md border border-[color:var(--theme-grad-start)]/20">
                    {task.agentId} / {task.pillar}
                  </span>
                </div>

                {subs.length > 0 && (
                  <div className="ml-8 pl-4 border-l border-zinc-200 dark:border-white/10 flex flex-col gap-2 mt-2">
                    {subs.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <button onClick={() => onToggle(sub.id)} className="text-zinc-500 hover:text-[color:var(--theme-grad-start)] transition-colors">
                          {sub.status === "DONE" ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        </button>
                        <span className={`text-sm ${sub.status === "DONE" ? "text-zinc-400 line-through" : "text-zinc-600 dark:text-zinc-300"}`}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {tasks.length === 0 && (
            <div className="text-center text-zinc-500 mt-10 tracking-widest text-sm uppercase">
              No active tasks found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
