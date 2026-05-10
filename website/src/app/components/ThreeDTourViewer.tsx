// src/app/components/ThreeDTourViewer.tsx
import { motion } from "motion/react";
import { Move, RotateCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface ThreeDTourViewerProps {
  onNavigate: (view: string) => void;
  isAdmin?: boolean;
  view?: string;
}

const KOLHI_ID = '2c0e586a-3685-4135-8107-b442cdd22d73';

export function ThreeDTourViewer({ onNavigate, isAdmin = false, view }: ThreeDTourViewerProps) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  useEffect(() => {
    // Extract communityId from "admin-3d-tour:uuid" or fall back to Kolhi
    const communityId = view?.split(':')[1] || KOLHI_ID;
    const isKolhi = communityId === KOLHI_ID;

    if (isKolhi) {
      // Kolhi tour: hardcoded, no terrain param needed
      const src = isAdmin
        ? `/3d-tour/index.html?mode=admin&community=${KOLHI_ID}`
        : `/3d-tour/index.html`;
      setIframeSrc(src);
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
        const src = isAdmin
          ? `/3d-tour/index.html?mode=admin&community=${communityId}&terrain=${terrain}`
          : `/3d-tour/index.html?community=${communityId}&terrain=${terrain}`;
        setIframeSrc(src);
      });
  }, [view, isAdmin]);

  return (
    <div className="min-h-screen bg-black relative">
      {iframeSrc && (
        <iframe
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