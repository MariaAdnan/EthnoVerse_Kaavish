import { supabase } from "../lib/supabase";

export async function logActivity(
  actorId: string,
  actionType: string,
  targetId?: string
) {
  return supabase.from("audit_log").insert([
    {
      actor_id: actorId,
      action_type: actionType,
      target_id: targetId ?? null,
    },
  ]);
}

