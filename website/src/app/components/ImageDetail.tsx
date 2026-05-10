// src/components/ImageDetail.tsx
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getMediaById } from "../../services/media";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  community_id: string;
  name: string;
  location: string;
}

interface MediaItem {
  id: number;
  title: string;
  description: string | null;
  picture_cloudinary_url: string;
  tags: string[] | null;
  created_at: string;
  communities: Community | null;
}

interface ImageDetailProps {
  onNavigate: (view: string) => void;
  /**
   * Matches App.tsx pattern:
   *   "image-detail:<id>"
   *   "image-detail:<id>:<id1,id2,id3,...>"   ← siblings for prev/next
   */
  view: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseView(view: string): { mediaId: number; siblingIds: number[] } {
  const rest = view.replace(/^image-detail:/, "");
  const [idPart, siblingPart] = rest.split(":");

  const mediaId = Number(idPart);
  const siblingIds = siblingPart
    ? siblingPart.split(",").map(Number).filter((n) => !Number.isNaN(n))
    : [];

  return { mediaId, siblingIds };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function archiveId(id: number) {
  return `ARCHIVE-${String(id).padStart(3, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageDetail({ onNavigate, view }: ImageDetailProps) {
  const { mediaId: initialId, siblingIds } = parseView(view);

  const [currentId, setCurrentId] = useState<number>(initialId);
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Re-sync if the view prop changes externally
  useEffect(() => {
    const { mediaId } = parseView(view);
    setCurrentId(mediaId);
  }, [view]);

  // Fetch whenever currentId changes
  useEffect(() => {
    if (!currentId || Number.isNaN(currentId)) {
      setLoading(false);
      setError("Invalid media ID.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setItem(null);

    getMediaById(currentId)
      .then((data) => { if (!cancelled) setItem(data as MediaItem); })
      .catch((err) => { if (!cancelled) setError(err?.message ?? "Failed to load media item."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [currentId]);

  // Prev / Next
  const currentIndex = siblingIds.indexOf(currentId);
  const hasPrev = siblingIds.length > 1 && currentIndex > 0;
  const hasNext = siblingIds.length > 1 && currentIndex < siblingIds.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentId(siblingIds[currentIndex - 1]);
  }, [hasPrev, siblingIds, currentIndex]);

  const goNext = useCallback(() => {
    if (hasNext) setCurrentId(siblingIds[currentIndex + 1]);
  }, [hasNext, siblingIds, currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNavigate("back");
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate, goPrev, goNext]);

  // Download
  const handleDownload = () => {
    if (!item?.picture_cloudinary_url) return;
    const a = document.createElement("a");
    a.href = item.picture_cloudinary_url;
    a.download = `${item.title.replace(/\s+/g, "_")}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/95 z-50 flex items-center justify-center p-4 sm:p-8">

      {/* Close */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onClick={() => onNavigate("back")}
        aria-label="Close"
        className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-[#F5F1E8]/30 hover:border-[#CC7722] hover:bg-[#CC7722]/10 transition-colors text-[#F5F1E8] z-10 shrink-0"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.button>

      {/* Reference tag — top left */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10 pointer-events-none">
        <p className="text-xs text-[#F5F1E8]/40" style={{ fontFamily: "'Space Mono', monospace" }}>
          {item ? archiveId(item.id) : "···"}
        </p>
      </div>

      {/* Sibling counter — top centre */}
      {siblingIds.length > 1 && currentIndex >= 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <p className="text-xs text-[#F5F1E8]/40" style={{ fontFamily: "'Space Mono', monospace" }}>
            {currentIndex + 1} / {siblingIds.length}
          </p>
        </div>
      )}

      {/* Prev */}
      {siblingIds.length > 1 && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: hasPrev ? 1 : 0.2, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={goPrev}
          disabled={!hasPrev}
          aria-label="Previous image"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-[#F5F1E8]/30 hover:border-[#CC7722] hover:bg-[#CC7722]/10 transition-colors text-[#F5F1E8] z-10 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      )}

      {/* Next */}
      {siblingIds.length > 1 && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: hasNext ? 1 : 0.2, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={goNext}
          disabled={!hasNext}
          aria-label="Next image"
          className="absolute right-14 sm:right-20 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-[#F5F1E8]/30 hover:border-[#CC7722] hover:bg-[#CC7722]/10 transition-colors text-[#F5F1E8] z-10 disabled:pointer-events-none"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-[#F5F1E8]/60"
          >
            <Loader2 className="w-10 h-10 animate-spin text-[#CC7722]" />
            <p className="text-xs tracking-widest" style={{ fontFamily: "'Space Mono', monospace" }}>
              LOADING ARCHIVE...
            </p>
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-[#F5F1E8]/70 max-w-sm text-center px-6"
          >
            <AlertCircle className="w-10 h-10 text-[#CC7722]" />
            <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl">
              Could not load image
            </p>
            <p style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs opacity-60">
              {error}
            </p>
            <button
              onClick={() => onNavigate("back")}
              className="mt-2 px-6 py-2 border border-[#F5F1E8]/30 hover:border-[#CC7722] transition-colors text-xs text-[#F5F1E8]"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              ← GO BACK
            </button>
          </motion.div>
        )}

        {!loading && !error && item && (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full flex items-center justify-center"
          >
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative flex items-center justify-center w-full max-w-6xl pb-40 sm:pb-36"
              style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
              <ImageWithFallback
                src={item.picture_cloudinary_url}
                alt={item.title}
                className="max-w-full object-contain"
                style={{ maxHeight: "calc(100vh - 16rem)" }}
              />
            </motion.div>

            {/* Metadata bar */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 sm:px-8"
            >
              <div className="backdrop-blur-md bg-[#1A1A1A]/80 border border-[#F5F1E8]/20 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className="text-xs text-[#F5F1E8]/60 mb-1 sm:mb-2 truncate"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {archiveId(item.id)} · IMAGE
                      {item.communities?.name
                        ? ` · ${item.communities.name.toUpperCase()} COMMUNITY`
                        : ""}
                    </p>
                    <h2
                      className="text-lg sm:text-2xl text-[#F5F1E8] leading-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {item.title}
                    </h2>
                    {item.description ? (
                      <p className="text-xs sm:text-sm text-[#F5F1E8]/70 mt-1 sm:mt-2 line-clamp-2">
                        {item.description}
                      </p>
                    ) : item.communities?.name ? (
                      <p className="text-xs sm:text-sm text-[#F5F1E8]/70 mt-1 sm:mt-2">
                        Collection: {item.communities.name} Cultural Heritage
                      </p>
                    ) : null}
                  </div>

                  <button
                    onClick={handleDownload}
                    title="Download Image"
                    className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-[#F5F1E8]/30 hover:border-[#CC7722] hover:bg-[#CC7722]/10 transition-colors text-[#F5F1E8]"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div
                  className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#F5F1E8]/10 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs text-[#F5F1E8]/60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <div>
                    <p className="mb-1">DATE</p>
                    <p className="text-[#F5F1E8]/90">{formatDate(item.created_at)}</p>
                  </div>
                  <div>
                    <p className="mb-1">LOCATION</p>
                    <p className="text-[#F5F1E8]/90">{item.communities?.location ?? "—"}</p>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="mb-1">TAGS</p>
                      <p className="text-[#F5F1E8]/90 truncate">{item.tags.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}