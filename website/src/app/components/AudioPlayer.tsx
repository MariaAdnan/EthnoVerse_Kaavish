import { motion } from "motion/react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getMediaById } from "../../services/media";
import { getTranscriptByMediaId } from "../../services/transcripts";

interface AudioPlayerProps {
  onNavigate: (view: string) => void;
  view: string;
}

export function AudioPlayer({ onNavigate, view }: AudioPlayerProps) {
  const mediaId = view.split(":")[1];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const transcriptRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [media, setMedia] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveData, setWaveData] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const activeIndex = transcript?.timestamps?.findIndex(
    (seg: any) => currentTime >= seg.start && currentTime < seg.end
  );

  /* ---------- Fetch data ---------- */
  useEffect(() => {
    getMediaById(mediaId).then(setMedia);
    getTranscriptByMediaId(mediaId).then(setTranscript);
  }, [mediaId]);

  /* ---------- Audio + Analyser setup ---------- */
  useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();

  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.connect(ctx.destination);

  analyserRef.current = analyser;
  dataArrayRef.current = dataArray;

  const onTime = () => setCurrentTime(audio.currentTime);
  const onMeta = () => setDuration(audio.duration || 0);

  audio.addEventListener("timeupdate", onTime);
  audio.addEventListener("loadedmetadata", onMeta);

  // ✅ CLEANUP MUST BE SYNC
  return () => {
    audio.removeEventListener("timeupdate", onTime);
    audio.removeEventListener("loadedmetadata", onMeta);

    if (ctx.state !== "closed") {
      ctx.close().catch(() => {});
    }
  };
}, []);


  /* ---------- Waveform animation ---------- */
  useEffect(() => {
    if (!isPlaying || !analyserRef.current || !dataArrayRef.current) return;

    const animate = () => {
      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);
      setWaveData([...dataArrayRef.current!.slice(0, 64)]);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [isPlaying]);

  /* ---------- Auto-scroll transcript ---------- */
  useEffect(() => {
    if (activeIndex == null) return;
    transcriptRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIndex]);

  /* ---------- Controls ---------- */
  const togglePlay = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const seek = (clientX: number) => {
    if (!audioRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (clientX - rect.left) / rect.width;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, percent * duration));
  };

  if (!media) return null;

  return (
    <div className="min-h-screen bg-[#2C2C2C] text-[#F5F1E8]">
      <audio ref={audioRef} src={media.storage_url} />

      {/* ---------- Waveform ---------- */}
      <div className="h-32 border-b border-[#F5F1E8]/10 flex items-end justify-center gap-[2px] px-8">
        {Array.from({ length: 64 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ height: waveData[i] ? waveData[i] / 2 : 10 }}
            transition={{ duration: 0.1 }}
            className="w-1 bg-accent rounded-full"
          />
        ))}
      </div>

      {/* ---------- Header ---------- */}
      <div className="p-12 border-b border-[#F5F1E8]/10">
        <p className="text-xs opacity-60">ORAL HISTORY · {media.communities?.name}</p>
        <h1 className="text-4xl mb-4">{media.title}</h1>
        <p className="opacity-70">{media.description}</p>
      </div>

      {/* ---------- Controls ---------- */}
      <div className="px-12 py-8 border-b border-[#F5F1E8]/10">
        <div className="flex items-center gap-8 max-w-2xl">
          <SkipBack />

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
          >
            {isPlaying ? <Pause /> : <Play className="ml-1" />}
          </button>

          <SkipForward />

          <div className="flex-1">
            <div
              ref={progressRef}
              className="h-0.5 bg-[#F5F1E8]/20 rounded-full cursor-pointer"
              onMouseDown={(e) => {
                setIsDragging(true);
                seek(e.clientX);
              }}
              onMouseMove={(e) => isDragging && seek(e.clientX)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              <div
                className="h-full bg-accent"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>

            <div className="flex justify-between text-xs opacity-60 mt-2">
              <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2,"0")}</span>
              <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2,"0")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Transcript ---------- */}
      {transcript && (
        <div className="p-12 max-w-3xl mx-auto space-y-10">
          {transcript.timestamps.map((seg: any, idx: number) => (
            <div
              key={idx}
              ref={(el) => { transcriptRefs.current[idx] = el; }}
              onClick={() => {
                audioRef.current!.currentTime = seg.start;
                audioRef.current!.play();
                setIsPlaying(true);
              }}
              className={`cursor-pointer transition-opacity ${
                idx === activeIndex ? "opacity-100" : "opacity-40"
              }`}
            >
              <p className="text-xs mb-2">{seg.time}</p>
              <p className="text-xl italic">{seg.text}</p>
              {seg.translation && <p className="opacity-70">{seg.translation}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ---------- Back ---------- */}
      <button
        onClick={() => onNavigate(`community:${media.community_id}`)}
        className="fixed top-8 left-8 text-sm opacity-60 hover:text-accent"
      >
        ← BACK TO COLLECTION
      </button>
    </div>
  );
}
