// src/services/interviews.ts
import { supabase } from "../lib/supabase";

export function getInterviewsByCommunity(communityId: string) {
  return supabase
    .from("interviews")
    .select("*")
    .eq("community_id", communityId)
    .order("date", { ascending: false });
}
export const getInterviewById = async (id: string) => {
  return await supabase
    .from("interviews")
    .select(`
      id,
      title,
      interviewee,
      interviewer,
      audio_cloudinary_url,
      date,
      summary_html,
      summary_text,
      summary_urdu,
      summary_sindhi,
      picture_cloudinary_url,
      communities (
        name,
        language
      )
    `)
    .eq("id", id)
    .single();
};

export const getRecentInterviews = async (limit: number = 3) => {
  return await supabase
    .from("interviews")
    .select(`
      id,
      title,
      interviewee,
      interviewer,
      audio_cloudinary_url,
      date,
      summary_html,
      summary_text,
      summary_urdu,
      summary_sindhi,
      picture_cloudinary_url,
      communities (
        name,
        language
      )
    `)
    .order("date", { ascending: false })
    .limit(limit);
};
