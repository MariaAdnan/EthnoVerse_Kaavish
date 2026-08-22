// src/app/components/ExploreCommunities.tsx
import { motion } from "motion/react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { useEffect, useState, useCallback } from "react";
import { getAllCommunities } from "../../services/communities";
import { COMMUNITY_PLACEHOLDER_IMAGE } from "../../config/archive";
import { withTimeout } from "../../lib/async";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  community_id: string;
  name: string;
  location: string;
  language?: string;
  short_description?: string;
  picture_cloudinary_url?: string | null;
  created_at: string;
}

interface ExploreCommunitiesProps {
  onNavigate: (view: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Vary image height naturally across the masonry grid.
 * Uses the item index so heights are deterministic (no layout shift on re-render).
 */
function cardHeight(index: number): number {
  const heights = [400, 500, 440, 480, 420, 460, 510, 390, 470, 430];
  return heights[index % heights.length];
}

/**
 * Fallback placeholder when a community has no Cloudinary image.
 * Uses a neutral Unsplash image so the grid never shows broken imgs.
 */
function getImage(community: Community): string {
  return community.picture_cloudinary_url || COMMUNITY_PLACEHOLDER_IMAGE;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Masonry skeleton shown while data loads */
function MasonrySkeleton() {
  // 6 placeholder cards with the same height variance as real cards
  const placeholders = [0, 1, 2, 3, 4, 5];
  return (
    <ResponsiveMasonry columnsCountBreakPoints={{ 0: 1, 640: 2, 1024: 3 }}>
      <Masonry gutter="24px">
        {placeholders.map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-sm bg-ink/10"
            style={{ height: `${cardHeight(i)}px` }}
            aria-hidden="true"
          />
        ))}
      </Masonry>
    </ResponsiveMasonry>
  );
}

/** Single community card in the masonry grid */
function CommunityCard({
  community,
  index,
  onNavigate,
}: {
  community: Community;
  index: number;
  onNavigate: (view: string) => void;
}) {
  const height = cardHeight(index);
  const imageSrc = getImage(community);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.08 * Math.min(index, 8) }}
    >
      <button
        onClick={() => onNavigate(`community:${community.community_id}`)}
        className="group relative overflow-hidden block w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`Explore ${community.name}`}
      >
        {/* Image */}
        <img
          src={imageSrc}
          alt={community.name}
          className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ height: `${height}px` }}
          loading={index < 3 ? "eager" : "lazy"}
        />

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-foreground/55 md:bg-foreground/0 md:group-hover:bg-foreground/60 transition-all duration-500" />

        {/* Text overlay — visible on hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-paper p-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <h2
            className="text-[clamp(1.8rem,4vw,3rem)] mb-3 tracking-wider text-center leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {community.name}
          </h2>
          {community.location && (
            <p
              className="text-sm mb-1 opacity-90"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {community.location}
            </p>
          )}
          {community.language && (
            <p
              className="text-xs opacity-70 mt-1"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {community.language.toUpperCase()}
            </p>
          )}
          <p
            className="text-xs opacity-80 mt-4 tracking-wide"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            VIEW COLLECTION →
          </p>
        </div>

        {/* Always-visible subtle name tag at bottom (for accessibility / discoverability) */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent group-hover:opacity-0 transition-opacity duration-300">
          <p
            className="text-paper text-sm tracking-wider truncate"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {community.name.toUpperCase()}
          </p>
        </div>
      </button>
    </motion.div>
  );
}

/** Error state with retry */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <p
        className="text-sm opacity-50"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        className="text-sm text-accent hover:underline"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        RETRY →
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExploreCommunities({ onNavigate }: ExploreCommunitiesProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: sbError } = await withTimeout(
        getAllCommunities(),
        8_000,
        "The archive did not respond in time.",
      );

      if (sbError) {
        console.error("[ExploreCommunities] Supabase error:", sbError.message);
        setError("Failed to load communities. Please try again.");
        setCommunities([]);
      } else {
        setCommunities(data ?? []);
      }
    } catch (err) {
      console.error("[ExploreCommunities] Unexpected error:", err);
      setError("Something went wrong. Please try again.");
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const communityCount = loading
    ? "—"
    : `${communities.length} INDIGENOUS ${communities.length === 1 ? "GROUP" : "GROUPS"}`;

  return (
    <div className="min-h-screen">
      {/* Back button — sits below the fixed global NavBar (NavBar is ~64px tall) */}
      <div className="fixed top-[72px] left-6 z-40">
        <button
          onClick={() => onNavigate("home")}
          className="text-foreground hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← HOME</span>
        </button>
      </div>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-28 pb-12 px-4 sm:px-12 text-center"
      >
        <h1
          className="text-[clamp(3rem,10vw,6rem)] mb-4 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Communities
        </h1>
        <p
          className="text-sm text-foreground"
          style={{ fontFamily: "'Space Mono', monospace" }}
          aria-live="polite"
          aria-label={communityCount}
        >
          {communityCount} · SINDH PROVINCE
        </p>
      </motion.div>

      {/* ── Masonry Grid ────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-12 pb-16">
        {loading ? (
          <MasonrySkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCommunities} />
        ) : communities.length === 0 ? (
          <div className="text-center py-32">
            <p
              className="text-sm opacity-40"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              NO COMMUNITIES FOUND
            </p>
          </div>
        ) : (
          <ResponsiveMasonry
            columnsCountBreakPoints={{ 0: 1, 640: 2, 1024: 3 }}
          >
            <Masonry gutter="24px">
              {communities.map((community, index) => (
                <CommunityCard
                  key={community.community_id}
                  community={community}
                  index={index}
                  onNavigate={onNavigate}
                />
              ))}
            </Masonry>
          </ResponsiveMasonry>
        )}
      </div>
    </div>
  );
}
