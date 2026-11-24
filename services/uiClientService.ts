export interface UiPreferencesRemoteResponse {
  persisted?: boolean;
  theme?: unknown;
}

export async function fetchRemoteUiPreferences(): Promise<UiPreferencesRemoteResponse | null> {
  try {
    const res = await fetch("/api/ui-preferences", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as UiPreferencesRemoteResponse;
  } catch {
    return null;
  }
}

export interface NovaContextCounts {
  tasks: number;
  events: number;
  metrics: number;
}

export async function fetchNovaContextCounts(): Promise<NovaContextCounts> {
  const [tData, cData, mData] = await Promise.all([
    fetch("/api/tasks")
      .then((r) => r.json() as Promise<{ tasks?: Array<{ status?: string }> }>)
      .catch(() => ({ tasks: [] })),
    fetch("/api/calendar")
      .then((r) => r.json() as Promise<{ events?: unknown[] }>)
      .catch(() => ({ events: [] })),
    fetch("/api/metrics")
      .then((r) => r.json() as Promise<{ metrics?: unknown[] }>)
      .catch(() => ({ metrics: [] })),
  ]);

  return {
    tasks: (tData.tasks ?? []).filter((t) => t.status !== "DONE").length,
    events: (cData.events ?? []).length,
    metrics: (mData.metrics ?? []).length,
  };
}
