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
        className="border-b border-border p-12 pt-32 text-center">
        {/* <p 
          className="text-sm mb-3 opacity-80"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          SRS FIGURE 3.8
        </p> */}
        <h1 
          className="text-7xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          About the Project
        </h1>
      </motion.div>

      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto p-12">
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
                documenting the indigenous communities of Sindh, Pakistan. Through immersive 
                multimedia experiences, we create permanent records of oral histories, traditional 
                practices, and cultural knowledge.
              </p>
              <p>
                This platform serves as both an academic archive and a public memorial, ensuring 
                that the voices, crafts, and wisdom of communities like the Kolhi, Bheel, and 
                Meghwar remain accessible to future generations.
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
                Our 3D reconstruction pipeline is based on 3D Gaussian Splatting (3DGS), a state-of-the-art technique for real-time scene rendering. Unlike traditional methods, 3DGS represents scenes using optimized Gaussian primitives, enabling fast, high-quality reconstruction from multi-view images with minimal manual intervention.
              </p>
              <p>
                This approach allows users to explore cultural environments as immersive, interactive 3D spaces, capturing spatial context and material detail beyond static media.
              </p>
              <p>
                All media is stored externally (e.g., Cloudinary) and linked with structured metadata, ensuring long-term accessibility, efficient retrieval, and compatibility with archival standards.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
