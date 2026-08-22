// src/app/components/ThreeDTourViewer.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { BUILT_IN_TOUR_COMMUNITY_ID } from "../../config/archive";
import { withTimeout } from "../../lib/async";

interface ThreeDTourViewerProps {
  onNavigate: (view: string) => void;
  isAdmin?: boolean;
  view?: string;
}

export function ThreeDTourViewer({ onNavigate, isAdmin = false, view }: ThreeDTourViewerProps) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const buildTourUrl = useCallback((communityId: string, terrain?: string) => {
    const params = new URLSearchParams({
      community: communityId,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey:
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
        import.meta.env.VITE_SUPABASE_ANON_KEY,
      cloudinaryFunction:
        import.meta.env.VITE_CLOUDINARY_ADMIN_FUNCTION ?? "cloudinary-admin",
    });

    if (isAdmin) params.set("mode", "admin");
    if (terrain) params.set("terrain", terrain);

    return `/3d-tour/index.html?${params.toString()}`;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const sendAdminToken = async (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.type !== "ethnoverse:request-admin-token"
      ) {
        return;
      }

      const { data } = await withTimeout(supabase.auth.getSession(), 8_000);
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "ethnoverse:admin-token",
          requestId: event.data.requestId,
          accessToken: data.session?.access_token ?? null,
        },
        event.origin,
      );
    };

    window.addEventListener("message", sendAdminToken);
    return () => window.removeEventListener("message", sendAdminToken);
  }, [isAdmin]);

  useEffect(() => {
    const communityId =
      view?.split(':')[1] || BUILT_IN_TOUR_COMMUNITY_ID;
    const isBuiltInTour = communityId === BUILT_IN_TOUR_COMMUNITY_ID;

    if (isBuiltInTour) {
      setIframeSrc(buildTourUrl(BUILT_IN_TOUR_COMMUNITY_ID));
      return;
    }

    // New community: fetch terrain_type from DB
    void withTimeout(
      supabase
        .from("communities")
        .select("terrain_type")
        .eq("community_id", communityId)
        .single(),
      8_000,
    )
      .then(({ data }) => {
        setIframeSrc(buildTourUrl(communityId, data?.terrain_type || "grass"));
      })
      .catch(() => {
        setIframeSrc(buildTourUrl(communityId, "grass"));
      });
  }, [view, buildTourUrl]);

  const returnRoute = isAdmin
    ? "admin"
    : `community:${view?.split(":")[1] || BUILT_IN_TOUR_COMMUNITY_ID}`;

  return (
    <div className="min-h-screen bg-black relative">
      {iframeSrc && (
        <iframe
          title={isAdmin ? "EthnoVerse 3D tour editor" : "EthnoVerse 3D tour"}
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-screen border-none"
          allow="fullscreen"
        />
      )}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sm:bottom-auto sm:left-6 sm:top-6 sm:translate-x-0">
        <button
          onClick={() => onNavigate(returnRoute)}
          className="whitespace-nowrap text-white bg-black/75 px-4 py-2 border border-white/50 hover:bg-black"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          ← EXIT VIRTUAL SPACE
        </button>
      </div>
    </div>
  );
}
