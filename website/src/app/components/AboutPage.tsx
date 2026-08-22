// src/app/components/AboutPage.tsx
import { motion } from "motion/react";

export function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="border-b border-border px-6 pb-12 pt-32 text-center sm:px-12">
        <h1 
          className="text-[clamp(3rem,12vw,4.5rem)] leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          About the Project
        </h1>
      </motion.div>

      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-16 mb-24"
        >
          {/* Left Column - Digital Storytelling Mission */}
          <div>
            <h2 
              className="text-3xl mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Digital Storytelling
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                EthnoVerse is a digital cultural preservation initiative
                documenting the Indigenous communities of Sindh, Pakistan. Through immersive
                multimedia experiences, we create digital records of oral histories, traditional
                practices, and cultural knowledge.
              </p>
              <p>
                This research prototype explores how community histories, crafts, and knowledge can
                be organized for responsible long-term access. Publication still depends on verified
                rights, cultural authority, and contextual review for each item.
              </p>
              <p>
                By combining field ethnography with cutting-edge 3D scanning technology, we transform 
                ephemeral cultural moments into permanent digital monuments—a "living archive" that 
                grows and evolves with the communities it represents.
              </p>
              <p>
                The project is part of the broader Kaavish initiative, dedicated to preserving 
                Pakistan's diverse cultural heritage through technology and scholarship.
              </p>
            </div>
          </div>

          {/* Right Column - Technology Stack */}
          <div>
            <h2 
              className="text-3xl mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Technology Stack & 3D Reconstruction
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                The platform is built as a React and Vite web application, supported by PostgreSQL, authentication, and row-level security through Supabase. This enables efficient handling of multimedia content, metadata, and controlled access for administrators and public users.
              </p>
              <p>
                Our 3D reconstruction pipeline is based on 3D Gaussian Splatting (3DGS), a technique for real-time scene rendering. 3DGS represents scenes using optimized Gaussian primitives, enabling interactive reconstruction from multi-view images while still requiring careful capture and quality review.
              </p>
              <p>
                This approach allows users to explore cultural environments as immersive, interactive 3D spaces, capturing spatial context and material detail beyond static media.
              </p>
              <p>
                Archive media and tour objects are stored in Cloudinary, generated models are retained in secure worker storage, and structured metadata is kept in Supabase. Operational backups and periodic restore tests are still required for long-term access.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
