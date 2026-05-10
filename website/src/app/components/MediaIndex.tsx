// src/app/components/MediaIndex.tsx
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  Image as ImageIcon,
  Video,
  FileText,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getMediaIndexItems } from "../../services/media";
import { searchArchive } from "../../services/search";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaIndexProps {
  onNavigate: (view: string) => void;
  initialFilter?: string;
  communityId?: string;
}

type MediaType = "AUDIO" | "IMAGE" | "VIDEO" | "PDF";

interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  date?: string;
  imageUrl?: string;
  tags?: string[]; 
  summaryText?: string;
}

const ICON_MAP: Record<MediaType, React.ElementType> = {
  AUDIO: Volume2,
  IMAGE: ImageIcon,
  VIDEO: Video,
  PDF: FileText,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaIndex({
  onNavigate,
  initialFilter = "ALL",
  communityId,
}: MediaIndexProps) {
  const [filterType, setFilterType] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [allItems, setAllItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMediaIndexItems(communityId)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) { setError(fetchError.message ?? "Failed to load archive."); return; }

        const audioItems: MediaItem[] = (data.interviews ?? []).map((item: any) => ({
          id: String(item.id),
          type: "AUDIO" as MediaType,
          title: item.title ?? "Untitled Interview",
          date: item.date,
          summaryText: item.summary_text ?? "",  
        }));

        const imageItems: MediaItem[] = (data.media ?? []).map((item: any) => ({
  id: String(item.id),
  type: "IMAGE" as MediaType,
  title: item.title ?? "Untitled Image",
  date: item.created_at,
  imageUrl: item.picture_cloudinary_url,
  tags: item.tags ?? [],   // ← add this
}));
const docItems: MediaItem[] = (data.documents ?? []).map((item: any) => ({
  id: String(item.id),
  type: "PDF" as MediaType,
  title: item.title ?? "Untitled Document",
  date: item.created_at,
}));

        // Newest first
        const merged = [...audioItems, ...imageItems, ...docItems].sort(
          (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
        );
        setAllItems(merged);
      })
      .catch((err) => { if (!cancelled) setError(err?.message ?? "Unknown error."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [communityId]);

  // ── Filter + Search ────────────────────────────────────────────────────────
const filteredItems = useMemo(() => {
  const q = searchQuery.toLowerCase().trim();
  const hasQuery = q.length >= 2;

  return allItems.filter((item) => {
    const matchesFilter =
      filterType === "ALL" ||
      (filterType === "VISUAL" && (item.type === "IMAGE" || item.type === "VIDEO")) ||
      (filterType === "TEXT" && item.type === "PDF") ||
      item.type === filterType;

    if (!hasQuery) return matchesFilter;

    const matchesSearch =
  item.title.toLowerCase().includes(q) ||
  `archive-${item.id}`.includes(q) ||
  item.tags?.some((t) => t.toLowerCase().includes(q)) ||
  item.summaryText?.toLowerCase().includes(q);

    return matchesSearch && matchesFilter;
  });
}, [allItems, filterType, searchQuery]);

  // IDs of visible images — sent to ImageDetail for prev/next navigation
  const visibleImageIds = useMemo(
    () => filteredItems.filter((i) => i.type === "IMAGE").map((i) => i.id),
    [filteredItems]
  );

  // ── Navigate on click ──────────────────────────────────────────────────────
  function handleRowClick(item: MediaItem) {
    if (item.type === "IMAGE") {
      // Pass sibling IDs so ImageDetail can do prev/next
      onNavigate(`image-detail:${item.id}:${visibleImageIds.join(",")}`);
    } else if (item.type === "AUDIO") {
      onNavigate(`audio:${item.id}`);
    } else if (item.type === "VIDEO") {
      onNavigate("video");
    } else if (item.type === "PDF") {
  onNavigate(`pdf:${item.id}`);
}
  }

  // ── Title ──────────────────────────────────────────────────────────────────
  const getTitle = () => {
    if (filterType === "VISUAL") return "Visual Media Collection";
    if (filterType === "AUDIO") return "Oral Histories & Audio";
    if (filterType === "TEXT") return "Manuscripts & Documents";
    return "Complete Collection";
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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
      <div className="pt-32 pb-12 px-6 sm:px-12 border-b border-[#1A1A1A]/10">
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
            {communityId
              ? `${communityId.toUpperCase()} COMMUNITY · ARCHIVE INDEX`
              : "KOLHI COMMUNITY · ARCHIVE INDEX"}
          </p>
          <h1
            className="mb-6 text-[#1A1A1A]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-[clamp(2.5rem,8vw,5rem)] leading-tight tracking-tight">
              {getTitle()}
            </span>
          </h1>
          <div className="mt-6 relative max-w-xl">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search this community's archive..."
    className="w-full bg-white/60 border border-[#1A1A1A]/20 rounded-lg pl-10 pr-4 py-3 focus:border-[#CC7722] outline-none transition-colors text-sm"
    style={{ fontFamily: "'Space Mono', monospace" }}
  />
</div>
        </motion.div>
      </div>

      {/* Search + Filters */}
      <div className="px-6 sm:px-12 py-8 border-b border-[#1A1A1A]/10 bg-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center">

          

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap justify-center">
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

      {/* Content area */}
      <div className="px-6 sm:px-12 py-8">
        <div className="max-w-7xl mx-auto">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-24 text-[#1A1A1A]/50">
              <Loader2 className="w-8 h-8 animate-spin text-[#CC7722]" />
              <p className="text-xs tracking-widest" style={{ fontFamily: "'Space Mono', monospace" }}>
                LOADING ARCHIVE...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-24 text-[#1A1A1A]/60">
              <AlertCircle className="w-8 h-8 text-[#CC7722]" />
              <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl">
                Failed to load archive
              </p>
              <p className="text-xs opacity-60" style={{ fontFamily: "'Space Mono', monospace" }}>
                {error}
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredItems.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-24 text-[#1A1A1A]/40">
              <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl">
                No results found
              </p>
              <p className="text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
                {searchQuery
                  ? `No items match "${searchQuery}"`
                  : "No items in this category yet"}
              </p>
            </div>
          )}

          {/* ── VISUAL → Gallery grid ── */}
          {!loading && !error && filteredItems.length > 0 && filterType === "VISUAL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.04 * Math.min(index, 12) }}
                    onClick={() => handleRowClick(item)}
                    className="cursor-pointer group"
                  >
                    {/* Fixed-height container so images are always visible */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#1A1A1A]/5">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#CC7722]">
                          <ImageIcon className="w-10 h-10 opacity-40" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-[#1A1A1A]/0 group-hover:bg-[#1A1A1A]/30 transition-colors duration-300" />
                    </div>
                    <p
                      className="mt-3 text-sm font-medium text-[#1A1A1A] group-hover:text-[#CC7722] transition-colors truncate"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {item.title}
                    </p>
                    {item.date && (
                      <p
                        className="text-xs text-[#1A1A1A]/40 mt-1"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        {new Date(item.date).toLocaleDateString("en-GB", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* ── ALL / AUDIO / TEXT → Table list ── */}
          {!loading && !error && filteredItems.length > 0 && filterType !== "VISUAL" && (
            <div className="border border-[#1A1A1A]/10 rounded-lg overflow-hidden bg-white">
              <AnimatePresence>
                {filteredItems.map((item, index) => {
                  const Icon = ICON_MAP[item.type] ?? FileText;
                  return (
                    <motion.button
                      key={`${item.type}-${item.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: 0.04 * Math.min(index, 12) }}
                      onClick={() => handleRowClick(item)}
                      className="w-full grid items-center gap-4 px-6 py-5 border-b border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 transition-colors group text-left last:border-b-0"
                      style={{ gridTemplateColumns: "2rem 1fr auto auto" }}
                    >
                      <Icon className="w-4 h-4 text-[#CC7722] shrink-0" />
                      <span
                        className="font-medium text-[#1A1A1A] group-hover:text-[#CC7722] transition-colors truncate"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {item.title}
                      </span>
                      {item.date && (
                        <span
                          className="text-xs text-[#1A1A1A]/40 hidden sm:block shrink-0"
                          style={{ fontFamily: "'Space Mono', monospace" }}
                        >
                          {new Date(item.date).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </span>
                      )}
                      <span
                        className="text-xs text-[#1A1A1A]/60 text-right shrink-0"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        {item.type}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>

              {/* Footer count */}
              <div className="px-6 py-3 border-t border-[#1A1A1A]/10 bg-[#1A1A1A]/5">
                <p
                  className="text-xs text-[#1A1A1A]/40"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {filteredItems.length} ITEM{filteredItems.length !== 1 ? "S" : ""}
                  {(searchQuery || filterType !== "ALL") && allItems.length !== filteredItems.length
                    ? ` (filtered from ${allItems.length})`
                    : ""}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}