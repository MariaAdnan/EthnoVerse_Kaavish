// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey =
  (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const REQUEST_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const upstreamSignal = init.signal;
  const forwardAbort = () => controller.abort(upstreamSignal?.reason);
  if (upstreamSignal?.aborted) forwardAbort();
  else upstreamSignal?.addEventListener("abort", forwardAbort, { once: true });
  const timeout = window.setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
    upstreamSignal?.removeEventListener("abort", forwardAbort);
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "missing-local-publishable-key",
  { global: { fetch: fetchWithTimeout } },
);

// One lightweight read to tell whether the archive database is answering. Free
// Supabase projects pause after a week without activity (a scheduled GitHub
// Action keeps it awake); this lets the site explain an outage instead of
// showing empty pages.
export async function isArchiveReachable(): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from("communities").select("community_id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
