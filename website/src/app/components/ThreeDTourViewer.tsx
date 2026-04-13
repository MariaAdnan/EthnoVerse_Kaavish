import { motion } from "motion/react";
import { Move, RotateCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import React from "react";

interface ThreeDTourViewerProps {
  onNavigate: (view: string) => void;
}

export function ThreeDTourViewer({ onNavigate }: ThreeDTourViewerProps) {
  return (
<div className="min-h-screen bg-black relative">      {/* 3D TOUR */}
      <iframe
        src="/3d-tour/index.html"
        className="w-full h-screen border-none"
        allow="fullscreen"
      />

      {/* EXIT BUTTON */}
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