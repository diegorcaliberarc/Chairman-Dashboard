"use client";

import { useState, useEffect } from "react";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Sidebar } from "@/components/Sidebar";

export default function GanttPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

  // same state as page.tsx for sidebar
  const [activeTab, setActiveTab] = useState("GANTT");
  const [deepWork, setDeepWork] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks) {
        setDbTasks(data.tasks);
        
        const ganttTasks: Task[] = data.tasks
          .filter((t: any) => t.startDate || t.dueDate)
          .map((t: any) => {
            const start = t.startDate ? new Date(t.startDate) : new Date(t.dueDate);
            const end = t.dueDate ? new Date(t.dueDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
            
            // gantt-task-react throws if end <= start
            if (end.getTime() <= start.getTime()) {
              end.setTime(start.getTime() + 24 * 60 * 60 * 1000);
            }

            return {
              start,
              end,
              name: t.title,
              id: t.id,
              type: "task",
              progress: t.status === "DONE" ? 100 : t.status === "In Progress" ? 50 : 0,
              isDisabled: false,
              styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' },
            };
          });

        if (ganttTasks.length > 0) {
          setTasks(ganttTasks);
        } else {
          // Provide a dummy task if none exist, otherwise gantt throws error
          setTasks([
            {
              start: new Date(),
              end: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
              name: "No tasks with dates yet",
              id: "dummy",
              type: "task",
              progress: 0,
              isDisabled: true,
            }
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTaskChange = async (task: Task) => {
    let newTasks = tasks.map(t => (t.id === task.id ? task : t));
    setTasks(newTasks);
    
    if (task.id === "dummy") return;

    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        startDate: task.start.toISOString(),
        dueDate: task.end.toISOString()
      }),
    });
  };

  return (
    <div className="flex h-screen bg-theme-gradient text-zinc-900 dark:text-zinc-50 overflow-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab}
        calConnected={false} onCalToggle={() => {}}
        isAppearanceOpen={isAppearanceOpen} setIsAppearanceOpen={setIsAppearanceOpen}
        user={{ name: "Chairman" }}
        deepWork={deepWork} setDeepWork={setDeepWork}
        novaOpen={novaOpen} setNovaOpen={setNovaOpen}
        doneTasks={dbTasks.filter(t => t.status === "DONE").length}
        totalTasks={dbTasks.length}
        overallPct={dbTasks.length > 0 ? dbTasks.filter(t => t.status === "DONE").length / dbTasks.length : 0}
        tasksLoading={false}
      />
      
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative" style={{ paddingLeft: 270, paddingRight: 32, paddingTop: 32, paddingBottom: 66 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-themeAccent">Gantt Architecture</h1>
          <div className="flex gap-2 bg-white/5 p-1 rounded-md border border-zinc-200/50 dark:border-white/10">
            {["Day", "Week", "Month"].map(mode => (
              <button 
                key={mode} 
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === mode ? 'bg-zinc-200 dark:bg-white/20 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-xl p-6 shadow-2xl text-black">
          {tasks.length > 0 ? (
            <Gantt 
              tasks={tasks}
              viewMode={viewMode}
              onDateChange={handleTaskChange}
              onProgressChange={handleTaskChange}
              listCellWidth="155px"
              columnWidth={viewMode === ViewMode.Month ? 150 : 65}
            />
          ) : (
            <div className="text-center py-20 text-zinc-500">Loading timeline...</div>
          )}
        </div>
      </main>
    </div>
  );
}
