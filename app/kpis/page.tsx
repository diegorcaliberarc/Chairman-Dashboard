"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  CORE_PILLAR_CATEGORIES,
  ScorecardHeroBanner,
  ScorecardMatrixTable,
  SectorPhysicsCard,
  useKpiScorecard,
} from "@features/kpi-scorecard";

const CSS_3D = `
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
`;

export default function KPIsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const calConnected = Boolean((session as { accessToken?: string } | null)?.accessToken);

  const [activeTab, setActiveTab] = useState("KPI");
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [deepWork, setDeepWork] = useState(false);

  const {
    metrics,
    viewMode,
    setViewMode,
    snapshots,
    streakCount,
    selectedSectorFilter,
    setSelectedSectorFilter,
    ragFilter,
    setRagFilter,
    searchTerm,
    setSearchTerm,
    inlineDrafts,
    setDraftValue,
    savedFlashKey,
    checkInOpen,
    setCheckInOpen,
    checkInCadence,
    setCheckInCadence,
    checkInNote,
    setCheckInNote,
    savingCheckIn,
    sectorRawValues,
    evaluatedRows,
    scorecardSummary,
    filteredScorecardSectors,
    getKpiSparklinePoints,
    handleSave,
    handleInlineQuickSave,
    handleLogScorecardCheckIn,
  } = useKpiScorecard();

  return (
    <div
      data-testid="kpi-scorecard-root"
      className="min-h-screen text-zinc-900 dark:text-white flex flex-row"
    >
      <style>{CSS_3D}</style>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        calConnected={calConnected}
        onCalToggle={() => (calConnected ? signOut({ redirect: false }) : signIn("google"))}
        isAppearanceOpen={isAppearanceOpen}
        setIsAppearanceOpen={setIsAppearanceOpen}
        activeTasksCount={0}
        activeSubtasksCount={0}
        tasksLoading={false}
        user={user}
        deepWork={deepWork}
        setDeepWork={setDeepWork}
      />

      <div className="flex-1 flex flex-col pt-14 lg:pt-0 min-w-0 transition-all duration-300">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-6">
          <div className="max-w-[1480px] mx-auto space-y-6 pb-24">
            <ScorecardHeroBanner
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              summary={scorecardSummary}
              totalKpisCount={evaluatedRows.length}
              streakCount={streakCount}
              snapshots={snapshots}
              checkInOpen={checkInOpen}
              onToggleCheckIn={() => setCheckInOpen((prev) => !prev)}
              onCloseCheckIn={() => setCheckInOpen(false)}
              checkInCadence={checkInCadence}
              onChangeCadence={setCheckInCadence}
              checkInNote={checkInNote}
              onChangeNote={setCheckInNote}
              savingCheckIn={savingCheckIn}
              onSubmitCheckIn={handleLogScorecardCheckIn}
            />

            {(viewMode === "matrix" || viewMode === "both") && (
              <ScorecardMatrixTable
                filteredScorecardSectors={filteredScorecardSectors}
                sectorScores={scorecardSummary.sectorScores}
                sectorRawValues={sectorRawValues}
                selectedSectorFilter={selectedSectorFilter}
                onSelectSectorFilter={setSelectedSectorFilter}
                ragFilter={ragFilter}
                onSelectRagFilter={setRagFilter}
                searchTerm={searchTerm}
                onChangeSearchTerm={setSearchTerm}
                inlineDrafts={inlineDrafts}
                onChangeDraft={setDraftValue}
                savedFlashKey={savedFlashKey}
                onInlineQuickSave={handleInlineQuickSave}
                onSaveRawMetric={handleSave}
                getKpiSparklinePoints={getKpiSparklinePoints}
              />
            )}

            {(viewMode === "cards" || viewMode === "both") && (
              <section data-testid="kpi-cards-section" className="space-y-3">
                {viewMode === "both" && (
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                      3D Interactive Sector Physics Deck (4 Core Pillars · Flip Any Card to Edit Raw Drivers)
                    </h2>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {CORE_PILLAR_CATEGORIES.map((cat) => (
                    <SectorPhysicsCard
                      key={cat.id}
                      category={cat}
                      allMetrics={metrics}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
