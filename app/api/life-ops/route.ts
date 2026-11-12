import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set([
  "culinary",
  "household_cleaning",
  "property_maintenance",
  "vehicle_fleet",
  "travel",
  "appointment",
]);

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function inferAdvanceDays(scheduleInterval: string | null, intervalVal: number): number {
  const s = (scheduleInterval || "").toLowerCase();
  if (s.includes("daily")) return 1;
  if (s.includes("week")) return 7;
  if (s.includes("month")) return 30;
  if (s.includes("quarter")) return 90;
  if (s.includes("biannual")) return 180;
  if (s.includes("annual") || s.includes("year")) return 365;
  return Math.max(1, intervalVal || 7);
}

interface SeedItem {
  category: string;
  title: string;
  description: string;
  schedule_interval: string;
  interval_value: number;
  last_completed_at: string | null;
  next_due_date: string | null;
  telemetry_metric: string | null;
  current_metric_reading: number | null;
  threshold_metric_due: number | null;
  checklist_items: { id: string; label: string; done: boolean }[];
}

function buildBaselineSeedItems(): SeedItem[] {
  return [
    // 1. Culinary Vault & Batch Prep Runway
    {
      category: "culinary",
      title: "Weekly Macro Container Batch Prep (14 Borosilicate Units)",
      description:
        "Bulk protein & clean-carb batching for instant 1-click MacroOps meal deployment.",
      schedule_interval: "weekly",
      interval_value: 7,
      last_completed_at: addDaysIso(-4),
      next_due_date: addDaysIso(3),
      telemetry_metric: "containers",
      current_metric_reading: 8,
      threshold_metric_due: 14,
      checklist_items: [
        { id: "c1", label: "Sanitize & dry 14 borosilicate glass lock-containers", done: true },
        { id: "c2", label: "Trim & dry-brine 6 lbs air-fried chicken breast", done: true },
        { id: "c3", label: "Par-boil & air-crisp 5 lbs Russet potato wedges", done: false },
        { id: "c4", label: "Rinse & steam 8 cups Jasmine white rice", done: false },
        { id: "c5", label: "Portion & color-tag Cut / Training macro lids", done: false },
      ],
    },
    {
      category: "culinary",
      title: "Cast-Iron Ribeye & Cold-Chain Protein Provisioning",
      description:
        "Dry-brine steak prep, freezer inventory audit, and Lodge skillet seasoning.",
      schedule_interval: "weekly",
      interval_value: 7,
      last_completed_at: addDaysIso(-2),
      next_due_date: addDaysIso(5),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "r1", label: "24h wire-rack kosher salt dry-brine on Prime Ribeyes", done: true },
        { id: "r2", label: "Re-season 12-inch cast-iron skillet with avocado oil", done: true },
        { id: "r3", label: "Audit chest freezer ribeye, bison & bone broth count", done: false },
        { id: "r4", label: "Replenish Redmond Real Salt, Kerrygold & whole peppercorns", done: false },
      ],
    },

    // 2. Household Cleaning Zones (5 Zones)
    {
      category: "household_cleaning",
      title: "Forward Living Room",
      description: "Primary reception & recovery lounge reset protocol.",
      schedule_interval: "weekly",
      interval_value: 7,
      last_completed_at: addDaysIso(-2),
      next_due_date: addDaysIso(5),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "fl1", label: "HEPA vacuum area rugs & upholstery seams", done: true },
        { id: "fl2", label: "Microfiber dust media console, baseboards & window sills", done: true },
        { id: "fl3", label: "Sanitize glass tables & align lounge pillows", done: true },
        { id: "fl4", label: "Damp-mop hardwood perimeter with neutral pH cleaner", done: false },
      ],
    },
    {
      category: "household_cleaning",
      title: "Executive Office Studio",
      description: "High-focus command cockpit, optics & workstation sanitation.",
      schedule_interval: "weekly",
      interval_value: 7,
      last_completed_at: addDaysIso(-3),
      next_due_date: addDaysIso(4),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "eo1", label: "Compressed-air purge keyboard switches & multi-monitor bezel", done: true },
        { id: "eo2", label: "Microfiber clean camera lens, mic arm & desk surface", done: true },
        { id: "eo3", label: "Dust under-desk cable raceway & UPS air intakes", done: false },
        { id: "eo4", label: "Vacuum chair casters & studio acoustic floor zone", done: false },
      ],
    },
    {
      category: "household_cleaning",
      title: "Kitchen & Dining",
      description: "Daily culinary surface degreasing and cold-storage hygiene.",
      schedule_interval: "daily",
      interval_value: 1,
      last_completed_at: addDaysIso(0),
      next_due_date: addDaysIso(1),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "kd1", label: "Degrease range hood, air-fryer basket & burner grates", done: true },
        { id: "kd2", label: "Sanitize countertops, sink basin & disposal collar", done: true },
        { id: "kd3", label: "Wipe stainless appliance fronts & macro scale deck", done: true },
        { id: "kd4", label: "Run evening dishwasher cycle & stage clean prep towels", done: true },
      ],
    },
    {
      category: "household_cleaning",
      title: "Laundry & Utility",
      description: "Washer/dryer mechanical care and garment turnaround.",
      schedule_interval: "weekly",
      interval_value: 7,
      last_completed_at: addDaysIso(-5),
      next_due_date: addDaysIso(2),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "lu1", label: "Deep-clean dryer lint screen & inspect exhaust louver", done: true },
        { id: "lu2", label: "Run hot tub-clean cycle & wipe door gasket seal", done: false },
        { id: "lu3", label: "Fold & rack training compression gear vs. executive wear", done: false },
        { id: "lu4", label: "Inspect braided water hoses & drain pan sensor", done: false },
      ],
    },
    {
      category: "household_cleaning",
      title: "Garage Gym Bay",
      description: "Strength training bay sanitation, barbell care & hardware check.",
      schedule_interval: "weekly",
      interval_value: 7,
      last_completed_at: addDaysIso(-3),
      next_due_date: addDaysIso(4),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "gg1", label: "Brush & oil barbell knurling; disinfect bench vinyl", done: true },
        { id: "gg2", label: "Blower-sweep & damp-mop rubber stall mats", done: true },
        { id: "gg3", label: "Check cable pulley bolts, rack J-cups & safety arms", done: false },
        { id: "gg4", label: "Re-rack calibrated plates, bands & chalk station", done: false },
      ],
    },

    // 3. Property Maintenance
    {
      category: "property_maintenance",
      title: "HVAC Filter — MERV-13 Return Air",
      description: "90-day pleated air filtration swap & condensate drain flush.",
      schedule_interval: "quarterly",
      interval_value: 90,
      last_completed_at: addDaysIso(-72),
      next_due_date: addDaysIso(18),
      telemetry_metric: "days",
      current_metric_reading: 72,
      threshold_metric_due: 90,
      checklist_items: [
        { id: "hv1", label: "Stage spare 20x25x4 MERV-13 filter", done: true },
        { id: "hv2", label: "Flush AC condensate line with distilled vinegar", done: false },
        { id: "hv3", label: "Write install date on frame & reset filter timer", done: false },
      ],
    },
    {
      category: "property_maintenance",
      title: "Water Softener Salt — Brine Tank",
      description: "Solar salt pellet level check & salt-bridge inspection.",
      schedule_interval: "monthly",
      interval_value: 30,
      last_completed_at: addDaysIso(-21),
      next_due_date: addDaysIso(9),
      telemetry_metric: "%",
      current_metric_reading: 38,
      threshold_metric_due: 20,
      checklist_items: [
        { id: "ws1", label: "Probe brine tank to confirm zero salt bridging", done: true },
        { id: "ws2", label: "Load two 40-lb solar salt bags to level mark", done: false },
      ],
    },
    {
      category: "property_maintenance",
      title: "Linen Sanitization — Master Suite",
      description: "140°F high-temp allergen wash & mattress UV refresh.",
      schedule_interval: "weekly",
      interval_value: 7,
      last_completed_at: addDaysIso(-5),
      next_due_date: addDaysIso(2),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "ln1", label: "Strip sheets, pillow protectors & bath towels", done: true },
        { id: "ln2", label: "Run 140°F steam sanitization cycle", done: false },
        { id: "ln3", label: "HEPA vacuum mattress top & air duvet insert", done: false },
      ],
    },

    // 4. Vehicle & Heavy Equipment Fleet Telemetry
    {
      category: "vehicle_fleet",
      title: "2013 Nissan Titan SV — Synthetic Oil & Filter",
      description: "5.6L VK56DE V8 · 5W-30 Full Synthetic + OEM Oil Filter",
      schedule_interval: "5,000 mi",
      interval_value: 5000,
      last_completed_at: addDaysIso(-45),
      next_due_date: addDaysIso(35),
      telemetry_metric: "miles",
      current_metric_reading: 142680,
      threshold_metric_due: 145000,
      checklist_items: [
        { id: "nt1", label: "6.5 qt Mobil 1 5W-30 + Nissan OEM filter", done: true },
        { id: "nt2", label: "Inspect rear axle breather & cooler lines", done: true },
        { id: "nt3", label: "Reset service interval at 145,000 mi", done: false },
      ],
    },
    {
      category: "vehicle_fleet",
      title: "2013 Nissan Titan SV — Tire Rotation & Alignment",
      description: "Cross-pattern AT tire rotation, tread depth & 35 PSI cold check.",
      schedule_interval: "6,000 mi",
      interval_value: 6000,
      last_completed_at: addDaysIso(-30),
      next_due_date: addDaysIso(52),
      telemetry_metric: "miles",
      current_metric_reading: 142680,
      threshold_metric_due: 146500,
      checklist_items: [
        { id: "nt4", label: "Set 35 PSI cold across all 4 tires + full spare", done: true },
        { id: "nt5", label: "Torque lug nuts to 98 ft-lbs", done: false },
      ],
    },
    {
      category: "vehicle_fleet",
      title: "2013 Nissan Titan SV — Battery Voltage & Registration",
      description: "Group 24F AGM resting voltage & annual state registration renewal.",
      schedule_interval: "annual",
      interval_value: 365,
      last_completed_at: addDaysIso(-120),
      next_due_date: addDaysIso(74),
      telemetry_metric: "volts",
      current_metric_reading: 12.7,
      threshold_metric_due: 12.2,
      checklist_items: [
        { id: "nt6", label: "Resting battery >= 12.6V / Alternator 14.2V", done: true },
        { id: "nt7", label: "Annual state registration decal & insurance card current", done: true },
      ],
    },
    {
      category: "vehicle_fleet",
      title: "Scissor Lift — Engine / Pump Hours & Service",
      description: "Aerial work platform onboard hour-meter & chassis lubrication.",
      schedule_interval: "250 hrs",
      interval_value: 250,
      last_completed_at: addDaysIso(-28),
      next_due_date: addDaysIso(42),
      telemetry_metric: "hours",
      current_metric_reading: 318.5,
      threshold_metric_due: 350.0,
      checklist_items: [
        { id: "sl1", label: "Grease scissor linkage pins & steering spindles", done: true },
        { id: "sl2", label: "Test upper/lower E-stop & tilt alarm sensor", done: true },
        { id: "sl3", label: "Inspect charger leads & deep-cycle battery pack", done: false },
      ],
    },
    {
      category: "vehicle_fleet",
      title: "Scissor Lift — Hydraulic Fluid & Annual Safety Cert",
      description: "AW-32 hydraulic reservoir inspection & ANSI A92 annual safety certification.",
      schedule_interval: "annual",
      interval_value: 365,
      last_completed_at: addDaysIso(-295),
      next_due_date: addDaysIso(70),
      telemetry_metric: "hours",
      current_metric_reading: 318.5,
      threshold_metric_due: 400.0,
      checklist_items: [
        { id: "sl4", label: "Check AW-32 hydraulic sight glass (stowed position)", done: true },
        { id: "sl5", label: "Inspect main lift cylinder rod seal & hoses for weep", done: true },
        { id: "sl6", label: "Renew annual ANSI / OSHA safety inspection tag", done: false },
      ],
    },

    // 5. Travel Runway
    {
      category: "travel",
      title: "Executive Summit — Flight & Hotel Manifest",
      description:
        "Outbound Nonstop AA-1482 (08:15 Departure · Seat 2A) · Four Seasons King Suite (Conf #FS-88412)",
      schedule_interval: "one_time",
      interval_value: 1,
      last_completed_at: null,
      next_due_date: addDaysIso(16),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "tv1", label: "Verify TSA PreCheck / ID & mobile boarding passes", done: true },
        { id: "tv2", label: "Pack mobile trading workstation, 140W GaN charger & YubiKey", done: true },
        { id: "tv3", label: "Pre-pack travel electrolytes, whey packets & garment bag", done: false },
        { id: "tv4", label: "Confirm household pet care & perimeter camera schedule", done: false },
      ],
    },

    // 6. Critical Appointment Radar
    {
      category: "appointment",
      title: "VA / VRE — Counselor Progress & Benefits Briefing",
      description:
        "Chapter 31 VR&E milestone verification, subsistence check & supply authorization.",
      schedule_interval: "quarterly",
      interval_value: 90,
      last_completed_at: addDaysIso(-84),
      next_due_date: addDaysIso(6),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "ap1", label: "Compile signed progress report & term schedule PDF", done: true },
        { id: "ap2", label: "Submit VA Form 28-1905m equipment verification", done: true },
        { id: "ap3", label: "Test video teleconference link 15m prior", done: false },
      ],
    },
    {
      category: "appointment",
      title: "Medical — Annual Executive Bloodwork & Lipid Panel",
      description:
        "12h fasted draw: Comprehensive metabolic, ApoB, hs-CRP, HbA1c & hormone panel.",
      schedule_interval: "biannual",
      interval_value: 180,
      last_completed_at: addDaysIso(-166),
      next_due_date: addDaysIso(14),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "ap4", label: "Begin water-only fast at 20:00 evening prior", done: false },
        { id: "ap5", label: "Pause biotin supplement 48h prior to lab draw", done: false },
      ],
    },
    {
      category: "appointment",
      title: "Dental — Biannual Prophylaxis & Periodontal Check",
      description: "Ultrasonic scaling, enamel polish & nightguard sanitization.",
      schedule_interval: "biannual",
      interval_value: 180,
      last_completed_at: addDaysIso(-151),
      next_due_date: addDaysIso(29),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "ap6", label: "Pack occlusal nightguard for ultrasonic bath", done: false },
      ],
    },
    {
      category: "appointment",
      title: "Veterinary — Canine Senior Wellness & Mobility Lab",
      description: "Comprehensive exam, senior joint panel & 6-month preventative refill.",
      schedule_interval: "biannual",
      interval_value: 180,
      last_completed_at: addDaysIso(-169),
      next_due_date: addDaysIso(11),
      telemetry_metric: null,
      current_metric_reading: null,
      threshold_metric_due: null,
      checklist_items: [
        { id: "ap7", label: "Confirm current joint & supplement dosing card", done: true },
        { id: "ap8", label: "Restock 6-month heartworm & tick prophylaxis", done: false },
      ],
    },
  ];
}

