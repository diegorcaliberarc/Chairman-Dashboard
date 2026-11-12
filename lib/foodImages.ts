/**
 * Canonical Food Image Map (lib/foodImages.ts)
 * High-resolution optimized photographic food assets for the MacroOps visual feed.
 */

export type CanonicalFoodImageKey =
  | "chicken_breast"
  | "steak_beef"
  | "eggs"
  | "whey_shake"
  | "russet_potato"
  | "rice"
  | "salad_greens"
  | "cucumber"
  | "apple"
  | "avocado"
  | "chips_snack"
  | "ice_cream_popsicle"
  | "light_beer_wine"
  | "water"
  | "electrolytes"
  | "default_food";

export const CANONICAL_FOOD_IMAGE_KEYS: CanonicalFoodImageKey[] = [
  "chicken_breast",
  "steak_beef",
  "eggs",
  "whey_shake",
  "russet_potato",
  "rice",
  "salad_greens",
  "cucumber",
  "apple",
  "avocado",
  "chips_snack",
  "ice_cream_popsicle",
  "light_beer_wine",
  "water",
  "electrolytes",
  "default_food",
];

export const FOOD_IMAGES: Record<CanonicalFoodImageKey, { url: string; label: string; accent: string }> = {
  chicken_breast: {
    url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80",
    label: "Chicken Breast",
    accent: "#10b981",
  },
  steak_beef: {
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
    label: "Sirloin / Beef Steak",
    accent: "#ef4444",
  },
  eggs: {
    url: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=400&q=80",
    label: "Eggs / Egg Whites",
    accent: "#f59e0b",
  },
  whey_shake: {
    url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80",
    label: "Whey Protein Shake",
    accent: "#8b5cf6",
  },
  russet_potato: {
    url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80",
    label: "Air-Fried Russet Potato",
    accent: "#eab308",
  },
  rice: {
    url: "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=80",
    label: "Jasmine / White Rice",
    accent: "#f97316",
  },
  salad_greens: {
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    label: "Mixed Salad Greens",
    accent: "#22c55e",
  },
  cucumber: {
    url: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=400&q=80",
    label: "Fresh Cucumber",
    accent: "#10b981",
  },
  apple: {
    url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80",
    label: "Crisp Apple",
    accent: "#ef4444",
  },
  avocado: {
    url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80",
    label: "Avocado",
    accent: "#84cc16",
  },
  chips_snack: {
    url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80",
    label: "Chips & Snacks",
    accent: "#f97316",
  },
  ice_cream_popsicle: {
    url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80",
    label: "Ice Cream / Popsicle",
    accent: "#ec4899",
  },
  light_beer_wine: {
    url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80",
    label: "Light Beverage / Drink",
    accent: "#eab308",
  },
  water: {
    url: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80",
    label: "Pure Water",
    accent: "#06b6d4",
  },
  electrolytes: {
    url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    label: "Electrolyte Hydration",
    accent: "#38bdf8",
  },
  default_food: {
    url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80",
    label: "Nutrition Fuel",
    accent: "#a1a1aa",
  },
};

/**
 * Fallback resolver if Gemini or user provides unknown key
 */
export function resolveFoodImage(key?: string): { url: string; label: string; accent: string } {
  if (key && key in FOOD_IMAGES) {
    return FOOD_IMAGES[key as CanonicalFoodImageKey];
  }
  return FOOD_IMAGES.default_food;
}
