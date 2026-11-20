"use client";

import React, { useState } from "react";
import { ChecklistItem } from "@/lib/synthesisRoadmapTypes";
import { Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import {
  scheduleDossierOnCalendar,
  syncDossierToPms,
} from "@/services/roadmapClientService";

interface DossierSyncFooterProps {
  title: string;
  checks: ChecklistItem[];
  domain: string;
  fragoWindow: string;
  nodeImage?: string;
  onClose: () => void;
  onVerifyStep?: () => void;
}

export function DossierSyncFooter({
  title,
  checks,
  domain,
  fragoWindow,
  nodeImage,
  onClose,
  onVerifyStep,
}: DossierSyncFooterProps) {
  const [isSyncingPms, setIsSyncingPms] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleSyncToPms = async () => {
    if (isSyncingPms) return;
    setIsSyncingPms(true);
    setSyncStatusMsg(null);
    try {
      const msg = await syncDossierToPms({
        nodeTitle: title,
        checks,
        domain: domain || "all",
      });
      setSyncStatusMsg(msg);
    } catch (err) {
      setSyncStatusMsg(err instanceof Error ? err.message : "Error connecting to PMS API");
    } finally {
      setIsSyncingPms(false);
    }
  };

  const handleScheduleCalendar = async () => {
    if (isSyncingCalendar) return;
    setIsSyncingCalendar(true);
    setSyncStatusMsg(null);
    try {
      const msg = await scheduleDossierOnCalendar({
        nodeTitle: title,
        fragoWindow,
        nodeImage,
        domain: domain || "engineering",
      });
      setSyncStatusMsg(msg);
    } catch (err) {
      setSyncStatusMsg(err instanceof Error ? err.message : "Error connecting to Calendar API");
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-white/10">
      {syncStatusMsg && (
        <div
          data-testid="pardo-fmea-sync-status"
          className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono flex items-center justify-between"
        >
          <span>{syncStatusMsg}</span>
          <button
            type="button"
            onClick={() => setSyncStatusMsg(null)}
            className="text-cyan-200 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="pardo-fmea-sync-pms-btn"
            onClick={handleSyncToPms}
            disabled={isSyncingPms}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            title="Export subtasks directly to Sovereign PMS database table"
          >
            <ExternalLink size={12} />
            <span>{isSyncingPms ? "Syncing..." : "Sync to Sovereign PMS"}</span>
          </button>

          <button
            type="button"
            data-testid="pardo-fmea-sync-calendar-btn"
            onClick={handleScheduleCalendar}
            disabled={isSyncingCalendar}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            title="Schedule execution window on 24H Circadian Solar Arc Calendar"
          >
            <Calendar size={12} />
            <span>{isSyncingCalendar ? "Scheduling..." : "Schedule on Solar Arc"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 font-semibold text-xs transition"
          >
            Close
          </button>
          <button
            type="button"
            data-testid="pardo-fmea-verify-step-btn"
            onClick={() => {
              onVerifyStep?.();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
          >
            <CheckCircle2 size={13} />
            <span>Verify Step (100%)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
