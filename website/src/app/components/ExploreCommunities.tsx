// src/app/components/ExploreCommunities.tsx
import { motion } from "motion/react";
import Masonry from "react-responsive-masonry";
import React, { useEffect, useState } from "react";
import { getAllCommunities } from "../../services/communities";
import { NavigationBar } from "./NavigationBar.tsx";


interface ExploreCommunitiesProps {
  onNavigate: (view: string) => void;
}

export function ExploreCommunities({ onNavigate }: ExploreCommunitiesProps) {
  const [communities, setCommunities] = useState<any[]>([]);
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // const communities = [
  //   {
  //     name: "KOLHI",
  //     location: "Tharparkar",
  //     coordinates: "25.3232° N, 69.7597° E",
  //     image: "https://images.unsplash.com/photo-1588848475993-01f5c4882472?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5kaCUyMGN1bHR1cmUlMjB0cmFkaXRpb25hbHxlbnwxfHx8fDE3NjU3NTcxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  //     height: 400,
  //   },
  //   {
  //     name: "BHEEL",
  //     location: "Kohistan",
  //     coordinates: "26.1235° N, 68.4521° E",
  //     image: "https://images.unsplash.com/photo-1619328147198-aa1477637a21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGVtYnJvaWRlcnklMjBwYXR0ZXJuc3xlbnwxfHx8fDE3NjU3NTcxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  //     height: 500,
  //   },
  //   {
  //     name: "MEGHWAR",
  //     location: "Badin",
  //     coordinates: "24.6560° N, 68.8390° E",
  //     image: "https://images.unsplash.com/photo-1669365415484-0b247a295659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMHBvdHRlcnklMjBjbGF5fGVufDF8fHx8MTc2NTc1NzE0NHww&ixlib=rb-4.1.0&q=80&w=1080",
  //     height: 450,
  //   },
  //   {
  //     name: "PARKARI",
  //     location: "Umerkot",
  //     coordinates: "25.3549° N, 69.7364° E",
  //     image: "https://images.unsplash.com/photo-1760328715296-9714daa8a737?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMHRleHRpbGUlMjB3ZWF2aW5nfGVufDF8fHx8MTc2NTc1NzE0NHww&ixlib=rb-4.1.0&q=80&w=1080",
  //     height: 480,
  //   },
  //   {
  //     name: "SAMA",
  //     location: "Khairpur",
  //     coordinates: "27.5295° N, 68.7590° E",
  //     image: "https://images.unsplash.com/photo-1677153224313-7b009d1b33e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFyJTIwZGVzZXJ0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc1NzE0M3ww&ixlib=rb-4.1.0&q=80&w=1080",
  //     height: 420,
  //   },
  //   {
  //     name: "KOLI",
  //     location: "Karachi",
  //     coordinates: "24.8607° N, 67.0011° E",
  //     image: "https://images.unsplash.com/photo-1689770429297-bb8488af924c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBkdW5lcyUyMGFlcmlhbHxlbnwxfHx8fDE3NjU3NTcxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  //     height: 440,
  //   },
  // ];
  useEffect(() => {
    const fetchCommunities = async () => {
      // setLoading(true);

      const { data, error } = await getAllCommunities();

      // if (error) {
      //   setError("Failed to load communities");
      //   setLoading(false);
      //   return;
      // }

      setCommunities(data || []);
      // setLoading(false);
    };

    fetchCommunities();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Back Navigation */}
      
      {/* Navigation Bar */}
      <NavigationBar onNavigate={onNavigate} />
<div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('home')}
          className="text-foreground hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← HOME</span>
        </button>
      </div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="p-12 pt-32 text-center"
      >
        <h1 
          className="text-7xl mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Communities
        </h1>
        <p 
          className="text-sm opacity-60"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          12 INDIGENOUS GROUPS · SINDH PROVINCE
        </p>
      </motion.div>      

      {/* Masonry Grid - "The Mosaic" */}
      <div className="px-12 pb-12">
        <Masonry columnsCount={3} gutter="24px">
          {communities.map((community, index) => (
            <motion.div
              key={community.community_id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <button
                onClick={() => onNavigate(`community:${community.community_id}`)}
                className="group relative overflow-hidden block w-full"
                // style={{ height: `${community.height}px` }}
              >
                {/* Image */}
                <img
  src={
    community.cover_image
      ? community.cover_image
      : "/placeholder-community.jpg"
  }
  alt={community.name}
  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
  style={{ height: `${350 + (index % 3) * 80}px` }}
/>

                
                {/* Dark Overlay on Hover */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 transition-all duration-500" />
                
                {/* Text Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-white p-6"
                >
                  <h2 
                    className="text-5xl mb-3 tracking-wider"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {community.name}
                  </h2>
                  <p className="text-sm mb-1">{community.location}</p>
                  <p 
                    className="text-xs opacity-70"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {community.coordinates}
                  </p>
                </motion.div>
              </button>
            </motion.div>
          ))}
        </Masonry>
      </div>
    </div>
  );
}
