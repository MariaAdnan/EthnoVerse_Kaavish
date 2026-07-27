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

export const createCommunity = async (data: {
  name: string;
  location: string;
  language: string;
  short_description: string;
  long_description: string;
  picture_cloudinary_url?: string | null;
}) => {
  if (!data.name.trim() || !data.location.trim() || !data.language.trim()) {
    throw new Error("Name, location, and language are required.");
  }

  return supabase
    .from("communities")
    .insert([data])
    .select()
    .single();
};
export async function updateCommunityTerrain(communityId: string, terrainType: string) {
  return await supabase
    .from("communities")
    .update({ terrain_type: terrainType })
    .eq("community_id", communityId);
}
