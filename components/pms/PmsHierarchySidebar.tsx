"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  List as ListIcon,
  Plus,
  Dumbbell,
  Cpu,
  Calendar,
  Trophy,
  Zap,
  Shield,
  Target,
  MoreHorizontal,
  FolderPlus,
  FilePlus,
  Layers,
} from "lucide-react";
import { PmsSpaceDTO, PmsFolderDTO, PmsListDTO } from "@/app/api/pms/route";

interface PmsHierarchySidebarProps {
  spaces: PmsSpaceDTO[];
  selectedSpaceId: string | null;
  selectedFolderId: string | null;
  selectedListId: string | null;
  onSelectSpace: (spaceId: string) => void;
  onSelectFolder: (spaceId: string, folderId: string) => void;
  onSelectList: (spaceId: string, folderId: string | null, listId: string) => void;
  onOpenNewSpaceModal: () => void;
  onCreateFolder: (spaceId: string, name: string) => Promise<void>;
  onCreateList: (spaceId: string, folderId: string | null, name: string) => Promise<void>;
}

export function PmsHierarchySidebar({
  spaces,
  selectedSpaceId,
  selectedFolderId,
  selectedListId,
  onSelectSpace,
  onSelectFolder,
  onSelectList,
  onOpenNewSpaceModal,
  onCreateFolder,
  onCreateList,
}: PmsHierarchySidebarProps) {
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({
    all: true,
  });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    all: true,
  });

  // Quick Inline Creation States
  const [addingFolderToSpaceId, setAddingFolderToSpaceId] = useState<string | null>(null);
  const [addingListToTarget, setAddingListToTarget] = useState<{
    spaceId: string;
    folderId: string | null;
  } | null>(null);
  const [inlineName, setInlineName] = useState("");

  const toggleSpace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSpaces((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const handleCreateInlineFolder = async (spaceId: string) => {
    if (!inlineName.trim()) {
      setAddingFolderToSpaceId(null);
      return;
    }
    await onCreateFolder(spaceId, inlineName.trim());
    setInlineName("");
    setAddingFolderToSpaceId(null);
  };

  const handleCreateInlineList = async (spaceId: string, folderId: string | null) => {
    if (!inlineName.trim()) {
      setAddingListToTarget(null);
      return;
    }
    await onCreateList(spaceId, folderId, inlineName.trim());
    setInlineName("");
    setAddingListToTarget(null);
  };

  const renderSpaceIcon = (iconName: string, color: string) => {
    const iconProps = { className: "w-4 h-4 flex-shrink-0", style: { color } };
    switch (iconName) {
      case "dumbbell":
        return <Dumbbell {...iconProps} />;
      case "cpu":
        return <Cpu {...iconProps} />;
      case "calendar":
        return <Calendar {...iconProps} />;
      case "trophy":
        return <Trophy {...iconProps} />;
      case "zap":
        return <Zap {...iconProps} />;
      case "shield":
        return <Shield {...iconProps} />;
      case "target":
        return <Target {...iconProps} />;
      default:
        return <Folder {...iconProps} />;
    }
  };

  return (
    <aside className="w-[240px] min-w-[240px] h-full bg-[#11131C] border-r border-[#1E222D] flex flex-col select-none z-10 text-zinc-300">
      {/* Top Header */}
      <div className="h-12 px-3 border-b border-[#1E222D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
            Spaces
          </span>
        </div>
        <button
          onClick={onOpenNewSpaceModal}
          title="Create New Space"
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Spaces & Folders Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {spaces.map((space) => {
          const isSpaceExpanded = expandedSpaces[space.id] !== false;
          const isSpaceSelected =
            selectedSpaceId === space.id && !selectedFolderId && !selectedListId;

          return (
            <div key={space.id} className="space-y-0.5">
              {/* Space Row */}
              <div
                onClick={() => onSelectSpace(space.id)}
                className={`group h-8 px-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs font-medium ${
                  isSpaceSelected
                    ? "bg-blue-600/20 text-white border border-blue-500/30"
                    : "hover:bg-[#181B26] text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={(e) => toggleSpace(space.id, e)}
                    className="p-0.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {isSpaceExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {renderSpaceIcon(space.icon, space.color_hex)}
                  <span className="truncate">{space.name}</span>
                </div>

                {/* Quick Add Menu */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                  <button
                    title="Add Folder / Epic"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingFolderToSpaceId(space.id);
                    }}
                    className="p-1 rounded hover:bg-[#252A3B] text-zinc-400 hover:text-white"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                  <button
                    title="Add List"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingListToTarget({ spaceId: space.id, folderId: null });
                    }}
                    className="p-1 rounded hover:bg-[#252A3B] text-zinc-400 hover:text-white"
                  >
                    <FilePlus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Inline Folder Creator */}
              {addingFolderToSpaceId === space.id && (
                <div className="pl-6 pr-2 py-1">
                  <input
                    type="text"
                    placeholder="Epic or Folder name..."
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateInlineFolder(space.id);
                      if (e.key === "Escape") setAddingFolderToSpaceId(null);
                    }}
                    autoFocus
                    className="w-full px-2 py-1 bg-[#090A0F] border border-blue-500 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Inline Direct List Creator */}
              {addingListToTarget?.spaceId === space.id &&
                addingListToTarget.folderId === null && (
                  <div className="pl-6 pr-2 py-1">
                    <input
                      type="text"
                      placeholder="List name..."
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateInlineList(space.id, null);
                        if (e.key === "Escape") setAddingListToTarget(null);
                      }}
                      autoFocus
                      className="w-full px-2 py-1 bg-[#090A0F] border border-blue-500 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                )}

              {/* Expanded Space Content: Folders & Direct Lists */}
              {isSpaceExpanded && (
                <div className="space-y-0.5">
                  {/* Folders / Epics */}
                  {space.folders.map((folder) => {
                    const isFolderExpanded = expandedFolders[folder.id] !== false;
                    const isFolderSelected =
                      selectedFolderId === folder.id && !selectedListId;

                    return (
                      <div key={folder.id} className="space-y-0.5">
                        <div
                          onClick={() => onSelectFolder(space.id, folder.id)}
                          className={`group h-8 pl-5 pr-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                            isFolderSelected
                              ? "bg-blue-600/20 text-white border border-blue-500/30"
                              : "hover:bg-[#181B26] text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              onClick={(e) => toggleFolder(folder.id, e)}
                              className="p-0.5 text-zinc-500 hover:text-zinc-300"
                            >
                              {isFolderExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                            <Folder className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{folder.name}</span>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 flex items-center transition">
                            <button
                              title="Add List to Folder"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddingListToTarget({
                                  spaceId: space.id,
                                  folderId: folder.id,
                                });
                              }}
                              className="p-1 rounded hover:bg-[#252A3B] text-zinc-400 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Inline List Creator in Folder */}
                        {addingListToTarget?.spaceId === space.id &&
                          addingListToTarget.folderId === folder.id && (
                            <div className="pl-10 pr-2 py-1">
                              <input
                                type="text"
                                placeholder="Backlog or List name..."
                                value={inlineName}
                                onChange={(e) => setInlineName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleCreateInlineList(space.id, folder.id);
                                  if (e.key === "Escape") setAddingListToTarget(null);
                                }}
                                autoFocus
                                className="w-full px-2 py-1 bg-[#090A0F] border border-blue-500 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                              />
                            </div>
                          )}

                        {/* Lists inside this folder */}
                        {isFolderExpanded && (
                          <div className="space-y-0.5">
                            {folder.lists.map((list) => {
                              const isListSelected = selectedListId === list.id;
                              return (
                                <div
                                  key={list.id}
                                  onClick={() =>
                                    onSelectList(space.id, folder.id, list.id)
                                  }
                                  className={`h-7 pl-9 pr-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                                    isListSelected
                                      ? "bg-blue-600/25 text-white font-medium border border-blue-500/40"
                                      : "hover:bg-[#181B26] text-zinc-400 hover:text-zinc-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <ListIcon className="w-3 h-3 text-zinc-500" />
                                    <span className="truncate">{list.name}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Direct Lists under space */}
                  {space.lists.map((list) => {
                    const isListSelected = selectedListId === list.id;
                    return (
                      <div
                        key={list.id}
                        onClick={() => onSelectList(space.id, null, list.id)}
                        className={`h-7 pl-6 pr-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                          isListSelected
                            ? "bg-blue-600/25 text-white font-medium border border-blue-500/40"
                            : "hover:bg-[#181B26] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ListIcon className="w-3 h-3 text-zinc-500" />
                          <span className="truncate">{list.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
