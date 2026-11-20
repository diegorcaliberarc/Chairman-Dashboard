import { always, eventually, now } from "@antithesishq/bombadil";
import { extract } from "@antithesishq/bombadil/browser";

export * from "@antithesishq/bombadil/browser/defaults";

const roadmapDom = extract((state) => {
  const doc = state.document;
  const root = doc.querySelector('[data-testid="roadmap-workspace-root"]');
  const viewMode = root?.getAttribute("data-view-mode") ?? null;
  const asyncPhase = root?.getAttribute("data-async-phase") ?? "IDLE";

  const hasDagCanvas = Boolean(doc.querySelector('[data-testid="dag-canvas-view"]'));
  const hasPyramidCanvas = Boolean(
    doc.querySelector('[data-testid="execution-pyramid-view"]')
  );

  const dossier = doc.querySelector('[data-testid="pardo-fmea-dossier-drawer"]');
  const dossierTitle =
    doc.querySelector('[data-testid="pardo-fmea-dossier-title"]')?.textContent?.trim() ??
    "";
  const hasCloseBtn = Boolean(doc.querySelector('[data-testid="pardo-fmea-close-btn"]'));

  const openDialogs = doc.querySelectorAll('[role="dialog"]').length;

  return {
    mounted: Boolean(root),
    viewMode,
    asyncPhase,
    hasDagCanvas,
    hasPyramidCanvas,
    dossierOpen: Boolean(dossier),
    dossierHasValidMetadata: dossierTitle.length > 0 && hasCloseBtn,
    openDialogs,
  };
});

/**
 * INV-1 & Metadata Property: Whenever PARDO & FMEA Dossier Drawer is open,
 * it always renders a non-empty node title and a deterministic close trigger.
 */
export const dossierAlwaysRendersValidMetadata = always(() => {
  if (!roadmapDom.current.dossierOpen) return true;
  return roadmapDom.current.dossierHasValidMetadata;
});

/**
 * INV-2 Liveness Property: Any in-flight DAG synthesis eventually resolves
 * back to IDLE or ERROR_RECOVERY within 10 seconds (never hangs indefinitely).
 */
export const synthesisEventuallySettles = always(() =>
  now(() => roadmapDom.current.asyncPhase === "SYNTHESIZING_DAG").implies(
    eventually(
      () => roadmapDom.current.asyncPhase !== "SYNTHESIZING_DAG"
    ).within(10, "seconds")
  )
);

/**
 * INV-3 Exclusive Modal Stack: At most one modal dialog is mounted at once.
 */
export const exclusiveModalStack = always(() => roadmapDom.current.openDialogs <= 1);

/**
 * View Consistency Property: Workspace viewMode attribute always matches the
 * rendered canvas (Execution Pyramid vs. DAG Graph).
 */
export const viewToggleMatchesRenderedSurface = always(() => {
  if (!roadmapDom.current.mounted) return true;
  if (roadmapDom.current.viewMode === "pyramid") {
    return roadmapDom.current.hasPyramidCanvas && !roadmapDom.current.hasDagCanvas;
  }
  return !roadmapDom.current.hasPyramidCanvas;
});
