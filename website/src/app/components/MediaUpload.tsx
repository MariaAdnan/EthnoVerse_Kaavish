//src/app/components/MediaUpload.tsx  

import { motion } from "motion/react";
  import { Upload, File } from "lucide-react";
  import { useState } from "react";
  import { createInterview } from "../../services/interviews";
  import { createMedia } from "../../services/media";
  import { uploadToCloudinary } from "../../services/upload";
  import { supabase } from "../../lib/supabase";
  import { useEffect } from "react";

  interface MediaUploadProps {
    onNavigate: (view: string) => void;
  }

  type MediaType = "audio" | "image" | "";

  export function MediaUpload({ onNavigate }: MediaUploadProps) {
    const [mediaType, setMediaType] = useState<MediaType>("");
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("community_id, name");

      if (error) {
        console.error(error);
      } else {
        setCommunities(data || []);
      }
    };

    fetchCommunities();
  }, []);
    // Common Fields
    const [title, setTitle] = useState("");
    const [community, setCommunity] = useState("");
    const [date, setDate] = useState("");

    // Audio Fields
    const [interviewer, setInterviewer] = useState("");
    const [interviewee, setInterviewee] = useState("");
    const [summaryText, setSummaryText] = useState("");
    const [summaryUrdu, setSummaryUrdu] = useState("");
    const [summarySindhi, setSummarySindhi] = useState("");

    // Image Fields
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");

    /* ------------------ Drag Handlers ------------------ */

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setUploadedFile(e.dataTransfer.files[0]);
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setUploadedFile(e.target.files[0]);
      }
    };

  const handlePublish = async () => {
    try {
      if (!mediaType) return alert("Select media type");
      if (!uploadedFile) return alert("Upload a file");
      if (!title || !community) return alert("Fill required fields");

      // 1️⃣ Upload to Cloudinary
      const fileUrl = await uploadToCloudinary(uploadedFile);

      if (mediaType === "audio") {
        const { error } = await createInterview({
          title,
          community_id: community,
          audio_cloudinary_url: fileUrl,
          date: date || null,
          interviewer: interviewer || null,
          interviewee: interviewee || null,
          summary_text: summaryText || null,
          summary_urdu: summaryUrdu || null,
          summary_sindhi: summarySindhi || null,
          picture_cloudinary_url: null,
        });

        if (error) throw error;
      }

      if (mediaType === "image") {
        const { error } = await createMedia({
          title,
          description: description || null,
          community_id: community,
          picture_cloudinary_url: fileUrl,
          tags: tags
            ? tags.split(",").map((t) => t.trim())
            : null,
        });

        if (error) throw error;
      }

      alert("Uploaded successfully ✅");
      onNavigate("admin");

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Upload failed");
    }
  };

    return (
      <div className="min-h-screen">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="border-b border-border p-8"
        >
          <div className="max-w-7xl mx-auto">
            <p
              className="text-sm mb-2 opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              FR-W02 · CONTENT MANAGEMENT
            </p>
            <h1
              className="text-5xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Upload New Media
            </h1>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto p-8 grid lg:grid-cols-2 gap-12">

          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* MEDIA TYPE */}
            <div className="mb-8">
              <label
                className="block text-sm mb-4 opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                MEDIA TYPE *
              </label>

              <select
                value={mediaType}
                onChange={(e) => {
                  setMediaType(e.target.value as MediaType);
                  setUploadedFile(null);
                }}
                className="w-full bg-background border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
                required
              >
                <option value="">Select Media Type</option>
                <option value="audio">Audio Interview</option>
                <option value="image">Image / Visual Media</option>
              </select>
            </div>

            {/* FILE DROP AREA */}
            {mediaType && (
              <>
                <label
                  className="block text-sm mb-4 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  MEDIA FILE
                </label>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed transition-all duration-300 aspect-[4/3] flex flex-col items-center justify-center cursor-pointer ${
                    dragActive
                      ? "border-accent bg-accent/5"
                      : uploadedFile
                      ? "border-sage bg-sage/5"
                      : "border-border hover:border-accent hover:bg-accent/5"
                  }`}
                >
                  <input
                    type="file"
                    accept={
                      mediaType === "audio"
                        ? "audio/*"
                        : "image/*"
                    }
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {uploadedFile ? (
                    <div className="text-center px-6">
                      <File className="w-16 h-16 mx-auto mb-4 text-sage" />
                      <p
                        className="text-sm mb-2"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs opacity-60">
                        Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div className="text-center px-6">
                      <Upload className="w-16 h-16 mx-auto mb-4 opacity-40" />
                      <p
                        className="text-lg mb-2"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        DROP FILES
                      </p>
                      <p className="text-sm opacity-60 mb-4">
                        {mediaType === "audio"
                          ? "Audio Files"
                          : "Image Files"}
                      </p>
                      <p className="text-xs opacity-40">
                        or click to browse
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            {mediaType && (
              <>
                <label
                  className="block text-sm mb-4 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  METADATA
                </label>

                {/* TITLE */}
                <div>
                  <label
                    className="block text-xs mb-3 opacity-60"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    TITLE *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
                    required
                  />
                </div>

                {/* COMMUNITY */}
                {/* Community Dropdown */}
              <div>
  <label 
    className="block text-xs mb-3 opacity-60"
    style={{ fontFamily: "'Space Mono', monospace" }}
  >
    COMMUNITY *
  </label>

  <select
    value={community}
    onChange={(e) => setCommunity(e.target.value)}
    className="w-full bg-background border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
    required
  >
    <option value="">Select Community</option>

    {communities.map((c) => (
      <option key={c.community_id} value={c.community_id}>
        {c.name}
      </option>
    ))}
  </select>
</div>

                {/* AUDIO FIELDS */}
                {mediaType === "audio" && (
                  <>
                    {/* <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
                    /> */}
                    <label 
                  className="block text-xs mb-3 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  INTERVIEWER *
                </label>
                    <input
                      type="text"
                      placeholder="xyz (e.g. John Doe)"
                      value={interviewer}
                      onChange={(e) => setInterviewer(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
                    />
                    <label 
                  className="block text-xs mb-3 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  INTERVIEWEE *
                </label>
                    <input
                      type="text"
                      placeholder="abc (e.g. Jane Doe)"
                      value={interviewee}
                      onChange={(e) => setInterviewee(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
                    />
  <label 
                  className="block text-xs mb-3 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  SUMMARY (ENGLISH) 
                </label>
                    <textarea
                      placeholder= "Provide a concise summary of the interview in English..."
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      className="w-full bg-transparent border-2 border-border focus:border-accent outline-none p-4 transition-colors resize-none"
                    />
  <label 
                  className="block text-xs mb-3 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  SUMMARY (URDU)
                </label>
                    <textarea
                      placeholder="Provide a concise summary of the interview in Urdu..."
                      value={summaryUrdu}
                      onChange={(e) => setSummaryUrdu(e.target.value)}
                      className="w-full bg-transparent border-2 border-border focus:border-accent outline-none p-4 transition-colors resize-none"
                    />
  <label 
                  className="block text-xs mb-3 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  SUMMARY (SINDHI)
                </label>
                    <textarea
                      placeholder="Provide a concise summary of the interview in Sindhi..."
                      value={summarySindhi}
                      onChange={(e) => setSummarySindhi(e.target.value)}
                      className="w-full bg-transparent border-2 border-border focus:border-accent outline-none p-4 transition-colors resize-none"
                    />
                  </>
                )}

                {/* IMAGE FIELDS */}
                {mediaType === "image" && (
                  <>
                    {/* Description Field */}
              <div>
                <label 
                  className="block text-xs mb-3 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  DESCRIPTION
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context and details about this media..."
                  rows={6}
                  className="w-full bg-transparent border-2 border-border focus:border-accent outline-none p-4 transition-colors resize-none"
                  style={{ caretColor: '#CC7722' }}
                />
              </div>
  <label 
                  className="block text-xs mb-3 opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  TAGS *
                </label>
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
                    />
                  </>
                )}

                {/* PUBLISH */}
                <button
                  onClick={handlePublish}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all py-4"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  PUBLISH
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    );
  }