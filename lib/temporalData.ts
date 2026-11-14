import {
  DaySegment,
  MonthNode,
  SeasonCard,
  TacticalWaypoint,
  RouteLeg,
  ConcentricTelemetry,
} from "./temporalTypes";

export function eventMatchesDate(date: Date, targetDateStr: string, tz: string = "America/Denver"): boolean {
  try {
    const localDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
    return localDateStr === targetDateStr;
  } catch {
    const targetMid = new Date(`${targetDateStr}T12:00:00Z`).getTime();
    return Math.abs(date.getTime() - targetMid) <= 14 * 60 * 60 * 1000;
  }
}

function inferDomainAndMedia(title: string, category?: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("workout") || t.includes("gym") || t.includes("training") || t.includes("lift") || category === "workout") {
    return { domain: "physical_training" as const, media: "", icon: "dumbbell" };
  }
  if (t.includes("dinner") || t.includes("lunch") || t.includes("breakfast") || t.includes("meal") || t.includes("refuel") || t.includes("fast") || t.includes("feed")) {
    return { domain: "nutrition" as const, media: "", icon: "utensils" };
  }
  if (t.includes("walk") || t.includes("dog") || t.includes("dogs") || t.includes("huskies") || t.includes("nova") || t.includes("astro") || t.includes("family") || t.includes("comet")) {
    return { domain: "family_pets" as const, media: "", icon: "dog" };
  }
  if (t.includes("rest") || t.includes("sleep") || t.includes("bed") || t.includes("shower") || t.includes("prep") || t.includes("wake up") || t.includes("trash")) {
    return { domain: "logistics" as const, media: "", icon: "bed" };
  }
  return { domain: "engineering" as const, media: "", icon: "laptop" };
}

export function getWeekDays(
  referenceDate: Date = new Date(),
  allEvents: Array<{ title: string; start_time: string; end_time: string; color_hex?: string; category?: string }> = [],
  tz: string = "America/Denver"
): DaySegment[] {
  const current = new Date(referenceDate);
  // Find Monday of current week
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const names = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const todayStr = new Date().toISOString().split("T")[0];

  return names.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayNum = String(d.getDate()).padStart(2, "0");
    const dStr = `${y}-${m}-${dayNum}`;

    const isToday = dStr === todayStr;
    const isPast = !isToday && d < new Date();
    const color = isToday
      ? "#FF9900"
      : isPast
      ? "#0088FF"
      : i === 4
      ? "#9D4EDD"
      : "#99FF33";

    // Match real Google / database events for this day
    const dayEvents = allEvents.filter((ev) => {
      const s = new Date(ev.start_time);
      return eventMatchesDate(s, dStr, tz);
    });

    const hasRealEvents = dayEvents.length > 0;
    const primaryEvent = hasRealEvents ? dayEvents[0] : null;
    const inferred = primaryEvent ? inferDomainAndMedia(primaryEvent.title, primaryEvent.category) : null;

    const primaryFocus = primaryEvent ? primaryEvent.title : (isToday ? "Today's Agenda" : "No scheduled events");
    const domain = inferred ? inferred.domain : "engineering";
    const mediaUrl = inferred ? inferred.media : "";
    const iconName = inferred ? inferred.icon : "calendar";

    return {
      isoDay: i + 1,
      dayName: name,
      dateNum: d.getDate(),
      dateStr: dStr,
      isActiveToday: isToday,
      isPast,
      statusColor: color,
      primaryFocus,
      domain,
      mediaUrl,
      iconName,
      telemetry: {
        healthPct: hasRealEvents ? Math.min(100, 75 + dayEvents.length * 5) : 80,
        workPct: hasRealEvents ? Math.min(100, dayEvents.length * 20) : 50,
        sleepPct: 90,
      },
      eventsCount: dayEvents.length,
      events: dayEvents.map((e) => ({
        id: (e as any).id || e.title,
        title: e.title,
        time: new Date(e.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        color: e.color_hex || "#3B82F6",
      })),
    };
  });
}

