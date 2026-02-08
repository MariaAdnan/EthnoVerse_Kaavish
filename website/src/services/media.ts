// src/services/media.ts
import { supabase } from "../lib/supabase";

export async function getMediaByCommunity(communityId: string) {
const { data, error } = await supabase
    .from("visual_media")
    .select(`
      id,
      title,
      description,
      picture_cloudinary_url,
      tags,
      created_at,
      communities ( community_id, name, location )
    `)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function saveMediaItem(payload: any) {
  const { data, error } = await supabase
    .from("visual_media")
    .insert(payload);

  if (error) throw error;
  return data;
}

export async function getMediaById(id: string | number) {
  const { data, error } = await supabase
    .from("visual_media")
    .select(`
      *,
      communities ( community_id, name, location )
    `)
    .eq("id", Number(id)) // 👈 force bigint match
    .single();

  if (error) throw error;
  return data;
}


export async function createMedia(payload: {
  title: string;
  description: string;
  community_id: string;
  picture_cloudinary_url: string;
  tags?: any;
}) {
  return supabase
    .from("visual_media")
    .insert([payload])
    .select()
    .single();
}

export async function getMediaIndexItems(communityId?: string) {
  let mediaQuery = supabase
    .from("visual_media")
    .select("id, title, created_at, community_id")
    .order("created_at", { ascending: false });

  // ⭐ filter ONLY if communityId exists
  if (communityId && communityId !== "ALL") {
    mediaQuery = mediaQuery.eq("community_id", communityId);
  }

  const { data: mediaData, error: mediaError } = await mediaQuery;

  let interviewQuery = supabase
    .from("interviews")
    .select("id, title, date, community_id")
    .order("date", { ascending: false });

  if (communityId && communityId !== "ALL") {
    interviewQuery = interviewQuery.eq("community_id", communityId);
  }

  const { data: interviewData, error: interviewError } =
    await interviewQuery;

  return {
    data: {
      media: mediaData || [],
      interviews: interviewData || [],
    },
    error: mediaError || interviewError,
  };
}
