import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  INITIAL_DIAGRAM_SPACES,
  KNOWN_MODULES_REGISTRY,
  ArchitectureNode,
  DiagramSpace,
} from "@/lib/architectureRegistry";

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// Recursively scan directories for page.tsx and route.ts
function scanRoutes(baseDir: string, relativeDir: string = ""): { pages: string[]; apis: string[] } {
  const pages: string[] = [];
  const apis: string[] = [];

  try {
    const fullPath = path.join(baseDir, relativeDir);
    if (!fs.existsSync(fullPath)) return { pages, apis };

    const entries = fs.readdirSync(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryRel = path.join(relativeDir, entry.name).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        const sub = scanRoutes(baseDir, entryRel);
        pages.push(...sub.pages);
        apis.push(...sub.apis);
      } else if (entry.isFile()) {
        if (entry.name === "page.tsx" || entry.name === "page.jsx") {
          const route = "/" + relativeDir.replace(/\\/g, "/");
          pages.push(route === "/." ? "/" : route);
        } else if (entry.name === "route.ts" || entry.name === "route.js") {
          const apiRoute = "/api/" + relativeDir.replace(/^api\/?/, "").replace(/\\/g, "/");
          apis.push(apiRoute);
        }
      }
    }
  } catch (err) {
    console.error("Error scanning routes:", err);
  }

  return { pages, apis };
}

export async function GET() {
  try {
    const appDir = path.join(process.cwd(), "app");
    const { pages, apis } = scanRoutes(appDir);

    // Merge discovered routes with our enriched registry
    const registeredRoutes = new Set(KNOWN_MODULES_REGISTRY.map((m) => m.route));
    const allDiscoveredModules: ArchitectureNode[] = [...KNOWN_MODULES_REGISTRY];

    // Add any discovered pages that are not yet in the known registry
    for (const pageRoute of pages) {
      if (!registeredRoutes.has(pageRoute) && pageRoute !== "/") {
        const seg = pageRoute.replace(/^\//, "").replace(/\//g, " ");
        const name = seg.charAt(0).toUpperCase() + seg.slice(1);
        allDiscoveredModules.push({
          id: pageRoute.toUpperCase().replace(/[^A-Z0-9]/g, "_"),
          label: name || "Discovered Page",
          subtitle: `Route ${pageRoute}`,
          route: pageRoute,
          pillar: "infra",
          spaceId: "master",
          status: "LIVE",
          description: `Automatically scanned Next.js page at ${pageRoute}.`,
          apis: [],
          subFeatures: ["Automated Route Discovery"],
          dependencies: [],
          techStack: ["Next.js App Router"],
          iconName: "FileCode",
        });
      }
    }

    // Try fetching custom spaces from Supabase if table exists
    let customSpaces: DiagramSpace[] = [];
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("diagram_pages")
          .select("*")
          .order("created_at", { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) {
          customSpaces = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description || "",
            badge: d.badge || "Custom",
            isDefault: Boolean(d.is_default),
            direction: (d.direction === "LR" ? "LR" : "TD") as "TD" | "LR",
            mermaidCode: d.mermaid_syntax || d.mermaidCode || "",
            updatedAt: d.updated_at || new Date().toISOString(),
          }));
        }
      }
    } catch {
      // Supabase table may not exist yet; gracefully fallback to default spaces
    }

    // Combine default spaces with custom spaces (deduplicating by id)
    const spaceMap = new Map<string, DiagramSpace>();
    for (const s of INITIAL_DIAGRAM_SPACES) {
      spaceMap.set(s.id, s);
    }
    for (const cs of customSpaces) {
      spaceMap.set(cs.id, cs);
    }

    return NextResponse.json({
      success: true,
      scannedAt: new Date().toISOString(),
      stats: {
        totalDiscoveredPages: pages.length,
        totalDiscoveredApis: apis.length,
        registeredModules: allDiscoveredModules.length,
      },
      spaces: Array.from(spaceMap.values()),
      modules: allDiscoveredModules,
      discoveredPages: pages,
      discoveredApis: apis,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to scan architecture map",
        spaces: INITIAL_DIAGRAM_SPACES,
        modules: KNOWN_MODULES_REGISTRY,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { space } = body;

    if (!space || !space.id || !space.title) {
      return NextResponse.json({ error: "Missing required space fields" }, { status: 400 });
    }

    // Attempt to persist in Supabase if configured
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("diagram_pages").upsert({
          id: space.id,
          title: space.title,
          description: space.description || "",
          badge: space.badge || "Custom",
          direction: space.direction || "TD",
          mermaid_syntax: space.mermaidCode || "",
          is_default: Boolean(space.isDefault),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn("Could not persist diagram page to Supabase (falling back to client storage):", dbErr);
    }

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
      space,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
