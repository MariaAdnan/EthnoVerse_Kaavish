import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="absolute top-6 left-6 bg-white/70 backdrop-blur-sm border border-[#D2B48C] text-[#5C4033] px-3 py-1.5 rounded-full shadow hover:bg-[#FAF3E0] transition-all flex items-center space-x-1"
    >
      <span className="text-sm font-large">←</span>
    </button>
  );
}
