import { motion } from "motion/react";
import { X, Download, FileText, ZoomIn, ZoomOut } from "lucide-react";
import { Search } from "lucide-react";
import { useState } from "react";
interface PDFViewerProps {
  onNavigate: (view: string) => void;
}

export function PDFViewer({ onNavigate }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/95 z-50 flex flex-col">
      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between p-6 border-b border-[#F5F1E8]/20"
      >
        <div className="flex items-center gap-4">
          <FileText className="w-6 h-6 text-[#F5F1E8]" />
          <div>
            <h2 
              className="text-[#F5F1E8] text-xl mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Traditional Craft Manuscripts
            </h2>
            <p 
              className="text-[#F5F1E8]/60 text-xs"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              ARCHIVE-049 · PDF DOCUMENT · KOLHI COMMUNITY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 border border-[#F5F1E8]/30 rounded px-3 py-1.5">
            <button
              onClick={handleZoomOut}
              className="text-[#F5F1E8] hover:text-accent transition-colors"
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span 
              className="text-[#F5F1E8] text-sm min-w-[50px] text-center"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="text-[#F5F1E8] hover:text-accent transition-colors"
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Download Button */}
          <button
            className="flex items-center gap-2 px-4 py-2 border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors text-[#F5F1E8]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">DOWNLOAD</span>
          </button>

          {/* Close Button */}
          <button
            onClick={() => onNavigate('community')}
            className="w-12 h-12 flex items-center justify-center border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors text-[#F5F1E8]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* PDF Viewer Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 overflow-auto p-8 flex items-start justify-center bg-[#2C2C2C]/30"
      >
        <div 
          className="bg-[#F5F1E8] shadow-2xl"
          style={{ 
            width: `${zoom}%`,
            minWidth: '600px',
            maxWidth: '1200px',
            transition: 'width 0.3s ease'
          }}
        >
          {/* PDF Content Placeholder - Simulated Document */}
          <div className="p-12 space-y-8">
            {/* Document Header */}
            <div className="border-b-2 border-foreground pb-6">
              <h1 
                className="text-4xl mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Traditional Craft Techniques
              </h1>
              <p 
                className="text-sm opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Documentation of Kolhi Pottery and Textile Methods
              </p>
              <p 
                className="text-sm opacity-60 mt-2"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Compiled by Dr. Amina Shaikh · November 2024
              </p>
            </div>

            {/* Document Content */}
            <div className="space-y-6 leading-relaxed">
              <section>
                <h2 
                  className="text-2xl mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Introduction
                </h2>
                <p className="mb-4">
                  The Kolhi community of Tharparkar has preserved ancient craft traditions for generations, 
                  passing down intricate techniques through oral instruction and hands-on apprenticeship. 
                  This document serves as a comprehensive record of these traditional methods, capturing 
                  the knowledge of master artisans and their time-honored practices.
                </p>
                <p className="mb-4">
                  Through extensive fieldwork conducted between 2023-2024, we have documented the complete 
                  lifecycle of traditional pottery-making, textile weaving, and natural dye preparation. 
                  Each technique represents centuries of accumulated wisdom adapted to the harsh desert 
                  environment of Sindh.
                </p>
              </section>

              <section>
                <h2 
                  className="text-2xl mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Pottery Techniques
                </h2>
                <p className="mb-4">
                  Traditional Kolhi pottery is characterized by its distinctive red clay sourced from 
                  seasonal riverbeds in the Thar Desert. The clay is hand-mixed with fine sand to achieve 
                  the proper consistency, a ratio carefully maintained through tactile experience rather 
                  than precise measurement.
                </p>
                <p className="mb-4">
                  The coiling method remains the primary construction technique, with potters building 
                  vessels from the base upward using long clay ropes. Surface finishing is achieved 
                  through polishing with smooth stones, creating a characteristic burnished appearance 
                  before firing in outdoor pit kilns.
                </p>
              </section>

              <section>
                <h2 
                  className="text-2xl mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Textile Traditions
                </h2>
                <p className="mb-4">
                  Weaving patterns are passed down through maternal lines, with each family maintaining 
                  distinctive motifs that serve as cultural signatures. The traditional pit loom remains 
                  in use, constructed from locally sourced wood and requiring minimal metal components.
                </p>
                <p className="mb-4">
                  Natural dyes extracted from indigenous plants provide the vibrant colors characteristic 
                  of Kolhi textiles. Indigo, turmeric, madder root, and pomegranate rind are combined in 
                  carefully guarded formulas to achieve specific hues and ensure colorfastness.
                </p>
              </section>
            </div>

            {/* Document Footer */}
            <div className="border-t-2 border-foreground pt-6 mt-12">
              <p 
                className="text-xs opacity-40"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Page 1 of 8 · EthnoVerse Living Archives · Kaavish Initiative © 2024
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Metadata Bar */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="border-t border-[#F5F1E8]/20 p-4 bg-[#1A1A1A]/90 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p 
                className="text-[#F5F1E8]/60 text-xs mb-1"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                FILE SIZE
              </p>
              <p className="text-[#F5F1E8] text-sm">2.4 MB</p>
            </div>
            <div className="h-8 w-px bg-[#F5F1E8]/20" />
            <div>
              <p 
                className="text-[#F5F1E8]/60 text-xs mb-1"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                PAGES
              </p>
              <p className="text-[#F5F1E8] text-sm">8</p>
            </div>
            <div className="h-8 w-px bg-[#F5F1E8]/20" />
            <div>
              <p 
                className="text-[#F5F1E8]/60 text-xs mb-1"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                UPLOADED
              </p>
              <p className="text-[#F5F1E8] text-sm">2024-11-15</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('community')}
            className="text-[#F5F1E8]/60 hover:text-accent text-sm transition-colors"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ← BACK TO COLLECTION
          </button>
        </div>
      </motion.div>
    </div>
  );
}
