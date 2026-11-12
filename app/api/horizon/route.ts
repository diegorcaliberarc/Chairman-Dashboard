import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

export type HorizonTier = "1_year" | "10_year" | "30_year" | "80_year";
export type WaypointTerrain =
  | "summit_peak"
  | "valley_station"
  | "river_crossing"
  | "coastal_harbor"
  | "citadel";

export interface HorizonPillarRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ray_angle_degrees: number;
  accent_color: string;
  sort_order: number;
  created_at: string;
}

export interface HorizonSliverRow {
  id: string;
  pillar_id: string;
  user_id: string;
  horizon_tier: HorizonTier;
  title: string;
  strategic_intent: string | null;
  target_year: number;
  resource_weight_pct: number;
  is_milestone_locked: boolean;
  linked_project_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface SpatialZoomAnchorRow {
  id: string;
  user_id: string;
  entity_id: string;
  zoom_level: number;
  spatial_coords_3d: {
    label: string;
    zoomFactor: number;
    x: number;
    y: number;
    z: number;
  };
  target_fov: number;
  created_at: string;
}

export interface JourneyWaypointRow {
  id: string;
  user_id: string;
  title: string;
  terrain_type: WaypointTerrain;
  coord_x: number;
  coord_y: number;
  coord_z: number;
  linked_horizon_sliver_id: string | null;
  linked_pms_list_id: string | null;
  target_date: string | null;
  completion_percentage: number;
  accent_glow_color: string;
  hud_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface JourneyPathRow {
  id: string;
  user_id: string;
  from_waypoint_id: string;
  to_waypoint_id: string;
  path_curve_type: string;
  is_active_pathway: boolean;
  created_at: string;
}

const SEED_PILLARS: Array<{
  title: string;
  description: string;
  ray_angle_degrees: number;
  accent_color: string;
  sort_order: number;
  slivers: Array<{
    horizon_tier: HorizonTier;
    title: string;
    strategic_intent: string;
    target_year: number;
    resource_weight_pct: number;
    is_milestone_locked: boolean;
  }>;
}> = [
  {
    title: "Equipsynx & SaaS Ventures",
    description:
      "Multi-tenant industrial SaaS platforms, autonomous MCP software IP, and recurring enterprise ARR engines.",
    ray_angle_degrees: 24,
    accent_color: "#e5c07b",
    sort_order: 0,
    slivers: [
      {
        horizon_tier: "1_year",
        title: "Equipsynx v2 Enterprise GA & First 25 Fleet Logos",
        strategic_intent:
          "Ship multi-tenant RLS dispatch core, RFID yard check-in webhooks, and cross $600K ARR run-rate.",
        target_year: 2027,
        resource_weight_pct: 36,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "10_year",
        title: "Autonomous Industrial SaaS Holding Co ($25M+ ARR)",
        strategic_intent:
          "Compound Equipsynx + vertical logistics SaaS suite into category-defining heavy-equipment telemetry standard.",
        target_year: 2034,
        resource_weight_pct: 32,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "30_year",
        title: "Sovereign Venture Studio & Industrial AI Foundry",
        strategic_intent:
          "Endow self-sustaining engineering leadership bench incubating mission-critical physical-world software.",
        target_year: 2056,
        resource_weight_pct: 22,
        is_milestone_locked: false,
      },
      {
        horizon_tier: "80_year",
        title: "Centennial Civic & Applied Engineering Institute",
        strategic_intent:
          "Perpetual open-charter engineering patronage advancing resilient infrastructure and sovereign tooling.",
        target_year: 2106,
        resource_weight_pct: 18,
        is_milestone_locked: false,
      },
    ],
  },
  {
    title: "Capital & Futures Mastery",
    description:
      "Caliber Arc Nasdaq futures alpha, Treasury liquidity harvesting, asymmetric compounding, and sovereign reserves.",
    ray_angle_degrees: 57,
    accent_color: "#f59e0b",
    sort_order: 1,
    slivers: [
      {
        horizon_tier: "1_year",
        title: "Caliber Arc 5-Account Synced Prop & Cash Harvest",
        strategic_intent:
          "Maintain zero circuit-breaker violations while sweeping quarterly futures alpha into Treasury & real-asset reserves.",
        target_year: 2027,
        resource_weight_pct: 24,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "10_year",
        title: "$10M Liquid Sovereign Capital & Quantitative Desk",
        strategic_intent:
          "Transition from active prop execution to proprietary algorithmic + discretionary macro family-office book.",
        target_year: 2035,
        resource_weight_pct: 25,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "30_year",
        title: "All-Weather Multi-Cycle Family Office Treasury",
        strategic_intent:
          "3.5% perpetual real distribution coverage across equities, T-bills, hard commodities, and private credit.",
        target_year: 2056,
        resource_weight_pct: 24,
        is_milestone_locked: false,
      },
      {
        horizon_tier: "80_year",
        title: "100-Year Dynasty Trust & Purchasing-Power Shield",
        strategic_intent:
          "Constitutional capital allocation charter preventing leverage ruin across four generations.",
        target_year: 2106,
        resource_weight_pct: 25,
        is_milestone_locked: false,
      },
    ],
  },
  {
    title: "Physiological Longevity",
    description:
      "VO2 max zenith, metabolic precision (MacroOps), strength-to-mass durability, and cognitive sharpness.",
    ray_angle_degrees: 90,
    accent_color: "#38bdf8",
    sort_order: 2,
    slivers: [
      {
        horizon_tier: "1_year",
        title: "1,750 kcal Cut Lock, Sub-12% BF & Top-5% VO2 Max",
        strategic_intent:
          "Execute 180g protein metabolic cadence, zero missed strength blocks, and 92%+ circadian sleep regularity.",
        target_year: 2027,
        resource_weight_pct: 16,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "10_year",
        title: "Decadal Biomarker Zero-Drift & Orthopedic Armor",
        strategic_intent:
          "Maintain elite DEXA lean mass, ApoB/HbA1c optimal quartiles, and injury-free posterior chain power.",
        target_year: 2036,
        resource_weight_pct: 16,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "30_year",
        title: "Active Septuagenarian Alpine & Strength Standard",
        strategic_intent:
          "Hike high-altitude ridgelines unassisted with full neuromuscular balance and metabolic flexibility.",
        target_year: 2056,
        resource_weight_pct: 20,
        is_milestone_locked: false,
      },
      {
        horizon_tier: "80_year",
        title: "Centenarian Healthspan & Lucid Matriarch/Patriarch Presence",
        strategic_intent:
          "Compress morbidity into the final margin of a vibrant century of clear-minded stewardship.",
        target_year: 2106,
        resource_weight_pct: 20,
        is_milestone_locked: false,
      },
    ],
  },
  {
    title: "Family & Kinship Dynasty",
    description:
      "His & Hers shared covenant, senior canine pack devotion, generational mentorship, and family culture.",
    ray_angle_degrees: 123,
    accent_color: "#a78bfa",
    sort_order: 3,
    slivers: [
      {
        horizon_tier: "1_year",
        title: "His & Hers Rhythm & Senior Canine Golden-Years Sanctuary",
        strategic_intent:
          "Protect weekly unplugged covenant rituals and 100% adherence to Senior Canine Longevity hydration/mobility care.",
        target_year: 2027,
        resource_weight_pct: 12,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "10_year",
        title: "Generational Education Charter & Annual Kinship Summits",
        strategic_intent:
          "Institutionalize annual family retreats, financial literacy apprenticeships, and shared archival storytelling.",
        target_year: 2033,
        resource_weight_pct: 13,
        is_milestone_locked: false,
      },
      {
        horizon_tier: "30_year",
        title: "Multi-Household Dynasty Governance & Stewardship Council",
        strategic_intent:
          "Empower next-generation builders with mentorship, values alignment, and meritocratic venture backing.",
        target_year: 2056,
        resource_weight_pct: 17,
        is_milestone_locked: false,
      },
      {
        horizon_tier: "80_year",
        title: "Centennial Rodriguez Family Archive & Living Covenant",
        strategic_intent:
          "Preserve a 100-year unbroken chain of letters, oral histories, and resilient kinship across descendants.",
        target_year: 2106,
        resource_weight_pct: 20,
        is_milestone_locked: false,
      },
    ],
  },
  {
    title: "Real Estate & Fleet Infrastructure",
    description:
      "Rodriguez Estate compound, solar/water off-grid autonomy, commercial IOS yards, and precision fleet logistics.",
    ray_angle_degrees: 156,
    accent_color: "#34d399",
    sort_order: 4,
    slivers: [
      {
        horizon_tier: "1_year",
        title: "Fleet OBD-II Zero-Downtime & Industrial Yard Parcel #1",
        strategic_intent:
          "Underwrite first cash-flowing IOS service yard and automate preventative maintenance across entire household fleet.",
        target_year: 2027,
        resource_weight_pct: 12,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "10_year",
        title: "Rodriguez Estate Microgrid Sanctuary & 4-Yard Corridor",
        strategic_intent:
          "Complete off-grid solar/cistern compound buildout alongside 4 strategic industrial outdoor storage hubs.",
        target_year: 2032,
        resource_weight_pct: 14,
        is_milestone_locked: true,
      },
      {
        horizon_tier: "30_year",
        title: "Debt-Free Land, Water & Logistics Corridor Portfolio",
        strategic_intent:
          "Unencumbered hard-asset base generating inflation-indexed cashflow with autonomous energy/water sovereignty.",
        target_year: 2056,
        resource_weight_pct: 17,
        is_milestone_locked: false,
      },
      {
        horizon_tier: "80_year",
        title: "Ancestral Sanctuary Land Trust & Ecological Preserve",
        strategic_intent:
          "Protected multi-hundred-acre family land & watershed stewardship enduring into the 22nd century.",
        target_year: 2106,
        resource_weight_pct: 17,
        is_milestone_locked: false,
      },
    ],
  },
];

async function seedHorizonIfEmpty(userId: string): Promise<void> {
  const countRows = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM public.macro_horizon_pillars WHERE user_id = $1`,
    userId
  );
  if ((countRows[0]?.cnt ?? 0) > 0) return;

  const createdSliverIdsByTitle = new Map<string, string>();

  for (const p of SEED_PILLARS) {
    const pRows = await pgQuery<{ id: string }>(
      `INSERT INTO public.macro_horizon_pillars
        (user_id, title, description, ray_angle_degrees, accent_color, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      userId,
      p.title,
      p.description,
      p.ray_angle_degrees,
      p.accent_color,
      p.sort_order
    );
    const pillarId = pRows[0]?.id;
    if (!pillarId) continue;

    for (const s of p.slivers) {
      const sRows = await pgQuery<{ id: string }>(
        `INSERT INTO public.macro_horizon_slivers
          (pillar_id, user_id, horizon_tier, title, strategic_intent, target_year, resource_weight_pct, is_milestone_locked, linked_project_ids)
         VALUES (
          $1::uuid,
          $2,
          $3::public.horizon_tier_enum,
          $4,
          $5,
          $6,
          $7,
          $8,
          ARRAY[]::text[]
         )
         RETURNING id`,
        pillarId,
        userId,
        s.horizon_tier,
        s.title,
        s.strategic_intent,
        s.target_year,
        s.resource_weight_pct,
        s.is_milestone_locked
      );
      if (sRows[0]?.id) {
        createdSliverIdsByTitle.set(s.title, sRows[0].id);
      }
    }
  }

