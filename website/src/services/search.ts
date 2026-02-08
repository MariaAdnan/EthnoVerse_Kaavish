import { supabase } from "../lib/supabase";

export interface SearchArchiveResponse {
  interviews: any[];
  media: any[];
}

export async function searchArchive(
  query: string
): Promise<SearchArchiveResponse> {
  if (!query) return { interviews: [], media: [] };

  /* -------- INTERVIEWS SEARCH -------- */
  const { data: interviews, error: interviewError } = await supabase
    .from("interviews")
    .select(`
  id,
  title,
  date,
  summary_text,
  community_id,
  communities ( name )
`)
    .or(
  `title.ilike.%${query}%,summary_text.ilike.%${query}%`
);

  if (interviewError) console.error("Interview search error:", interviewError);

  /* -------- MEDIA SEARCH -------- */
const { data: media, error: mediaError } = await supabase
  .rpc("search_media", { search_text: query });

  if (mediaError) console.error("Media search error:", mediaError);

  return {
    interviews: interviews ?? [],
    media: media ?? [],
  };
}
