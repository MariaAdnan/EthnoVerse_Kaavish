import { supabase } from "../lib/supabase";
import { withTimeout } from "../lib/async";

export const adminLogin = async (email: string, password: string) => {
  try {
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      12_000,
      "The authentication service did not respond. Please try again.",
    );

    if (authError) return { error: "Invalid email or password" };

    const userId = authData.user?.id;
    if (!userId) return { error: "Authentication did not return a user account" };

    const { data: user, error: roleError } = await withTimeout(
      supabase.from("users").select("role").eq("user_id", userId).single(),
      8_000,
      "Administrator verification did not respond. Please try again.",
    );

    if (roleError || !user) {
      await supabase.auth.signOut();
      return { error: "User record not found" };
    }

    if (user.role !== "admin") {
      await supabase.auth.signOut();
      return { error: "Access denied: Admins only" };
    }

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Sign-in failed. Please try again.",
    };
  }
};

export async function adminLogout() {
  const { error } = await withTimeout(
    supabase.auth.signOut(),
    8_000,
    "The authentication service did not respond. Please try again.",
  );
  if (error) throw error;
};