  // Seed Powers of Ten spatial_zoom_anchors (Levels 0..3)
  const anchors = [
    {
      entity_id: "horizon-macro-80y",
      zoom_level: 0,
      coords: {
        label: "80-Year Life Horizon",
        zoomFactor: 0.3,
        x: 0,
        y: 0,
        z: 1000,
      },
      fov: 60,
    },
    {
      entity_id: "horizon-decadal-10y",
      zoom_level: 1,
      coords: {
        label: "2026-2036 Decadal",
        zoomFactor: 1.0,
        x: 0,
        y: 120,
        z: 420,
      },
      fov: 48,
    },
    {
      entity_id: "horizon-tactical-1y",
      zoom_level: 2,
      coords: {
        label: "2027 Tactical Arc",
        zoomFactor: 2.5,
        x: 0,
        y: 240,
        z: 140,
      },
      fov: 38,
    },
    {
      entity_id: "horizon-circadian-today",
      zoom_level: 3,
      coords: {
        label: "Today: Circadian Solar Ring",
        zoomFactor: 4.5,
        x: 0,
        y: 360,
        z: 24,
      },
      fov: 30,
    },
  ];

  for (const a of anchors) {
    await pgExec(
      `INSERT INTO public.spatial_zoom_anchors (user_id, entity_id, zoom_level, spatial_coords_3d, target_fov)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (user_id, entity_id, zoom_level) DO NOTHING`,
      userId,
      a.entity_id,
      a.zoom_level,
      JSON.stringify(a.coords),
      a.fov
    );
  }

