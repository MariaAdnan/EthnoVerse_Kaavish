// src/app/components/Homepage.tsx
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { getAllCommunities } from "../../services/communities";
import { NavigationBar } from "./NavigationBar.tsx";

interface HomepageProps {
  onNavigate: (view: string) => void;
}

export function Homepage({ onNavigate }: HomepageProps) {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  const fetchCommunities = async () => {
    setLoading(true);

    const { data, error } = await getAllCommunities();

    if (error) {
      setError("Failed to load communities");
      setLoading(false);
      return;
    }

    setCommunities(data || []);
    setLoading(false);
  };

  fetchCommunities();
}, []);
const featured = communities.length > 0 ? communities[0] : null;

  return (
    <div className="min-h-screen">
     <NavigationBar onNavigate={onNavigate} />
      {/* Hero Section - "The Title Wall" */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Film Grain Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1677153224313-7b009d1b33e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFyJTIwZGVzZXJ0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc1NzE0M3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Tharparkar Desert"
            className="w-full h-full object-cover grayscale opacity-40"
          />
          {/* Film Grain Texture */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="block text-[clamp(3rem,12vw,10rem)] leading-[0.9] tracking-tight">
              LIVING
            </span>
            <span className="block text-[clamp(3rem,12vw,10rem)] leading-[0.9] tracking-tight">
              ARCHIVES
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="max-w-3xl mx-auto mb-16"
          >
            <p 
              className="text-[clamp(1.25rem,2.5vw,2rem)] leading-relaxed tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Documenting Sindh's Indigenous communities through
              multimedia and immersive 3D experiences
            </p>
          </motion.div>
        </div>

        {/* Floating Navigation Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-12 left-0 right-0 flex justify-between px-12"
        >
          <button
            onClick={() => onNavigate('explore')}
            className="group"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <span className="text-lg underline underline-offset-4 decoration-accent hover:text-accent transition-colors">
              EXPLORE COMMUNITIES →
            </span>
          </button>
          <button
            onClick={() => onNavigate('search')}
            className="group"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <span className="text-lg underline underline-offset-4 decoration-accent hover:text-accent transition-colors">
              SEARCH ARCHIVES →
            </span>
          </button>
        </motion.div>
      </section>
{loading && (
  <p className="text-center text-sm opacity-60">
    Loading featured community…
  </p>
)}

{error && (
  <p className="text-center text-red-500 text-sm">
    {error}
  </p>
)}

      {/* Featured Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 
            className="mb-12"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-[clamp(2rem,6vw,4rem)] tracking-tight">Featured</span>
          </h2>
          
          <div 
            className="group cursor-pointer"
onClick={() => {
  if (featured) {
    onNavigate(`community:${featured.community_id}`);
  }
}}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
  src={
    featured?.cover_image
      ? featured.cover_image
      : "/placeholder-community.jpg"
  }
  alt={featured?.name}
  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
  onError={(e) => {
    e.currentTarget.src = "/placeholder-community.jpg";
  }}
/>

                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-500" />
              </div>
              
              <div>
                <p 
                  className="text-sm mb-2 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  ARCHIVE-001 · FEATURED
                </p>
                <h3 
                  className="mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  <span className="text-[clamp(1.5rem,4vw,3rem)] leading-tight">
                    {featured?.name}
                  </span>
                </h3>
                <p className="text-lg leading-relaxed mb-6 text-muted-foreground">
                  {featured?.short_description}
                </p>
                <button 
                  className="inline-flex items-center gap-2 text-accent hover:gap-4 transition-all"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <span className="text-sm">VIEW COLLECTION</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* About Teaser */}
      <section className="py-24 px-6 bg-secondary/30">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <p 
            className="text-sm mb-4 opacity-60"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            TECHNICAL ARCHITECTURE
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground">
            EthnoVerse is built on the MERN stack (MongoDB, Express, React, Node.js) with advanced 
            3D rendering capabilities using NeRF and Gaussian Splatting technologies. The platform 
            combines cutting-edge computational methods with cultural preservation methodologies.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <button 
              onClick={() => onNavigate('about')}
              className="inline-flex items-center gap-2 text-accent hover:gap-4 transition-all"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <span className="text-sm">LEARN MORE</span>
              <span>→</span>
            </button>
            <button 
              onClick={() => onNavigate('admin-login')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent hover:gap-4 transition-all"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <span className="text-sm">ADMIN LOGIN</span>
              <span>→</span>
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}