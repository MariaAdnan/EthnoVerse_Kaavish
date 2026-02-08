import { motion } from "motion/react";
import { Play, Pause, Download, Share2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getInterviewById, getRecentInterviews } from "../../services/interviews";

interface AudioPlayerProps {
  view: string;
  onNavigate: (view: string) => void;
}

export function AudioPlayer({ view, onNavigate }: AudioPlayerProps) {
  const interviewId = view.split(":")[1];

  const [interview, setInterview] = useState<any>(null);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showCollections, setShowCollections] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
const [summaryLang, setSummaryLang] = useState<"en" | "ur" | "sd">("en");

const [duration, setDuration] = useState(0);
const totalDuration = duration;


/* -------------------- DATA FETCH -------------------- */
const [recentStoriesData, setRecentStoriesData] = useState<any[]>([]);

  // Fetch recent stories from backend
  useEffect(() => {
    const fetchRecent = async () => {
      const { data, error } = await getRecentInterviews();
      if (!error && data) {
        setRecentStoriesData(data);
      }
    };
    fetchRecent();
  }, []);
useEffect(() => {
  if (!interviewId) return;

  const fetchInterview = async () => {
    const { data, error } = await getInterviewById(interviewId);
    if (error || !data) {
      setError("Interview not found");
      return;
    }
    setInterview(data);
  };

  fetchInterview();
}, [interviewId]);

useEffect(() => {
  if (!audioRef.current) return;

  const audio = audioRef.current;

  const onLoadedMetadata = () => {
    setDuration(audio.duration);
  };

  const onTimeUpdate = () => {
    setCurrentTime(audio.currentTime);
  };

  const onEnded = () => {
    setIsPlaying(false);
  };

  audio.addEventListener("loadedmetadata", onLoadedMetadata);
  audio.addEventListener("timeupdate", onTimeUpdate);
  audio.addEventListener("ended", onEnded);

  return () => {
    audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    audio.removeEventListener("timeupdate", onTimeUpdate);
    audio.removeEventListener("ended", onEnded);
  };
}, [interview?.audio]);
function getSummaryByLanguage() {
  if (!interview) return "";

  if (summaryLang === "ur" && interview.summary_urdu)
    return interview.summary_urdu;

  if (summaryLang === "sd" && interview.summary_sindhi)
    return interview.summary_sindhi;

  // fallback to english summary_text
  return interview.summary_text || "";
}

function togglePlay() {
  if (!audioRef.current) return;
  if (isPlaying) {
    audioRef.current.pause();
    setIsPlaying(false);
  } else {
    audioRef.current.play();
    setIsPlaying(true);
  }
}

/* -------------------- PLAY/PAUSE EFFECT -------------------- */
useEffect(() => {
  if (!audioRef.current) return;
  if (isPlaying) {
    audioRef.current.play();
  } else {
    audioRef.current.pause();
  }
}, [isPlaying]);


/* -------------------- PROGRESS BAR CLICK -------------------- */
function getSummaryText(summaryHtml: unknown): string {
  try {
    const parsed =
      typeof summaryHtml === "string"
        ? JSON.parse(summaryHtml)
        : summaryHtml;

    const firstParagraph = parsed?.summary?.[0]?.paragraph;

    return typeof firstParagraph === "string"
      ? firstParagraph.slice(0, 160) + "…"
      : "";
  } catch {
    return "";
  }
}



const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!progressRef.current) return;
  const rect = progressRef.current.getBoundingClientRect();
  const percentage = (e.clientX - rect.left) / rect.width;
  const newTime = percentage * duration;

  if (audioRef.current) {
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }
};