  // Seed 5 Flagship Spatial Journey Waypoints + Catmull-Rom Paths
  const waypointsSeed: Array<{
    title: string;
    terrain_type: WaypointTerrain;
    coord_x: number;
    coord_y: number;
    coord_z: number;
    sliverTitle: string;
    target_date: string;
    completion_percentage: number;
    accent_glow_color: string;
    hud_description: string;
  }> = [
    {
      title: "Equipsynx MVP Genesis",
      terrain_type: "valley_station",
      coord_x: 18,
      coord_y: 82,
      coord_z: 110,
      sliverTitle: "Equipsynx v2 Enterprise GA & First 25 Fleet Logos",
      target_date: "2026-12-15T00:00:00Z",
      completion_percentage: 92,
      accent_glow_color: "#e5c07b",
      hud_description:
        "Valley Basecamp Outpost · Multi-tenant PostgreSQL RLS dispatch engine live with mobile field-operator telemetry.",
    },
    {
      title: "Chairman Living OS Dock",
      terrain_type: "coastal_harbor",
      coord_x: 36,
      coord_y: 69,
      coord_z: 260,
      sliverTitle: "1,750 kcal Cut Lock, Sub-12% BF & Top-5% VO2 Max",
      target_date: "2027-04-01T00:00:00Z",
      completion_percentage: 78,
      accent_glow_color: "#38bdf8",
      hud_description:
        "River Harbor Command · Unified Solar Calendar, Neural Vault, Epistemic Triage & MacroOps cockpit fully operational.",
    },
    {
      title: "Caliber Arc Citadel",
      terrain_type: "citadel",
      coord_x: 54,
      coord_y: 54,
      coord_z: 480,
      sliverTitle: "Caliber Arc 5-Account Synced Prop & Cash Harvest",
      target_date: "2028-09-01T00:00:00Z",
      completion_percentage: 64,
      accent_glow_color: "#f59e0b",
      hud_description:
        "Mid-Ridge Bastion · Disciplined MNQ/NQ execution fortress compounding liquid distributions into hard reserves.",
    },
    {
      title: "Rodriguez Estate",
      terrain_type: "river_crossing",
      coord_x: 71,
      coord_y: 39,
      coord_z: 740,
      sliverTitle: "Rodriguez Estate Microgrid Sanctuary & 4-Yard Corridor",
      target_date: "2032-06-01T00:00:00Z",
      completion_percentage: 41,
      accent_glow_color: "#34d399",
      hud_description:
        "Highland River Crossing · Off-grid LFP solar sanctuary, deep-well cistern autonomy & senior canine shaded gardens.",
    },
    {
      title: "Centennial Dynasty Peak",
      terrain_type: "summit_peak",
      coord_x: 84,
      coord_y: 21,
      coord_z: 1200,
      sliverTitle: "100-Year Dynasty Trust & Purchasing-Power Shield",
      target_date: "2106-01-01T00:00:00Z",
      completion_percentage: 18,
      accent_glow_color: "#a78bfa",
      hud_description:
        "80-Year Sovereign Summit · Multi-generational capital endowment, land stewardship & unbroken family charter.",
    },
  ];

