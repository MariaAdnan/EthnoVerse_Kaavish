// src/app/components/ThreeDTourViewer.tsx
import { motion } from "motion/react";
import { Move, RotateCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

interface ThreeDTourViewerProps {
  onNavigate: (view: string) => void;
  isAdmin?: boolean;
  view?: string;
}

const KOLHI_ID = '2c0e586a-3685-4135-8107-b442cdd22d73';

export function ThreeDTourViewer({ onNavigate, isAdmin = false, view }: ThreeDTourViewerProps) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const buildTourUrl = (communityId: string, terrain?: string) => {
    const params = new URLSearchParams({
      community: communityId,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    });

    if (isAdmin) params.set("mode", "admin");
    if (terrain) params.set("terrain", terrain);

    return `/3d-tour/index.html?${params.toString()}`;
  };

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

      const { data } = await supabase.auth.getSession();
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
    // Extract communityId from "admin-3d-tour:uuid" or fall back to Kolhi
    const communityId = view?.split(':')[1] || KOLHI_ID;
    const isKolhi = communityId === KOLHI_ID;

    if (isKolhi) {
      // Kolhi tour: hardcoded, no terrain param needed
      setIframeSrc(buildTourUrl(KOLHI_ID));
      return;
    }

    // New community: fetch terrain_type from DB
    supabase
      .from("communities")
      .select("terrain_type")
      .eq("community_id", communityId)
      .single()
      .then(({ data }) => {
        const terrain = data?.terrain_type || 'grass';
        setIframeSrc(buildTourUrl(communityId, terrain));
      });
  }, [view, isAdmin]);

  return (
    <div className="min-h-screen bg-black relative">
      {iframeSrc && (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-screen border-none"
          allow="fullscreen"
        />
      )}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => onNavigate("back")}
          className="text-white bg-black/60 px-4 py-2 border border-white/30 hover:bg-black"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          ← EXIT VIRTUAL SPACE
        </button>
      </div>
    </div>
  );
}