export function getMonthNodes(
  year: number = 2026,
  month: number = 10,
  allEvents: Array<{ title: string; start_time: string; end_time: string; color_hex?: string }> = [],
  tz: string = "America/Denver"
): MonthNode[] {
  // month is 0-indexed (10 = November)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const nodes: MonthNode[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(d).padStart(2, "0");
    const dateStr = `${year}-${mStr}-${dStr}`;

    const isToday = dateStr === todayStr;
    const dObj = new Date(year, month, d);
    const isPast = !isToday && dObj < new Date();
    const isActiveWeek = d >= 9 && d <= 15;

    // Check real events for this node
    const dayEvents = allEvents.filter((ev) => {
      const s = new Date(ev.start_time);
      return eventMatchesDate(s, dateStr, tz);
    });
    const hasEvents = dayEvents.length > 0;

    let status: MonthNode["status"] = "upcoming";
    let statusColor = "rgba(255, 255, 255, 0.25)";

    if (isToday) {
      status = "active_today";
      statusColor = "#FF9900";
    } else if (hasEvents) {
      status = "active_week";
      statusColor = isPast ? "#0088FF" : "#99FF33";
    } else if (isActiveWeek) {
      status = "active_week";
      statusColor = isPast ? "#0088FF" : "#9D4EDD";
    } else if (isPast) {
      status = "completed";
      statusColor = "#0088FF";
    } else {
      status = "dimmed";
      statusColor = "rgba(255, 255, 255, 0.18)";
    }

    nodes.push({
      dayOfMonth: d,
      dateStr,
      isCurrentMonth: true,
      isToday,
      isActiveWeek,
      isPast,
      status,
      statusColor,
      taskCount: hasEvents ? dayEvents.length : (isPast ? 4 : isToday ? 5 : 2),
      eventsCount: dayEvents.length,
      primaryEvent: dayEvents[0]?.title,
    });
  }
  return nodes;
}

export function getSeasonCards(
  selectedYear: number = 2026,
  allEvents: Array<{ title: string; start_time: string }> = []
): SeasonCard[] {
  const getEventCountInMonths = (monthIndices: number[]) => {
    return allEvents.filter((ev) => {
      const d = new Date(ev.start_time);
      return d.getFullYear() === selectedYear && monthIndices.includes(d.getMonth());
    }).length;
  };

  const winterCount = getEventCountInMonths([11, 0, 1]); // Dec, Jan, Feb
  const springCount = getEventCountInMonths([2, 3, 4]);  // Mar, Apr, May
  const summerCount = getEventCountInMonths([5, 6, 7]);  // Jun, Jul, Aug
  const fallCount = getEventCountInMonths([8, 9, 10]);   // Sep, Oct, Nov

  return [
    {
      id: "winter",
      title: "WINTER",
      months: "DEC · JAN · FEB",
      subtitle: winterCount > 0 ? `${winterCount} Events Scheduled` : "Winter Break & Foundation",
      strategicImperative: "Restoration & High-Altitude Strength",
      accentColor: "#38bdf8",
      mediaUrl: "",
      isActiveCurrent: false,
    },
    {
      id: "spring",
      title: "SPRING",
      months: "MAR · APR · MAY",
      subtitle: springCount > 0 ? `${springCount} Events Scheduled` : "Launch Season",
      strategicImperative: "Commercial Scale & New Feature Deployments",
      accentColor: "#99FF33",
      mediaUrl: "",
      isActiveCurrent: false,
    },
    {
      id: "summer",
      title: "SUMMER",
      months: "JUN · JUL · AUG",
      subtitle: summerCount > 0 ? `${summerCount} Events Scheduled` : "Summertime & Outdoor Recon",
      strategicImperative: "Fitness Peak & Wilderness Pack Treks",
      accentColor: "#FF5500",
      mediaUrl: "",
      isActiveCurrent: false,
    },
    {
      id: "fall",
      title: "FALL",
      months: "SEP · OCT · NOV",
      subtitle: fallCount > 0 ? `${fallCount} Events Scheduled` : "Q4 Milestones & Revenue Lock",
      strategicImperative: "Active Season · Enterprise Architecture & Cash Reserves",
      accentColor: "#FF9900",
      mediaUrl: "",
      isActiveCurrent: true,
    },
  ];
}

