/**
 * Automatic Title-to-Image Visuals Parser for Synthesis Roadmap Cards
 * Evaluates node titles, subtitles, and domain context to instantly pair clean,
 * relevant dark-mode aerospace/fitness/engineering imagery with zero UI lag.
 */

interface KeywordMapping {
  keywords: string[];
  imageUrl: string;
}

const VISUAL_MAPPINGS: KeywordMapping[] = [
  // Dogs & Family Pets
  {
    keywords: ["dog", "husky", "astro", "nova", "comet", "potty", "yard", "pet", "vet", "pack"],
    imageUrl: "/circadian/huskies-walk.jpg",
  },
  // Workouts, Gym & Physical Training
  {
    keywords: ["bench", "press", "incline", "barbell", "smith", "chest"],
    imageUrl: "/workouts/incline_bench.jpg",
  },
  {
    keywords: ["dumbbell", "shoulder", "deltoid", "lateral", "arm", "bicep", "curl", "tricep"],
    imageUrl: "/workouts/dumbbell_press.jpg",
  },
  {
    keywords: ["cable", "fly", "crossover", "pulldown", "row", "stretch", "hypertrophy", "tension", "lift", "workout", "gym"],
    imageUrl: "/workouts/cable_fly.jpg",
  },
  {
    keywords: ["squat", "quad", "hamstring", "deadlift", "legs", "hack", "calf"],
    imageUrl: "/workouts/legs_day.jpg",
  },
  // Rest, Sleep, Circadian & Recovery
  {
    keywords: ["sleep", "rest", "circadian", "bed", "pod", "curfew", "nsdr", "recovery", "chill", "dark"],
    imageUrl: "/circadian/cozier-rest.jpg",
  },
  // Fuel, Nutrition, Kitchen & Cooking
  {
    keywords: ["steak", "beef", "meal", "food", "protein", "fuel", "macro", "caloric", "prep", "dinner", "lunch", "breakfast", "cook"],
    imageUrl: "/circadian/nutrition-steak.jpg",
  },
  {
    keywords: ["kitchen", "dishwasher", "sink", "dish", "counter", "pantry", "stove", "fridge"],
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  },
  // Plumbing, Utility Sink & Workshop Construction
  {
    keywords: ["pex", "pipe", "plumbing", "pvc", "drain", "water", "trap", "valve", "faucet", "basin", "tapcon", "drill", "tools"],
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  },
  // SaaS, Software, Code, Wealth & Trading
  {
    keywords: ["saas", "code", "dev", "build", "api", "database", "supabase", "deploy", "server", "cloud"],
    imageUrl: "/circadian/saas-build.jpg",
  },
  {
    keywords: ["trading", "futures", "nq", "mnq", "chart", "broker", "rth", "pnl", "ticker", "equity", "wealth", "budget", "finance"],
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
  },
  // Bio-tuning, Dexa, Lab & Science
  {
    keywords: ["dexa", "vitals", "scan", "biotech", "lab", "endocrine", "blood", "test", "hormone", "synthesis", "science", "formula"],
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
  },
  // Home Ops, Living Space & Architecture
  {
    keywords: ["home", "family", "house", "room", "ambient", "living", "patio", "yard", "logistics"],
    imageUrl: "/backgrounds/eco-home-ambient.jpg",
  },
];

/**
 * Procedural fallback gradient based on node title hash
 */
export function getProceduralFallback(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 45) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 15%) 0%, hsl(${hue2}, 80%, 8%) 100%)`;
}

/**
 * Main resolution function: given title, optional sub, and domain, resolves the best image.
 */
export function resolveNodeVisual(title: string, sub?: string, domain?: string): string {
  const combined = `${title || ""} ${sub || ""} ${domain || ""}`.toLowerCase();

  for (const mapping of VISUAL_MAPPINGS) {
    if (mapping.keywords.some((kw) => combined.includes(kw))) {
      return mapping.imageUrl;
    }
  }

  // Fallbacks by domain
  if (domain === "dogs") return "/circadian/huskies-walk.jpg";
  if (domain === "health") return "/workouts/incline_bench.jpg";
  if (domain === "wealth") return "/circadian/saas-build.jpg";
  if (domain === "family") return "/backgrounds/eco-home-ambient.jpg";

  return "/circadian/saas-build.jpg";
}