  const insertedWaypointIds: string[] = [];
  for (const wp of waypointsSeed) {
    const linkedSliverId = createdSliverIdsByTitle.get(wp.sliverTitle) || null;
    const wRows = await pgQuery<{ id: string }>(
      `INSERT INTO public.journey_waypoints
        (user_id, title, terrain_type, coord_x, coord_y, coord_z, linked_horizon_sliver_id,
         target_date, completion_percentage, accent_glow_color, hud_description)
       VALUES (
        $1,
        $2,
        $3::public.waypoint_terrain_type,
        $4,
        $5,
        $6,
        $7::uuid,
        $8::timestamptz,
        $9,
        $10,
        $11
       )
       RETURNING id`,
      userId,
      wp.title,
      wp.terrain_type,
      wp.coord_x,
      wp.coord_y,
      wp.coord_z,
      linkedSliverId,
      wp.target_date,
      wp.completion_percentage,
      wp.accent_glow_color,
      wp.hud_description
    );
    if (wRows[0]?.id) {
      insertedWaypointIds.push(wRows[0].id);
    }
  }

  for (let i = 0; i < insertedWaypointIds.length - 1; i++) {
    await pgExec(
      `INSERT INTO public.journey_paths (user_id, from_waypoint_id, to_waypoint_id, path_curve_type, is_active_pathway)
       VALUES ($1, $2::uuid, $3::uuid, 'catmull_rom', TRUE)
       ON CONFLICT (from_waypoint_id, to_waypoint_id) DO NOTHING`,
      userId,
      insertedWaypointIds[i],
      insertedWaypointIds[i + 1]
    );
  }
}

async function fetchHorizonState(userId: string) {
  const pillars = await pgQuery<HorizonPillarRow>(
    `SELECT id, user_id, title, description, ray_angle_degrees, accent_color, sort_order, created_at
     FROM public.macro_horizon_pillars
     WHERE user_id = $1
     ORDER BY sort_order ASC, ray_angle_degrees ASC`,
    userId
  );

  const slivers = await pgQuery<HorizonSliverRow>(
    `SELECT id, pillar_id, user_id, horizon_tier::text AS horizon_tier, title, strategic_intent,
            target_year, resource_weight_pct, is_milestone_locked,
            COALESCE(linked_project_ids, ARRAY[]::text[]) AS linked_project_ids,
            created_at, updated_at
     FROM public.macro_horizon_slivers
     WHERE user_id = $1
     ORDER BY target_year ASC, resource_weight_pct DESC`,
    userId
  );

  const zoomAnchors = await pgQuery<SpatialZoomAnchorRow>(
    `SELECT id, user_id, entity_id, zoom_level, spatial_coords_3d, target_fov, created_at
     FROM public.spatial_zoom_anchors
     WHERE user_id = $1
     ORDER BY zoom_level ASC`,
    userId
  );

  const waypoints = await pgQuery<JourneyWaypointRow>(
    `SELECT id, user_id, title, terrain_type::text AS terrain_type,
            coord_x, coord_y, coord_z, linked_horizon_sliver_id, linked_pms_list_id,
            target_date, completion_percentage, accent_glow_color, hud_description,
            created_at, updated_at
     FROM public.journey_waypoints
     WHERE user_id = $1
     ORDER BY coord_z ASC, created_at ASC`,
    userId
  );

  const paths = await pgQuery<JourneyPathRow>(
    `SELECT id, user_id, from_waypoint_id, to_waypoint_id, path_curve_type, is_active_pathway, created_at
     FROM public.journey_paths
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    userId
  );

  let circadianEvents: Array<{
    id: string;
    title: string;
    domain: string;
    start_time: string;
    end_time: string;
    accent_color: string;
  }> = [];

  try {
    circadianEvents = await pgQuery(
      `SELECT id, title, domain::text AS domain, start_time, end_time, accent_color
       FROM public.circadian_events
       ORDER BY start_time ASC
       LIMIT 12`
    );
  } catch {
    // fallback if circadian_events is empty or uninitialized
  }

  return {
    pillars,
    slivers,
    zoomAnchors,
    waypoints,
    paths,
    circadianEvents,
  };
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    await seedHorizonIfEmpty(userId);
    const state = await fetchHorizonState(userId);
    return NextResponse.json(state);
  } catch (error: any) {
    console.error("[API /horizon GET] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to load Macro Horizon & Spatial Journey",
        detail: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = String(body.action || "create_sliver");

    if (action === "create_sliver") {
      const pillarId = String(body.pillar_id || body.pillarId || "");
      const horizonTier: HorizonTier = [
        "1_year",
        "10_year",
        "30_year",
        "80_year",
      ].includes(body.horizon_tier)
        ? body.horizon_tier
        : "1_year";
      const title = String(body.title || "New Strategic Milestone").trim();
      const intent = body.strategic_intent
        ? String(body.strategic_intent).trim()
        : "Strategic milestone locked onto Chairman Horizon arc.";
      const targetYear = Number(body.target_year) || 2027;
      const weight = Math.min(
        100,
        Math.max(1, Math.round(Number(body.resource_weight_pct) || 20))
      );
      const locked = Boolean(body.is_milestone_locked ?? true);

      if (!pillarId) {
        return NextResponse.json(
          { error: "pillar_id is required" },
          { status: 400 }
        );
      }

      await pgExec(
        `INSERT INTO public.macro_horizon_slivers
          (pillar_id, user_id, horizon_tier, title, strategic_intent, target_year, resource_weight_pct, is_milestone_locked, linked_project_ids)
         VALUES (
          $1::uuid,
          $2,
          $3::public.horizon_tier_enum,
          $4,
          $5,
          $6,
          $7,
          $8,
          ARRAY[]::text[]
         )`,
        pillarId,
        userId,
        horizonTier,
        title,
        intent,
        targetYear,
        weight,
        locked
      );

      const state = await fetchHorizonState(userId);
      return NextResponse.json(state, { status: 201 });
    }

    if (action === "create_waypoint") {
      const title = String(body.title || "New Expedition Outpost").trim();
      const terrain: WaypointTerrain = [
        "summit_peak",
        "valley_station",
        "river_crossing",
        "coastal_harbor",
        "citadel",
      ].includes(body.terrain_type)
        ? body.terrain_type
        : "citadel";
      const cx = Number(body.coord_x ?? 50);
      const cy = Number(body.coord_y ?? 50);
      const cz = Number(body.coord_z ?? 500);
      const completion = Math.min(
        100,
        Math.max(0, Math.round(Number(body.completion_percentage ?? 25)))
      );
      const glow = String(body.accent_glow_color || "#e5c07b").slice(0, 9);
      const desc = body.hud_description
        ? String(body.hud_description).trim()
        : "Sovereign outpost established on the River of Time.";
      const targetDate = body.target_date || "2029-01-01T00:00:00Z";

      const inserted = await pgQuery<{ id: string }>(
        `INSERT INTO public.journey_waypoints
          (user_id, title, terrain_type, coord_x, coord_y, coord_z, target_date, completion_percentage, accent_glow_color, hud_description)
         VALUES (
          $1,
          $2,
          $3::public.waypoint_terrain_type,
          $4,
          $5,
          $6,
          $7::timestamptz,
          $8,
          $9,
          $10
         )
         RETURNING id`,
        userId,
        title,
        terrain,
        cx,
        cy,
        cz,
        targetDate,
        completion,
        glow,
        desc
      );

      if (inserted[0]?.id && body.connectFromWaypointId) {
        await pgExec(
          `INSERT INTO public.journey_paths (user_id, from_waypoint_id, to_waypoint_id, path_curve_type, is_active_pathway)
           VALUES ($1, $2::uuid, $3::uuid, 'catmull_rom', TRUE)
           ON CONFLICT (from_waypoint_id, to_waypoint_id) DO NOTHING`,
          userId,
          body.connectFromWaypointId,
          inserted[0].id
        );
      }

      const state = await fetchHorizonState(userId);
      return NextResponse.json(state, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown POST action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API /horizon POST] Error:", error);
    return NextResponse.json(
      { error: "Failed horizon creation", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();

    if (body.action === "update_sliver" && body.id) {
      if (body.is_milestone_locked !== undefined) {
        await pgExec(
          `UPDATE public.macro_horizon_slivers
           SET is_milestone_locked = $1, updated_at = NOW()
           WHERE id = $2::uuid AND user_id = $3`,
          Boolean(body.is_milestone_locked),
          body.id,
          userId
        );
      }
      if (body.resource_weight_pct !== undefined) {
        const weight = Math.min(
          100,
          Math.max(1, Math.round(Number(body.resource_weight_pct)))
        );
        await pgExec(
          `UPDATE public.macro_horizon_slivers
           SET resource_weight_pct = $1, updated_at = NOW()
           WHERE id = $2::uuid AND user_id = $3`,
          weight,
          body.id,
          userId
        );
      }
      const state = await fetchHorizonState(userId);
      return NextResponse.json(state);
    }

    if (body.action === "update_waypoint" && body.id) {
      if (body.completion_percentage !== undefined) {
        const pct = Math.min(
          100,
          Math.max(0, Math.round(Number(body.completion_percentage)))
        );
        await pgExec(
          `UPDATE public.journey_waypoints
           SET completion_percentage = $1, updated_at = NOW()
           WHERE id = $2::uuid AND user_id = $3`,
          pct,
          body.id,
          userId
        );
      }
      const state = await fetchHorizonState(userId);
      return NextResponse.json(state);
    }

    return NextResponse.json({ error: "Unsupported PATCH action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API /horizon PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed horizon update", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const { searchParams } = new URL(req.url);
    const sliverId = searchParams.get("sliverId");
    const waypointId = searchParams.get("waypointId");

    if (sliverId) {
      await pgExec(
        `DELETE FROM public.macro_horizon_slivers WHERE id = $1::uuid AND user_id = $2`,
        sliverId,
        userId
      );
    } else if (waypointId) {
      await pgExec(
        `DELETE FROM public.journey_waypoints WHERE id = $1::uuid AND user_id = $2`,
        waypointId,
        userId
      );
    } else {
      return NextResponse.json(
        { error: "sliverId or waypointId required" },
        { status: 400 }
      );
    }

    const state = await fetchHorizonState(userId);
    return NextResponse.json({ ok: true, ...state });
  } catch (error: any) {
    console.error("[API /horizon DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed horizon delete", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
