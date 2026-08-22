import { supabase } from "../lib/supabase";
import {
  normalizeTags,
  optionalText,
  requireHttpUrl,
  requireText,
  requireUuid,
} from "../lib/validation";

export interface MediaIndexImage {
  id: number | string;
  title: string | null;
  created_at: string;
  community_id: string;
  picture_cloudinary_url: string | null;
  tags: string[] | null;
}

export interface MediaIndexInterview {
  id: number | string;
  title: string | null;
  date: string | null;
  community_id: string;
  summary_text: string | null;
}

export interface MediaIndexDocument {
  id: number | string;
  title: string | null;
  created_at: string;
  community_id: string;
}

export interface MediaDetail {
  id: number;
  title: string;
  description: string | null;
  picture_cloudinary_url: string;
  tags: string[] | null;
  created_at: string;
  communities: {
    community_id: string;
    name: string;
    location: string;
  } | null;
}

export async function getMediaById(id: string | number): Promise<MediaDetail> {
  const { data, error } = await supabase
    .from("visual_media")
    .select(`id, title, description, picture_cloudinary_url, tags, created_at, community_id, communities ( community_id, name, location )`)
    .eq("id", Number(id))
    .single();
  if (error) throw error;
  if (!data) throw new Error("Media item not found.");
  const relation = Array.isArray(data.communities)
    ? data.communities[0]
    : data.communities;
  return {
    id: Number(data.id),
    title: String(data.title ?? "Untitled Image"),
    description: data.description == null ? null : String(data.description),
    picture_cloudinary_url: String(data.picture_cloudinary_url ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : null,
    created_at: String(data.created_at),
    communities: relation
      ? {
          community_id: String(relation.community_id),
          name: String(relation.name),
          location: String(relation.location),
        }
      : null,
  };
}

export async function createMedia(payload: {
  title: string;
  description?: string | null;
  community_id: string;
  picture_cloudinary_url: string;
  tags?: string[] | null;
}) {
  const validated = {
    title: requireText(payload.title, "Title", 200),
    description: optionalText(payload.description, "Description", 5_000),
    community_id: requireUuid(payload.community_id, "Community"),
    picture_cloudinary_url: requireHttpUrl(
      payload.picture_cloudinary_url,
      "Image URL",
    ),
    tags: normalizeTags(payload.tags),
  };
  const { data, error } = await supabase
    .from("visual_media")
    .insert([validated])
    .select()
    .single();
  return { data, error };
}

export async function getMediaIndexItems(
  communityId?: string,
  offset = 0,
  pageSize = 50,
) {
  const scopedCommunityId =
    communityId && communityId !== "ALL"
      ? requireUuid(communityId, "Community")
      : undefined;
  const lastRow = offset + pageSize - 1;
  let mediaQuery = supabase
    .from("visual_media")
    .select("id, title, created_at, community_id, picture_cloudinary_url, tags")
    .order("created_at", { ascending: false })
    .range(offset, lastRow);

  if (scopedCommunityId) {
    mediaQuery = mediaQuery.eq("community_id", scopedCommunityId);
  }

  let interviewQuery = supabase
    .from("interviews")
    .select("id, title, date, community_id, summary_text")
    .order("date", { ascending: false })
    .range(offset, lastRow);

  if (scopedCommunityId) {
    interviewQuery = interviewQuery.eq("community_id", scopedCommunityId);
  }

  let docQuery = supabase
    .from("documents")
    .select("id, title, created_at, community_id")
    .order("created_at", { ascending: false })
    .range(offset, lastRow);

  if (scopedCommunityId) {
    docQuery = docQuery.eq("community_id", scopedCommunityId);
  }

  const [mediaResult, interviewResult, documentResult] = await Promise.all([
    mediaQuery,
    interviewQuery,
    docQuery,
  ]);

  const mediaData = mediaResult.data || [];
  const interviewData = interviewResult.data || [];
  const docData = documentResult.data || [];

  return {
    data: {
      media: mediaData as MediaIndexImage[],
      interviews: interviewData as MediaIndexInterview[],
      documents: docData as MediaIndexDocument[],
    },
    hasMore:
      mediaData.length === pageSize ||
      interviewData.length === pageSize ||
      docData.length === pageSize,
    error: mediaResult.error || interviewResult.error || documentResult.error,
  };
}
