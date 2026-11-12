import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

export interface VaultNodeRow {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content_markdown: string;
  domain: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaultLinkRow {
  id: string;
  user_id: string;
  source_node_id: string;
  target_node_id: string;
  link_type: string;
  created_at: string;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-node"
  );
}

function extractWikilinkTitles(markdown: string): string[] {
  if (!markdown) return [];
  const regex = /\[\[([^\[\]|#]+)(?:#[^\[\]|]+)?(?:\|[^\[\]]+)?\]\]/g;
  const seen = new Set<string>();
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const clean = match[1].trim();
    const key = clean.toLowerCase();
    if (clean && !seen.has(key)) {
      seen.add(key);
      results.push(clean);
    }
  }
  return results;
}

async function syncWikilinksForNode(
  userId: string,
  sourceNodeId: string,
  sourceDomain: string,
  markdown: string,
  autoCreateMissing = true
): Promise<void> {
  const targetTitles = extractWikilinkTitles(markdown);

  await pgExec(
    `DELETE FROM public.vault_links WHERE user_id = $1 AND source_node_id = $2::uuid AND link_type = 'wikilink'`,
    userId,
    sourceNodeId
  );

  if (targetTitles.length === 0) return;

  const existingNodes = await pgQuery<{
    id: string;
    title: string;
    slug: string;
  }>(
    `SELECT id, title, slug FROM public.vault_nodes WHERE user_id = $1 AND is_archived = FALSE`,
    userId
  );

  const byTitle = new Map<string, string>();
  const bySlug = new Map<string, string>();
  for (const n of existingNodes) {
    byTitle.set(n.title.trim().toLowerCase(), n.id);
    bySlug.set(n.slug.trim().toLowerCase(), n.id);
  }

  for (const rawTarget of targetTitles) {
    const lower = rawTarget.toLowerCase();
    const targetSlug = slugify(rawTarget);
    let targetId = byTitle.get(lower) || bySlug.get(targetSlug);

    if (!targetId && autoCreateMissing) {
      const inserted = await pgQuery<{ id: string }>(
        `INSERT INTO public.vault_nodes (user_id, title, slug, content_markdown, domain, tags, is_pinned)
         VALUES ($1, $2, $3, $4, $5, ARRAY['wikilink-stub']::text[], FALSE)
         RETURNING id`,
        userId,
        rawTarget,
        targetSlug,
        `# ${rawTarget}\n\nAuto-materialized node referenced from the Neural Vault graph. Expand operational doctrine and backlinks here.`,
        sourceDomain || "engineering"
      );
      if (inserted[0]?.id) {
        targetId = inserted[0].id;
        byTitle.set(lower, targetId);
        bySlug.set(targetSlug, targetId);
      }
    }

    if (targetId && targetId !== sourceNodeId) {
      await pgExec(
        `INSERT INTO public.vault_links (user_id, source_node_id, target_node_id, link_type)
         VALUES ($1, $2::uuid, $3::uuid, 'wikilink')
         ON CONFLICT (source_node_id, target_node_id) DO NOTHING`,
        userId,
        sourceNodeId,
        targetId
      );
    }
  }
}

const SEED_VAULT_NODES: Array<{
  title: string;
  domain: "engineering" | "trading" | "property" | "canine" | "logistics";
  tags: string[];
  is_pinned: boolean;
  content_markdown: string;
}> = [
  {
    title: "Chairman Living OS Master Architecture",
    domain: "engineering",
    tags: ["living-os", "architecture", "sovereign", "command"],
    is_pinned: true,
    content_markdown: `# Chairman Living OS Master Architecture

The Living OS unifies executive telemetry, multi-entity circadian command, and sovereign PostgreSQL memory into one zero-trust cockpit.

## Core Pillar Couplings
- SaaS infrastructure scales on [[Equipsynx Multi-Tenant Core]] with strict row-level isolation and deterministic audit trails.
- Autonomous agent orchestration routes tool execution through [[Autonomous MCP Mesh Spec]] with sub-20ms connector health checks.
- Daily liquid alpha generation follows [[Caliber Arc MNQ Playbook]] while capital preservation is enforced by [[Caliber Arc Risk Circuit Breaker]].
- Physical sovereignty anchors on [[Rodriguez Estate Master Plan]], [[Senior Canine Longevity Protocol]], and [[Fleet & Cold-Chain Telemetry]].`,
  },
  {
    title: "Equipsynx Multi-Tenant Core",
    domain: "engineering",
    tags: ["equipsynx", "saas", "postgresql", "rls"],
    is_pinned: true,
    content_markdown: `# Equipsynx Multi-Tenant Core

Enterprise heavy-equipment & field asset telemetry platform engineered for zero cross-tenant leakage and real-time dispatch visibility.

## Architectural Invariants
- Every tenant schema binds directly into [[Chairman Living OS Master Architecture]] executive KPI rollups.
- Field dispatch webhooks stream equipment utilization metrics straight into [[Fleet & Cold-Chain Telemetry]] for preventative maintenance triggers.
- AI dispatch copilots execute deterministic mutations through [[Autonomous MCP Mesh Spec]] without exposing raw service keys.`,
  },
  {
    title: "Autonomous MCP Mesh Spec",
    domain: "engineering",
    tags: ["mcp", "agents", "zero-trust", "telemetry"],
    is_pinned: false,
    content_markdown: `# Autonomous MCP Mesh Spec

Standardizes sovereign Model Context Protocol connectors across GitHub, Supabase, Google Calendar, and brokerage execution bridges.

## Operational Guardrails
- Reports live connector latency back to [[Chairman Living OS Master Architecture]] every 60 seconds.
- Powers automated tenant diagnostics inside [[Equipsynx Multi-Tenant Core]] during high-concurrency onboarding windows.
- Feeds real-time session drawdown alerts into [[Caliber Arc Risk Circuit Breaker]] to lock order routing when volatility spikes.`,
  },
  {
    title: "Caliber Arc MNQ Playbook",
    domain: "trading",
    tags: ["futures", "mnq", "nq", "orderflow"],
    is_pinned: true,
    content_markdown: `# Caliber Arc MNQ Playbook

Precision Nasdaq-100 micro/mini futures execution doctrine centered on opening-drive CVD divergence, leader alignment, and strict asymmetric R-multiples.

## Execution Rules
- Never initiate New York open exposure unless [[Caliber Arc Risk Circuit Breaker]] confirms session drawdown buffer is 100% armed.
- Align directional bias with [[Macro Liquidity & Treasury Cycle]] auction flows and 10Y real-yield velocity.
- Net prop-account distributions sweep quarterly toward [[Industrial Yard Acquisition Thesis]] and [[Chairman Living OS Master Architecture]] reserves.`,
  },
  {
    title: "Caliber Arc Risk Circuit Breaker",
    domain: "trading",
    tags: ["risk", "drawdown", "replikanto", "discipline"],
    is_pinned: false,
    content_markdown: `# Caliber Arc Risk Circuit Breaker

Hard daily $250 per-session loss cutoff and automated Replikanto follower flatten protocol designed to eliminate tilt and protect funded accounts.

## Enforcement Bridges
- Governs every trade entry defined in [[Caliber Arc MNQ Playbook]] with a mandatory two-strike cooldown lock.
- Monitored continuously by [[Autonomous MCP Mesh Spec]] telemetry hooks so breaches trigger immediate cockpit lockouts.`,
  },
  {
    title: "Macro Liquidity & Treasury Cycle",
    domain: "trading",
    tags: ["macro", "treasuries", "rates", "capital-allocation"],
    is_pinned: false,
    content_markdown: `# Macro Liquidity & Treasury Cycle

Tracks TGA rebuilds, Fed reverse-repo drainage, SOFR spreads, and credit impulse to time both intraday volatility regimes and real-asset deployments.

## Strategic Transmissions
- Dictates volatility regime sizing inside [[Caliber Arc MNQ Playbook]] during FOMC and CPI weeks.
- Guides fixed-debt lock windows for [[Rodriguez Estate Master Plan]] and commercial cap-rate hurdles in [[Industrial Yard Acquisition Thesis]].`,
  },
  {
    title: "Rodriguez Estate Master Plan",
    domain: "property",
    tags: ["estate", "dynasty", "solar", "sovereignty"],
    is_pinned: true,
    content_markdown: `# Rodriguez Estate Master Plan

Multi-generational compound blueprint integrating solar + LFP microgrid autonomy, deep-well water resilience, acoustic studio Sanctuary, and shaded canine runs.

## Interconnected Systems
- Capitalized alongside [[Macro Liquidity & Treasury Cycle]] rate windows for optimal long-duration debt structure.
- Perimeter shading, non-slip turf, and hydro-therapy access are purpose-built around [[Senior Canine Longevity Protocol]].
- Cold-pantry bulk storage synchronizes weekly with [[Household Culinary & Provisioning SOP]].`,
  },
  {
    title: "Industrial Yard Acquisition Thesis",
    domain: "property",
    tags: ["commercial", "industrial", "cap-rate", "yard"],
    is_pinned: false,
    content_markdown: `# Industrial Yard Acquisition Thesis

Acquiring high-utility IOS (Industrial Outdoor Storage) and service-bay parcels in supply-constrained logistics corridors with 8.5%+ cash-on-cash yield.

## Synergy Flywheel
- Serves as a live physical proving ground for [[Equipsynx Multi-Tenant Core]] yard-sensor hardware and asset RFID gates.
- Funded partially via compounded distributions from [[Caliber Arc MNQ Playbook]] and underwritten against [[Macro Liquidity & Treasury Cycle]].
- Houses service bays monitored by [[Fleet & Cold-Chain Telemetry]].`,
  },
  {
    title: "Senior Canine Longevity Protocol",
    domain: "canine",
    tags: ["canine", "longevity", "biometrics", "pack"],
    is_pinned: true,
    content_markdown: `# Senior Canine Longevity Protocol

Zero-compromise daily care architecture protecting mobility, renal hydration, cognitive sharpness, and thermal comfort for our senior canine pack members.

## Daily Care Loops
- Administers morning & evening Mobility + Omega dosing defined in [[Canine Joint & Metabolic Stack]].
- Outdoor walk windows and shaded recovery zones integrate directly into [[Rodriguez Estate Master Plan]] microclimate sensors.
- Fresh whole-food toppers and hydration broth prep run in lockstep with [[Household Culinary & Provisioning SOP]].`,
  },
  {
    title: "Canine Joint & Metabolic Stack",
    domain: "canine",
    tags: ["canine", "supplements", "hydration", "mobility"],
    is_pinned: false,
    content_markdown: `# Canine Joint & Metabolic Stack

Precision weight-calibrated dosing log for UC-II collagen, green-lipped mussel, EPA/DHA triglycerides, and renal-safe electrolyte hydration targets.

## Reference Protocol
- Executes twice daily at 06:30 and 17:30 as the foundational clinical layer of [[Senior Canine Longevity Protocol]].`,
  },
  {
    title: "Fleet & Cold-Chain Telemetry",
    domain: "logistics",
    tags: ["fleet", "obd2", "maintenance", "logistics"],
    is_pinned: false,
    content_markdown: `# Fleet & Cold-Chain Telemetry

Predictive mileage, tire-tread, synthetic oil interval, and battery-SOH tracking across personal vehicles, tow rigs, and service trailers.

## Operational Links
- Shares sensor ingestion patterns with [[Equipsynx Multi-Tenant Core]] and stages heavy equipment at [[Industrial Yard Acquisition Thesis]].
- Coordinates cold-chain grocery & farm-share transport windows with [[Household Culinary & Provisioning SOP]].`,
  },
  {
    title: "Household Culinary & Provisioning SOP",
    domain: "logistics",
    tags: ["macro-ops", "culinary", "provisioning", "cadence"],
    is_pinned: false,
    content_markdown: `# Household Culinary & Provisioning SOP

Sunday & Wednesday batch-prep rhythm hitting 1,750 kcal / 180g protein training targets with zero decision fatigue during market hours.

## Linked Dependencies
- Cold-storage inventory levels map directly to [[Rodriguez Estate Master Plan]] pantry zones and [[Fleet & Cold-Chain Telemetry]] supply runs.
- Prepares unseasoned lean protein & bone-broth portions concurrently for [[Senior Canine Longevity Protocol]].`,
  },
  {
    title: "Air-Gapped Glacier Key Ceremony",
    domain: "engineering",
    tags: ["security", "multisig", "cold-storage", "unlinked-brief"],
    is_pinned: false,
    content_markdown: `# Air-Gapped Glacier Key Ceremony

Quarantined field protocol for Shamir secret-share rotation, Faraday pouch verification, and steel-plate checksum audits across geographic vaults.

> Tip: This node intentionally starts with 0 graph links so the Orphan Detector filter can isolate unlinked vault notes ready to weave into [[Chairman Living OS Master Architecture]] when promoted.`,
  },
];

// Override the 13th node's markdown so it literally has 0 wikilinks (true orphan!)
SEED_VAULT_NODES[12].content_markdown = `# Air-Gapped Glacier Key Ceremony

Quarantined field protocol for Shamir 2-of-3 secret-share rotation, Faraday pouch verification, and stamped titanium plate checksum audits across geographic vaults.

## Verification Checklist
- Boot air-gapped signing hardware on battery power with RF-shielded enclosure verified.
- Validate deterministic entropy dice rolls and verify receive addresses across two independent hardware screens.
- Note: Intentionally unlinked standalone protocol note — toggle the **Orphans (0 Links)** filter or add a double-bracket wikilink to connect it into the Chairman Living OSMaster Architecture.`;

async function seedVaultIfEmpty(userId: string): Promise<void> {
  const countRows = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM public.vault_nodes WHERE user_id = $1`,
    userId
  );
  if ((countRows[0]?.cnt ?? 0) > 0) return;

  const insertedNodes: Array<{ id: string; domain: string; content: string }> = [];

  for (const item of SEED_VAULT_NODES) {
    const slug = slugify(item.title);
    const rows = await pgQuery<{ id: string }>(
      `INSERT INTO public.vault_nodes (user_id, title, slug, content_markdown, domain, tags, is_pinned, is_archived)
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         ARRAY(SELECT jsonb_array_elements_text($6::jsonb)),
         $7,
         FALSE
       )
       RETURNING id`,
      userId,
      item.title,
      slug,
      item.content_markdown,
      item.domain,
      JSON.stringify(item.tags),
      item.is_pinned
    );
    if (rows[0]?.id) {
      insertedNodes.push({
        id: rows[0].id,
        domain: item.domain,
        content: item.content_markdown,
      });
    }
  }

  for (const node of insertedNodes) {
    await syncWikilinksForNode(
      userId,
      node.id,
      node.domain,
      node.content,
      false
    );
  }
}

async function fetchVaultState(userId: string) {
  const nodes = await pgQuery<VaultNodeRow>(
    `SELECT id, user_id, title, slug, content_markdown, domain, COALESCE(tags, ARRAY[]::text[]) AS tags,
            is_pinned, is_archived, created_at, updated_at
     FROM public.vault_nodes
     WHERE user_id = $1 AND is_archived = FALSE
     ORDER BY is_pinned DESC, updated_at DESC`,
    userId
  );

  const links = await pgQuery<VaultLinkRow>(
    `SELECT l.id, l.user_id, l.source_node_id, l.target_node_id, l.link_type, l.created_at
     FROM public.vault_links l
     INNER JOIN public.vault_nodes s ON s.id = l.source_node_id AND s.is_archived = FALSE
     INNER JOIN public.vault_nodes t ON t.id = l.target_node_id AND t.is_archived = FALSE
     WHERE l.user_id = $1
     ORDER BY l.created_at ASC`,
    userId
  );

  return { nodes, links };
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    await seedVaultIfEmpty(userId);
    const { nodes, links } = await fetchVaultState(userId);
    return NextResponse.json({ nodes, links });
  } catch (error: any) {
    console.error("[API /vault GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to load Neural Vault", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();

    const title = String(body.title || "Untitled Vault Note").trim();
    const slug = slugify(title);
    const domain = String(body.domain || "engineering").trim();
    const contentMarkdown = String(
      body.content_markdown ?? `# ${title}\n\n`
    );
    const tags: string[] = Array.isArray(body.tags)
      ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : [];
    const isPinned = Boolean(body.is_pinned);

    const inserted = await pgQuery<VaultNodeRow>(
      `INSERT INTO public.vault_nodes (user_id, title, slug, content_markdown, domain, tags, is_pinned, is_archived)
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         ARRAY(SELECT jsonb_array_elements_text($6::jsonb)),
         $7,
         FALSE
       )
       RETURNING id, user_id, title, slug, content_markdown, domain, COALESCE(tags, ARRAY[]::text[]) AS tags, is_pinned, is_archived, created_at, updated_at`,
      userId,
      title,
      slug,
      contentMarkdown,
      domain,
      JSON.stringify(tags),
      isPinned
    );

    const createdNode = inserted[0];
    if (createdNode?.id) {
      await syncWikilinksForNode(
        userId,
        createdNode.id,
        domain,
        contentMarkdown,
        body.autoCreateStubs !== false
      );
    }

    const state = await fetchVaultState(userId);
    return NextResponse.json({ node: createdNode, ...state }, { status: 201 });
  } catch (error: any) {
    console.error("[API /vault POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create vault node", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();

    if (body.action === "add_link" && body.source_node_id && body.target_node_id) {
      if (body.source_node_id !== body.target_node_id) {
        await pgExec(
          `INSERT INTO public.vault_links (user_id, source_node_id, target_node_id, link_type)
           VALUES ($1, $2::uuid, $3::uuid, $4)
           ON CONFLICT (source_node_id, target_node_id) DO NOTHING`,
          userId,
          body.source_node_id,
          body.target_node_id,
          body.link_type || "manual"
        );
      }
      const state = await fetchVaultState(userId);
      return NextResponse.json(state);
    }

    if (!body.id) {
      return NextResponse.json({ error: "Node id is required" }, { status: 400 });
    }

    const existingRows = await pgQuery<VaultNodeRow>(
      `SELECT id, user_id, title, slug, content_markdown, domain, COALESCE(tags, ARRAY[]::text[]) AS tags,
              is_pinned, is_archived
       FROM public.vault_nodes
       WHERE id = $1::uuid AND user_id = $2`,
      body.id,
      userId
    );

    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json({ error: "Vault node not found" }, { status: 404 });
    }

    const nextTitle =
      body.title !== undefined ? String(body.title).trim() : existing.title;
    const nextSlug = slugify(nextTitle);
    const nextContent =
      body.content_markdown !== undefined
        ? String(body.content_markdown)
        : existing.content_markdown;
    const nextDomain =
      body.domain !== undefined ? String(body.domain).trim() : existing.domain;
    const nextTags: string[] = Array.isArray(body.tags)
      ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : existing.tags || [];
    const nextPinned =
      body.is_pinned !== undefined ? Boolean(body.is_pinned) : existing.is_pinned;
    const nextArchived =
      body.is_archived !== undefined
        ? Boolean(body.is_archived)
        : existing.is_archived;

    const updated = await pgQuery<VaultNodeRow>(
      `UPDATE public.vault_nodes
       SET title = $1,
           slug = $2,
           content_markdown = $3,
           domain = $4,
           tags = ARRAY(SELECT jsonb_array_elements_text($5::jsonb)),
           is_pinned = $6,
           is_archived = $7,
           updated_at = NOW()
       WHERE id = $8::uuid AND user_id = $9
       RETURNING id, user_id, title, slug, content_markdown, domain, COALESCE(tags, ARRAY[]::text[]) AS tags,
                 is_pinned, is_archived, created_at, updated_at`,
      nextTitle,
      nextSlug,
      nextContent,
      nextDomain,
      JSON.stringify(nextTags),
      nextPinned,
      nextArchived,
      body.id,
      userId
    );

    if (!nextArchived) {
      await syncWikilinksForNode(
        userId,
        body.id,
        nextDomain,
        nextContent,
        body.autoCreateStubs !== false
      );
    }

    const state = await fetchVaultState(userId);
    return NextResponse.json({ node: updated[0], ...state });
  } catch (error: any) {
    console.error("[API /vault PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update vault node", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // ignore empty body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await pgExec(
      `DELETE FROM public.vault_nodes WHERE id = $1::uuid AND user_id = $2`,
      id,
      userId
    );

    const state = await fetchVaultState(userId);
    return NextResponse.json({ ok: true, ...state });
  } catch (error: any) {
    console.error("[API /vault DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete vault node", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
