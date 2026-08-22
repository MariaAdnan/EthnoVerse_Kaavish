// src/services/interviews.ts
import { supabase } from "../lib/supabase";
import {
  optionalText,
  requireHttpUrl,
  requireText,
  requireUuid,
} from "../lib/validation";

export async function getInterviewsByCommunity(communityId: string) {
  const validatedCommunityId = requireUuid(communityId, "Community");
  return await supabase
    .from("interviews")
    .select("id, title, interviewee, interviewer, date, picture_cloudinary_url, summary_text")
    .eq("community_id", validatedCommunityId)
    .order("date", { ascending: false })
    .limit(100);
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
  const validated = {
    title: requireText(payload.title, "Title", 200),
    community_id: requireUuid(payload.community_id, "Community"),
    audio_cloudinary_url: requireHttpUrl(payload.audio_cloudinary_url, "Audio URL"),
    date: payload.date || null,
    interviewer: optionalText(payload.interviewer, "Interviewer", 200),
    interviewee: optionalText(payload.interviewee, "Interviewee", 200),
    summary_text: optionalText(payload.summary_text, "English summary", 10_000),
    picture_cloudinary_url: payload.picture_cloudinary_url
      ? requireHttpUrl(payload.picture_cloudinary_url, "Interview image URL")
      : null,
    summary_urdu: optionalText(payload.summary_urdu, "Urdu summary", 10_000),
    summary_sindhi: optionalText(payload.summary_sindhi, "Sindhi summary", 10_000),
  };
  const { data, error } = await supabase
    .from("interviews")
    .insert([validated])
    .select()
    .single();

  return { data, error };
}
