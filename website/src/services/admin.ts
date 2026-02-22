import { supabase } from "../lib/supabase";

/* ---------------- STATS ---------------- */

export async function getDashboardStats() {
  // run queries in parallel (fast)
  const [
    visualMediaRes,
    interviewsRes,
    communitiesRes,
    usersThisMonthRes,
  ] = await Promise.all([
    supabase.from("visual_media").select("*", { count: "exact", head: true }),
    supabase.from("interviews").select("*", { count: "exact", head: true }),
    supabase.from("communities").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const totalArchives =
    (visualMediaRes.count || 0) + (interviewsRes.count || 0);

  return {
    totalArchives,
    communities: communitiesRes.count || 0,
    newUsersThisMonth: usersThisMonthRes.count || 0,
  };
}
export async function getRecentActivity() {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [mediaRes, interviewsRes] = await Promise.all([
    supabase
      .from("visual_media")
      .select("id, title, created_at")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false }),

    supabase
      .from("interviews")
      .select("id, title, created_at")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false }),
  ]);

  const media =
    mediaRes.data?.map((item) => ({
      id: `MEDIA-${item.id}`,
      type: "IMAGE",
      title: item.title ?? "Untitled Media",
      date: item.created_at,
    })) || [];

  const interviews =
    interviewsRes.data?.map((item) => ({
      id: `AUDIO-${item.id}`,
      type: "AUDIO",
      title: item.title ?? "Untitled Interview",
      date: item.created_at,
    })) || [];

  return [...media, ...interviews].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
export async function deleteArchiveItem(id: string, type: string) {
  // id format: "MEDIA-12" or "AUDIO-7"
  const realId = id.split("-")[1];

  if (type === "IMAGE") {
    return await supabase
      .from("visual_media")
      .delete()
      .eq("id", Number(realId));
  }

  if (type === "AUDIO") {
    return await supabase
      .from("interviews")
      .delete()
      .eq("id", Number(realId));
  }

  return { error: "Unknown type" };
}