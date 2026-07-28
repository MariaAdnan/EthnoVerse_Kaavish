import { supabase } from "../lib/supabase";
import {
  requireHttpUrl,
  requireText,
  requireUuid,
} from "../lib/validation";

export type JobStatus = "queued" | "processing" | "done" | "failed";

export interface ModelJob {
  id: string;
  media_id: string | null;
  object_name: string;
  status: JobStatus;
  progress: number;
  message: string | null;
  model_url: string | null;
  created_at: string;
  community_id: string | null;
  video_url?: string | null;
  images_zip_url?: string | null;
  communities?: {
    name: string;
  };
}

export async function createJob(data: {
  community_id: string;
  images_zip_url: string;
  object_name: string;
}) {
  const jobId = crypto.randomUUID();
  const communityId = requireUuid(data.community_id, "Community");
  const imagesZipUrl = requireHttpUrl(data.images_zip_url, "Image ZIP URL");
  const objectName = requireText(data.object_name, "Object name", 80);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(objectName)) {
    throw new Error("Object name may contain letters, numbers, hyphens, and underscores.");
  }
  const { data: insertedJob, error } = await supabase
    .from("model_jobs")
    .insert([
      {
        id: jobId,
        community_id: communityId,
        images_zip_url: imagesZipUrl,
        object_name: objectName,
        status: "queued",
        progress: 0,
        message: "Job queued...",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return insertedJob as ModelJob;
}

export async function getJobs() {
  const { data, error } = await supabase
    .from("model_jobs")
    .select("*, communities(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data as ModelJob[];
}

export async function getJobsByUser(communityId: string) {
  const { data, error } = await supabase
    .from("model_jobs")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ModelJob[];
}

export async function getJobById(jobId: string) {
  const { data, error } = await supabase
    .from("model_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) throw error;
  return data as ModelJob;
}

export async function subscribeToJobUpdates(
  jobId: string,
  callback: (job: ModelJob) => void
) {
  const channel = supabase
    .channel(`job-${jobId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "model_jobs",
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as ModelJob);
        }
      }
    );

  await channel.subscribe();
  return channel;
}
