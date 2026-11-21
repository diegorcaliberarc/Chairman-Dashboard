"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { PmsStatusDTO, PmsTaskDTO } from "@/lib/pmsTypes";

interface TaskCalendarViewProps {
  tasks: PmsTaskDTO[];
  statuses: PmsStatusDTO[];
  onSelectTask: (taskId: string) => void;
  onRescheduleTask: (taskId: string, dueDateIso: string) => Promise<void>;
  onCreateTaskOnDate: (params: {
    name: string;
    statusId?: string;
    dueDate: string;
  }) => Promise<void>;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function TaskCalendarView({
  tasks,
  statuses,
  onSelectTask,
  onRescheduleTask,
  onCreateTaskOnDate,
}: TaskCalendarViewProps) {
  const [cursor, setCursor] = useState<{ year: number; month: number }>(() => {
    const d = new Date(2026, 10, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
  }, []);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [addingDateIso, setAddingDateIso] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const cells = useMemo(() => {
    const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const grid: Array<{ iso: string; day: number; inMonth: boolean }> = [];

    const prevMonthDays = new Date(cursor.year, cursor.month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDate = new Date(cursor.year, cursor.month - 1, prevMonthDays - i);
      grid.push({
        iso: toIsoDate(
          prevDate.getFullYear(),
          prevDate.getMonth(),
          prevDate.getDate()
        ),
        day: prevDate.getDate(),
        inMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      grid.push({
        iso: toIsoDate(cursor.year, cursor.month, day),
        day,
        inMonth: true,
      });
    }

    let trailing = 1;
    while (grid.length < 42) {
      const nextDate = new Date(cursor.year, cursor.month + 1, trailing++);
      grid.push({
        iso: toIsoDate(
          nextDate.getFullYear(),
          nextDate.getMonth(),
          nextDate.getDate()
        ),
        day: nextDate.getDate(),
        inMonth: false,
      });
    }
    return grid;
  }, [cursor]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, PmsTaskDTO[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const key = task.due_date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    [],
    { month: "long", year: "numeric" }
  );

  const stepMonth = (delta: number) => {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  };

  const handleQuickCreate = async (dateIso: string) => {
    if (!quickTitle.trim()) return;
    await onCreateTaskOnDate({
      name: quickTitle.trim(),
      statusId: statuses[0]?.id,
      dueDate: new Date(`${dateIso}T12:00:00.000Z`).toISOString(),
    });
    setQuickTitle("");
    setAddingDateIso(null);
  };

  return (
    <div
      data-testid="pms-calendar-view"
      className="h-full flex flex-col bg-[#11131C] border border-[#222630] rounded-xl overflow-hidden"
    >
      <div className="h-11 px-4 border-b border-[#1E222D] bg-[#141624] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="pms-cal-prev-month"
            onClick={() => stepMonth(-1)}
            className="p-1 rounded-md hover:bg-[#1E2230] text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold tracking-wide text-zinc-100 min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            data-testid="pms-cal-next-month"
            onClick={() => stepMonth(1)}
            className="p-1 rounded-md hover:bg-[#1E2230] text-zinc-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className="text-[11px] text-zinc-400">
          Drag tasks between dates to reschedule due dates
        </span>
      </div>

      <div className="grid grid-cols-7 border-b border-[#1E222D] bg-[#0F111A]">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-[#1A1E2A] overflow-y-auto">
        {cells.map((cell) => {
          const dayTasks = tasksByDate.get(cell.iso) ?? [];
          const isOver = dragOverDate === cell.iso;

          return (
            <div
              key={cell.iso}
              data-testid={`pms-cal-day-${cell.iso}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDate(cell.iso);
              }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverDate(null);
                const taskId = e.dataTransfer.getData("text/pms-task-id");
                if (taskId) {
                  void onRescheduleTask(
                    taskId,
                    new Date(`${cell.iso}T12:00:00.000Z`).toISOString()
                  );
                }
              }}
              className={`group min-h-[86px] p-1.5 flex flex-col gap-1 transition ${
                isOver
                  ? "bg-blue-500/15"
                  : cell.inMonth
                    ? "bg-[#11131C]"
                    : "bg-[#0B0D14] opacity-55"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">
                  {cell.day}
                </span>
                <button
                  type="button"
                  onClick={() => setAddingDateIso(cell.iso)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
                  title={`Add task due ${cell.iso}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-20">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/pms-task-id", task.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onSelectTask(task.id)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer border border-white/10 hover:border-blue-400/60"
                    style={{
                      backgroundColor: `${task.status_color}22`,
                      color: "#f4f4f5",
                    }}
                  >
                    {task.name}
                  </div>
                ))}

                {addingDateIso === cell.iso && (
                  <input
                    type="text"
                    placeholder="Task title..."
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleQuickCreate(cell.iso);
                      if (e.key === "Escape") setAddingDateIso(null);
                    }}
                    autoFocus
                    className="w-full px-1.5 py-0.5 bg-[#090A0F] border border-blue-500 rounded text-[10px] text-white focus:outline-none"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
