import { supabase } from "../lib/supabase";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

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
  video_url: string | null;
  communities?: {
    name: string;
  };
}

export async function createJob(data: {
  community_id: string;
  video_url: string;
  object_name: string;
}) {
  const jobId = crypto.randomUUID();
  const { data: insertedJob, error } = await supabase
    .from("model_jobs")
    .insert([
      {
        id: jobId,
        community_id: data.community_id,
        video_url: data.video_url,
        object_name: data.object_name,
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