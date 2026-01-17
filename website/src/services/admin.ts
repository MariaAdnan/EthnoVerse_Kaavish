import { supabase } from "../lib/supabase";

/* ------------------ STATS ------------------ */

export async function getAdminStats() {
  const [{ count: mediaCount }, { count: communityCount }] =
    await Promise.all([
      supabase.from("media_items").select("*", { count: "exact", head: true }),
      supabase.from("communities").select("*", { count: "exact", head: true }),
    ]);

  return {
    mediaCount: mediaCount ?? 0,
    communityCount: communityCount ?? 0,
  };
}

/* ------------------ RECENT ACTIVITY ------------------ */

export async function getRecentMedia(limit = 10) {
  const { data, error } = await supabase
    .from("media_items")
    .select(`
      media_id,
      media_type,
      title,
      created_at,
      visible
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/* ------------------ DELETE ------------------ */

export async function deleteMedia(mediaId: string) {
  const { error } = await supabase
    .from("media_items")
    .delete()
    .eq("media_id", mediaId);

  if (error) throw error;
}
