import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

export interface ScheduleBlock {
  id: string;
  startHour: number; // 0..24 decimal (e.g. 7.5 = 07:30)
  endHour: number;   // 0..24 decimal (wraps midnight if endHour < startHour)
  label: string;
  category: string;
  color: string;
  notes?: string;
}

export interface MedicationSpec {
  id: string;
  name: string;
  dosage: string;
  cadence: string;
  intervalHours: number;
  scheduleHours: number[]; // e.g., [7, 19]
  critical?: boolean;
  instructions?: string;
}

export interface HouseholdEntityRow {
  id: string;
  user_id: string;
  name: string;
  entity_type: "human_adult" | "human_child" | "canine_senior" | "canine_adult";
  avatar_url: string | null;
  accent_color: string;
  daily_water_target_oz: number;
  daily_food_target_grams: number;
  special_care_notes: string | null;
  schedule_blocks: ScheduleBlock[];
  medications: MedicationSpec[];
  created_at: string;
}

export interface EntityTelemetryLogRow {
  id: string;
  entity_id: string;
  log_date: string;
  water_consumed_oz: number;
  food_consumed_grams: number;
  potty_walk_completed: boolean;
  medication_administered: boolean;
  medication_name: string | null;
  activity_minutes: number;
  logged_at: string;
  notes: string | null;
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function ensureSeededFamilyEntities(userId: string, todayStr: string) {
  const existing = await pgQuery<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM public.household_entities WHERE user_id = $1`,
    userId
  );
  if ((existing[0]?.count ?? 0) >= 5) return;

  const existingNamesRows = await pgQuery<{ name: string }>(
    `SELECT name FROM public.household_entities WHERE user_id = $1`,
    userId
  );
  const existingNames = new Set(existingNamesRows.map((r) => r.name.toLowerCase()));

  const seedSpecs: Array<{
    name: string;
    entity_type: "human_adult" | "human_child" | "canine_senior" | "canine_adult";
    accent_color: string;
    water_oz: number;
    food_g: number;
    notes: string;
    blocks: ScheduleBlock[];
    meds: MedicationSpec[];
    initialTelemetry: {
      water: number;
      food: number;
      walk: boolean;
      medName?: string;
      activityMins: number;
      note: string;
    };
  }> = [
    {
      name: "Diego Rodriguez",
      entity_type: "human_adult",
      accent_color: "#3b82f6",
      water_oz: 112,
      food_g: 2100,
      notes:
        "Chairman & Principal Architect • Caliber Arc MNQ NY Session • Sovereign Deep Work • 1,750 kcal / 180g Protein MacroOps • Garage Gym Hypertrophy",
      blocks: [
        {
          id: "diego-sleep",
          startHour: 22.5,
          endHour: 6.0,
          label: "Deep Circadian Sleep",
          category: "sleep",
          color: "#1e293b",
          notes: "85+ Sleep Score Target • Cool 67°F Sanctuary",
        },
        {
          id: "diego-dawn",
          startHour: 6.0,
          endHour: 7.25,
          label: "Dawn Hydration & Canine Pack Walk",
          category: "shared_walk",
          color: "#14b8a6",
          notes: "Electrolytes + Comet Sling Potty + Nova/Astro Walk",
        },
        {
          id: "diego-trading",
          startHour: 7.25,
          endHour: 9.5,
          label: "Caliber Arc Futures (NY Open)",
          category: "deep_focus",
          color: "#f59e0b",
          notes: "MNQ / NQ Execution • CVD + Market ADD Alignment",
        },
        {
          id: "diego-deep1",
          startHour: 9.5,
          endHour: 13.0,
          label: "Sovereign Deep Work Block I",
          category: "deep_focus",
          color: "#3b82f6",
          notes: "Zero-Interruption Pristine Architecture & Living OS",
        },
        {
          id: "diego-macro1",
          startHour: 13.0,
          endHour: 14.0,
          label: "MacroOps Meal Prep & Midday Sling Check",
          category: "nutrition",
          color: "#10b981",
          notes: "High-Protein Meal 1 + Comet Midday Parachute Sling",
        },
        {
          id: "diego-deep2",
          startHour: 14.0,
          endHour: 16.5,
          label: "Deep Work Block II & Systems Review",
          category: "deep_focus",
          color: "#2563eb",
          notes: "Code Reviews, Engineering Pod Sync & Deployments",
        },
        {
          id: "diego-gym",
          startHour: 16.5,
          endHour: 18.0,
          label: "Garage Gym Hypertrophy & Zone 2",
          category: "training",
          color: "#ef4444",
          notes: "Compound Lifts + Post-Workout MacroOps",
        },
        {
          id: "diego-family",
          startHour: 18.0,
          endHour: 20.5,
          label: "Family Dinner, Dusk Walk & Homework Sync",
          category: "family_overlap",
          color: "#8b5cf6",
          notes: "Shared Family Window + Comet 19:00 Crash Cart Meds",
        },
        {
          id: "diego-winddown",
          startHour: 20.5,
          endHour: 22.5,
          label: "Sanctuary Wind-Down & Night Patrol",
          category: "rest",
          color: "#6366f1",
          notes: "Final Canine Check + Reading + Blue-Light Cutoff",
        },
      ],
      meds: [
        {
          id: "diego-creatine",
          name: "Creatine + Electrolytes",
          dosage: "5g + 1000mg Na",
          cadence: "q24h AM",
          intervalHours: 24,
          scheduleHours: [6.5],
          instructions: "Dawn hydration bolus",
        },
        {
          id: "diego-mag",
          name: "Magnesium Bisglycinate",
          dosage: "400mg",
          cadence: "q24h PM",
          intervalHours: 24,
          scheduleHours: [21.5],
          instructions: "30m prior to sleep cycle",
        },
      ],
      initialTelemetry: {
        water: 48,
        food: 820,
        walk: true,
        medName: "Creatine + Electrolytes",
        activityMins: 45,
        note: "Dawn hydration & pack dispatch logged",
      },
    },
    {
      name: "Maximiliano",
      entity_type: "human_child",
      accent_color: "#10b981",
      water_oz: 64,
      food_g: 1450,
      notes:
        "School 08:00–15:00 • Afternoon Homework Focus Block • Youth Sports & Agility Training • Balanced Growth Nutrition",
      blocks: [
        {
          id: "max-sleep",
          startHour: 21.0,
          endHour: 6.75,
          label: "Growth & Recovery Sleep",
          category: "sleep",
          color: "#1e293b",
        },
        {
          id: "max-am",
          startHour: 6.75,
          endHour: 8.0,
          label: "Protein Breakfast & School Prep",
          category: "nutrition",
          color: "#14b8a6",
        },
        {
          id: "max-school",
          startHour: 8.0,
          endHour: 15.0,
          label: "School Academic Window (08:00–15:00)",
          category: "deep_focus",
          color: "#10b981",
          notes: "Core Classes, STEM & Campus Lunch",
        },
        {
          id: "max-homework",
          startHour: 15.0,
          endHour: 16.5,
          label: "Homework & Reading Block",
          category: "deep_focus",
          color: "#3b82f6",
          notes: "Focused desk study & reading log",
        },
        {
          id: "max-sports",
          startHour: 16.5,
          endHour: 18.0,
          label: "Sports & Athletic Training",
          category: "training",
          color: "#f59e0b",
          notes: "Field drills, conditioning & hydration",
        },
        {
          id: "max-family",
          startHour: 18.0,
          endHour: 20.0,
          label: "Family Dinner & Evening Hangout",
          category: "family_overlap",
          color: "#8b5cf6",
        },
        {
          id: "max-wind",
          startHour: 20.0,
          endHour: 21.0,
          label: "Shower, Reading & Lights Out",
          category: "rest",
          color: "#6366f1",
        },
      ],
      meds: [
        {
          id: "max-vit",
          name: "Youth Multivitamin + D3",
          dosage: "1 Gummy / 1000 IU",
          cadence: "q24h AM",
          intervalHours: 24,
          scheduleHours: [7.25],
          instructions: "With morning breakfast",
        },
      ],
      initialTelemetry: {
        water: 28,
        food: 540,
        walk: true,
        medName: "Youth Multivitamin + D3",
        activityMins: 35,
        note: "Breakfast & school hydration bottle packed",
      },
    },
    {
      name: "Nova",
      entity_type: "canine_senior",
      accent_color: "#a855f7",
      water_oz: 48,
      food_g: 420,
      notes:
        "12yo Senior Husky • Gentle Low-Impact Dawn & Dusk Walks • Senior Enzymatic Dental Regimen • Orthopedic Joint Comfort Rest",
      blocks: [
        {
          id: "nova-sleep",
          startHour: 21.5,
          endHour: 6.0,
          label: "Orthopedic Overnight Sleep",
          category: "sleep",
          color: "#1e293b",
        },
        {
          id: "nova-dawn-walk",
          startHour: 6.0,
          endHour: 6.75,
          label: "Gentle Dawn Sniff Walk",
          category: "shared_walk",
          color: "#a855f7",
          notes: "Flat-grade pace • Protect senior hips",
        },
        {
          id: "nova-am-feed",
          startHour: 7.0,
          endHour: 7.5,
          label: "Senior Joint-Support Breakfast",
          category: "nutrition",
          color: "#10b981",
        },
        {
          id: "nova-joint-rest",
          startHour: 8.0,
          endHour: 17.0,
          label: "Joint Comfort Cooling Mat Rest",
          category: "rest",
          color: "#475569",
          notes: "Low-stress indoor lounge + midday backyard water check",
        },
        {
          id: "nova-pm-feed",
          startHour: 17.5,
          endHour: 18.0,
          label: "Senior Dinner & Omega-3 Topper",
          category: "nutrition",
          color: "#10b981",
        },
        {
          id: "nova-dusk-walk",
          startHour: 18.5,
          endHour: 19.25,
          label: "Gentle Dusk Pack Stroll",
          category: "shared_walk",
          color: "#c084fc",
        },
        {
          id: "nova-dental",
          startHour: 19.5,
          endHour: 20.0,
          label: "Senior Dental Brushing & Chew Regimen",
          category: "care",
          color: "#ec4899",
          notes: "Enzymatic poultry gel + gum check",
        },
      ],
      meds: [
        {
          id: "nova-dasuquin",
          name: "Dasuquin Senior Hip & Joint",
          dosage: "1 Soft Chew",
          cadence: "q24h AM",
          intervalHours: 24,
          scheduleHours: [7.0],
          instructions: "Give with morning meal",
        },
        {
          id: "nova-dental-gel",
          name: "Enzymatic Senior Dental Regimen",
          dosage: "Full Gum Brush",
          cadence: "q24h PM",
          intervalHours: 24,
          scheduleHours: [19.5],
          instructions: "No water for 20m after application",
        },
      ],
      initialTelemetry: {
        water: 22,
        food: 210,
        walk: true,
        medName: "Dasuquin Senior Hip & Joint",
        activityMins: 30,
        note: "Gentle dawn sniff walk & joint chew completed",
      },
    },
    {
      name: "Astro",
      entity_type: "canine_adult",
      accent_color: "#06b6d4",
      water_oz: 60,
      food_g: 560,
      notes:
        "7yo Husky • High-Energy Aerobic Run • Playpen Cognitive Enrichment • Structured AM/PM Feeding Windows",
      blocks: [
        {
          id: "astro-sleep",
          startHour: 22.0,
          endHour: 6.0,
          label: "Night Den Sleep",
          category: "sleep",
          color: "#1e293b",
        },
        {
          id: "astro-run",
          startHour: 6.0,
          endHour: 7.0,
          label: "High-Energy Dawn Trail Run",
          category: "shared_walk",
          color: "#06b6d4",
          notes: "Brisk 3.5-mile aerobic Husky burn",
        },
        {
          id: "astro-am-feed",
          startHour: 7.25,
          endHour: 7.75,
          label: "AM Feeding Window (280g)",
          category: "nutrition",
          color: "#10b981",
          notes: "30m post-run bloat-prevention cooldown first",
        },
        {
          id: "astro-enrichment",
          startHour: 10.5,
          endHour: 12.25,
          label: "Playpen Puzzle & Tug Enrichment",
          category: "training",
          color: "#f59e0b",
          notes: "Frozen Kong + scent work while Comet rests",
        },
        {
          id: "astro-nap",
          startHour: 12.5,
          endHour: 17.25,
          label: "Midday Pack Recovery Nap",
          category: "rest",
          color: "#475569",
        },
        {
          id: "astro-pm-feed",
          startHour: 17.5,
          endHour: 18.0,
          label: "PM Feeding Window (280g)",
          category: "nutrition",
          color: "#10b981",
        },
        {
          id: "astro-dusk",
          startHour: 18.5,
          endHour: 19.5,
          label: "Evening Pack Decompression Walk",
          category: "shared_walk",
          color: "#22d3ee",
        },
      ],
      meds: [
        {
          id: "astro-probiotic",
          name: "Canine Probiotic + Coat Omega",
          dosage: "1 Scoop",
          cadence: "q24h AM",
          intervalHours: 24,
          scheduleHours: [7.5],
          instructions: "Top-dressed on AM kibble",
        },
      ],
      initialTelemetry: {
        water: 30,
        food: 280,
        walk: true,
        medName: "Canine Probiotic + Coat Omega",
        activityMins: 55,
        note: "High-energy dawn run + 280g AM feeding logged",
      },
    },
    {
      name: "Comet",
      entity_type: "canine_senior",
      accent_color: "#f43f5e",
      water_oz: 28,
      food_g: 240,
      notes:
        "12yo Senior Corgi • STRICT IVDD SPINE RECOVERY • Zero Stairs/Steps • Parachute Sling Potty Windows Only • Crash Cart q12h Gabapentin + Methocarbamol + Rimadyl",
      blocks: [
        {
          id: "comet-sleep",
          startHour: 21.0,
          endHour: 6.5,
          label: "Strict IVDD Orthopedic Crate Night",
          category: "sleep",
          color: "#1e293b",
        },
        {
          id: "comet-sling-1",
          startHour: 6.5,
          endHour: 7.0,
          label: "Parachute Sling Potty Window #1",
          category: "sling_potty",
          color: "#fb7185",
          notes: "Support hind-quarters fully • Level grass patch only",
        },
        {
          id: "comet-meds-am",
          startHour: 7.0,
          endHour: 7.5,
          label: "AM Crash Cart: Gabapentin + Methocarbamol + Rimadyl",
          category: "medication",
          color: "#f43f5e",
          notes: "Administer with 120g wet gastro-protective meal",
        },
        {
          id: "comet-ivdd-1",
          startHour: 7.5,
          endHour: 12.5,
          label: "Strict IVDD Spine Recovery Crate Rest I",
          category: "ivdd_rest",
          color: "#9f1239",
          notes: "Horizontal spine alignment • Calm acoustic environment",
        },
        {
          id: "comet-sling-2",
          startHour: 12.5,
          endHour: 13.0,
          label: "Parachute Sling Potty Window #2",
          category: "sling_potty",
          color: "#fb7185",
          notes: "Midday bladder expression / sling support check",
        },
        {
          id: "comet-ivdd-2",
          startHour: 13.0,
          endHour: 17.5,
          label: "Strict IVDD Spine Recovery Crate Rest II",
          category: "ivdd_rest",
          color: "#9f1239",
        },
        {
          id: "comet-sling-3",
          startHour: 17.5,
          endHour: 18.0,
          label: "Parachute Sling Potty #3 & 120g PM Meal",
          category: "sling_potty",
          color: "#fb7185",
        },
        {
          id: "comet-meds-pm",
          startHour: 19.0,
          endHour: 19.5,
          label: "PM Crash Cart: Gabapentin q12h + Methocarbamol q12h",
          category: "medication",
          color: "#f43f5e",
          notes: "Exact 12h neuropathic & spasm coverage",
        },
        {
          id: "comet-sling-4",
          startHour: 20.5,
          endHour: 21.0,
          label: "Final Parachute Sling Night Potty #4",
          category: "sling_potty",
          color: "#fb7185",
        },
      ],
      meds: [
        {
          id: "comet-gabapentin",
          name: "Gabapentin",
          dosage: "100mg Capsule",
          cadence: "q12h (07:00 / 19:00)",
          intervalHours: 12,
          scheduleHours: [7, 19],
          critical: true,
          instructions: "Neuropathic IVDD nerve root analgesia",
        },
        {
          id: "comet-methocarbamol",
          name: "Methocarbamol",
          dosage: "125mg Tablet",
          cadence: "q12h (07:00 / 19:00)",
          intervalHours: 12,
          scheduleHours: [7, 19],
          critical: true,
          instructions: "Paraspinal muscle spasm control",
        },
        {
          id: "comet-rimadyl",
          name: "Rimadyl (Carprofen)",
          dosage: "25mg Caplet",
          cadence: "q12h w/ Food (07:00 / 19:00)",
          intervalHours: 12,
          scheduleHours: [7, 19],
          critical: true,
          instructions: "NSAID anti-inflammatory — NEVER give on empty stomach",
        },
      ],
      initialTelemetry: {
        water: 12,
        food: 120,
        walk: true,
        medName: "Gabapentin",
        activityMins: 10,
        note: "07:00 Parachute Sling Potty #1 + 120g Meal + AM Gabapentin verified",
      },
    },
  ];

  for (const spec of seedSpecs) {
    if (existingNames.has(spec.name.toLowerCase())) continue;

    const inserted = await pgQuery<{ id: string }>(
      `INSERT INTO public.household_entities (
        user_id, name, entity_type, accent_color,
        daily_water_target_oz, daily_food_target_grams,
        special_care_notes, schedule_blocks, medications
      ) VALUES (
        $1, $2, $3::public.entity_type_enum, $4,
        $5, $6, $7, $8::jsonb, $9::jsonb
      )
      RETURNING id`,
      userId,
      spec.name,
      spec.entity_type,
      spec.accent_color,
      spec.water_oz,
      spec.food_g,
      spec.notes,
      JSON.stringify(spec.blocks),
      JSON.stringify(spec.meds)
    );

    const entityId = inserted[0].id;

    await pgExec(
      `INSERT INTO public.entity_telemetry_logs (
        entity_id, log_date, water_consumed_oz, food_consumed_grams,
        potty_walk_completed, medication_administered, medication_name,
        activity_minutes, notes
      ) VALUES (
        $1::uuid, $2::date, $3, $4,
        $5, $6, $7, $8, $9
      )`,
      entityId,
      todayStr,
      spec.initialTelemetry.water,
      spec.initialTelemetry.food,
      spec.initialTelemetry.walk,
      Boolean(spec.initialTelemetry.medName),
      spec.initialTelemetry.medName || null,
      spec.initialTelemetry.activityMins,
      spec.initialTelemetry.note
    );

    // For Comet, also log Methocarbamol & Rimadyl morning baseline so crash cart reflects realistic AM care
    if (spec.name === "Comet") {
      await pgExec(
        `INSERT INTO public.entity_telemetry_logs (
          entity_id, log_date, water_consumed_oz, food_consumed_grams,
          potty_walk_completed, medication_administered, medication_name,
          activity_minutes, notes
        ) VALUES ($1::uuid, $2::date, 0, 0, FALSE, TRUE, 'Methocarbamol', 0, '07:00 AM Crash Cart Methocarbamol verified')`,
        entityId,
        todayStr
      );
      await pgExec(
        `INSERT INTO public.entity_telemetry_logs (
          entity_id, log_date, water_consumed_oz, food_consumed_grams,
          potty_walk_completed, medication_administered, medication_name,
          activity_minutes, notes
        ) VALUES ($1::uuid, $2::date, 0, 0, FALSE, TRUE, 'Rimadyl (Carprofen)', 0, '07:00 AM Rimadyl verified after 120g meal')`,
        entityId,
        todayStr
      );
    }
  }
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    const todayStr = getTodayDateString();

    await ensureSeededFamilyEntities(userId, todayStr);

    const entities = await pgQuery<HouseholdEntityRow>(
      `SELECT
         id, user_id, name,
         entity_type::text AS entity_type,
         avatar_url, accent_color,
         daily_water_target_oz, daily_food_target_grams,
         special_care_notes, schedule_blocks, medications, created_at
       FROM public.household_entities
       WHERE user_id = $1
       ORDER BY
         CASE name
           WHEN 'Diego Rodriguez' THEN 1
           WHEN 'Maximiliano' THEN 2
           WHEN 'Nova' THEN 3
           WHEN 'Astro' THEN 4
           WHEN 'Comet' THEN 5
           ELSE 6
         END ASC,
         created_at ASC`,
      userId
    );

    const entityIds = entities.map((e) => e.id);
    let logs: EntityTelemetryLogRow[] = [];
    if (entityIds.length > 0) {
      logs = await pgQuery<EntityTelemetryLogRow>(
        `SELECT
           id, entity_id, log_date::text AS log_date,
           water_consumed_oz, food_consumed_grams,
           potty_walk_completed, medication_administered,
           medication_name, activity_minutes, logged_at, notes
         FROM public.entity_telemetry_logs
         WHERE entity_id IN (
           SELECT (jsonb_array_elements_text($1::jsonb))::uuid
         )
         AND log_date = $2::date
         ORDER BY logged_at DESC`,
        JSON.stringify(entityIds),
        todayStr
      );
    }

    return NextResponse.json({
      today: todayStr,
      entities,
      logs,
    });
  } catch (error: any) {
    console.error("[GET /api/family-hub] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load Multi-Entity Command Hub" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const entityId = String(body.entity_id || "");
    const eventType = String(body.event_type || ""); // "water" | "food" | "walk" | "medication"

    if (!entityId || !eventType) {
      return NextResponse.json(
        { error: "entity_id and event_type are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const ownerCheck = await pgQuery<{ id: string; name: string }>(
      `SELECT id, name FROM public.household_entities WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
      entityId,
      userId
    );
    if (!ownerCheck[0]) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const todayStr = getTodayDateString();
    const waterOz = eventType === "water" ? Number(body.amount || 8) : 0;
    const foodGrams = eventType === "food" ? Number(body.amount || 120) : 0;
    const walkDone = eventType === "walk";
    const medDone = eventType === "medication";
    const medName = medDone ? String(body.medication_name || "Scheduled Dose") : null;
    const activityMins = walkDone ? Number(body.activity_minutes || 15) : 0;
    const notes = body.notes
      ? String(body.notes)
      : eventType === "water"
      ? `+${waterOz} fl oz hydration logged`
      : eventType === "food"
      ? `+${foodGrams}g nutrition logged`
      : eventType === "walk"
      ? ownerCheck[0].name === "Comet"
        ? "Parachute Sling Assisted Potty Window verified"
        : "Walk / movement session completed"
      : `Medication dose verified: ${medName}`;

    const inserted = await pgQuery<EntityTelemetryLogRow>(
      `INSERT INTO public.entity_telemetry_logs (
        entity_id, log_date, water_consumed_oz, food_consumed_grams,
        potty_walk_completed, medication_administered, medication_name,
        activity_minutes, notes
      ) VALUES (
        $1::uuid, $2::date, $3, $4,
        $5, $6, $7, $8, $9
      )
      RETURNING
        id, entity_id, log_date::text AS log_date,
        water_consumed_oz, food_consumed_grams,
        potty_walk_completed, medication_administered,
        medication_name, activity_minutes, logged_at, notes`,
      entityId,
      todayStr,
      waterOz,
      foodGrams,
      walkDone,
      medDone,
      medName,
      activityMins,
      notes
    );

    return NextResponse.json({ ok: true, log: inserted[0] });
  } catch (error: any) {
    console.error("[POST /api/family-hub] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record entity telemetry" },
      { status: 500 }
    );
  }
}
