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
      audio,
      date,
      summary_html,
      picture,
      community_id,
      communities (
        name
      )
    `)
    .eq("id", id)
    .single();
};

export const getRecentInterviews = async (limit: number = 3) => {
  return await supabase
    .from("interviews")
    .select(`id,
      title,
      interviewee,
      audio,
      date,
      summary_html,
      picture,
      community_id,
      communities (
        name
      )`)
    .order("date", { ascending: true })
    .limit(limit);
};