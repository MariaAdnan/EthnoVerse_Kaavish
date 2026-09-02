// src/app/components/Homepage.tsx
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAllCommunities } from "../../services/communities";
import {
  COMMUNITY_PLACEHOLDER_IMAGE,
  OFFLINE_COMMUNITY,
} from "../../config/archive";
import { isSupabaseConfigured } from "../../lib/supabase";
import { withTimeout } from "../../lib/async";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  community_id: string;
  name: string;
  location: string;
  language: string;
  short_description: string;
  long_description: string;
  picture_cloudinary_url?: string | null;
  created_at: string;
}

interface HomepageProps {
  onNavigate: (view: string) => void;
}

// ─── Static fallback (shown while loading / on error) ────────────────────────

const OFFLINE_PREVIEW: Community = OFFLINE_COMMUNITY;

// ─── Film-grain noise SVG (inline, no external dependency) ───────────────────

const FILM_GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Skeleton shimmer for featured card while data loads */
function FeaturedSkeleton() {
  return (
    <div
      className="grid md:grid-cols-2 gap-8 items-center animate-pulse"
      role="status"
      aria-label="Loading featured community…"
      aria-live="polite"
    >
      {/* Image placeholder */}
      <div className="aspect-[4/3] rounded-sm bg-ink/10" />
      {/* Text placeholders */}
      <div className="space-y-4">
        <div className="h-3 w-24 rounded bg-ink/10" />
        <div className="h-8 w-3/4 rounded bg-ink/10" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-ink/10" />
          <div className="h-4 w-5/6 rounded bg-ink/10" />
          <div className="h-4 w-4/6 rounded bg-ink/10" />
        </div>
        <div className="h-4 w-32 rounded bg-ink/10" />
      </div>
    </div>
  );
}

/** Featured community card — the first (most recently added) community */
function FeaturedCard({
  community,
  index,
  onNavigate,
}: {
  community: Community;
  index: number;
  onNavigate: (view: string) => void;
}) {
  const imageSrc =
    community.picture_cloudinary_url ||
    COMMUNITY_PLACEHOLDER_IMAGE;

  // Zero-padded archive ID e.g. ARCHIVE-001
  const archiveId = `ARCHIVE-${String(index + 1).padStart(3, "0")}`;

  return (
    <button
      type="button"
      className="group w-full cursor-pointer text-left"
      onClick={() =>
        community.community_id === "offline-preview"
          ? onNavigate("explore")
          : onNavigate(`community:${community.community_id}`)
      }
      aria-label={`View ${community.name} collection`}
    >
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageSrc}
            alt={community.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="eager"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-500" />
        </div>

        {/* Text */}
        <div>
          <p
            className="text-sm mb-2 opacity-80"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {archiveId} · FEATURED
          </p>
          <h3
            className="mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-[clamp(1.5rem,4vw,3rem)] leading-tight">
              {community.name}
            </span>
          </h3>
          <p className="text-lg leading-relaxed mb-6 text-muted-foreground">
            {community.short_description}
          </p>
          {community.location && (
            <p
              className="text-sm mb-4 opacity-50"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {community.location}
              {community.language ? ` · ${community.language}` : ""}
            </p>
          )}
          <span
            className="inline-flex items-center gap-2 text-accent hover:gap-4 transition-all focus-visible:outline-none focus-visible:underline"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <span className="text-sm">VIEW COLLECTION</span>
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Homepage({ onNavigate }: HomepageProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCommunities() {
      if (!isSupabaseConfigured) {
        setError("Supabase is not configured for this local preview.");
        setCommunities([OFFLINE_PREVIEW]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: sbError } = await withTimeout(
          getAllCommunities(),
          8_000,
          "The archive is temporarily unreachable.",
        );

        if (cancelled) return;

        if (sbError) {
          console.error("[Homepage] Supabase error:", sbError.message);
          setError(sbError.message);
          // Fall back gracefully — show hardcoded data
          setCommunities([OFFLINE_PREVIEW]);
        } else {
          setCommunities(data ?? [OFFLINE_PREVIEW]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[Homepage] Unexpected error:", err);
        setError("Failed to load communities.");
        setCommunities([OFFLINE_PREVIEW]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCommunities();
    return () => {
      cancelled = true;
    };
  }, []);

  // Featured community = the first one returned (ordered by created_at DESC in service)
  const featuredCommunity = communities[0] ?? OFFLINE_PREVIEW;

  return (
    <div className="min-h-screen">

      {/* ── Hero Section ── "The Title Wall" ──────────────────────────────── */}
      <section
        className="relative h-screen flex items-center justify-center overflow-hidden"
        aria-label="Hero"
      >
        {/* Background Image + Film Grain */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={COMMUNITY_PLACEHOLDER_IMAGE}
            alt=""
            className="w-full h-full object-cover grayscale opacity-40"
            /* decorative — alt intentionally empty */
            loading="eager"
          />
          {/* Film Grain Texture */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: FILM_GRAIN_SVG,
              backgroundRepeat: "repeat",
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {/* clamp() ensures the text scales between mobile and desktop
                without ever overflowing or getting clipped */}
            <span className="block text-[clamp(2.5rem,12vw,10rem)] leading-[0.9] tracking-tight">
              ETHNOVERSE
            </span>
            {/* <span className="block text-[clamp(2.5rem,12vw,10rem)] leading-[0.9] tracking-tight">
              ARCHIVES
            </span> */}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <p
              className="text-[clamp(1rem,2vw,1.75rem)] leading-relaxed tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span className="block">
                Documenting Sindh&apos;s Indigenous communities through multimedia
              </span>
              <span className="block">and immersive 3D experiences</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Section ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto" aria-label="Featured community">
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
            <span className="text-[clamp(2rem,6vw,4rem)] tracking-tight">
              Featured
            </span>
          </h2>

          {/* Backend state: loading → skeleton, error notice (non-blocking), data → card */}
          {loading ? (
            <FeaturedSkeleton />
          ) : (
            <>
              {error && (
                <p
                  className="mb-8 border-2 border-destructive bg-destructive/10 p-4 text-sm font-semibold text-destructive"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                  role="status"
                >
                  OFFLINE PREVIEW — this is placeholder content, not archive data
                </p>
              )}
              <FeaturedCard
                community={featuredCommunity}
                index={0}
                onNavigate={onNavigate}
              />
            </>
          )}
        </motion.div>
      </section>

      {/* ── About / Tech Teaser ───────────────────────────────────────────── */}
      <section
        className="py-24 px-4 sm:px-6 bg-secondary/30"
        aria-label="About EthnoVerse"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <p
            className="text-sm mb-4 opacity-80"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ABOUT ETHNOVERSE
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground">
            This project began during a Summer Tehqiq II research, where a group of Habib University students engaged with indigenous communities in Sindh. Through interviews, they encountered rich traditions that exist almost entirely outside formal archives. What stayed with them was the realization that these narratives are undocumented and at risk of disappearing. EthnoVerse emerged from this moment, as an attempt to preserve cultural memory.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => onNavigate("about")}
              className="inline-flex items-center gap-2 text-accent hover:gap-4 transition-all focus-visible:outline-none focus-visible:underline"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <span className="text-sm">LEARN MORE</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              onClick={() => onNavigate("admin-login")}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent hover:gap-4 transition-all focus-visible:outline-none focus-visible:underline"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <span className="text-sm">ADMIN LOGIN</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
