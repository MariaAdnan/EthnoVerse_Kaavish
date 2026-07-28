// src/services/media.ts
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

export async function getMediaByCommunity(communityId: string) {
  const { data, error } = await supabase
    .from("visual_media")
    .select(`
      id, title, description, picture_cloudinary_url, tags, created_at,
      communities ( community_id, name, location )
    `)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMediaById(id: string | number) {
  const { data, error } = await supabase
    .from("visual_media")
    .select(`*, communities ( community_id, name, location )`)
    .eq("id", Number(id))
    .single();
  if (error) throw error;
  return data;
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

export async function getMediaIndexItems(communityId?: string) {
  let mediaQuery = supabase
    .from("visual_media")
    .select("id, title, created_at, community_id, picture_cloudinary_url, tags")
    .order("created_at", { ascending: false });

  if (communityId && communityId !== "ALL") {
    mediaQuery = mediaQuery.eq("community_id", communityId);
  }

  const { data: mediaData, error: mediaError } = await mediaQuery;

  let interviewQuery = supabase
    .from("interviews")
    .select("id, title, date, community_id, summary_text")
    .order("date", { ascending: false });

  if (communityId && communityId !== "ALL") {
    interviewQuery = interviewQuery.eq("community_id", communityId);
  }

  const { data: interviewData, error: interviewError } = await interviewQuery;

  let docQuery = supabase
    .from("documents")
    .select("id, title, created_at, community_id")
    .order("created_at", { ascending: false });

  if (communityId && communityId !== "ALL") {
    docQuery = docQuery.eq("community_id", communityId);
  }

  const { data: docData } = await docQuery;

  return {
    data: {
      media: (mediaData || []) as MediaIndexImage[],
      interviews: (interviewData || []) as MediaIndexInterview[],
      documents: (docData || []) as MediaIndexDocument[],
    },
    error: mediaError || interviewError,
  };
}

export type AdminMediaItem = {
  id: string;
  media_type: "image" | "audio";
  title: string;
  created_at: string;
  visible: boolean;
};
