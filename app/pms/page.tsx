"use client";

import React from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { NewSpaceModal } from "@/components/pms/NewSpaceModal";
import { PmsHierarchySidebar } from "@/components/pms/PmsHierarchySidebar";
import {
  GroupedTaskList,
  PmsAiCommandBar,
  PmsHomePanel,
  PmsOverviewPanel,
  TaskCalendarView,
  TaskDetailDrawer,
  TaskKanbanBoard,
  TaskViewSwitcher,
  usePmsWorkspace,
} from "@features/pms";

export default function SovereignPmsPage() {
  const {
    state,
    dispatch,
    currentSpaceStatuses,
    filteredTasks,
    selectedTask,
    breadcrumb,
    handleCreateSpace,
    handleCreateFolder,
    handleCreateList,
    handleCreateTask,
    handleMoveStatus,
    handleStepStatus,
    handleUpdateTask,
    handleToggleChecklist,
    handleAddChecklist,
    handleAddComment,
    handleAddSubtask,
    handleDeleteTask,
    handleRunAiCommand,
  } = usePmsWorkspace();

  return (
    <ExecutiveModuleShell
      moduleId="PMS"
      eyebrow="Operations & Planning"
      title="Project Management"
      subtitle="ClickUp-style spaces, grouped status lists, Kanban boards, task calendar & slide-over inspector"
      accentColor="#4984fd"
      fullBleed={true}
      headerActions={
        <PmsAiCommandBar
          onRunCommand={handleRunAiCommand}
          onNotify={(message) => dispatch({ type: "SET_TOAST", message })}
        />
      }
    >
      <div
        data-testid="pms-workspace-root"
        data-view-mode={state.viewMode}
        className="flex min-h-[calc(100vh-140px)] w-full rounded-2xl border overflow-hidden select-none transition-colors"
        style={{
          backgroundColor: "var(--glass-surface)",
          borderColor: "var(--glass-border)",
          color: "var(--glass-text-primary)",
        }}
      >
        {state.toastMessage && (
          <div
            data-testid="pms-toast"
            className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#4984fd] text-white text-xs font-medium shadow-xl flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{state.toastMessage}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_TOAST", message: null })}
              className="ml-1 p-0.5 rounded hover:bg-white/20"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {state.showSpacesDrawer && (
          <PmsHierarchySidebar
            spaces={state.spaces}
            selectedSpaceId={state.selectedSpaceId}
            selectedFolderId={state.selectedFolderId}
            selectedListId={state.selectedListId}
            onSelectSpace={(spaceId) =>
              dispatch({ type: "SELECT_SPACE", spaceId })
            }
            onSelectFolder={(spaceId, folderId) =>
              dispatch({ type: "SELECT_FOLDER", spaceId, folderId })
            }
            onSelectList={(spaceId, folderId, listId) =>
              dispatch({ type: "SELECT_LIST", spaceId, folderId, listId })
            }
            onOpenNewSpaceModal={() =>
              dispatch({ type: "OPEN_NEW_SPACE_MODAL" })
            }
            onCreateFolder={handleCreateFolder}
            onCreateList={handleCreateList}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
          <TaskViewSwitcher
            breadcrumb={breadcrumb}
            showSpacesDrawer={state.showSpacesDrawer}
            viewMode={state.viewMode}
            searchQuery={state.searchQuery}
            priorityFilter={state.priorityFilter}
            onToggleSpacesDrawer={() =>
              dispatch({ type: "TOGGLE_SPACES_DRAWER" })
            }
            onSelectViewMode={(viewMode) =>
              dispatch({ type: "SET_VIEW_MODE", viewMode })
            }
            onSearchChange={(query) =>
              dispatch({ type: "SET_SEARCH_QUERY", query })
            }
            onPriorityFilterChange={(priority) =>
              dispatch({ type: "SET_PRIORITY_FILTER", priority })
            }
            onTriggerQuickAdd={() => {
              if (currentSpaceStatuses[0]) {
                if (state.viewMode !== "list" && state.viewMode !== "board") {
                  dispatch({ type: "SET_VIEW_MODE", viewMode: "list" });
                }
                dispatch({
                  type: "SET_ADDING_TASK_STATUS",
                  statusId: currentSpaceStatuses[0].id,
                });
              }
            }}
          />

          <div className="flex-1 overflow-hidden p-4">
            {state.loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : state.viewMode === "list" ? (
              <GroupedTaskList
                statuses={currentSpaceStatuses}
                tasks={filteredTasks}
                collapsedStatusIds={state.collapsedStatusIds}
                addingTaskForStatusId={state.addingTaskForStatusId}
                onToggleCollapse={(statusId) =>
                  dispatch({ type: "TOGGLE_COLLAPSE_STATUS", statusId })
                }
                onSetAddingStatus={(statusId) =>
                  dispatch({ type: "SET_ADDING_TASK_STATUS", statusId })
                }
                onCreateTask={handleCreateTask}
                onSelectTask={(taskId) =>
                  dispatch({ type: "OPEN_TASK_DRAWER", taskId })
                }
                onMoveStatus={handleMoveStatus}
                onUpdateTask={handleUpdateTask}
              />
            ) : state.viewMode === "board" ? (
              <TaskKanbanBoard
                statuses={currentSpaceStatuses}
                tasks={filteredTasks}
                collapsedStatusIds={state.collapsedStatusIds}
                addingTaskForStatusId={state.addingTaskForStatusId}
                onToggleCollapse={(statusId) =>
                  dispatch({ type: "TOGGLE_COLLAPSE_STATUS", statusId })
                }
                onSetAddingStatus={(statusId) =>
                  dispatch({ type: "SET_ADDING_TASK_STATUS", statusId })
                }
                onCreateTask={handleCreateTask}
                onSelectTask={(taskId) =>
                  dispatch({ type: "OPEN_TASK_DRAWER", taskId })
                }
                onMoveStatus={handleMoveStatus}
                onStepStatus={handleStepStatus}
              />
            ) : state.viewMode === "calendar" ? (
              <TaskCalendarView
                tasks={filteredTasks}
                statuses={currentSpaceStatuses}
                onSelectTask={(taskId) =>
                  dispatch({ type: "OPEN_TASK_DRAWER", taskId })
                }
                onRescheduleTask={(taskId, dueDateIso) =>
                  handleUpdateTask(taskId, { due_date: dueDateIso })
                }
                onCreateTaskOnDate={handleCreateTask}
              />
            ) : state.viewMode === "overview" ? (
              <PmsOverviewPanel
                tasks={filteredTasks}
                statuses={currentSpaceStatuses}
              />
            ) : (
              <PmsHomePanel
                spaces={state.spaces}
                tasks={state.tasks}
                onOpenNewSpaceModal={() =>
                  dispatch({ type: "OPEN_NEW_SPACE_MODAL" })
                }
                onSelectSpaceToBoard={(spaceId) => {
                  dispatch({ type: "SELECT_SPACE", spaceId });
                  dispatch({ type: "SET_VIEW_MODE", viewMode: "board" });
                }}
              />
            )}
          </div>
        </main>

        <TaskDetailDrawer
          task={selectedTask}
          statuses={currentSpaceStatuses}
          peekMode={state.peekMode}
          onChangePeekMode={(peekMode) =>
            dispatch({ type: "SET_PEEK_MODE", peekMode })
          }
          onClose={() => dispatch({ type: "CLOSE_TASK_DRAWER" })}
          onUpdateTask={handleUpdateTask}
          onToggleChecklist={handleToggleChecklist}
          onAddChecklist={handleAddChecklist}
          onAddSubtask={handleAddSubtask}
          onAddComment={handleAddComment}
          onDeleteTask={handleDeleteTask}
        />

        <NewSpaceModal
          isOpen={state.isNewSpaceModalOpen}
          onClose={() => dispatch({ type: "CLOSE_NEW_SPACE_MODAL" })}
          onCreateSpace={handleCreateSpace}
        />
      </div>
    </ExecutiveModuleShell>
  );
}
