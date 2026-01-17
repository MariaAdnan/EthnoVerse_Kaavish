import { supabase } from "../lib/supabase";

export async function getTranscriptByMediaId(mediaId: string) {
  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .eq("media_id", mediaId)
    .single();

  if (error) throw error;
  return data;
}
