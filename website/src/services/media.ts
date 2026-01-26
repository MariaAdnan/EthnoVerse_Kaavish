// src/services/media.ts
import { supabase } from "../lib/supabase";

export async function getMediaByCommunity(communityId: string) {
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("community_id", communityId)
    .eq("visible", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
export async function saveMediaItem(payload: any) {
  const { data, error } = await supabase
    .from("media_items")
    .insert(payload);

  if (error) throw error;
  return data;
}

export async function getMediaById(mediaId: string) {
  const { data, error } = await supabase
    .from("media_items")
    .select(`
      *,
      communities (
        community_id,
        name,
        location
      )
    `)
    .eq("media_id", mediaId)
    .single();

  if (error) throw error;
  return data;
}

export async function createMedia(payload: {
  title: string;
  description: string;
  community_id: string;
  media_type: "image" | "audio" | "video";
  storage_url: string;
  date_captured?: string;
}) {
  return supabase
    .from("media_items") 
    .insert([payload])
    .select()
    .single();
}

export async function getMediaIndexItems(communityId?: string) {
  // let query = supabase
  const mediaQuery = supabase
    .from("media_items")
    .select(`
      media_id,
      media_type,
      title,
      date_captured,
      storage_url,
      visible
    `)
    .eq("visible", true)
    .order("created_at", { ascending: false });

  // if (communityId) {
  //   query = query.eq("community_id", communityId);
  // }
  
  if (communityId) mediaQuery.eq("community_id", communityId);

  const { data: mediaData, error: mediaError } = await mediaQuery;

const interviewQuery = supabase
    .from("interviews")
    .select("id, title, date, community_id");

  if (communityId) interviewQuery.eq("community_id", communityId);

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
