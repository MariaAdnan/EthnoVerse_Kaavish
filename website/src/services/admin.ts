import { supabase } from "../lib/supabase";
import { withTimeout } from "../lib/async";

export interface RecentActivity {
  id: string;
  type: "IMAGE" | "AUDIO" | "DOCUMENT";
  title: string;
  date: string;
}

/* ---------------- STATS ---------------- */

export async function getDashboardStats() {
  // run queries in parallel (fast)
  const [
    visualMediaRes,
    interviewsRes,
    communitiesRes,
    accountsThisMonthRes,
    documentsRes,
  ] = await Promise.all([
    supabase.from("visual_media").select("id", { count: "exact", head: true }),
    supabase.from("interviews").select("id", { count: "exact", head: true }),
    supabase.from("communities").select("community_id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("documents").select("id", { count: "exact", head: true }),
  ]);

  const queryError = [
    visualMediaRes,
    interviewsRes,
    communitiesRes,
    accountsThisMonthRes,
    documentsRes,
  ].find((result) => result.error)?.error;
  if (queryError) throw queryError;

  const totalArchives =
    (visualMediaRes.count || 0) +
    (interviewsRes.count || 0) +
    (documentsRes.count || 0);

  return {
    totalArchives,
    communities: communitiesRes.count || 0,
    newAccountsThisMonth: accountsThisMonthRes.count || 0,
  };
}
export async function getRecentActivity(): Promise<RecentActivity[]> {
  const [mediaRes, interviewsRes, documentsRes] = await Promise.all([
    supabase
      .from("visual_media")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(10),

    supabase
      .from("interviews")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(10),

    supabase
      .from("documents")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const queryError = [mediaRes, interviewsRes, documentsRes].find(
    (result) => result.error,
  )?.error;
  if (queryError) throw queryError;

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

  const documents =
    documentsRes.data?.map((item) => ({
      id: `DOCUMENT-${item.id}`,
      type: "DOCUMENT",
      title: item.title ?? "Untitled Document",
      date: item.created_at,
    })) || [];

  return ([...media, ...interviews, ...documents] as RecentActivity[]).sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
export async function deleteArchiveItem(id: string, type: RecentActivity["type"]) {
  // id format: "MEDIA-12", "AUDIO-7", or "DOCUMENT-4"
  const realId = id.slice(id.indexOf("-") + 1);
  if (!/^\d+$/.test(realId)) return { error: new Error("Invalid archive item ID") };
  const functionName =
    import.meta.env.VITE_CLOUDINARY_ADMIN_FUNCTION?.trim() || "cloudinary-admin";
  const { data, error } = await withTimeout(
    supabase.functions.invoke<{
      result?: string;
      cleanupWarning?: boolean;
    }>(functionName, {
      body: { action: "delete-archive-item", archiveType: type, itemId: realId },
    }),
    15_000,
    "Archive deletion timed out.",
  );
  return { data, error };
}
