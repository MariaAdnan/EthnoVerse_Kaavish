// src/app/components/VideoPlayer.tsx
import { motion } from "motion/react";
import { Play, Pause } from "lucide-react";
import { useState } from "react";
import React from "react";

interface VideoPlayerProps {
  onNavigate: (view: string) => void;
}

export function VideoPlayer({ onNavigate }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 240; // 4 minutes

  const transcript = [
    {
      time: "00:00",
      text: "The weaving process begins with selecting the raw cotton fibers, which must be cleaned and prepared before spinning.",
    },
    {
      time: "00:30",
      text: "Using a traditional wooden spindle, the artisan transforms loose fibers into strong, consistent thread through rhythmic hand movements passed down through generations.",
    },
    {
      time: "01:15",
      text: "The loom setup requires precision. Each warp thread must be carefully positioned to ensure the pattern emerges correctly during weaving.",
    },
    {
      time: "02:00",
      text: "Natural dyes extracted from local plants create the vibrant colors—indigo for blue, turmeric for yellow, madder root for red.",
    },
    {
      time: "02:45",
      text: "The weaving itself is a meditative practice, requiring focus and patience as the shuttle passes back and forth through the warp threads.",
    },
    {
      time: "03:30",
      text: "Each completed textile carries the unique signature of its maker, a testament to individual skill within a shared cultural tradition.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#2C2C2C] text-[#F5F1E8]">
      {/* Header Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="p-8 border-b border-[#F5F1E8]/10"
      >
        <div className="max-w-6xl mx-auto">
          <p 
            className="text-xs mb-2 opacity-60"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ARCHIVE-045 · VIDEO · KOLHI COMMUNITY
          </p>
          <h1 
            className="text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Weaving Techniques
          </h1>
          <p className="text-sm opacity-70 mt-2">
            Recorded November 2024 · Tharparkar District · Duration 4:00
          </p>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Video Player Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          {/* 16:9 Video Frame */}
          <div className="relative aspect-video bg-black border-2 border-[#F5F1E8]/20 overflow-hidden">
            {/* Placeholder Video Frame - would be actual video element in production */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1760328715296-9714daa8a737?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMHRleHRpbGUlMjB3ZWF2aW5nfGVufDF8fHx8MTc2NTc1NzE0NHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Weaving Techniques"
                className="w-full h-full object-cover opacity-70"
              />
              
              {/* Play Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setIsPlaying(true)}
                    className="w-20 h-20 rounded-full border-2 border-[#F5F1E8] hover:border-accent flex items-center justify-center transition-colors"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Video Reference */}
            <div className="absolute top-4 left-4">
              <p 
                className="text-xs text-[#F5F1E8]/60 bg-black/50 px-2 py-1"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                SRS MULTIMEDIA SUPPORT
              </p>
            </div>
          </div>

          {/* Video Controls */}
          <div className="mt-4 flex items-center gap-6">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 flex items-center justify-center border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Timeline */}
            <div className="flex-1">
              <div className="relative h-1 bg-[#F5F1E8]/20 rounded-full overflow-hidden cursor-pointer">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-accent"
                  style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                />
              </div>
              <div 
                className="flex justify-between mt-2 text-xs opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                <span>4:00</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transcript Panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="border-t border-[#F5F1E8]/10 pt-8"
        >
          <h2 
            className="text-2xl mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Transcript
          </h2>

          <div className="space-y-6 max-h-96 overflow-y-auto pr-4">
            {transcript.map((line, index) => (
              <div
                key={index}
                className="pb-6 border-b border-[#F5F1E8]/5"
              >
                <p 
                  className="text-xs mb-3 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {line.time}
                </p>
                <p className="text-base leading-relaxed opacity-90">
                  {line.text}
                </p>
              </div>
            ))}
          </div>

          {/* Metadata */}
          <div 
            className="mt-8 pt-6 border-t border-[#F5F1E8]/10 text-xs opacity-60 space-y-2"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <p>SUBJECT: Traditional Textile Production</p>
            <p>DEMONSTRATOR: Meera Kolhi (Master Weaver)</p>
            <p>LANGUAGE: Sindhi with English subtitles</p>
            <p>EQUIPMENT: Sony A7III, Rode VideoMic Pro</p>
            <p>FORMAT: MP4 1920x1080 · 30fps</p>
          </div>
        </motion.div>
      </div>

      {/* Back Navigation */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('community')}
          className="text-[#F5F1E8] hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← BACK TO COLLECTION</span>
        </button>
      </div>
    </div>
  );
}
