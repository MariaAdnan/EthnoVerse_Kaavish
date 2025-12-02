import React from "react";
import { Link, useParams } from "react-router-dom";
import TopNav from "../components/TopNav";
import Container from "../components/Container";
// import { DUMMY_COMMUNITIES, DUMMY_MEDIA } from "../data/dummyData";
import { apiGet } from "../utils/api";


export default function VirtualTourPage() {
  const { communityId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav />
      <Container>
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
            3D Virtual Tour
          </h2>
          <p className="text-gray-700 mt-3">
            Explore the world of <span className="font-semibold">{communityId}</span> through immersive 3D visualization.
          </p>
        </div>

        {/* 3D Viewer Section */}
        <div className="relative bg-gradient-to-br from-[#5C4033] via-[#8B5E3C] to-[#CBB994] rounded-3xl shadow-2xl overflow-hidden h-[28rem] flex items-center justify-center border border-[#D2B48C]">          {/* Decorative Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>

          {/* Placeholder */}
          <div className="z-10 text-center text-white">
            <div className="text-2xl font-bold tracking-wide">
              3D Viewer Placeholder
            </div>
            <div className="text-sm text-gray-300 mt-2">
              (NeRF / Gaussian Splatting integration goes here)
            </div>
            <div className="mt-6">
              <button
                disabled
                className="px-6 py-2 rounded-full bg-white/10 text-white border border-white/40 cursor-not-allowed"
              >
                Rendering Environment Unavailable
              </button>
            </div>
          </div>

          {/* Animated Light Gradient */}
<div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#8B5E3C]/10 via-[#5C4033]/10 to-transparent animate-pulse"></div>       
 </div>

        {/* Description Section */}
        <div className="mt-10 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow border border-gray-100">
          <h3 className="text-2xl font-semibold text-[#8B5E3C] mb-3">
            About This Tour
          </h3>
          <p className="text-gray-700 leading-relaxed">
            This 3D tour will allow users to experience the <span className="font-medium">{communityId}</span> community environment 
            through photogrammetry or NeRF-based reconstructions. It can include walk-throughs of homes, artifacts, and cultural spaces, 
            enabling interactive storytelling and spatial immersion.
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link
            to={`/community/${communityId}`}
            className="inline-block bg-gradient-to-r bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] text-white px-6 py-2 rounded-full font-medium shadow hover:scale-105 transition-all"
          >
            ← Back to Community
          </Link>
        </div>
      </Container>
    </div>
  );
}
