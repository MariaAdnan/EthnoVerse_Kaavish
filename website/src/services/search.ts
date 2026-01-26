import { supabase } from "../lib/supabase";

export interface SearchArchiveResponse {
  interviews: any[];
  media: any[];
}

export async function searchArchive(
  query: string
): Promise<SearchArchiveResponse> {
  if (!query) {
    return { interviews: [], media: [] }; // ✅ NOT []
  }

  const { data: interviews } = await supabase
    .from("interviews")
    .select(`
      id,
      title,
      date,
      tags,
      summary_text,
      community_id,
      communities ( name )
    `)
    .or(`title.ilike.%${query}%,tags.ilike.%${query}%,summary_text.ilike.%${query}%`);

  const { data: media } = await supabase
    .from("media_items")
    .select(`
      media_id,
      title,
      media_type,
      tags,
      date_captured,
      community_id,
      communities ( name )
    `)
    .eq("visible", true)
    .or(`title.ilike.%${query}%,tags.ilike.%${query}%`);

  return {
    interviews: interviews ?? [],
    media: media ?? [],
  };
}
