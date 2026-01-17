// src/app/components/ImageDetail.tsx
import { motion } from "motion/react";
import { X, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { getMediaById } from "../../services/media";

interface ImageDetailProps {
  onNavigate: (view: string) => void;
  view: string;
}

export function ImageDetail({ onNavigate, view }: ImageDetailProps) {
  const mediaId = view.split(":")[1];

  const [media, setMedia] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const data = await getMediaById(mediaId);
        setMedia(data);
      } catch (err) {
        console.error("Failed to load media", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [mediaId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: loading ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 bg-[#1A1A1A]/95 z-50 flex items-center justify-center p-8"
    >
      {/* Close Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onClick={() => onNavigate(`community:${media?.community_id}`)}
        className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors text-[#F5F1E8]"
      >
        <X className="w-6 h-6" />
      </motion.button>

      {/* Image Container */}
      {media && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-6xl max-h-[80vh] flex items-center justify-center"
        >
          <img
            src={media.storage_url}
            alt={media.title}
            className="max-w-full max-h-[80vh] object-contain"
            loading="eager"
          />
        </motion.div>
      )}

      {/* Metadata Bar */}
      {media && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8"
        >
          <div className="backdrop-blur-md bg-[#1A1A1A]/80 border border-[#F5F1E8]/20 p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs text-[#F5F1E8]/60 mb-2"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  IMAGE · {media.communities?.name || "ARCHIVE"}
                </p>

                <h2
                  className="text-2xl text-[#F5F1E8]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {media.title}
                </h2>

                <p className="text-sm text-[#F5F1E8]/70 mt-2">
                  {media.description}
                </p>
              </div>

              {/* Download */}
              <a
                href={media.storage_url}
                download
                className="w-12 h-12 flex items-center justify-center border border-[#F5F1E8]/30 hover:border-accent hover:bg-accent/10 transition-colors text-[#F5F1E8]"
                title="Download Image"
              >
                <Download className="w-5 h-5" />
              </a>
            </div>

            {/* Extra Metadata */}
            <div
              className="mt-4 pt-4 border-t border-[#F5F1E8]/10 grid grid-cols-3 gap-4 text-xs text-[#F5F1E8]/60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <div>
                <p className="mb-1">DATE</p>
                <p className="text-[#F5F1E8]/90">
                  {media.created_at || "—"}
                </p>
              </div>

              <div>
                <p className="mb-1">LOCATION</p>
                <p className="text-[#F5F1E8]/90">
                  {media.communities?.location || "—"}
                </p>
              </div>

              <div>
                <p className="mb-1">FORMAT</p>
                <p className="text-[#F5F1E8]/90">IMAGE</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reference Tag */}
      <div className="absolute top-8 left-8">
        <p
          className="text-xs text-[#F5F1E8]/40"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          SRS FIGURE
        </p>
      </div>
    </motion.div>
  );
}
