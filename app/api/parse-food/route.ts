import { NextRequest, NextResponse } from "next/server";
import { pgExec, pgQuery } from "@/lib/livingOsDb";
import { CANONICAL_FOOD_IMAGE_KEYS, CanonicalFoodImageKey } from "@/lib/foodImages";

export const dynamic = "force-dynamic";

interface ParsedFoodItem {
  name: string;
  quantity_grams: number;
  weight_lbs: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  cholesterol_mg: number;
  water_oz: number;
  image_key: CanonicalFoodImageKey;
  is_estimated: boolean;
  meal_window?: string;
}

/**
 * Fallback USDA nutritional heuristic parser
 * Used when Gemini API key is not present or rate limited
 */
function fallbackParseNutrients(rawText: string): ParsedFoodItem[] {
  const items: ParsedFoodItem[] = [];
  // Split on commas, semicolons, newlines, and " and " or " + "
  const clauses = rawText
    .split(/[,;\n]+|\s+and\s+|\s*\+\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    const lower = clause.toLowerCase();

    // Check grams (e.g. 160g, 160 grams, 160 gm)
    const gramMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?|gm)\b/);
    // Check ounces (e.g. 8oz, 6 ounces, 16 fl oz)
    const ozMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounces?|fl\s*oz)\b/);
    // Check pounds (e.g. 1 lb, 0.5 lbs)
    const lbMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)\b/);
    // Check cups (e.g. 1 cup, 2 cups)
    const cupMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:cups?)\b/);
    // Check scoops (e.g. 1 scoop, 2 scoops)
    const scoopMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:scoops?)\b/);
    // Check items count (e.g. 2 eggs, 3 slices)
    const countMatch = lower.match(/^(\d+(?:\.\d+)?)\s+/);

    let grams = 100;
    let isEstimated = true;
    let waterOz = 0;

    if (gramMatch) {
      grams = parseFloat(gramMatch[1]);
      isEstimated = false;
    } else if (ozMatch) {
      const oz = parseFloat(ozMatch[1]);
      grams = oz * 28.3495;
      if (lower.includes("water") || lower.includes("liquid") || lower.includes("drink") || lower.includes("shake")) {
        waterOz = oz;
      }
      isEstimated = false;
    } else if (lbMatch) {
      const lbs = parseFloat(lbMatch[1]);
      grams = lbs * 453.592;
      isEstimated = false;
    } else if (cupMatch) {
      const cups = parseFloat(cupMatch[1]);
      grams = cups * 150;
      isEstimated = true;
    } else if (scoopMatch) {
      const scoops = parseFloat(scoopMatch[1]);
      grams = scoops * 32;
      isEstimated = false;
    } else if (lower.includes("handful")) {
      grams = 100;
      isEstimated = true;
    } else if (countMatch) {
      const count = parseFloat(countMatch[1]);
      if (lower.includes("egg")) grams = count * 50;
      else if (lower.includes("apple") || lower.includes("banana")) grams = count * 150;
      else grams = count * 60;
      isEstimated = true;
    }

    let name = clause;
    let calories = Math.round(grams * 1.5);
    let protein_g = 5;
    let carbs_g = 15;
    let fat_g = 3;
    let cholesterol_mg = 0;
    let image_key: CanonicalFoodImageKey = "default_food";

    if (lower.includes("chicken") || lower.includes("breast") || lower.includes("poultry") || lower.includes("tender")) {
      name = "Cooked Chicken Breast";
      calories = Math.round((grams / 100) * 165);
      protein_g = Number(((grams / 100) * 31).toFixed(1));
      carbs_g = 0;
      fat_g = Number(((grams / 100) * 3.6).toFixed(1));
      cholesterol_mg = Math.round((grams / 100) * 85);
      image_key = "chicken_breast";
    } else if (lower.includes("steak") || lower.includes("beef") || lower.includes("sirloin") || lower.includes("ribeye") || lower.includes("burger")) {
      name = "Sirloin / Beef Steak";
      calories = Math.round((grams / 100) * 210);
      protein_g = Number(((grams / 100) * 29).toFixed(1));
      carbs_g = 0;
      fat_g = Number(((grams / 100) * 10).toFixed(1));
      cholesterol_mg = Math.round((grams / 100) * 75);
      image_key = "steak_beef";
    } else if (lower.includes("egg") || lower.includes("whites")) {
      name = lower.includes("white") ? "Egg Whites" : "Whole Eggs";
      calories = lower.includes("white") ? Math.round((grams / 100) * 52) : Math.round((grams / 100) * 143);
      protein_g = lower.includes("white") ? Number(((grams / 100) * 11).toFixed(1)) : Number(((grams / 100) * 12.6).toFixed(1));
      carbs_g = 0.5;
      fat_g = lower.includes("white") ? 0.2 : Number(((grams / 100) * 9.5).toFixed(1));
      cholesterol_mg = lower.includes("white") ? 0 : Math.round((grams / 100) * 372);
      image_key = "eggs";
    } else if (lower.includes("whey") || lower.includes("protein shake") || lower.includes("isolate") || lower.includes("casein") || lower.includes("powder")) {
      name = "Whey Protein Isolate";
      calories = Math.round((grams / 30) * 120);
      protein_g = Number(((grams / 30) * 25).toFixed(1));
      carbs_g = 2.0;
      fat_g = 1.0;
      cholesterol_mg = 15;
      image_key = "whey_shake";
    } else if (lower.includes("potato") || lower.includes("russet") || lower.includes("fries") || lower.includes("tater") || lower.includes("spud")) {
      name = "Air-Fried Russet Potato";
      calories = Math.round((grams / 100) * 93);
      protein_g = Number(((grams / 100) * 2.5).toFixed(1));
      carbs_g = Number(((grams / 100) * 21.2).toFixed(1));
      fat_g = 0.1;
      cholesterol_mg = 0;
      image_key = "russet_potato";
    } else if (lower.includes("rice") || lower.includes("jasmine") || lower.includes("basmati")) {
      name = "Steamed Jasmine Rice";
      calories = Math.round((grams / 100) * 130);
      protein_g = Number(((grams / 100) * 2.7).toFixed(1));
      carbs_g = Number(((grams / 100) * 28.2).toFixed(1));
      fat_g = 0.3;
      cholesterol_mg = 0;
      image_key = "rice";
    } else if (lower.includes("salad") || lower.includes("lettuce") || lower.includes("greens") || lower.includes("spinach") || lower.includes("kale")) {
      name = "Fresh Salad Greens";
      calories = Math.round((grams / 100) * 15);
      protein_g = Number(((grams / 100) * 1.4).toFixed(1));
      carbs_g = Number(((grams / 100) * 2.8).toFixed(1));
      fat_g = 0.2;
      cholesterol_mg = 0;
      image_key = "salad_greens";
    } else if (lower.includes("cucumber")) {
      name = "Fresh Cucumber";
      calories = Math.round((grams / 100) * 15);
      protein_g = 0.7;
      carbs_g = 3.6;
      fat_g = 0.1;
      cholesterol_mg = 0;
      image_key = "cucumber";
    } else if (lower.includes("apple")) {
      name = "Crisp Apple";
      if (!gramMatch) grams = 180;
      calories = Math.round((grams / 100) * 52);
      protein_g = 0.3;
      carbs_g = 13.8;
      fat_g = 0.2;
      cholesterol_mg = 0;
      image_key = "apple";
    } else if (lower.includes("avocado")) {
      name = "Hass Avocado";
      if (!gramMatch) grams = 100;
      calories = Math.round((grams / 100) * 160);
      protein_g = 2.0;
      carbs_g = 8.5;
      fat_g = 14.7;
      cholesterol_mg = 0;
      image_key = "avocado";
    } else if (lower.includes("electrolyte") || lower.includes("hydration") || lower.includes("lmnt") || lower.includes("gatorade")) {
      name = "Electrolyte Hydration Water";
      if (!ozMatch && !gramMatch) {
        waterOz = 32;
        grams = 946;
      }
      calories = 0;
      protein_g = 0;
      carbs_g = 0;
      fat_g = 0;
      cholesterol_mg = 0;
      image_key = "electrolytes";
    } else if (lower.includes("water") || lower.includes("h2o")) {
      name = "Pure Water";
      if (!ozMatch && !gramMatch) {
        waterOz = 16;
        grams = 473;
      } else if (ozMatch) {
        waterOz = parseFloat(ozMatch[1]);
      }
      calories = 0;
      protein_g = 0;
      carbs_g = 0;
      fat_g = 0;
      cholesterol_mg = 0;
      image_key = "water";
    } else if (lower.includes("chip") || lower.includes("snack") || lower.includes("popcorn") || lower.includes("pretzel")) {
      name = "Snack Chips / Crisp";
      calories = Math.round((grams / 100) * 536);
      protein_g = 7.0;
      carbs_g = 53.0;
      fat_g = 34.0;
      cholesterol_mg = 0;
      image_key = "chips_snack";
    } else if (lower.includes("ice cream") || lower.includes("popsicle") || lower.includes("gelato") || lower.includes("treat") || lower.includes("dessert")) {
      name = "Ice Cream / Treat";
      calories = Math.round((grams / 100) * 207);
      protein_g = 3.5;
      carbs_g = 24.0;
      fat_g = 11.0;
      cholesterol_mg = 44;
      image_key = "ice_cream_popsicle";
    } else if (lower.includes("beer") || lower.includes("wine") || lower.includes("cider") || lower.includes("alcohol")) {
      name = "Light Beer / Wine";
      calories = Math.round((grams / 100) * 85);
      protein_g = 0.5;
      carbs_g = 6.0;
      fat_g = 0.0;
      cholesterol_mg = 0;
      image_key = "light_beer_wine";
    }

    const weight_lbs = Number((grams / 453.592).toFixed(2));

    items.push({
      name,
      quantity_grams: Number(grams.toFixed(1)),
      weight_lbs,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      cholesterol_mg,
      water_oz: Number(waterOz.toFixed(1)),
      image_key,
      is_estimated: isEstimated,
    });
  }

  return items;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawText = body.text || body.rawText || body.prompt || body.input || body.query;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json({ error: "Food description text is required" }, { status: 400 });
    }

    const text = rawText.trim();
    const targetDate = body.log_date || body.date || body.selectedDate || new Date().toISOString().split("T")[0];

    // Determine current feeding/fasting window based on hour
    const currentHour = new Date().getHours();
    const defaultWindow =
      body.meal_window ||
      body.mealWindow ||
      (currentHour < 12 ? "pre_fast" : currentHour >= 18 ? "post_fast" : "unassigned");

    let parsedItems: ParsedFoodItem[] = [];
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `
You are a precise sports nutritionist and USDA database food parser.
Parse every food, snack, supplement, and beverage item mentioned in the user's text.
For each item:
1. Normalize quantity to exact quantity_grams (1 fl oz water = 29.57g, 1 oz solid food = 28.35g).
2. Calculate weight_lbs = quantity_grams / 453.592 (rounded to 2 decimal places).
3. Provide accurate USDA calories (int), protein_g (float), carbs_g (float), fat_g (float), cholesterol_mg (int), and water_oz (float, only non-zero for water/hydrating liquids).
4. Set is_estimated = false if user provided exact gram or oz measurement; set is_estimated = true if user provided a vague unit ("1 apple", "handful of chips", "half avocado").
5. Strictly map image_key to one of: ${JSON.stringify(CANONICAL_FOOD_IMAGE_KEYS)}.
Return a JSON array of parsed food objects.
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text }] }],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });

        if (response.text) {
          const rawClean = response.text.trim();
          const parsed = JSON.parse(rawClean);
          const list = Array.isArray(parsed)
            ? parsed
            : parsed.items || parsed.foods || parsed.entries || parsed.food_entries || (parsed.data && Array.isArray(parsed.data) ? parsed.data : []);

          if (Array.isArray(list) && list.length > 0) {
            parsedItems = list.map((item: any) => ({
              name: item.name || "Logged Item",
              quantity_grams: Number(item.quantity_grams) || 100,
              weight_lbs: Number((Number(item.quantity_grams || 100) / 453.592).toFixed(2)),
              calories: Math.round(Number(item.calories) || 0),
              protein_g: Number(Number(item.protein_g || 0).toFixed(1)),
              carbs_g: Number(Number(item.carbs_g || 0).toFixed(1)),
              fat_g: Number(Number(item.fat_g || 0).toFixed(1)),
              cholesterol_mg: Math.round(Number(item.cholesterol_mg) || 0),
              water_oz: Number(Number(item.water_oz || 0).toFixed(1)),
              image_key: CANONICAL_FOOD_IMAGE_KEYS.includes(item.image_key) ? item.image_key : "default_food",
              is_estimated: Boolean(item.is_estimated),
            }));
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini parse failed or rate-limited; applying USDA fallback:", geminiErr);
        parsedItems = fallbackParseNutrients(text);
      }
    } else {
      parsedItems = fallbackParseNutrients(text);
    }

    if (parsedItems.length === 0) {
      parsedItems = fallbackParseNutrients(text);
    }

    // Insert each parsed item into Postgres if available
    const insertedEntries: any[] = [];
    try {
      // Ensure daily_logs exists for targetDate
      await pgExec(
        `INSERT INTO daily_logs (log_date, calorie_target, protein_target_g, cholesterol_cap_mg, water_target_oz)
         VALUES ($1::date, 1700, 180, 255, 128)
         ON CONFLICT (log_date) DO NOTHING;`,
        targetDate
      );

      for (const item of parsedItems) {
        const rows = await pgQuery(
          `INSERT INTO food_entries (
             log_date, meal_window, raw_input, name, quantity_grams, weight_lbs,
             calories, protein_g, carbs_g, fat_g, cholesterol_mg, water_oz,
             image_key, is_estimated
           ) VALUES (
             $1::date, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
           ) RETURNING *;`,
          targetDate,
          item.meal_window || defaultWindow,
          text,
          item.name,
          item.quantity_grams,
          item.weight_lbs,
          item.calories,
          item.protein_g,
          item.carbs_g,
          item.fat_g,
          item.cholesterol_mg,
          item.water_oz,
          item.image_key,
          item.is_estimated
        );
        if (rows && rows[0]) {
          insertedEntries.push(rows[0]);
        }
      }
    } catch (dbErr) {
      console.warn("Postgres insert food_entries warning (returning parsed items anyway):", dbErr);
    }

    const finalEntries = insertedEntries.length > 0 ? insertedEntries : parsedItems;

    return NextResponse.json({
      success: true,
      log_date: targetDate,
      count: finalEntries.length,
      entries: finalEntries,
      items: finalEntries,
      inserted: insertedEntries.length > 0,
    });
  } catch (error: any) {
    console.error("Food parsing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse food" },
      { status: 500 }
    );
  }
}

