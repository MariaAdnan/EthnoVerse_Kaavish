//src/app/components/MediaUpload.tsx  

import { motion } from "motion/react";
import { File, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createInterview } from "../../services/interviews";
import { createMedia } from "../../services/media";
import { uploadToCloudinary, uploadZipToCloudinary } from "../../services/upload";
import { supabase } from "../../lib/supabase";
import { createDocument } from "../../services/document";
import { createJob } from "../../services/jobs";
import { resizeImage, validateUploadFile } from "../../lib/files";
import { errorMessage } from "../../lib/validation";

  interface MediaUploadProps {
    onNavigate: (view: string) => void;
  }

  interface CommunityOption {
    community_id: string;
    name: string;
  }

  type MediaType = "audio" | "image" | "document" | "3d-tour" | "";
  export function MediaUpload({ onNavigate }: MediaUploadProps) {
    const [mediaType, setMediaType] = useState<MediaType>("");
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [author, setAuthor] = useState("");
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

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
    const date = "";

    // Audio Fields
    const [interviewer, setInterviewer] = useState("");
    const [interviewee, setInterviewee] = useState("");
    const [summaryText, setSummaryText] = useState("");
    const [summaryUrdu, setSummaryUrdu] = useState("");
    const [summarySindhi, setSummarySindhi] = useState("");

    // Image Fields
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");

    const [objectName, setObjectName] = useState("");
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

    const selectFile = async (file: File) => {
      if (!mediaType) {
        toast.error("Select a media type first.");
        return;
      }
      try {
        validateUploadFile(file, mediaType);
        const preparedFile = mediaType === "image" ? await resizeImage(file) : file;
        setUploadedFile(preparedFile);
        if (preparedFile.size < file.size) {
          toast.success(
            `Image optimized from ${(file.size / 1024 / 1024).toFixed(1)} MB to ${(preparedFile.size / 1024 / 1024).toFixed(1)} MB.`,
          );
        }
      } catch (error) {
        setUploadedFile(null);
        toast.error(errorMessage(error, "The selected file is not valid."));
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        void selectFile(e.dataTransfer.files[0]);
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        void selectFile(e.target.files[0]);
      }
    };

  const handlePublish = async () => {
    if (isPublishing) return;
    try {
      if (!mediaType) return toast.error("Select a media type.");
      if (!uploadedFile) return toast.error("Upload a file.");
      if (!title.trim() || !community) return toast.error("Fill all required fields.");
      validateUploadFile(uploadedFile, mediaType);
      setIsPublishing(true);

      if (mediaType === "audio") {
        const fileUrl = await uploadToCloudinary(uploadedFile);
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
if (mediaType === "document") {
  const fileUrl = await uploadToCloudinary(uploadedFile);
  const { error } = await createDocument({
    title,
    description: description || null,
    community_id: community,
    pdf_cloudinary_url: fileUrl,
    author: author || null,
  });
  if (error) throw error;
}
      if (mediaType === "image") {
        const fileUrl = await uploadToCloudinary(uploadedFile);
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
      if (mediaType === "3d-tour") {
  if (!objectName.trim()) throw new Error("Enter an object name.");

  const zipUrl = await uploadZipToCloudinary(uploadedFile);
  await createJob({
    community_id: community,
    images_zip_url: zipUrl,
    object_name: objectName,
  });
}

      toast.success("Media published successfully.");
      onNavigate("admin");

    } catch (err: unknown) {
      console.error(err);
      toast.error(errorMessage(err, "Upload failed."));
    } finally {
      setIsPublishing(false);
    }
  };

    return (
      
      <div className="min-h-screen">
<div className="fixed top-24 left-8 z-50">
        <button
          onClick={() => onNavigate("back")}
          className="text-ink hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← BACK</span>
        </button>
      </div>
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="border-b border-border p-8"
        >
          <div className="max-w-7xl mx-auto">
            <p
              className="text-sm mb-2 opacity-80"
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
                className="block text-sm mb-4 opacity-80"
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
                <option value="document">Document / PDF</option>
                <option value="3d-tour">3D Tour (Gaussian Splat)</option>
                
              </select>
            </div>

            {/* FILE DROP AREA */}
            {mediaType && (
              <>
                <label
                  className="block text-sm mb-4 opacity-80"
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
                    aria-label="Choose media file"
                    type="file"
                    accept={
  mediaType === "audio" ? "audio/*" :
  mediaType === "3d-tour" ? ".zip" :
    mediaType === "document" ? ".pdf" :

  "image/*"
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
                      <p className="text-xs opacity-80">
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
                      <p className="text-sm opacity-80 mb-4">
  {mediaType === "audio"
    ? "Audio Files"
    : mediaType === "3d-tour"
    ? "ZIP of Images"
    : mediaType === "document"
    ? "PDF Files"
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
                  className="block text-sm mb-4 opacity-80"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  METADATA
                </label>

                {/* TITLE */}
                <div>
                  <label
                    className="block text-xs mb-3 opacity-80"
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
    className="block text-xs mb-3 opacity-80"
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
                  className="block text-xs mb-3 opacity-80"
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
                  className="block text-xs mb-3 opacity-80"
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
                  className="block text-xs mb-3 opacity-80"
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
                  className="block text-xs mb-3 opacity-80"
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
                  className="block text-xs mb-3 opacity-80"
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
                  className="block text-xs mb-3 opacity-80"
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
                  style={{ caretColor: 'var(--accent)' }}
                />
              </div>
  <label 
                  className="block text-xs mb-3 opacity-80"
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
                {mediaType === "document" && (
  <>
    <div>
      <label className="block text-xs mb-3 opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
        AUTHOR / COMPILER
      </label>
      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="e.g. Dr. Amina Shaikh"
        className="w-full bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
      />
    </div>
    <div>
      <label className="block text-xs mb-3 opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
        DESCRIPTION
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What does this document contain?"
        rows={4}
        className="w-full bg-transparent border-2 border-border focus:border-accent outline-none p-4 transition-colors resize-none"
      />
    </div>
  </>
)}
                {mediaType === "3d-tour" && (
  <div>
    <label
      className="block text-xs mb-3 opacity-80"
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      OBJECT NAME *
    </label>
    <input
      type="text"
      value={objectName}
      onChange={(e) => setObjectName(e.target.value)}
      placeholder="e.g. ketchup, pottery-jar"
      className="w-full bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
    />
    <p className="text-xs opacity-40 mt-2" style={{ fontFamily: "'Space Mono', monospace" }}>
      Used as the folder name in the pipeline output. Upload a .zip of your images above.
    </p>
  </div>
)}

                {/* PUBLISH */}
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all py-4 disabled:cursor-wait disabled:opacity-80 flex items-center justify-center gap-3"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {isPublishing && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {isPublishing ? "PUBLISHING…" : "PUBLISH"}
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    );
  }
