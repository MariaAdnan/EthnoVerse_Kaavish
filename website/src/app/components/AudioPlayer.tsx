// src/app/components/AudioPlayer.tsx
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Download, Share2, Loader2, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { getInterviewById, getRecentInterviews } from "../../services/interviews";
import { downloadRemoteFile } from "../../lib/files";
import { errorMessage } from "../../lib/validation";
import { toast } from "sonner";
import { withTimeout } from "../../lib/async";

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

const LETTERBOXED_INTERVIEW_IMAGES = [
  "person2_Momal_",
  "person4_Khatu_",
  "person5_Nanoo_",
  "person6_Jainti_",
];

const VIVID_INTERVIEW_IMAGES = ["person1_Champa_", "person3_Kids_"];

function needsInterviewImageCorrection(src?: string | null): boolean {
  return Boolean(
    src && LETTERBOXED_INTERVIEW_IMAGES.some((name) => src.includes(name)),
  );
}

function interviewImageStyle(src?: string | null): React.CSSProperties | undefined {
  if (needsInterviewImageCorrection(src)) {
    return { filter: "brightness(1.16) contrast(1.1) saturate(1.3)" };
  }
  if (src && VIVID_INTERVIEW_IMAGES.some((name) => src.includes(name))) {
    return { filter: "brightness(0.9) contrast(0.96) saturate(0.72)" };
  }
  return undefined;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [summaryLang, setSummaryLang] = useState<SummaryLang>("en");

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

    withTimeout(getInterviewById(interviewId), 8_000)
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
    withTimeout(getRecentInterviews(4), 8_000)
      .then(({ data }) => {
        if (data) {
          setRecentStories(
            (data as unknown as RawInterview[])
              .map(normaliseInterview)
              .filter((story) => String(story.id) !== interviewId)
              .slice(0, 3),
          );
        }
      })
      .catch(() => { /* non-critical — silent fail */ });
  }, [interviewId]);

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
    const audio = audioRef.current;
    return () => { audio?.pause(); };
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
  const handleSeek = (newTime: number) => {
    if (!audioRef.current || !duration) return;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!interview?.audio_cloudinary_url) return;
    try {
      await downloadRemoteFile(
        interview.audio_cloudinary_url,
        `${(interview.title ?? "interview").replace(/\s+/g, "_")}.mp3`,
      );
      toast.success("Audio download started.");
    } catch (downloadError) {
      toast.error(errorMessage(downloadError, "Audio download failed."));
    }
  };

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: interview?.title ?? "Oral History",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard.");
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      toast.error("This link could not be shared.");
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-smoke">
          <Loader2 className="w-10 h-10 animate-spin text-umber" />
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-smoke max-w-sm text-center px-6">
          <AlertCircle className="w-10 h-10 text-umber" />
          <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-graphite">
            Could not load interview
          </p>
          <p style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs opacity-80">
            {error}
          </p>
          <button
            onClick={() => onNavigate("back")}
            className="mt-2 px-6 py-2 border border-graphite/30 hover:border-umber transition-colors text-sm text-graphite"
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
    <div className="min-h-screen bg-surface text-graphite">

      {/* Hidden audio element — always mounted when interview exists */}
      <audio
        ref={audioRef}
        src={interview.audio_cloudinary_url}
        preload="metadata"
        style={{ display: "none" }}
      />

      {/* ── Back ────────────────────────────────────────────────────────────── */}
      <div className="fixed left-4 top-24 z-40 md:left-8 md:top-28">
        <button
          onClick={() => onNavigate("back")}
          className="rounded-sm bg-paper/90 px-3 py-2 text-graphite shadow-sm backdrop-blur-sm transition-colors hover:bg-paper hover:text-umber"
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
        className="w-full h-[60vh] bg-graphite overflow-hidden"
      >
        <ImageWithFallback
          src={interview.picture_cloudinary_url ?? ""}
          alt={interview.title}
          className="h-full w-full object-cover"
          style={interviewImageStyle(interview.picture_cloudinary_url)}
        />
      </motion.div>

      {/* ── Audio section ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-graphite/10">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12">

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <p
              className="text-xs tracking-widest text-smoke mb-4"
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
            <p className="text-lg text-smoke">
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
            className="bg-surface border border-graphite/10 p-6 sm:p-8"
          >
            <div className="flex items-center gap-4 sm:gap-6 mb-6">

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-umber hover:bg-dark-umber text-white flex items-center justify-center transition-all shadow-lg"
              >
                {isPlaying
                  ? <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                  : <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-1" />}
              </button>

              {/* Progress */}
              <div className="flex-1 min-w-0">
                <input
                  type="range"
                  aria-label="Seek in audio"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  onChange={(event) => handleSeek(Number(event.target.value))}
                  className="block h-2 w-full cursor-pointer mb-2 accent-umber"
                />
                <div
                  className="flex justify-between text-xs text-smoke"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Download */}
              <button
                type="button"
                onClick={() => void handleDownload()}
                aria-label="Download audio"
                className="shrink-0 w-10 h-10 flex items-center justify-center text-smoke hover:text-umber transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={() => void handleShare()}
                aria-label="Share"
                className="shrink-0 w-10 h-10 flex items-center justify-center text-smoke hover:text-umber transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Audio info */}
            <div
              className="text-xs text-smoke space-y-1"
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
            type="button"
            aria-pressed={summaryLang === key}
            onClick={() => setSummaryLang(key)}
            className={`px-4 py-2 border text-sm transition-colors ${
              summaryLang === key
                ? "bg-umber text-white border-umber"
                : "border-graphite/20 hover:border-umber text-graphite"
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
                      ? "text-xl first-letter:text-6xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-umber"
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
          className="mt-16 pt-8 border-t border-graphite/10 text-sm text-smoke space-y-2"
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
        <div className="bg-white border-t border-graphite/10 py-16">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <h2
              className="text-4xl mb-12 text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              More Voices from the Archive
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {recentStories.map((story, index) => (
                <motion.button
                  type="button"
                  key={story.id ?? index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="group w-full cursor-pointer text-left"
                  onClick={() => onNavigate(`audio:${story.id}`)}
                >
                  <div className="mb-4 overflow-hidden bg-graphite">
                    <ImageWithFallback
                      src={story.picture_cloudinary_url ?? ""}
                      alt={`Portrait of ${story.interviewee ?? story.title}`}
                      className={`aspect-[3/4] w-full object-cover transition-transform duration-500 ${
                        needsInterviewImageCorrection(story.picture_cloudinary_url)
                          ? "scale-[1.2] group-hover:scale-[1.25]"
                          : "group-hover:scale-105"
                      }`}
                      style={interviewImageStyle(story.picture_cloudinary_url)}
                    />
                  </div>
                  <h3
                    className="text-2xl mb-2 text-graphite"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {story.interviewee ?? story.title}
                  </h3>
                  {story.communities?.name && (
                    <p
                      className="text-xs tracking-widest text-smoke mb-3"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {story.communities.name.toUpperCase()}
                    </p>
                  )}
                  <p className="text-smoke leading-relaxed italic text-sm">
                    {getSummaryExcerpt(story.summary_html)}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-graphite text-surface py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <p
            className="text-sm opacity-70"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            EthnoVerse · Preserving the Cultural Heritage of Sindh
          </p>
          <p className="text-xs opacity-50 mt-2">
            © 2026 EthnoVerse Project · Contact the project team about permissions or corrections
          </p>
        </div>
      </footer>
    </div>
  );
}
