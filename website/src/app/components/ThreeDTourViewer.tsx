import { motion } from "motion/react";
import { Move, RotateCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import React from "react";

interface ThreeDTourViewerProps {
  onNavigate: (view: string) => void;
}

export function ThreeDTourViewer({ onNavigate }: ThreeDTourViewerProps) {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F5F1E8]">
      {/* Main Viewport - "The Digital Point Cloud" */}
      <div className="relative h-screen p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="h-full relative"
        >
          {/* 3D Viewer Placeholder */}
          <div className="relative h-full bg-black/50 border border-[#F5F1E8]/20 overflow-hidden">
            {/* Simulated Point Cloud Background */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(204, 119, 34, 0.3) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 30%, rgba(168, 181, 160, 0.2) 0%, transparent 50%),
                                  radial-gradient(circle at 40% 80%, rgba(245, 241, 232, 0.1) 0%, transparent 50%)`,
              }}
            />
            
            {/* Central Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-6">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-48 h-48 mx-auto border-2 border-[#F5F1E8]/30 rounded-sm relative"
                >
                  <div className="absolute inset-0 border-2 border-accent/50 rotate-45" />
                  <div className="absolute inset-4 border border-[#F5F1E8]/20 rounded-sm" />
                </motion.div>
                
                <div>
                  <p 
                    className="text-2xl mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    3D Viewer
                  </p>
                  <p 
                    className="text-sm opacity-60"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    NeRF / GAUSSIAN SPLATTING VIEWPORT
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Overlay - Wireframe Icons */}
            <div className="absolute top-6 right-6 space-y-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="block w-12 h-12 border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
                title="Orbit"
              >
                <RotateCw className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="block w-12 h-12 border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
                title="Pan"
              >
                <Move className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="block w-12 h-12 border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="block w-12 h-12 border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="block w-12 h-12 border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
                title="Fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Technical Info Overlay */}
            <div className="absolute top-6 left-6">
              <div 
                className="text-xs space-y-1 opacity-50"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                <p>RESOLUTION: 2048x2048</p>
                <p>QUALITY: HIGH</p>
                <p>RENDER: REAL-TIME</p>
                <p>FPS: 60</p>
              </div>
            </div>
          </div>

          {/* Context Panel - Frosted Glass Effect */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute bottom-6 left-6 max-w-lg"
          >
            <div className="backdrop-blur-md bg-[#1A1A1A]/80 border border-[#F5F1E8]/20 p-8">
              <p 
                className="text-xs mb-3 opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                ABOUT THIS TOUR
              </p>
              <h3 
                className="text-xl mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Traditional Kolhi Settlement
              </h3>
              <p className="text-sm leading-relaxed opacity-80 mb-4">
                This Neural Radiance Field reconstruction captures a traditional Kolhi dwelling 
                in Tharparkar. The 3D scan preserves architectural details, material textures, 
                and spatial relationships that define the community's built environment.
              </p>
              <div 
                className="text-xs space-y-1 opacity-50"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                <p>CAPTURE DATE: November 2024</p>
                <p>SCAN POINTS: 2.4M</p>
                <p>PROCESSING: Gaussian Splatting + NeRF</p>
                <p>LOCATION: 25.3232° N, 69.7597° E</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Back Navigation */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('community')}
          className="text-[#F5F1E8] hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← EXIT VIRTUAL SPACE</span>
        </button>
      </div>
    </div>
  );
}
