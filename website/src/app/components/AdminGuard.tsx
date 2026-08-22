import { useEffect, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { withTimeout } from "../../lib/async";

interface AdminGuardProps {
  children: ReactNode;
  onNavigate: (view: string) => void;
}

type AccessState = "checking" | "allowed" | "denied" | "error";

export function AdminGuard({ children, onNavigate }: AdminGuardProps) {
  const [access, setAccess] = useState<AccessState>("checking");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function checkAdminAccess() {
      if (!isSupabaseConfigured) {
        if (active) setAccess("denied");
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          8_000,
          "Authentication service did not respond.",
        );
        if (sessionError) throw sessionError;
        const userId = sessionData.session?.user.id;

        if (!userId) {
          if (active) setAccess("denied");
          return;
        }

        const { data: profile, error } = await withTimeout(
          supabase
            .from("users")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle(),
          8_000,
          "Administrator verification did not respond.",
        );

        if (active) {
          setAccess(!error && profile?.role === "admin" ? "allowed" : "denied");
        }
      } catch (error) {
        console.error("Administrator access check failed:", error);
        if (active) setAccess("error");
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
  }, [retryCount]);

  if (access === "allowed") return children;

  return (
    <section className="min-h-[75vh] bg-paper px-6 py-24 text-ink">
      <div className="mx-auto max-w-xl border-2 border-ink p-8 text-center">
        <p
          className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {access === "checking"
            ? "Checking access"
            : access === "error"
              ? "Service unavailable"
              : "Restricted area"}
        </p>
        <h1
          className="mb-4 text-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {access === "checking"
            ? "Please wait…"
            : access === "error"
              ? "Could not verify access"
              : "Admin sign-in required"}
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
        {access === "error" && (
          <>
            <p className="mb-8 text-sm text-muted-foreground">
              The archive could not reach its authentication service. Your access has not been changed.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setAccess("checking");
                  setRetryCount((value) => value + 1);
                }}
                className="bg-ink px-6 py-3 text-sm text-paper hover:bg-accent hover:text-ink"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                RETRY
              </button>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="border border-ink px-6 py-3 text-sm text-ink hover:bg-ink hover:text-paper"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                RETURN HOME
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
