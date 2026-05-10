// src/app/components/AudioPlayer.tsx
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Download, Share2, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getInterviewById, getRecentInterviews } from "../../services/interviews";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudioPlayerProps {
  view: string;
  onNavigate: (view: string) => void;
}

interface Interview {
  id: string | number;
  title: string;
  interviewee: string | null;
  interviewer: string | null;
  audio_cloudinary_url: string;
  picture_cloudinary_url: string | null;
  date: string | null;
  summary_html: string | object | null;
  summary_text: string | null;
  summary_urdu: string | null;
  summary_sindhi: string | null;
  // Supabase returns a joined table as an array even when it's a single row.
  // We normalise this in normaliseInterview() below.
  communities: { name: string; language: string } | null;
}

// Raw shape as Supabase actually returns it (communities is an array)
interface RawInterview extends Omit<Interview, "communities"> {
  communities: { name: string; language: string }[] | { name: string; language: string } | null;
}

/** Normalise the Supabase row so communities is always an object or null */
function normaliseInterview(raw: RawInterview): Interview {
  const communities = Array.isArray(raw.communities)
    ? (raw.communities[0] ?? null)
    : raw.communities;
  return { ...raw, communities };
}

type SummaryLang = "en" | "ur" | "sd";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const s = Math.floor(Math.max(0, seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** Safely extract a short excerpt from summary_html JSON or plain string */
function getSummaryExcerpt(summaryHtml: string | object | null): string {
  if (!summaryHtml) return "";
  try {
    const parsed =
      typeof summaryHtml === "string" ? JSON.parse(summaryHtml) : summaryHtml;
    const firstParagraph = parsed?.summary?.[0]?.paragraph;
    if (typeof firstParagraph === "string")
      return `"${firstParagraph.slice(0, 160).trim()}…"`;
  } catch {
    /* not JSON — fall through */
  }
  if (typeof summaryHtml === "string")
    return `"${summaryHtml.slice(0, 160).trim()}…"`;
  return "";
}

/** Safely parse summary_html into an array of paragraph objects */
function parseSummaryParagraphs(
  summaryHtml: string | object | null
): { paragraph: string }[] {
  if (!summaryHtml) return [];
  try {
    const parsed =
      typeof summaryHtml === "string" ? JSON.parse(summaryHtml) : summaryHtml;
    if (Array.isArray(parsed?.summary)) return parsed.summary;
  } catch {
    /* fall through */
  }
  return [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AudioPlayer({ view, onNavigate }: AudioPlayerProps) {
  const interviewId = view.split(":")[1];

  // ── Data ───────────────────────────────────────────────────────────────────
  const [interview, setInterview] = useState<Interview | null>(null);
  const [recentStories, setRecentStories] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Audio state ────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [summaryLang, setSummaryLang] = useState<SummaryLang>("en");
  const [showCollections, setShowCollections] = useState(false);

  // ── Fetch interview ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!interviewId) {
      setError("No interview specified.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    getInterviewById(interviewId)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError || !data) {
          setError(fetchError?.message ?? "Interview not found.");
          return;
        }
        setInterview(normaliseInterview(data as unknown as RawInterview));
      })
      .catch((err) => { if (!cancelled) setError(err?.message ?? "Unknown error."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [interviewId]);

  // ── Fetch recent stories ───────────────────────────────────────────────────
  useEffect(() => {
    getRecentInterviews(3)
      .then(({ data }) => {
        if (data) setRecentStories((data as unknown as RawInterview[]).map(normaliseInterview));
      })
      .catch(() => { /* non-critical — silent fail */ });
  }, []);

  // ── Wire audio element events ──────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (!isNaN(audio.duration) && audio.duration !== Infinity)
        setDuration(audio.duration);
    };
    const onDurationChange = () => {
      if (!isNaN(audio.duration) && audio.duration !== Infinity)
        setDuration(audio.duration);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [interview?.audio_cloudinary_url]);

  // ── Pause on unmount to avoid ghost audio ─────────────────────────────────
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  // ── Play / pause ───────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // ── Scrub progress bar ─────────────────────────────────────────────────────
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!interview?.audio_cloudinary_url) return;
    const a = document.createElement("a");
    a.href = interview.audio_cloudinary_url;
    a.download = `${(interview.title ?? "interview").replace(/\s+/g, "_")}.mp3`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: interview?.title ?? "Oral History", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  // ── Summary text by language ───────────────────────────────────────────────
  function getSummaryByLanguage(): string {
    if (!interview) return "";
    if (summaryLang === "ur" && interview.summary_urdu) return interview.summary_urdu;
    if (summaryLang === "sd" && interview.summary_sindhi) return interview.summary_sindhi;
    return interview.summary_text ?? "";
  }

  const transcriptParagraphs = interview
    ? parseSummaryParagraphs(interview.summary_html)
    : [];

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#666666]">
          <Loader2 className="w-10 h-10 animate-spin text-[#8B4513]" />
          <p style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs tracking-widest">
            LOADING ARCHIVE...
          </p>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !interview) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#666666] max-w-sm text-center px-6">
          <AlertCircle className="w-10 h-10 text-[#8B4513]" />
          <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#333333]">
            Could not load interview
          </p>
          <p style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs opacity-60">
            {error}
          </p>
          <button
            onClick={() => onNavigate("back")}
            className="mt-2 px-6 py-2 border border-[#333333]/30 hover:border-[#8B4513] transition-colors text-sm text-[#333333]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ← GO BACK
          </button>
        </div>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333]">

      {/* Hidden audio element — always mounted when interview exists */}
      <audio
        ref={audioRef}
        src={interview.audio_cloudinary_url}
        preload="metadata"
        style={{ display: "none" }}
      />

      {/* ── Back ────────────────────────────────────────────────────────────── */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate("back")}
          className="text-[#333333] hover:text-[#8B4513] transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← BACK</span>
        </button>
      </div>

      {/* ── Hero image ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full h-[60vh] bg-[#333333] overflow-hidden"
      >
        <ImageWithFallback
          src={interview.picture_cloudinary_url ?? ""}
          alt={interview.title}
          className="w-full h-full object-cover grayscale opacity-90"
        />
      </motion.div>

      {/* ── Audio section ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#333333]/10">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12">

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <p
              className="text-xs tracking-widest text-[#666666] mb-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              ORAL HISTORY ARCHIVE
              {interview.communities?.name
                ? ` · ${interview.communities.name.toUpperCase()} COMMUNITY`
                : ""}
            </p>
            <h1
              className="text-[clamp(2rem,6vw,3.5rem)] mb-4 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {interview.title}
            </h1>
            <p className="text-lg text-[#666666]">
              {interview.date
                ? `Recorded ${new Date(interview.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · `
                : ""}
              Duration {formatTime(duration)}
            </p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#F9F9F9] border border-[#333333]/10 p-6 sm:p-8"
          >
            <div className="flex items-center gap-4 sm:gap-6 mb-6">

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#8B4513] hover:bg-[#704010] text-white flex items-center justify-center transition-all shadow-lg"
              >
                {isPlaying
                  ? <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                  : <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-1" />}
              </button>

              {/* Progress */}
              <div className="flex-1 min-w-0">
                <div
                  ref={progressRef}
                  onClick={handleProgressClick}
                  className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden cursor-pointer mb-2"
                >
                  <div
                    className="h-full bg-[#8B4513] transition-all duration-300"
                    style={{
                      width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                    }}
                  />
                </div>
                <div
                  className="flex justify-between text-xs text-[#666666]"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Download */}
              <button
                onClick={handleDownload}
                aria-label="Download audio"
                className="shrink-0 w-10 h-10 flex items-center justify-center text-[#666666] hover:text-[#8B4513] transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                aria-label="Share"
                className="shrink-0 w-10 h-10 flex items-center justify-center text-[#666666] hover:text-[#8B4513] transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Audio info */}
            <div
              className="text-xs text-[#666666] space-y-1"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {interview.interviewee && <p>Speaker: {interview.interviewee}</p>}
              {interview.communities?.language && (
                <p>Language: {interview.communities.language}</p>
              )}
              {interview.interviewer && (
                <p>Interviewer: {interview.interviewer}</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Language toggle ──────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-10 flex gap-3">
        {(
          [
            { key: "en", label: "English" },
            { key: "ur", label: "اردو" },
            { key: "sd", label: "سنڌي" },
          ] as { key: SummaryLang; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSummaryLang(key)}
            className={`px-4 py-2 border text-sm transition-colors ${
              summaryLang === key
                ? "bg-[#8B4513] text-white border-[#8B4513]"
                : "border-[#333333]/20 hover:border-[#8B4513] text-[#333333]"
            }`}
            style={{
              fontFamily:
                key === "en" ? "'Space Mono', monospace" : "'Noto Nastaliq Urdu', serif",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Long-form narrative ─────────────────────────────────────────────── */}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="max-w-3xl mx-auto px-6 sm:px-8 py-16"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={summaryLang}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            dir={summaryLang !== "en" ? "rtl" : "ltr"}
            className={`prose prose-lg max-w-none ${summaryLang !== "en" ? "text-right" : "text-left"}`}
            style={{
              fontFamily:
                summaryLang !== "en"
                  ? "'Noto Nastaliq Urdu', serif"
                  : "'Playfair Display', serif",
            }}
          >
            {/* If we have structured JSON paragraphs and we're in English, render them with drop-cap */}
            {summaryLang === "en" && transcriptParagraphs.length > 0 ? (
              transcriptParagraphs.map((block, i) => (
                <p
                  key={i}
                  className={`leading-relaxed mb-8 ${
                    i === 0
                      ? "text-xl first-letter:text-6xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-[#8B4513]"
                      : ""
                  }`}
                >
                  {block.paragraph}
                </p>
              ))
            ) : (
              /* Plain text fallback (summary_text, summary_urdu, summary_sindhi) */
              <p className="leading-relaxed whitespace-pre-line">
                {getSummaryByLanguage() || "No summary available."}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Metadata footer */}
        <div
          className="mt-16 pt-8 border-t border-[#333333]/10 text-sm text-[#666666] space-y-2"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {interview.date && (
            <p>
              <strong>Interview Date:</strong>{" "}
              {new Date(interview.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          {interview.communities?.name && (
            <p>
              <strong>Community:</strong> {interview.communities.name}
            </p>
          )}
          {interview.interviewer && (
            <p>
              <strong>Interviewer:</strong> {interview.interviewer}
            </p>
          )}
          {interview.interviewee && (
            <p>
              <strong>Speaker:</strong> {interview.interviewee}
            </p>
          )}
          {interview.communities?.language && (
            <p>
              <strong>Language:</strong> {interview.communities.language}
            </p>
          )}
          <p>
            <strong>Archive Reference:</strong> ETHNO-
            {String(interview.id).padStart(4, "0")}
          </p>
        </div>
      </motion.article>

      {/* ── More Voices ─────────────────────────────────────────────────────── */}
      {recentStories.length > 0 && (
        <div className="bg-white border-t border-[#333333]/10 py-16">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <h2
              className="text-4xl mb-12 text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              More Voices from the Archive
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {recentStories.map((story, index) => (
                <motion.div
                  key={story.id ?? index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => onNavigate(`audio:${story.id}`)}
                >
                  <div className="mb-4 overflow-hidden bg-[#333333]">
                    <ImageWithFallback
                      src={story.picture_cloudinary_url ?? ""}
                      alt={`Portrait of ${story.interviewee ?? story.title}`}
                      className="w-full aspect-[3/4] object-cover grayscale group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3
                    className="text-2xl mb-2 text-[#333333]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {story.interviewee ?? story.title}
                  </h3>
                  {story.communities?.name && (
                    <p
                      className="text-xs tracking-widest text-[#666666] mb-3"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {story.communities.name.toUpperCase()}
                    </p>
                  )}
                  <p className="text-[#666666] leading-relaxed italic text-sm">
                    {getSummaryExcerpt(story.summary_html)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#333333] text-[#F9F9F9] py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <p
            className="text-sm opacity-70"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            EthnoVerse Living Archives · Preserving the Cultural Heritage of Sindh
          </p>
          <p className="text-xs opacity-50 mt-2">
            © 2026 EthnoVerse Project · All oral histories recorded with informed consent
          </p>
        </div>
      </footer>
    </div>
  );
}