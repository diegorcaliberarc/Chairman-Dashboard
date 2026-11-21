import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const JSON_MODE = process.argv.includes("--json");

const CORE_ROUTES = [
  { route: "/", sphere: "master", page: "app/page.tsx", apis: ["app/api/widgets/route.ts", "app/api/ui-preferences/route.ts"] },
  { route: "/command", sphere: "operations", page: "app/command/page.tsx", apis: ["app/api/command/route.ts", "app/api/scorecard/route.ts"] },
  { route: "/pms", sphere: "operations", page: "app/pms/page.tsx", apis: ["app/api/pms/route.ts"] },
  { route: "/roadmaps", sphere: "operations", page: "app/roadmaps/page.tsx", apis: ["app/api/roadmaps/route.ts", "app/api/roadmaps/synthesize/route.ts"] },
  { route: "/org-chart", sphere: "operations", page: "app/org-chart/page.tsx", apis: ["app/api/architecture/map/route.ts"] },
  { route: "/horizon", sphere: "operations", page: "app/horizon/page.tsx", apis: ["app/api/horizon/route.ts"] },
  { route: "/life-ops", sphere: "operations", page: "app/life-ops/page.tsx", apis: ["app/api/life-ops/route.ts"] },
  { route: "/skills", sphere: "operations", page: "app/skills/page.tsx", apis: ["app/api/skills/route.ts"] },
  { route: "/artifacts", sphere: "operations", page: "app/artifacts/page.tsx", apis: ["app/api/artifacts/route.ts"] },
  { route: "/workouts", sphere: "health", page: "app/workouts/page.tsx", apis: ["app/api/titan/sessions/route.ts", "app/api/titan/exercises/route.ts", "app/api/titan/sets/route.ts"] },
  { route: "/macro-ops", sphere: "health", page: "app/macro-ops/page.tsx", apis: ["app/api/nutrition/route.ts", "app/api/sitrep/route.ts", "app/api/parse-food/route.ts"] },
  { route: "/calendar", sphere: "health", page: "app/calendar/page.tsx", apis: ["app/api/circadian/route.ts", "app/api/calendar-ops/route.ts", "app/api/calendar-events/route.ts"] },
  { route: "/mindset", sphere: "health", page: "app/mindset/page.tsx", apis: ["app/api/mindset/route.ts"] },
  { route: "/budget", sphere: "wealth", page: "app/budget/page.tsx", apis: ["app/api/budget/route.ts", "app/api/plaid/route.ts"] },
  { route: "/caliber-arc", sphere: "wealth", page: "app/caliber-arc/page.tsx", apis: ["app/api/trading/route.ts"] },
  { route: "/marketing-agent", sphere: "wealth", page: "app/marketing-agent/page.tsx", apis: ["app/api/marketing-agent/route.ts"] },
  { route: "/education", sphere: "wealth", page: "app/education/page.tsx", apis: ["app/api/education/route.ts"] },
  { route: "/pods", sphere: "fam", page: "app/pods/page.tsx", apis: ["app/api/pods/route.ts"] },
  { route: "/family-hub", sphere: "fam", page: "app/family-hub/page.tsx", apis: ["app/api/family-hub/route.ts"] },
  { route: "/kpis", sphere: "executive", page: "app/kpis/page.tsx", apis: ["app/api/kpi-scorecard/route.ts", "app/api/metrics/route.ts"] },
];

