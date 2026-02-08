// CommunityDetail.tsx

import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Box } from "lucide-react";
import { getCommunityById } from "../../services/communities";
import { getInterviewsByCommunity } from "../../services/interviews";
// src/app/components/CommunityDetail.tsx

interface CommunityDetailProps {
  onNavigate: (view: string) => void;
  view: string;
}

export function CommunityDetail({ onNavigate, view }: CommunityDetailProps) {
  const communityId = view.split(":")[1];

  if (!communityId) {
    return <p className="p-12 text-red-500">Invalid community</p>;
  }

  const [community, setCommunity] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [error, setError] = useState("");
  

  useEffect(() => {
    const fetchData = async () => {
      const { data: communityData, error: communityError } =
        await getCommunityById(communityId);

      if (communityError) {
        setError("Community not found");
        return;
      }

      const { data: interviewData } =
        await getInterviewsByCommunity(communityId);

      setCommunity(communityData);
      setInterviews(interviewData || []);
    };

    fetchData();
  }, [communityId]);

  if (error) return <p className="p-12 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen pt-32 pb-12">
      {/* Back */}
      <div className="fixed top-24 left-8 z-50">
        <button
          onClick={() => onNavigate("back")}
          className="text-[#1A1A1A] hover:text-[#CC7722] transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← BACK</span>
        </button>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <p
            className="text-sm tracking-widest opacity-60 mb-4"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {community?.location}
          </p>

          <h1
            className="text-6xl md:text-7xl mb-8 text-[#1A1A1A]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {community?.name}
          </h1>

          <p className="text-lg opacity-70 leading-relaxed mb-8">
            {community?.short_description}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("3d-tour")}
              className="px-8 py-3 bg-[#1A1A1A] text-[#F5F1E8] rounded-sm flex items-center gap-3 hover:bg-[#333] transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <Box className="w-4 h-4" /> ENTER VIRTUAL SPACE
            </button>

            <button
              onClick={() => onNavigate("media-visual")}
              className="px-8 py-3 border border-[#1A1A1A] text-[#1A1A1A] rounded-sm hover:bg-[#1A1A1A]/5 transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              VIEW FULL ARCHIVE
            </button>
          </div>
        </motion.div>
      </div>

      {/* Glimpse Oral Histories */}
      <div className="max-w-7xl mx-auto px-6">
        <h2
          className="text-3xl mb-12 text-center"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Glimpse Oral Histories
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {interviews.map((interview, index) => (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white border border-[#1A1A1A]/10 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onNavigate(`audio:${interview.id}`)}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
  src={interview.picture_cloudinary_url || "/placeholder.jpg"}
  alt={interview.interviewee}
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
/>

              </div>

              <div className="p-8">
                <h3
                  className="text-2xl mb-2 text-[#1A1A1A] group-hover:text-[#CC7722] transition-colors"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {interview.title}
                </h3>

                <p
                  className="text-xs opacity-50 mb-4"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  RECORDED: {interview.date}
                </p>

                {/* <p className="text-sm opacity-80 leading-relaxed mb-6 line-clamp-3">
                  “{interview.title}”
                </p> */}

                <span
                  className="text-xs font-bold tracking-wide uppercase border-b border-[#1A1A1A] pb-1 group-hover:border-[#CC7722] group-hover:text-[#CC7722] transition-colors"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Read More »
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
