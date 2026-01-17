// src/app/components/MediaUpload.tsx

import { motion } from "motion/react";
import { Upload, File as FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import React from "react";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { createMedia } from "../../services/media";
import { getAllCommunities } from "../../services/communities";   


interface MediaUploadProps {
  onNavigate: (view: string) => void;
}

export function MediaUpload({ onNavigate }: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  // const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [community, setCommunity] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [communities, setCommunities] = useState<any[]>([]);
useEffect(() => {
  getAllCommunities()
    .then(({ data, error }) => {
      if (error) throw error;
      setCommunities(data ?? []);
    })
    .catch(console.error);
}, []);


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setDragActive(false);
  if (e.dataTransfer.files[0]) {
    setFile(e.dataTransfer.files[0]);
  }
};

const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) {
    setFile(e.target.files[0]);
  }
};


  const handleSaveDraft = () => {
    console.log("Saving draft...");
    onNavigate('admin');
  };

const handlePublish = async () => {
  if (!file || !title || !community) {
    alert("Missing required fields");
    return;
  }

  try {
    setUploading(true);

    //  Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(file);

    const mediaType =
      uploadResult.resource_type === "image"
        ? "image"
        : uploadResult.resource_type === "video"
        ? "video"
        : "audio";

    //  Insert into Supabase
    const { error } = await createMedia({
      title,
      description,
      community_id: community,
      media_type: mediaType,
      storage_url: uploadResult.url, 
      date_captured: date || undefined,
    });

    if (error) throw error;

    alert("Media published successfully");
    onNavigate("admin");

  }  catch (err: any) {
  console.error("PUBLISH ERROR:", err);
  alert(err.message || "Upload failed");
}
 finally {
    setUploading(false);
  }
};
  return (
    <div className="min-h-screen">
      {/* Header */}
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

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Zone - File Drop Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
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
                  ? 'border-accent bg-accent/5' 
                  : file
                  ? 'border-sage bg-sage/5'
                  : 'border-border hover:border-accent hover:bg-accent/5'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleFileInput}
                accept="image/*,audio/*,video/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {file ? (
                <div className="text-center px-6">
                  <FileIcon className="w-16 h-16 mx-auto mb-4 text-sage" />
                  <p 
                    className="text-sm mb-2"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {file.name}
                  </p>
                  <p className="text-xs opacity-60">Click or drag to replace</p>
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
                    Image, Audio, Video
                  </p>
                  <p className="text-xs opacity-40">
                    or click to browse
                  </p>
                </div>
              )}
            </div>

            <p 
              className="text-xs opacity-60 mt-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              SUPPORTED: JPG, PNG, MP3, WAV, MP4, MOV · MAX 500MB
            </p>
          </motion.div>

          {/* Right Form - Metadata Fields */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            <label 
              className="block text-sm mb-4 opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              METADATA
            </label>

            {/* Title Field */}
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
                placeholder="e.g., Traditional Tattoo Patterns"
                className="w-full bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
                style={{ caretColor: '#CC7722' }}
                required
              />
            </div>

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
  required
  className="w-full bg-background border-b-2 border-border pb-3"
>
  <option value="">Select Community</option>

  {communities.map((c) => (
    <option key={c.community_id} value={c.community_id}>
      {c.name}
    </option>
  ))}
</select>

            </div>

            {/* Date Field */}
            <div>
              <label 
                className="block text-xs mb-3 opacity-60"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                DATE RECORDED
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border-b-2 border-border focus:border-accent outline-none pb-3 transition-colors"
                style={{ caretColor: '#CC7722' }}
              />
            </div>

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

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSaveDraft}
                className="flex-1 border-2 border-foreground hover:bg-foreground hover:text-background transition-all py-4"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                SAVE DRAFT
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 transition-all py-4"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                PUBLISH
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Back Navigation */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('admin')}
          className="text-foreground hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← BACK TO DASHBOARD</span>
        </button>
      </div>
    </div>
  );
}
