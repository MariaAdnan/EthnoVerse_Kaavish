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

export async function createInterview(payload: {
  title: string;
  community_id: string;
  audio_cloudinary_url: string;
  date?: string | null;
  interviewer?: string | null;
  interviewee?: string | null;
  summary_text?: string | null;
  picture_cloudinary_url?: string | null;
  summary_urdu?: string | null;
  summary_sindhi?: string | null;
}) {
  const { data, error } = await supabase
    .from("interviews")
    .insert([
      {
        title: payload.title,
        community_id: payload.community_id,
        audio_cloudinary_url: payload.audio_cloudinary_url,
        date: payload.date ?? null,
        interviewer: payload.interviewer ?? null,
        interviewee: payload.interviewee ?? null,
        summary_text: payload.summary_text ?? null,
        picture_cloudinary_url: payload.picture_cloudinary_url ?? null,
        summary_urdu: payload.summary_urdu ?? null,
        summary_sindhi: payload.summary_sindhi ?? null,
      },
    ])
    .select()
    .single();

  return { data, error };
}
