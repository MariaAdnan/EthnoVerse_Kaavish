// src/services/communities.ts
import { supabase } from "../lib/supabase";
import {
  requireHttpUrl,
  requireText,
  requireUuid,
} from "../lib/validation";

export async function getAllCommunities() {
  return await supabase
    .from("communities")
    .select("community_id, name, location, language, short_description, long_description, picture_cloudinary_url, terrain_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
}
export const getCommunityById = async (id: string) => {
  const communityId = requireUuid(id, "Community");
  return supabase
    .from("communities")
    .select("community_id, name, location, language, short_description, long_description, picture_cloudinary_url, terrain_type, created_at")
    .eq("community_id", communityId)
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
  const validated = {
    name: requireText(data.name, "Name", 120),
    location: requireText(data.location, "Location", 180),
    language: requireText(data.language, "Language", 120),
    short_description: requireText(data.short_description, "Short description", 150),
    long_description: requireText(data.long_description, "Long description", 10_000),
    picture_cloudinary_url: data.picture_cloudinary_url
      ? requireHttpUrl(data.picture_cloudinary_url, "Cover image URL")
      : null,
  };

  return supabase
    .from("communities")
    .insert([validated])
    .select()
    .single();
};
export async function updateCommunityTerrain(communityId: string, terrainType: string) {
  const validatedCommunityId = requireUuid(communityId, "Community");
  const validatedTerrain = requireText(terrainType, "Terrain", 40);
  if (!["grass", "rocky", "mountains", "custom"].includes(validatedTerrain)) {
    throw new Error("Terrain is not supported.");
  }
  return await supabase
    .from("communities")
    .update({ terrain_type: validatedTerrain })
    .eq("community_id", validatedCommunityId);
}
