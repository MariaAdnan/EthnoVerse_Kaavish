// src/app/components/AboutPage.tsx
import { motion } from "motion/react";
import { NavigationBar } from "./NavigationBar";

interface AboutPageProps {
  onNavigate: (view: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <NavigationBar onNavigate={onNavigate} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="border-b border-border p-12 pt-32 text-center">
        <p 
          className="text-sm mb-3 opacity-60"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          SRS FIGURE 3.8
        </p>
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
                EthnoVerse (Living Archives) is a digital cultural preservation initiative 
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
              MERN Stack & NeRF
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                The platform is built on the MERN stack (MongoDB, Express, React, Node.js), 
                providing a robust and scalable foundation for managing large multimedia datasets 
                and serving content to researchers worldwide.
              </p>
              <p>
                Our 3D virtual tours leverage Neural Radiance Fields (NeRF) and Gaussian Splatting—
                advanced computational photography techniques that reconstruct physical spaces from 
                multiple photographs into fully navigable 3D environments.
              </p>
              <p>
                This approach allows users to virtually "walk through" traditional dwellings, 
                ceremonial sites, and craft workshops, experiencing spatial and material dimensions 
                that photographs alone cannot convey.
              </p>
              <p>
                All media files are stored with standardized metadata schemas, ensuring 
                long-term accessibility and interoperability with international archival standards 
                such as Dublin Core and METS.
              </p>
            </div>

            <div 
              className="mt-8 p-6 bg-secondary/30 border-l-4 border-accent"
            >
              <p 
                className="text-xs mb-2 opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                TECHNICAL SPECIFICATIONS
              </p>
              <ul 
                className="text-sm space-y-1"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                <li>• MongoDB Atlas (Cloud Database)</li>
                <li>• Express.js (REST API)</li>
                <li>• React 18 + TypeScript</li>
                <li>• Node.js Runtime</li>
                <li>• NeRF + Gaussian Splatting (3D)</li>
                <li>• WCAG 2.1 AA Compliant</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Credits Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="border-t border-border pt-12"
        >
          <h2 
            className="text-3xl mb-8 text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Credits
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Team */}
            <div>
              <p 
                className="text-xs mb-4 opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                PROJECT TEAM
              </p>
              <ul className="space-y-2 text-sm">
                <li>Dr. Amina Shaikh</li>
                <li>Rashid Baloch</li>
                <li>Sara Pathan</li>
                <li>Kamil Hussain</li>
              </ul>
            </div>

            {/* Supervisor */}
            <div>
              <p 
                className="text-xs mb-4 opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                ACADEMIC SUPERVISION
              </p>
              <ul className="space-y-2 text-sm">
                <li>Dr. Hassan Ahmed</li>
                <li>Department of Anthropology</li>
                <li>University of Sindh</li>
              </ul>
            </div>

            {/* Partners */}
            <div>
              <p 
                className="text-xs mb-4 opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                PARTNERS
              </p>
              <ul className="space-y-2 text-sm">
                <li>Kaavish Initiative</li>
                <li>Sindh Cultural Heritage Society</li>
                <li>Tharparkar Development Authority</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p 
              className="text-xs opacity-40"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              © 2024 EthnoVerse · Kaavish Initiative · All Rights Reserved
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}