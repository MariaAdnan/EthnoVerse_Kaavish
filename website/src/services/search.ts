// src/services/search.ts
import { supabase } from "../lib/supabase";

export interface SearchArchiveResponse {
  interviews: SearchInterview[];
  media: SearchMedia[];
  documents: SearchDocument[];
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

export interface SearchDocument {
  id: string | number;
  title: string | null;
  description: string | null;
  author: string | null;
  created_at: string | null;
  community_id: string;
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
  const normalizedQuery = query.trim().slice(0, 100);
  const escapedQuery = escapePostgrestLike(normalizedQuery);
  if (!escapedQuery) return { interviews: [], media: [], documents: [] };
  const archiveId = normalizedQuery.match(/^(?:archive-)?0*(\d{1,10})$/i)?.[1];
  const idFilter = archiveId ? `id.eq.${Number(archiveId)},` : "";

  let interviewQuery = supabase
    .from("interviews")
    .select(`id, title, date, summary_text, community_id, communities ( name )`)
    .or(`${idFilter}title.ilike.%${escapedQuery}%,summary_text.ilike.%${escapedQuery}%`)
    .limit(100);

  if (communityId) {
    interviewQuery = interviewQuery.eq("community_id", communityId);
  }

  const { data: interviews, error: interviewError } = await interviewQuery;
  if (interviewError) throw interviewError;

  let mediaData;

  if (communityId) {
    const tagMatch = normalizedQuery.toLowerCase();

    const { data: textData, error: textError } = await supabase
      .from("visual_media")
      .select(`id, title, description, tags, community_id, communities ( name ), picture_cloudinary_url`)
      .eq("community_id", communityId)
      .or(`${idFilter}title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`)
      .limit(100);

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
    .or(`${idFilter}title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`)
    .limit(100);

  if (textError) throw textError;

  const { data: tagData, error: tagError } = await supabase
    .from("visual_media")
    .select(`id, title, description, tags, community_id, communities ( name ), picture_cloudinary_url`)
    .contains("tags", JSON.stringify([normalizedQuery.toLowerCase()]))
    .limit(100);

  if (tagError) throw tagError;

  const merged = [...(textData ?? []), ...(tagData ?? [])];
  mediaData = merged.filter(
    (item, i, arr) => arr.findIndex((candidate) => candidate.id === item.id) === i
  );
}

  let documentQuery = supabase
    .from("documents")
    .select("id, title, description, author, created_at, community_id, communities ( name )")
    .or(
      `${idFilter}title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,author.ilike.%${escapedQuery}%`,
    )
    .limit(100);
  if (communityId) documentQuery = documentQuery.eq("community_id", communityId);
  const { data: documents, error: documentError } = await documentQuery;
  if (documentError) throw documentError;

  return {
    interviews: (interviews ?? []) as SearchInterview[],
    media: (mediaData ?? []) as SearchMedia[],
    documents: (documents ?? []) as SearchDocument[],
  };
}
