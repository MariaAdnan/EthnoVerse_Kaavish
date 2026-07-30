import { useEffect, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

interface AdminGuardProps {
  children: ReactNode;
  onNavigate: (view: string) => void;
}

type AccessState = "checking" | "allowed" | "denied";

export function AdminGuard({ children, onNavigate }: AdminGuardProps) {
  const [access, setAccess] = useState<AccessState>("checking");

  useEffect(() => {
    let active = true;

    async function checkAdminAccess() {
      if (!isSupabaseConfigured) {
        if (active) setAccess("denied");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        if (active) setAccess("denied");
        return;
      }

      const { data: profile, error } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (active) {
        setAccess(!error && profile?.role === "admin" ? "allowed" : "denied");
      }
    }

    void checkAdminAccess();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (active) {
        setAccess("checking");
        void checkAdminAccess();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (access === "allowed") return children;

  return (
    <section className="min-h-[75vh] bg-paper px-6 py-24 text-ink">
      <div className="mx-auto max-w-xl border-2 border-ink p-8 text-center">
        <p
          className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {access === "checking" ? "Checking access" : "Restricted area"}
        </p>
        <h1
          className="mb-4 text-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {access === "checking" ? "Please wait…" : "Admin sign-in required"}
        </h1>
        {access === "denied" && (
          <>
            <p className="mb-8 text-sm text-muted-foreground">
              This page is available only to verified archive administrators.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("admin-login")}
              className="bg-ink px-6 py-3 text-sm text-paper transition-colors hover:bg-accent"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              GO TO ADMIN LOGIN
            </button>
          </>
        )}
      </div>
    </section>
  );
}
