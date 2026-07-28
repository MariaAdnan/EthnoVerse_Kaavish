// src/app/components/CommunityDetail.tsx

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Box } from "lucide-react";
import { getCommunityById } from "../../services/communities";
import { getInterviewsByCommunity } from "../../services/interviews";
import { COMMUNITY_PLACEHOLDER_IMAGE } from "../../config/archive";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  community_id: string;
  name: string;
  location?: string;
  language?: string;
  short_description?: string;
  long_description?: string;
  picture_cloudinary_url?: string | null;
}

interface Interview {
  id: string;
  title: string;
  interviewee?: string | null;
  interviewer?: string | null;
  date?: string | null;
  picture_cloudinary_url?: string | null;
  summary_text?: string | null;
}

interface CommunityDetailProps {
  onNavigate: (view: string) => void;
  view: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(raw?: string | null): string {
  if (!raw) return "DATE UNKNOWN";
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase();
  } catch {
    return raw;
  }
}

// ─── Skeleton sub-components ──────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse text-center" aria-hidden="true">
      <div className="h-3 w-32 bg-ink/10 rounded mx-auto mb-4" />
      <div className="h-16 w-3/4 bg-ink/10 rounded mx-auto mb-6" />
      <div className="space-y-2 mb-8">
        <div className="h-4 w-full bg-ink/10 rounded mx-auto" />
        <div className="h-4 w-5/6 bg-ink/10 rounded mx-auto" />
        <div className="h-4 w-4/6 bg-ink/10 rounded mx-auto" />
      </div>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <div className="h-12 w-48 bg-ink/10 rounded-sm mx-auto md:mx-0" />
        <div className="h-12 w-48 bg-ink/10 rounded-sm mx-auto md:mx-0" />
      </div>
    </div>
  );
}

function InterviewCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="bg-white border border-ink/10 rounded-lg overflow-hidden animate-pulse"
      style={{ animationDelay: `${index * 0.1}s` }}
      aria-hidden="true"
    >
      <div className="aspect-[4/3] bg-ink/10" />
      <div className="p-8 space-y-3">
        <div className="h-6 w-3/4 bg-ink/10 rounded" />
        <div className="h-3 w-24 bg-ink/10 rounded" />
        <div className="h-4 w-full bg-ink/10 rounded" />
        <div className="h-4 w-5/6 bg-ink/10 rounded" />
        <div className="h-3 w-16 bg-ink/10 rounded mt-2" />
      </div>
    </div>
  );
}

// ─── Interview Card ───────────────────────────────────────────────────────────

function InterviewCard({
  interview,
  index,
  onNavigate,
}: {
  interview: Interview;
  index: number;
  onNavigate: (view: string) => void;
}) {
  const imageSrc =
    interview.picture_cloudinary_url ||
    COMMUNITY_PLACEHOLDER_IMAGE;

  const excerpt = interview.summary_text
    ? `"${interview.summary_text.slice(0, 120).trim()}${interview.summary_text.length > 120 ? "…" : ""}"`
    : null;

  return (
    <motion.div
      key={interview.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="bg-white border border-ink/10 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => onNavigate(`audio:${interview.id}`)}
      role="link"
      tabIndex={0}
      aria-label={`Listen to interview: ${interview.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(`audio:${interview.id}`);
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={imageSrc}
          alt={interview.interviewee || interview.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading={index < 3 ? "eager" : "lazy"}
        />
      </div>

      <div className="p-8">
        {/* Title */}
        <h3
          className="text-2xl mb-2 text-ink group-hover:text-accent transition-colors leading-snug"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {interview.title}
        </h3>

        {/* Interviewee */}
        {interview.interviewee && (
          <p
            className="text-xs opacity-80 mb-1"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {interview.interviewee.toUpperCase()}
          </p>
        )}

        {/* Date */}
        <p
          className="text-xs opacity-50 mb-4"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          RECORDED: {formatDate(interview.date)}
        </p>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm opacity-80 leading-relaxed mb-6 line-clamp-3">
            {excerpt}
          </p>
        )}

        {/* CTA */}
        <span
          className="text-xs font-bold tracking-wide uppercase border-b border-ink pb-1 group-hover:border-accent group-hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Listen Now »
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CommunityDetail({ onNavigate, view }: CommunityDetailProps) {
  // Parse community ID from route string "community:UUID"
  const communityId = view.split(":")[1];

  const [community, setCommunity] = useState<Community | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId) {
      setLoadingCommunity(false);
      setLoadingInterviews(false);
      setCommunityError("Invalid community.");
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      // Fetch community and interviews in parallel
      setLoadingCommunity(true);
      setLoadingInterviews(true);
      setCommunityError(null);

      const [communityResult, interviewsResult] = await Promise.allSettled([
        getCommunityById(communityId),
        getInterviewsByCommunity(communityId),
      ]);

      if (cancelled) return;

      // Community
      if (communityResult.status === "fulfilled") {
        const { data, error } = communityResult.value;
        if (error || !data) {
          setCommunityError("Community not found.");
        } else {
          setCommunity(data);
        }
      } else {
        setCommunityError("Failed to load community.");
      }
      setLoadingCommunity(false);

      // Interviews (non-blocking — grid shows empty state if none)
      if (interviewsResult.status === "fulfilled") {
        const { data } = interviewsResult.value;
        setInterviews(data ?? []);
      } else {
        setInterviews([]);
      }
      setLoadingInterviews(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [communityId]);

  // Hard error: community itself couldn't load
  if (!loadingCommunity && communityError) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p
            className="text-sm opacity-50"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {communityError}
          </p>
          <button
            onClick={() => onNavigate("explore")}
            className="text-sm text-accent hover:underline"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ← BACK TO EXPLORE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-16">
      {/* Back button — below global NavBar */}
      <div className="fixed top-[72px] left-6 z-40">
        <button
          onClick={() => onNavigate("back")}
          className="text-ink hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← BACK</span>
        </button>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 text-center">
        {loadingCommunity ? (
          <HeroSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            {/* Location + language */}
            <p
              className="text-sm tracking-widest opacity-80 mb-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {[community?.location, community?.language]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {/* Community name */}
            <h1
              className="text-[clamp(3rem,8vw,5.5rem)] leading-tight mb-8 text-ink"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {community?.name}
            </h1>

            {/* Short description */}
            {community?.short_description && (
              <p className="text-lg opacity-70 leading-relaxed mb-8 max-w-2xl mx-auto">
                {community.short_description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
onClick={() => onNavigate(`3d-tour:${communityId}`)}
                className="px-8 py-3 bg-ink text-paper rounded-sm flex items-center gap-3 hover:bg-graphite transition-colors w-full sm:w-auto justify-center"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                <Box className="w-4 h-4" aria-hidden="true" />
                ENTER VIRTUAL SPACE
              </button>

              <button
  onClick={() => onNavigate(`community:${communityId}:visual`)}
  className="px-8 py-3 border border-ink text-ink rounded-sm hover:bg-ink/5 transition-colors w-full sm:w-auto"
  style={{ fontFamily: "'Space Mono', monospace" }}
>
  VIEW FULL ARCHIVE
</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Oral Histories Grid ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2
          className="text-[clamp(1.8rem,4vw,3rem)] mb-12 text-center"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          A Glimpse of Oral Histories
        </h2>

        {loadingInterviews ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <InterviewCardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-16">
            <p
              className="text-sm opacity-40"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              NO INTERVIEWS RECORDED YET
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {interviews.map((interview, index) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                index={index}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