const formatTime = (seconds: number) => {
  const rounded = Math.floor(seconds); // Round down to nearest second
  return `${Math.floor(rounded / 60)}:${(rounded % 60).toString().padStart(2, "0")}`;
};

  if (error) return <p className="p-12 text-red-500">{error}</p>;
  if (!interview) return <p className="p-12">Loading...</p>;

  const transcript =
    typeof interview.summary_html === "string"
      ? JSON.parse(interview.summary_html)?.summary ?? []
      : interview.summary_html?.summary ?? [];

  return (
    <div>
      {/* -------------------- BACK BUTTON -------------------- */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate("back")}
          className="text-[#333333] hover:text-[#8B4513] transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← BACK</span>
        </button>
      </div>

      {/* -------------------- HERO -------------------- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full h-[60vh] bg-[#333333] overflow-hidden"
      >
        <ImageWithFallback
  src={interview.picture_cloudinary_url}
  alt={interview.title}

          className="w-full h-full object-cover grayscale opacity-90"
        />
      </motion.div>

      {/* -------------------- AUDIO SECTION -------------------- */}
      <div className="bg-white border-b border-[#333333]/10">
        <div className="max-w-4xl mx-auto px-8 py-12">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <p className="text-xs tracking-widest text-[#666666] mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
              ORAL HISTORY ARCHIVE · {interview.communities?.name?.toUpperCase()} COMMUNITY
            </p>

            <h1 className="text-5xl mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {interview.title}
            </h1>

            <p className="text-lg text-[#666666]">
              Recorded {interview.date} · Duration {formatTime(totalDuration)}
            </p>
          </motion.div>

          {/* AUDIO CONTROLS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#F9F9F9] border border-[#333333]/10 p-8"
          >
            <audio
  ref={audioRef}
  src={interview.audio_cloudinary_url}
  preload="metadata"
  style={{ display: "none" }}
/>

            <div className="flex items-center gap-6 mb-6">
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-[#8B4513] hover:bg-[#704010] text-white flex items-center justify-center transition-all shadow-lg"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </button>

              <div className="flex-1">
                <div
                  ref={progressRef}
                  onClick={handleProgressClick}
                  className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden cursor-pointer mb-2"
                >
                  <div
                    className="h-full bg-[#8B4513]"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-[#666666]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalDuration)}</span>
                </div>
              </div>

              <button><Download className="w-5 h-5" /></button>
              <button><Share2 className="w-5 h-5" /></button>
            </div>

            <div className="text-xs text-[#666666] space-y-1">
              <p>Speaker: {interview.interviewee}</p>
              <p>Language: {interview.communities?.language}</p>
              <p>Interviewer: {interview.interviewer}</p>

            </div>
          </motion.div>
        </div>
      </div>
{/* LANGUAGE TOGGLE */}
<div className="max-w-3xl mx-auto px-8 pt-10 flex gap-4">
  <button
    onClick={() => setSummaryLang("en")}
    className={`px-4 py-2 border ${summaryLang === "en" ? "bg-[#8B4513] text-white" : ""}`}
  >
    English
  </button>

  <button
    onClick={() => setSummaryLang("ur")}
    className={`px-4 py-2 border ${summaryLang === "ur" ? "bg-[#8B4513] text-white" : ""}`}
  >
    اردو
  </button>

  <button
    onClick={() => setSummaryLang("sd")}
    className={`px-4 py-2 border ${summaryLang === "sd" ? "bg-[#8B4513] text-white" : ""}`}
  >
    سنڌي
  </button>
</div>

      {/* -------------------- LONG FORM -------------------- */}
      <motion.article
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.8, delay: 0.4 }}
  className="max-w-3xl mx-auto px-8 py-16"
>
  <div 
    className="prose prose-lg max-w-none whitespace-pre-line"
    style={{ fontFamily: "'Playfair Display', serif" }}
  >
    {getSummaryByLanguage()}
  </div>
</motion.article>

      {/* Recent Stories Footer */}
      <div className="bg-white border-t border-[#333333]/10 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <h2 
            className="text-4xl mb-12 text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            More Voices from the Archive
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {recentStoriesData.map((story, index) => (
              <motion.div
                key={story.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => onNavigate(`audio:${story.id}`)}
              >
                <div className="mb-4 overflow-hidden bg-[#333333]">
                  <ImageWithFallback
                    src={story.picture_cloudinary_url}
                    alt={`Portrait of ${story.interviewee || story.name}`}
                    className="w-full aspect-[3/4] object-cover grayscale group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 
                  className="text-2xl mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {story.interviewee || story.name}, {story.age}
                </h3>
                <p 
                  className="text-xs tracking-widest text-[#666666] mb-3"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {(story.communities?.name || story.community || "").toUpperCase()}
                </p>
                <p className="text-[#666666] leading-relaxed italic">
                  "{getSummaryText(story.summary_html)}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="bg-[#333333] text-[#F9F9F9] py-8">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-sm opacity-70" style={{ fontFamily: "'Space Mono', monospace" }}>
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
