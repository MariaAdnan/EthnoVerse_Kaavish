// src/app/components/MediaIndex.tsx
import { motion } from "motion/react";
import {
  Volume2,
  Image,
  Video,
  FileText,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getMediaIndexItems } from "../../services/media";

interface MediaIndexProps {
  onNavigate: (view: string) => void;
  initialFilter?: string;
  communityId?: string;
}

interface MediaItem {
  id: string;
  type: "AUDIO" | "IMAGE" | "VIDEO" | "PDF";
  title: string;
  date?: string;
  icon: any;
}

export function MediaIndex({
  onNavigate,
  initialFilter = "ALL",
  communityId,
}: MediaIndexProps) {
  const [filterType, setFilterType] = useState(initialFilter);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
  const fetchMedia = async () => {
    const { data, error } = await getMediaIndexItems(communityId);

    if (!error && data) {
          console.log("MEDIA:", data.media);
    console.log("INTERVIEWS:", data.interviews);
      const iconMap = {
        AUDIO: Volume2,
        IMAGE: Image,
        VIDEO: Video,
        PDF: FileText,
      };

      // 🔊 interviews → AUDIO
      const audioItems: MediaItem[] = data.interviews.map((item) => ({
  id: String(item.id), // ⭐ FIX
  type: "AUDIO",
  title: item.title ?? "Untitled Interview",
  date: item.date,
  icon: iconMap.AUDIO,
}));

const mediaItemsMapped: MediaItem[] = data.media.map((item) => ({
  id: String(item.id), // ⭐ FIX
  type: "IMAGE",
  title: item.title ?? "Untitled Image",
  date: item.created_at,
  icon: iconMap.IMAGE,
}));




      // merge both
      setMediaItems([...audioItems, ...mediaItemsMapped]);
    }
  };

  fetchMedia();
}, [communityId]);

  const filteredItems = mediaItems.filter((item) => {
  if (filterType === "ALL") return true;
  if (filterType === "VISUAL")
    return item.type === "IMAGE" || item.type === "VIDEO";
  if (filterType === "TEXT") return item.type === "PDF";
  return item.type === filterType;
});

  const getTitle = () => {
    if (filterType === "VISUAL") return "Visual Media Collection";
    if (filterType === "AUDIO") return "Oral Histories & Audio";
    if (filterType === "TEXT") return "Manuscripts & Documents";
    return "Complete Collection";
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Back */}
      <div className="fixed top-24 left-8 z-40">
        <button
          onClick={() => onNavigate("back")}
          className="text-[#1A1A1A] hover:text-[#CC7722] transition-colors flex items-center gap-2"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">BACK</span>
        </button>
      </div>

      {/* Header */}
      <div className="pt-32 pb-12 px-12 border-b border-[#1A1A1A]/10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto"
        >
          <p
            className="text-sm mb-3 opacity-60"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            KOLHI COMMUNITY · ARCHIVE INDEX
          </p>
          <h1
            className="mb-6 text-[#1A1A1A]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-[clamp(2.5rem,8vw,5rem)] leading-tight tracking-tight">
              {getTitle()}
            </span>
          </h1>
        </motion.div>
      </div>

      {/* Search + Filters */}
      <div className="px-12 py-8 border-b border-[#1A1A1A]/10 bg-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center">
          {/* <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or archive ID..."
              className="w-full bg-[#F5F1E8] border border-[#1A1A1A]/20 rounded-lg pl-12 pr-4 py-3 focus:border-[#CC7722] outline-none transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </div> */}

          <div className="flex gap-2">
            {["ALL", "AUDIO", "VISUAL", "TEXT"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-xs transition-all ${
                  filterType === type
                    ? "bg-[#1A1A1A] text-[#F5F1E8]"
                    : "bg-[#1A1A1A]/10 hover:bg-[#1A1A1A]/20"
                }`}
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="border border-[#1A1A1A]/10 rounded-lg overflow-hidden bg-white">
            {filteredItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  onClick={() => {
                    const typeMap: Record<string, string> = {
                      IMAGE: "image-detail",
                      AUDIO: "audio",
                      VIDEO: "video",
                      PDF: "pdf",
                    };
                    onNavigate(`${typeMap[item.type]}:${item.id}`);
                  }}
                  className="w-full grid grid-cols-12 gap-4 px-6 py-5 border-b border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 transition-colors group text-left items-center"
                >
                  <div className="col-span-1">
                    <Icon className="w-4 h-4 text-[#CC7722]" />
                  </div>
                  <div className="col-span-8 font-medium">{item.title}</div>
                  <div className="col-span-3 text-right opacity-60 text-xs">
                    {item.type}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      {filteredItems.length === 0 && (
  <div className="text-center py-20 opacity-60">
    No items found.
  </div>
)}

    </div>
  );
}
