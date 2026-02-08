import { supabase } from "../lib/supabase";

export async function getArchiveStats() {
  const [interviews, media, communities] = await Promise.all([
    supabase.from("interviews").select("id", { count: "exact", head: true }),
    supabase.from("visual_media").select("id", { count: "exact", head: true }),
    supabase.from("communities").select("community_id", { count: "exact", head: true }),
  ]);

  return {
    totalItems: (interviews.count ?? 0) + (media.count ?? 0),
    totalCommunities: communities.count ?? 0,
  };
}