/**
 * El Paso Tactical Waypoints matching "The Routine Roadmap"
 * Home Base (Franklin Mountain Foothills) -> School -> Downtown HQ -> East El Paso Store -> Home
 */
export const EL_PASO_TACTICAL_WAYPOINTS: TacticalWaypoint[] = [
  {
    id: "wp-home-wake",
    title: "Wake Up / Shower & Meds",
    category: "home_base",
    timeWindow: "05:30",
    minuteOfDay: 330,
    lat: 31.8150,
    lng: -106.5120,
    elevation: 1220,
    status: "completed",
    accentColor: "#0088FF",
    mediaUrl: "",
    subtasks: ["Cold face splash & electrolytes", "Thyroid & morning supplements", "66°F room airflow reset"],
    isHomeBaseHub: true,
    homeRadialOffset: [
      { dx: -28, dy: -24, label: "Wake & Shower", icon: "bath" },
      { dx: 26, dy: -32, label: "Water Grass", icon: "droplet" },
      { dx: 42, dy: 10, label: "Make Breakfast", icon: "utensils" },
      { dx: -34, dy: 30, label: "Garage Project", icon: "wrench" },
      { dx: 12, dy: 44, label: "Nighttime Meds", icon: "shield" },
    ],
  },
  {
    id: "wp-dog-walk-1",
    title: "Dog Walk #1 (Franklin Trail)",
    category: "home_base",
    timeWindow: "06:30",
    minuteOfDay: 390,
    lat: 31.8210,
    lng: -106.5050,
    elevation: 1250,
    status: "completed",
    accentColor: "#0088FF",
    mediaUrl: "",
    subtasks: ["Nova & Astro harness check", "1.8 Mile morning optical flow", "Hydrate pack"],
  },
  {
    id: "wp-water-grass",
    title: "Water Grass & Lawn Irrigation",
    category: "home_base",
    timeWindow: "07:15",
    minuteOfDay: 435,
    lat: 31.8155,
    lng: -106.5122,
    elevation: 1220,
    status: "completed",
    accentColor: "#0088FF",
    mediaUrl: "",
    subtasks: ["Zone 1-4 rotary sprinklers", "Inspect desert perimeter"],
  },
  {
    id: "wp-breakfast",
    title: "Make Breakfast (3-Egg Scramble)",
    category: "home_base",
    timeWindow: "07:30",
    minuteOfDay: 450,
    lat: 31.8152,
    lng: -106.5118,
    elevation: 1220,
    status: "completed",
    accentColor: "#0088FF",
    mediaUrl: "",
    subtasks: ["Pasture-raised eggs & sourdough", "60g protein intake floor", "Espresso brew"],
  },
  {
    id: "wp-school-commute",
    title: "Commute to School Drop-off",
    category: "school",
    timeWindow: "08:00",
    minuteOfDay: 480,
    lat: 31.7850,
    lng: -106.4950,
    elevation: 1180,
    status: "completed",
    accentColor: "#0088FF",
    mediaUrl: "",
    subtasks: ["Vehicle checklist & safe transit", "School gate drop-off", "Clear morning traffic"],
  },
  {
    id: "wp-start-work",
    title: "START DAY / HQ OPERATIONS",
    category: "outdoor_transit",
    timeWindow: "10:00",
    minuteOfDay: 600,
    lat: 31.7619,
    lng: -106.4850,
    elevation: 1140,
    status: "active",
    accentColor: "#FF9900",
    mediaUrl: "",
    subtasks: ["Supabase RLS & Auth hardening", "ClickUp C-suite triage", "High-leverage sprint block"],
  },
  {
    id: "wp-lunch",
    title: "Lunch Break & Walk",
    category: "outdoor_transit",
    timeWindow: "12:00",
    minuteOfDay: 720,
    lat: 31.7650,
    lng: -106.4810,
    elevation: 1145,
    status: "upcoming",
    accentColor: "#99FF33",
    mediaUrl: "",
    subtasks: ["Grilled chicken & avocado refuel", "15m sunlight exposure walk"],
  },
  {
    id: "wp-school-pickup",
    title: "Pick Up Kid from School",
    category: "school",
    timeWindow: "15:30",
    minuteOfDay: 930,
    lat: 31.7850,
    lng: -106.4950,
    elevation: 1180,
    status: "upcoming",
    accentColor: "#99FF33",
    mediaUrl: "",
    subtasks: ["Arrive at pickup queue by 15:20", "Brief afternoon debrief"],
  },
  {
    id: "wp-dog-walk-2",
    title: "Nova & Astro Walk #2 (Sunset Recon)",
    category: "home_base",
    timeWindow: "17:30",
    minuteOfDay: 1050,
    lat: 31.8210,
    lng: -106.5050,
    elevation: 1250,
    status: "upcoming",
    accentColor: "#9D4EDD",
    mediaUrl: "",
    subtasks: ["Sunset twilight optic flow", "2-Mile evening exercise pace", "Inspect paws and coat"],
  },
  {
    id: "wp-dinner",
    title: "Cook Dinner & Family Eat",
    category: "home_base",
    timeWindow: "18:30",
    minuteOfDay: 1110,
    lat: 31.8152,
    lng: -106.5118,
    elevation: 1220,
    status: "upcoming",
    accentColor: "#9D4EDD",
    mediaUrl: "",
    subtasks: ["Grass-fed ribeye & sweet potato", "Hit 180g protein daily floor", "Close feeding window"],
  },
  {
    id: "wp-sleep",
    title: "Nighttime Wind-Down & Sleep",
    category: "home_base",
    timeWindow: "23:00",
    minuteOfDay: 1380,
    lat: 31.8150,
    lng: -106.5120,
    elevation: 1220,
    status: "upcoming",
    accentColor: "#38bdf8",
    mediaUrl: "",
    subtasks: ["Nighttime magnesium & zinc", "Blue-light zero emission", "7.5h deep recovery lock"],
  },
];

