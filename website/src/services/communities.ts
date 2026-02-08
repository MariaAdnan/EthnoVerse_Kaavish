// src/services/communities.ts
import { supabase } from "../lib/supabase";

export async function getAllCommunities() {
  return await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false });
}
export const getCommunityById = async (id: string) => {
  return supabase
    .from("communities")
    .select("*")
    .eq("community_id", id)
    .single();
};

export const getMediaByCommunity = async (id: string) => {
  return supabase
    .from("media_items")
    .select("*")
    .eq("community_id", id)
    .order("created_at");
};
export const createCommunity = async (data: {
  name: string;
  location: string;
  language: string;
  short_description: string;
  long_description: string;
  picture_cloudinary_url?: string | null;
}) => {
  return supabase
    .from("communities")
    .insert([data])
    .select()
    .single();
};