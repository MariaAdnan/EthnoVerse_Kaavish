// src/services/search.ts
import { supabase } from "../lib/supabase";

export interface SearchArchiveResponse {
  interviews: SearchInterview[];
  media: SearchMedia[];
}

export interface SearchInterview {
  id: string | number;
  title: string | null;
  date: string | null;
  summary_text: string | null;
  community_id: string;
  communities: { name: string }[] | { name: string } | null;
}

export interface SearchMedia {
  id: string | number;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  community_id: string;
  picture_cloudinary_url: string | null;
  communities: { name: string }[] | { name: string } | null;
}

// `.or()` receives a PostgREST filter expression, not a parameterized value.
// Escape its grammar and SQL-like wildcard characters before interpolation.
function escapePostgrestLike(value: string) {
  return value.replace(/[\\%_(),."]/g, "\\$&");
}

export async function searchArchive(
  query: string,
  communityId?: string
): Promise<SearchArchiveResponse> {
  const escapedQuery = escapePostgrestLike(query.trim());
  if (!escapedQuery) return { interviews: [], media: [] };

  let interviewQuery = supabase
    .from("interviews")
    .select(`id, title, date, summary_text, community_id, communities ( name )`)
    .or(`title.ilike.%${escapedQuery}%,summary_text.ilike.%${escapedQuery}%`);

  if (communityId) {
    interviewQuery = interviewQuery.eq("community_id", communityId);
  }

  const { data: interviews, error: interviewError } = await interviewQuery;
  if (interviewError) throw interviewError;

  let mediaData;

  if (communityId) {
    const tagMatch = query.toLowerCase();

    const { data: textData, error: textError } = await supabase
      .from("visual_media")
      .select(`id, title, description, tags, community_id, communities ( name ), picture_cloudinary_url`)
      .eq("community_id", communityId)
      .or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);

    if (textError) throw textError;

    const { data: tagData } = await supabase
  .rpc("search_media_tags", { community: communityId, search: tagMatch });

    const merged = [...(textData ?? []), ...(tagData ?? [])];
    mediaData = merged.filter(
      (item, i, arr) => arr.findIndex((candidate) => candidate.id === item.id) === i,
    );
  } else {
  const { data: textData, error: textError } = await supabase
    .from("visual_media")
    .select(`id, title, description, tags, community_id, communities ( name ), picture_cloudinary_url`)
    .or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);

  if (textError) throw textError;

  const { data: tagData, error: tagError } = await supabase
    .from("visual_media")
    .select(`id, title, description, tags, community_id, communities ( name ), picture_cloudinary_url`)
    .contains("tags", JSON.stringify([query.toLowerCase()]));

  if (tagError) throw tagError;

  const merged = [...(textData ?? []), ...(tagData ?? [])];
  mediaData = merged.filter(
    (item, i, arr) => arr.findIndex((candidate) => candidate.id === item.id) === i
  );
}

  return {
    interviews: (interviews ?? []) as SearchInterview[],
    media: (mediaData ?? []) as SearchMedia[],
  };
}
