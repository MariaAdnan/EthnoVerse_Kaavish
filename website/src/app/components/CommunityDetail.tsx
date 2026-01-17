// src/app/components/CommunityDetail.tsx

import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Volume2, Image, Video, Box } from "lucide-react";
import {
  getCommunityById,
  getMediaByCommunity
} from "../../services/communities";

interface CommunityDetailProps {
  onNavigate: (view: string) => void;
  view: string;
}

  export function CommunityDetail({ onNavigate, view }: CommunityDetailProps) {
  
    const communityId = view.split(":")[1];
console.log("VIEW:", view);
console.log("COMMUNITY ID:", communityId);
if (!communityId) {
  return <p className="p-12 text-red-500">Invalid community</p>;
}

  const [community, setCommunity] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      
      // setLoading(true);
      const { data: communityData, error: communityError } = await getCommunityById(communityId);

      // if (communityError) {
      //   setError("Community not found");
      //   setLoading(false);
      //   return;
      // }

      const { data: mediaData } = await getMediaByCommunity(communityId);

      setCommunity(communityData);
      setMediaItems(mediaData || []);
      // setLoading(false);
      console.log("COMMUNITY DATA:", communityData);
      console.log("MEDIA DATA:", mediaData);

    };

    fetchData();
  }, [communityId]);

  // if (loading) return <p className="p-12">Loading community…</p>;
  if (error) return <p className="p-12 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen">
      {/* Split Screen Layout - "The Exhibition Hall" */}
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Column - Fixed/Sticky */}
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center p-12 bg-secondary/20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p 
              className="text-sm mb-4 opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {community?.location}
</p>
            
            <h1 
              className="mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="block text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] tracking-tight">
                  {community?.name}

              </span>
            </h1>

            <div className="mb-12 space-y-4 text-lg leading-relaxed text-muted-foreground max-w-xl">
              {community?.long_description}
            </div>

            {/* 3D Tour Trigger - "The Orb" */}
            <div className="space-y-6">
              <button
                onClick={() => onNavigate('3d-tour')}
                className="group relative w-full"
              >
                <div className="relative overflow-hidden rounded-sm bg-accent hover:bg-accent/90 transition-all duration-300 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p 
                        className="text-accent-foreground text-sm mb-1"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        ENTER VIRTUAL SPACE
                      </p>
                      <p className="text-accent-foreground/80 text-xs">
                        NeRF Reconstruction
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Box className="w-8 h-8 text-accent-foreground" />
                    </motion.div>
                  </div>
                </div>
              </button>

              {/* <button
                onClick={() => onNavigate(`audio:${communityId}`)}

                className="w-full rounded-sm border-2 border-foreground hover:bg-foreground hover:text-background transition-all duration-300 p-6"
              >
                <p 
                  className="text-sm"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  VIEW MEDIA COLLECTION
                </p>
              </button> */}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Scrollable Media Stream */}
        <div className="p-12 space-y-12">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 
              className="mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="text-[clamp(1.75rem,4vw,3rem)]">Media Collection</span>
            </h2>

            {/* Curated Index - Minimalist List */}
            <div className="space-y-1">
              {mediaItems.map((item, index) => {
  const type = item?.media_type ?? "unknown";

  const Icon =
    type === "audio" ? Volume2 :
    type === "image" ? Image :
    type === "video" ? Video :
    Box;

  const targetView =
  type === "image" ? `image:${item.media_id}` :
  type === "video" ? `video:${item.media_id}` :
  type === "audio" ? `audio:${item.media_id}` :
  `community:${communityId}`;


  return (
    <motion.div
      key={item.media_id ?? Math.random()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
    >
      <button
        onClick={() => onNavigate(targetView)}
        className="group w-full text-left border-b border-border py-6"
      >
        <div className="flex items-start gap-6">
          <Icon className="w-5 h-5 mt-1 text-accent" />
          <div className="flex-1">
            <p className="text-xs mb-2 opacity-60">
              {item.media_id ?? "—"} · {type.toUpperCase()}
            </p>
            <p className="text-lg group-hover:text-accent">
              {item.title ?? "Untitled Media"}
            </p>
          </div>
          <span className="opacity-0 group-hover:opacity-100">→</span>
        </div>
      </button>
    </motion.div>
  );
})}


            </div>
          </motion.div>

          {/* Visual Artifacts Stream */}
          {/* <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 
              className="text-lg mb-6"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              PHOTOGRAPHIC DOCUMENTATION
            </h3>
            <div className="space-y-8">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1619328147198-aa1477637a21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGVtYnJvaWRlcnklMjBwYXR0ZXJuc3xlbnwxfHx8fDE3NjU3NTcxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Traditional Patterns"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1669365415484-0b247a295659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMHBvdHRlcnklMjBjbGF5fGVufDF8fHx8MTc2NTc1NzE0NHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Traditional Pottery"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1760328715296-9714daa8a737?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMHRleHRpbGUlMjB3ZWF2aW5nfGVufDF8fHx8MTc2NTc1NzE0NHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Textile Weaving"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div> */}
        </div>
      </div>

      {/* Back Navigation */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('home')}
          className="text-foreground hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← BACK</span>
        </button>
      </div>
    </div>
  );
}