async function ensureSeededAndFetch(userId: string) {
  const countRows = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM public.life_logistics_items WHERE user_id = $1`,
    userId
  );

  if ((countRows[0]?.cnt ?? 0) === 0) {
    const seeds = buildBaselineSeedItems();
    for (const item of seeds) {
      await pgExec(
        `INSERT INTO public.life_logistics_items (
           user_id, category, title, description, schedule_interval, interval_value,
           last_completed_at, next_due_date, telemetry_metric,
           current_metric_reading, threshold_metric_due, checklist_items, is_active
         ) VALUES (
           $1, $2::public.logistics_category, $3, $4, $5, $6::int,
           $7::timestamptz, $8::timestamptz, $9,
           $10::numeric, $11::numeric, $12::jsonb, true
         )`,
        userId,
        item.category,
        item.title,
        item.description,
        item.schedule_interval,
        item.interval_value,
        item.last_completed_at,
        item.next_due_date,
        item.telemetry_metric,
        item.current_metric_reading,
        item.threshold_metric_due,
        JSON.stringify(item.checklist_items)
      );
    }
  }

  const items = await pgQuery<any>(
    `SELECT *
     FROM public.life_logistics_items
     WHERE user_id = $1 AND is_active = true
     ORDER BY next_due_date ASC NULLS LAST, created_at ASC`,
    userId
  );

  return {
    items: items.map((it) => ({
      ...it,
      checklist_items: Array.isArray(it.checklist_items)
        ? it.checklist_items
        : typeof it.checklist_items === "string"
        ? JSON.parse(it.checklist_items || "[]")
        : [],
    })),
  };
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    const payload = await ensureSeededAndFetch(userId);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("[API /api/life-ops GET]", error);
    return NextResponse.json(
      {
        items: buildBaselineSeedItems().map((s, idx) => ({
          id: `fallback-${idx}`,
          ...s,
        })),
        warning: error?.message || "Fallback active",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create_item") {
      const category = VALID_CATEGORIES.has(String(body.category))
        ? String(body.category)
        : "appointment";
      const title = String(body.title || "New Logistics Directive").trim().slice(0, 160);
      const description = body.description ? String(body.description).trim() : null;
      const scheduleInterval = body.scheduleInterval
        ? String(body.scheduleInterval).trim().slice(0, 32)
        : "monthly";
      const intervalValue = Math.max(1, Math.round(Number(body.intervalValue || 1)));
      const nextDueDate = body.nextDueDate
        ? new Date(body.nextDueDate).toISOString()
        : addDaysIso(14);
      const telemetryMetric = body.telemetryMetric
        ? String(body.telemetryMetric).trim().slice(0, 32)
        : null;
      const currentReading =
        body.currentMetricReading !== undefined &&
        body.currentMetricReading !== null &&
        body.currentMetricReading !== ""
          ? Number(body.currentMetricReading)
          : null;
      const thresholdDue =
        body.thresholdMetricDue !== undefined &&
        body.thresholdMetricDue !== null &&
        body.thresholdMetricDue !== ""
          ? Number(body.thresholdMetricDue)
          : null;
      const checklist = Array.isArray(body.checklistItems) ? body.checklistItems : [];

      await pgExec(
        `INSERT INTO public.life_logistics_items (
           user_id, category, title, description, schedule_interval, interval_value,
           next_due_date, telemetry_metric, current_metric_reading, threshold_metric_due,
           checklist_items, is_active
         ) VALUES (
           $1, $2::public.logistics_category, $3, $4, $5, $6::int,
           $7::timestamptz, $8, $9::numeric, $10::numeric,
           $11::jsonb, true
         )`,
        userId,
        category,
        title,
        description,
        scheduleInterval,
        intervalValue,
        nextDueDate,
        telemetryMetric,
        currentReading,
        thresholdDue,
        JSON.stringify(checklist)
      );
    } else if (action === "toggle_checklist") {
      const id = String(body.id || "");
      const rows = await pgQuery<any>(
        `SELECT * FROM public.life_logistics_items WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
        id,
        userId
      );
      if (rows.length > 0) {
        const list = Array.isArray(rows[0].checklist_items)
          ? rows[0].checklist_items
          : [];
        const idx = Number(body.index ?? -1);
        if (idx >= 0 && idx < list.length) {
          list[idx] = { ...list[idx], done: !list[idx].done };
        } else if (Array.isArray(body.checklistItems)) {
          list.splice(0, list.length, ...body.checklistItems);
        }
        await pgExec(
          `UPDATE public.life_logistics_items
           SET checklist_items = $2::jsonb,
               updated_at = NOW()
           WHERE id = $1::uuid`,
          id,
          JSON.stringify(list)
        );
      }
    } else if (action === "complete_cycle") {
      const id = String(body.id || "");
      const resetChecklist = Boolean(body.resetChecklist);
      const rows = await pgQuery<any>(
        `SELECT * FROM public.life_logistics_items WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
        id,
        userId
      );
      if (rows.length > 0) {
        const row = rows[0];
        const list = Array.isArray(row.checklist_items) ? row.checklist_items : [];
        const nextList = list.map((c: any) => ({
          ...c,
          done: resetChecklist ? false : true,
        }));
        const advanceDays = inferAdvanceDays(
          row.schedule_interval,
          Number(row.interval_value || 7)
        );
        const nextDue = addDaysIso(advanceDays);

        let nextThreshold = row.threshold_metric_due;
        if (
          body.advanceThreshold &&
          row.current_metric_reading !== null &&
          row.interval_value
        ) {
          nextThreshold =
            Number(row.current_metric_reading) + Number(row.interval_value);
        }

        await pgExec(
          `UPDATE public.life_logistics_items
           SET last_completed_at = NOW(),
               next_due_date = $2::timestamptz,
               threshold_metric_due = $3::numeric,
               checklist_items = $4::jsonb,
               updated_at = NOW()
           WHERE id = $1::uuid`,
          id,
          nextDue,
          nextThreshold,
          JSON.stringify(nextList)
        );
      }
    } else if (action === "update_telemetry") {
      const reading = Number(body.reading ?? 0);
      const vehiclePrefix = body.vehiclePrefix ? String(body.vehiclePrefix) : null;
      const metric = body.metric ? String(body.metric) : null;
      const id = body.id ? String(body.id) : null;

      if (vehiclePrefix && metric) {
        await pgExec(
          `UPDATE public.life_logistics_items
           SET current_metric_reading = $3::numeric,
               updated_at = NOW()
           WHERE user_id = $1
             AND category = 'vehicle_fleet'::public.logistics_category
             AND title ILIKE $2
             AND telemetry_metric = $4`,
          userId,
          `${vehiclePrefix}%`,
          reading,
          metric
        );
      } else if (id) {
        await pgExec(
          `UPDATE public.life_logistics_items
           SET current_metric_reading = $2::numeric,
               updated_at = NOW()
           WHERE id = $1::uuid AND user_id = $3`,
          id,
          reading,
          userId
        );
      }
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const updated = await ensureSeededAndFetch(userId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API /api/life-ops POST]", error);
    return NextResponse.json(
      { error: error?.message || "LifeOps mutation failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await pgExec(
      `DELETE FROM public.life_logistics_items WHERE id = $1::uuid AND user_id = $2`,
      id,
      userId
    );

    const updated = await ensureSeededAndFetch(userId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API /api/life-ops DELETE]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete item" },
      { status: 500 }
    );
  }
}
