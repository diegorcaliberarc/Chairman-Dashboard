import { useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";

export function TaskDetailModal({
  task, agentColor, onClose, onSave, onToggleSubtask, onDeleteSubtask, onAddSubtask, subtasks
}: {
  task: any;
  agentColor: string;
  onClose: () => void;
  onSave: (id: string, updates: any) => void;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  subtasks: any[];
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [subInput, setSubInput] = useState("");

  const handleSave = () => {
    onSave(task.id, { title, description });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-6" onClick={onClose}>
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white/5 dark:bg-black/20 border border-zinc-200/20 dark:border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span style={{ color: agentColor, fontFamily: "Georgia, serif", fontSize: 20 }}>Task Details</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5 min-h-0 pr-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest uppercase text-zinc-500">Task Title</label>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-200/20 dark:border-white/10 pb-2 text-zinc-900 dark:text-white text-lg font-medium focus:outline-none transition-colors"
              style={{ borderBottomColor: title ? agentColor : undefined }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5 flex-1 min-h-[120px]">
            <label className="text-[10px] tracking-widest uppercase text-zinc-500">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              className="w-full flex-1 bg-white/5 dark:bg-black/20 border border-zinc-200/20 dark:border-white/5 rounded-lg p-3 text-zinc-900 dark:text-white text-sm focus:outline-none transition-all resize-none"
              style={{ outlineColor: description ? agentColor : "transparent" }}
            />
          </div>

          {/* Subtasks */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] tracking-widest uppercase text-zinc-500 mb-1">Subtasks</label>
            {subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-2.5 bg-white/5 dark:bg-black/20 border border-zinc-200/20 dark:border-white/5 rounded-md">
                <button onClick={() => onToggleSubtask(sub.id)} className="shrink-0">
                  {sub.status === "DONE" ? <CheckCircle2 size={14} color={agentColor} /> : <Circle size={14} className="text-zinc-500" />}
                </button>
                <span className={`flex-1 text-xs ${sub.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>{sub.title}</span>
                <button onClick={() => onDeleteSubtask(sub.id)} className="text-zinc-500 hover:text-red-400 transition-colors shrink-0">
                  <X size={12} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-3 p-2 bg-white/5 dark:bg-black/20 border border-zinc-200/20 dark:border-white/5 rounded-md">
              <input
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && subInput.trim()) {
                    onAddSubtask(task.id, subInput.trim());
                    setSubInput("");
                  }
                }}
                placeholder="+ Add subtask"
                className="w-full bg-transparent border-none outline-none text-xs text-zinc-900 dark:text-white ml-2"
              />
            </div>
          </div>
        </div>

        {/* Footer / Save */}
        <div className="mt-6 pt-4 border-t border-zinc-200/20 dark:border-white/10 flex justify-end shrink-0">
          <button 
            onClick={handleSave}
            className="px-6 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all"
            style={{ backgroundColor: `${agentColor}20`, color: agentColor, border: `1px solid ${agentColor}40` }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
