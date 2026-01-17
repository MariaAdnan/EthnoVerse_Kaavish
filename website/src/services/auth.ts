import { supabase } from "../lib/supabase";

export const adminLogin = async (email: string, password: string) => {
  // 1. Supabase Auth login
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    return { error: "Invalid email or password" };
  }

  const userId = authData.user?.id;

  // 2. Check role from users table
  const { data: user, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (roleError || !user) {
    return { error: "User record not found" };
  }

  if (user.role !== "admin") {
    return { error: "Access denied: Admins only" };
  }

  // ✅ success
  return { success: true };
};