export const EL_PASO_ROUTE_LEGS: RouteLeg[] = [
  {
    id: "leg-1",
    fromId: "wp-home-wake",
    toId: "wp-school-commute",
    startMinute: 450,
    endMinute: 480,
    color: "#0088FF",
    mode: "DRIVE",
    pathCoordinates: [
      [-106.5120, 31.8150],
      [-106.5080, 31.8080],
      [-106.5020, 31.7980],
      [-106.4970, 31.7900],
      [-106.4950, 31.7850],
    ],
  },
  {
    id: "leg-2",
    fromId: "wp-school-commute",
    toId: "wp-start-work",
    startMinute: 490,
    endMinute: 540,
    color: "#FF9900",
    mode: "DRIVE",
    pathCoordinates: [
      [-106.4950, 31.7850],
      [-106.4900, 31.7780],
      [-106.4860, 31.7700],
      [-106.4850, 31.7619],
    ],
  },
  {
    id: "leg-3",
    fromId: "wp-start-work",
    toId: "wp-school-pickup",
    startMinute: 900,
    endMinute: 930,
    color: "#99FF33",
    mode: "DRIVE",
    pathCoordinates: [
      [-106.4850, 31.7619],
      [-106.4860, 31.7700],
      [-106.4900, 31.7780],
      [-106.4950, 31.7850],
    ],
  },
  {
    id: "leg-4",
    fromId: "wp-school-pickup",
    toId: "wp-dog-walk-2",
    startMinute: 960,
    endMinute: 1020,
    color: "#9D4EDD",
    mode: "DRIVE",
    pathCoordinates: [
      [-106.4950, 31.7850],
      [-106.4970, 31.7900],
      [-106.5020, 31.7980],
      [-106.5080, 31.8080],
      [-106.5120, 31.8150],
    ],
  },
];

