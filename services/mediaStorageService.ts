import { createClient } from "@supabase/supabase-js";

/**
 * Uploads an event media file to the `circadian-media` Supabase Storage bucket
 * when environment credentials are configured; returns null if unavailable.
 */
export async function uploadCircadianMediaFile(file: File): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `events/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from("circadian-media")
      .upload(objectPath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      return null;
    }

    const { data } = supabase.storage
      .from("circadian-media")
      .getPublicUrl(objectPath);

    return data?.publicUrl || null;
  } catch {
    return null;
  }
}