function readSafe(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

function countMatches(text, regex) {
  const m = text.match(regex);
  return m ? m.length : 0;
}

const results = CORE_ROUTES.map((entry) => {
  const pageSrc = readSafe(entry.page) || "";
  const lines = pageSrc ? pageSrc.split(/\r?\n/).length : 0;

  const hasFetchOrService =
    /fetch\s*\(\s*["'`]\/api\//.test(pageSrc) ||
    /from\s+["']@features\//.test(pageSrc) ||
    /from\s+["']@\/services\//.test(pageSrc) ||
    /from\s+["']@\/components\//.test(pageSrc);

  const hasMutationFetch =
    /method:\s*["'`](POST|PATCH|PUT|DELETE)["'`]/.test(pageSrc) ||
    /from\s+["']@features\//.test(pageSrc) ||
    /from\s+["']@\/services\//.test(pageSrc);

  const hasLocalStorageOnly =
    /localStorage\./.test(pageSrc) && !/fetch\s*\(\s*["'`]\/api\//.test(pageSrc) && !/from\s+["']@features\//.test(pageSrc);

  const seedConstCount = countMatches(
    pageSrc,
    /\bconst\s+(?:MOCK|SEED|SAMPLE|DUMMY|DEFAULT|INITIAL|FALLBACK)_[A-Z0-9_]+\b/g
  );
  const comingSoonCount = countMatches(
    pageSrc,
    /coming soon|placeholder|stub|TODO|FIXME|lorem ipsum/gi
  );
  const noopHandlerCount = countMatches(
    pageSrc,
    /onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}|alert\s*\(/g
  );

  const apiDetails = entry.apis.map((apiPath) => {
    const apiSrc = readSafe(apiPath);
    if (!apiSrc) return { path: apiPath, exists: false, dbBacked: false, verbs: [] };
    const verbs = ["GET", "POST", "PATCH", "PUT", "DELETE"].filter((v) =>
      new RegExp(`export\\s+async\\s+function\\s+${v}\\b`).test(apiSrc)
    );
    const dbBacked =
      /prisma\.|pgQuery|pgExec|supabase\./.test(apiSrc);
    const apiSeedCount = countMatches(
      apiSrc,
      /\b(?:SEED|FALLBACK|DEFAULT)_[A-Z0-9_]+\b|seedIfEmpty|ensureSeeded/g
    );
    return { path: apiPath, exists: true, dbBacked, verbs, apiSeedCount };
  });

  const existingApis = apiDetails.filter((a) => a.exists);
  const dbBackedApis = existingApis.filter((a) => a.dbBacked);
  const allVerbs = Array.from(new Set(existingApis.flatMap((a) => a.verbs)));

  let tier = "PLACEHOLDER_SHELL";
  if (dbBackedApis.length > 0 && hasMutationFetch && allVerbs.includes("POST")) {
    tier = seedConstCount >= 2 || comingSoonCount > 0 ? "HYBRID_SEEDED" : "LIVE_PERSISTED";
  } else if (existingApis.length > 0 && hasFetchOrService) {
    tier = "HYBRID_SEEDED";
  } else if (hasLocalStorageOnly) {
    tier = "LOCAL_ONLY";
  }

  return {
    route: entry.route,
    sphere: entry.sphere,
    page: entry.page,
    lines,
    tier,
    apiCount: existingApis.length,
    dbBackedApiCount: dbBackedApis.length,
    verbs: allVerbs,
    seedConstCount,
    comingSoonCount,
    noopHandlerCount,
    missingApis: apiDetails.filter((a) => !a.exists).map((a) => a.path),
  };
});

if (JSON_MODE) {
  console.log(JSON.stringify({ totalRoutes: results.length, routes: results }, null, 2));
} else {
  console.log(`\n[Workflow Audit Static Scan] ${results.length} routes inspected:\n`);
  for (const r of results) {
    const flags = [
      r.seedConstCount > 0 ? `seeds=${r.seedConstCount}` : null,
      r.comingSoonCount > 0 ? `placeholders=${r.comingSoonCount}` : null,
      r.noopHandlerCount > 0 ? `noops=${r.noopHandlerCount}` : null,
      r.missingApis.length > 0 ? `missingApi=${r.missingApis.join(",")}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    console.log(
      `  ${r.route.padEnd(18)} ${r.tier.padEnd(18)} lines=${String(r.lines).padStart(4)} dbApis=${r.dbBackedApiCount}/${r.apiCount} verbs=[${r.verbs.join(",")}] ${flags}`
    );
  }
}
