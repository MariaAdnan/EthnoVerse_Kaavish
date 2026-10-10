// src/app/components/ArchiveStatusNotice.tsx
import { useEffect, useState } from "react";
import { isArchiveReachable } from "../../lib/supabase";

export function ArchiveStatusNotice() {
  const [unreachable, setUnreachable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isArchiveReachable().then((reachable) => {
      if (!cancelled) setUnreachable(!reachable);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!unreachable || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-xl border border-ink bg-paper p-4 shadow-lg sm:p-5"
    >
      <p className="mb-1 text-sm font-semibold text-ink">The archive isn&apos;t responding right now</p>
      <p className="mb-4 text-sm text-ink/80">
        Its database may be waking up after a quiet period. Please try again in a few
        minutes; the 3D tour&apos;s village still loads in the meantime.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-ink px-4 py-2 text-xs tracking-wide text-paper hover:bg-accent"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          TRY AGAIN
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="border border-ink/30 px-4 py-2 text-xs tracking-wide text-ink hover:border-ink"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          DISMISS
        </button>
      </div>
    </div>
  );
}
