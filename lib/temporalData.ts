import {
  DaySegment,
  MonthNode,
  SeasonCard,
  TacticalWaypoint,
  RouteLeg,
  ConcentricTelemetry,
} from "./temporalTypes";

export function getWeekDays(referenceDate: Date = new Date()): DaySegment[] {
  const current = new Date(referenceDate);
  // Find Monday of current week
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const names = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const todayStr = new Date().toISOString().split("T")[0];

  const presets = [
    {
      focus: "Cozier Rest & Reset",
      domain: "logistics" as const,
      media: "/circadian/cozier-rest.jpg",
      icon: "bed",
      health: 88,
      work: 95,
      sleep: 96,
    },
    {
      focus: "SaaS Build Sprint",
      domain: "engineering" as const,
      media: "/circadian/saas-build.jpg",
      icon: "laptop",
      health: 82,
      work: 100,
      sleep: 90,
    },
    {
      focus: "Deep System Architecture",
      domain: "engineering" as const,
      media: "/circadian/saas-build.jpg",
      icon: "laptop",
      health: 85,
      work: 92,
      sleep: 88,
    },
    {
      focus: "Hypertrophy Push & Deadlift",
      domain: "physical_training" as const,
      media: "/circadian/gym-workout.jpg",
      icon: "dumbbell",
      health: 96,
      work: 90,
      sleep: 92,
    },
    {
      focus: "Operations & Client Sync",
      domain: "engineering" as const,
      media: "/circadian/saas-build.jpg",
      icon: "briefcase",
      health: 80,
      work: 94,
      sleep: 85,
    },
    {
      focus: "Nova & Astro Trail Trek",
      domain: "family_pets" as const,
      media: "/circadian/huskies-walk.jpg",
      icon: "dog",
      health: 98,
      work: 70,
      sleep: 95,
    },
    {
      focus: "Macro Refuel & Cast-Iron",
      domain: "nutrition" as const,
      media: "/circadian/nutrition-steak.jpg",
      icon: "utensils",
      health: 94,
      work: 65,
      sleep: 98,
    },
  ];

  return names.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayNum = String(d.getDate()).padStart(2, "0");
    const dStr = `${y}-${m}-${dayNum}`;

    const isToday = dStr === todayStr || i === 3; // THU 12 as showcase if needed
    const isPast = !isToday && d < new Date();
    const color = isToday
      ? "#FF9900"
      : isPast
      ? "#0088FF"
      : i === 4
      ? "#9D4EDD"
      : "#99FF33";

    return {
      isoDay: i + 1,
      dayName: name,
      dateNum: d.getDate(),
      dateStr: dStr,
      isActiveToday: isToday,
      isPast,
      statusColor: color,
      primaryFocus: presets[i].focus,
      domain: presets[i].domain,
      mediaUrl: presets[i].media,
      iconName: presets[i].icon,
      telemetry: {
        healthPct: presets[i].health,
        workPct: presets[i].work,
        sleepPct: presets[i].sleep,
      },
    };
  });
}

export function getMonthNodes(year: number = 2026, month: number = 10): MonthNode[] {
  // month is 0-indexed (10 = November)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = 12; // Nov 12

  const nodes: MonthNode[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const isPast = d < today;
    const isActiveWeek = d >= 9 && d <= 15;

    let status: MonthNode["status"] = "upcoming";
    let statusColor = "rgba(255, 255, 255, 0.25)";

    if (isToday) {
      status = "active_today";
      statusColor = "#FF9900";
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

    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(d).padStart(2, "0");

    nodes.push({
      dayOfMonth: d,
      dateStr: `${year}-${mStr}-${dStr}`,
      isCurrentMonth: true,
      isToday,
      isActiveWeek,
      isPast,
      status,
      statusColor,
      taskCount: isPast ? 4 : isToday ? 5 : 2,
    });
  }
  return nodes;
}

export function getSeasonCards(): SeasonCard[] {
  return [
    {
      id: "winter",
      title: "WINTER",
      months: "DEC · JAN · FEB",
      subtitle: "Winter Break & Foundation",
      strategicImperative: "Restoration & High-Altitude Strength",
      accentColor: "#38bdf8",
      mediaUrl: "/circadian/cozier-rest.jpg",
      isActiveCurrent: false,
    },
    {
      id: "spring",
      title: "SPRING",
      months: "MAR · APR · MAY",
      subtitle: "Launch Season",
      strategicImperative: "Commercial Scale & New Feature Deployments",
      accentColor: "#99FF33",
      mediaUrl: "/circadian/gym-workout.jpg",
      isActiveCurrent: false,
    },
    {
      id: "summer",
      title: "SUMMER",
      months: "JUN · JUL · AUG",
      subtitle: "Summertime & Outdoor Recon",
      strategicImperative: "Fitness Peak & Wilderness Pack Treks",
      accentColor: "#FF5500",
      mediaUrl: "/circadian/huskies-walk.jpg",
      isActiveCurrent: false,
    },
    {
      id: "fall",
      title: "FALL",
      months: "SEP · OCT · NOV",
      subtitle: "Q4 Milestones & Revenue Lock",
      strategicImperative: "Active Season · Enterprise Architecture & Cash Reserves",
      accentColor: "#FF9900",
      mediaUrl: "/circadian/saas-build.jpg",
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
    mediaUrl: "/circadian/cozier-rest.jpg",
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
    mediaUrl: "/circadian/huskies-walk.jpg",
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
    mediaUrl: "/circadian/saas-build.jpg",
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
    mediaUrl: "/circadian/nutrition-steak.jpg",
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
    mediaUrl: "/circadian/gym-workout.jpg",
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
    mediaUrl: "/circadian/saas-build.jpg",
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
    mediaUrl: "/circadian/nutrition-steak.jpg",
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
    mediaUrl: "/circadian/gym-workout.jpg",
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
    mediaUrl: "/circadian/huskies-walk.jpg",
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
    mediaUrl: "/circadian/nutrition-steak.jpg",
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
    mediaUrl: "/circadian/cozier-rest.jpg",
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

