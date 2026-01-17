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
