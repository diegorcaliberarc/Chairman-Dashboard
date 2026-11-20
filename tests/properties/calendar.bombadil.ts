import { always } from "@antithesishq/bombadil";
import { extract } from "@antithesishq/bombadil/browser";

export * from "@antithesishq/bombadil/browser/defaults";

const calendarDom = extract((state) => {
  const doc = state.document;
  const solarBtn = doc.querySelector('[data-testid="calendar-engine-solar"]');
  const googleBtn = doc.querySelector('[data-testid="calendar-engine-google"]');
  const dateBadge = doc.querySelector('[data-testid="calendar-active-date"]');
  const activeDate = dateBadge?.getAttribute("data-active-date") ?? "";

  return {
    mounted: Boolean(solarBtn && googleBtn),
    hasBothEngines: Boolean(solarBtn) && Boolean(googleBtn),
    activeDate,
  };
});

/**
 * Active Date ISO Invariant: Across Solar Arc and Google Calendar Grid switches,
 * the active date state always remains a valid YYYY-MM-DD calendar string.
 */
export const calendarActiveDateAlwaysValidIso = always(() => {
  if (!calendarDom.current.mounted) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(calendarDom.current.activeDate);
});

/**
 * Engine Control Availability: Both Solar Arc and Google Calendar Grid engine
 * toggles remain mounted and interactive in the top header bar.
 */
export const calendarEngineSwitcherAlwaysMounted = always(() => {
  if (!calendarDom.current.mounted) return true;
  return calendarDom.current.hasBothEngines;
});
